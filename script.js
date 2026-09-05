import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  onAuthStateChanged, 
  signOut 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  increment, 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  serverTimestamp, 
  runTransaction 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { Router } from "./router.js";
import { getSlides } from "./slides-data.js";

// ==================== KONFIGURASI FIREBASE ====================
const firebaseConfig = {
  apiKey: "AIzaSyAueGUF5wZDh-3sSCu3DUKSOIMvFxZYD60",
  authDomain: "oktal-e18a1.firebaseapp.com",
  projectId: "oktal-e18a1",
  storageBucket: "oktal-e18a1.firebasestorage.app",
  messagingSenderId: "994497779237",
  appId: "1:994497779237:web:dfa0ef8547212838ad11cc"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ==================== STATE UTAMA ====================
let currentUser = null;
let currentBank = '';
let questions = [];
let currentIndex = 0;
let userAnswers = [];
let userRagu = [];
let timerInterval = null;
let secondsElapsed = 0;
let examMode = 'exam';
let lastExamResult = null;

// ==================== LOCAL STORAGE HELPERS ====================
function safeGetJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    if (parsed === null || parsed === undefined) return fallback;
    if (Array.isArray(fallback) && !Array.isArray(parsed)) return fallback;
    if (typeof fallback === 'object' && !Array.isArray(fallback) && (typeof parsed !== 'object' || Array.isArray(parsed))) return fallback;
    return parsed;
  } catch (e) {
    console.warn(`Gagal parse localStorage "${key}":`, e);
    return fallback;
  }
}

function safeSetJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`Gagal simpan localStorage "${key}":`, e);
  }
}

let notesList = safeGetJSON('oktal_notes', []);
let examHistory = safeGetJSON('oktal_exam_history', []);

function saveHistory() {
  safeSetJSON('oktal_exam_history', examHistory);
}

// ==================== LILO PET SYSTEM ====================
// Try to migrate from old localStorage key if it exists
let liloState = safeGetJSON('oktal_lilo', null);
if (!liloState) {
  const oldState = safeGetJSON('oktal_aren', null);
  if (oldState) {
    liloState = oldState;
    safeSetJSON('oktal_lilo', liloState);
    localStorage.removeItem('oktal_aren');
  } else {
    liloState = {
      skin: 'mujaer',
      foodCount: 0,
      unlockedSkins: ['mujaer']
    };
  }
}

function saveLiloState() {
  safeSetJSON('oktal_lilo', liloState);
}

function getLiloStatus() {
  if (liloState.foodCount <= 10) return 'hungry';
  if (liloState.foodCount <= 50) return 'normal';
  if (liloState.foodCount <= 100) return 'happy';
  return 'very-happy';
}

function getLiloStatusLabel() {
  const status = getLiloStatus();
  const labels = { 'hungry': '😿 Lapar', 'normal': '😐 Biasa', 'happy': '😊 Senang', 'very-happy': '😍 Sangat Senang' };
  return labels[status];
}

window.feedLilo = function(amount) {
  if (typeof amount !== 'number' || amount <= 0) return;
  
  liloState.foodCount += amount;
  if (liloState.foodCount > 200) liloState.foodCount = 200;
  
  const oldStatus = getLiloStatus();
  saveLiloState();
  const newStatus = getLiloStatus();
  
  // Unlock skins berdasarkan foodCount
  if (liloState.foodCount >= 20 && !liloState.unlockedSkins.includes('white')) {
    liloState.unlockedSkins.push('white');
    saveLiloState();
    showToast('🐱 Skin Putih Salju terbuka!');
  }
  if (liloState.foodCount >= 50 && !liloState.unlockedSkins.includes('orange')) {
    liloState.unlockedSkins.push('orange');
    saveLiloState();
    showToast('🐱 Skin Oren Manis terbuka!');
  }
  if (liloState.foodCount >= 100 && !liloState.unlockedSkins.includes('black')) {
    liloState.unlockedSkins.push('black');
    saveLiloState();
    showToast('🐱 Skin Hitam Misterius terbuka!');
  }
  if (liloState.foodCount >= 150 && !liloState.unlockedSkins.includes('rainbow')) {
    liloState.unlockedSkins.push('rainbow');
    saveLiloState();
    showToast('🌈 Skin Pelangi terbuka!');
  }
  if (liloState.foodCount >= 200 && !liloState.unlockedSkins.includes('gold')) {
    liloState.unlockedSkins.push('gold');
    saveLiloState();
    showToast('⭐ Skin Emas Legend terbuka!');
  }
  
  if (newStatus !== oldStatus && (newStatus === 'happy' || newStatus === 'very-happy')) {
    showToast(`🐟 Lilo sekarang ${getLiloStatusLabel()}!`);
  }
  
  updateLiloPetCard();
  updateExamLiloWidget();
};

window.changeLiloSkin = function(skin) {
  if (!liloState.unlockedSkins.includes(skin)) {
    showToast('🔒 Skin ini masih terkunci! Kumpulkan lebih banyak makanan.');
    return;
  }
  liloState.skin = skin;
  saveLiloState();
  updateLiloPetCard();
  updateExamLiloWidget();
  updateLiloSkinSelector();
  showToast('🐱 Skin Lilo berhasil diganti!');
};

function updateLiloPetCard() {
  const card = document.getElementById('lilo-pet-card');
  if (!card) return;
  
  const status = getLiloStatus();
  const foodPct = Math.min(100, Math.round((liloState.foodCount / 200) * 100));
  
  card.querySelector('.lilo-pet-status').className = `lilo-pet-status ${status}`;
  card.querySelector('.lilo-pet-status').innerText = getLiloStatusLabel();
  card.querySelector('.lilo-food-count').innerText = `🐟 ${liloState.foodCount} snack`;
  card.querySelector('.lilo-food-progress-fill').style.width = `${foodPct}%`;
  
  const liloCatEl = card.querySelector('.lilo-cat');
  liloCatEl.className = `lilo-cat ${liloState.skin ? 'skin-' + liloState.skin : ''} ${status}`;
}

function updateLiloSkinSelector() {
  const selector = document.getElementById('lilo-skin-selector');
  if (!selector) return;
  
  const skins = [
    { id: 'mujaer', emoji: '🐱', label: 'Mujaer' },
    { id: 'white', emoji: '🤍', label: 'Putih' },
    { id: 'orange', emoji: '🧡', label: 'Oren' },
    { id: 'black', emoji: '🖤', label: 'Hitam' },
    { id: 'rainbow', emoji: '🌈', label: 'Pelangi' },
    { id: 'gold', emoji: '⭐', label: 'Emas' }
  ];
  
  selector.innerHTML = skins.map(s => {
    const unlocked = liloState.unlockedSkins.includes(s.id);
    const active = liloState.skin === s.id;
    return `
      <button class="lilo-skin-btn ${s.id} ${active ? 'active' : ''} ${!unlocked ? 'locked' : ''}" 
              onclick="changeLiloSkin('${s.id}')" 
              title="${s.label}${!unlocked ? ' (Terkunci)' : ''}">
        ${s.emoji}
      </button>
    `;
  }).join('');
}

function updateExamLiloWidget() {
  const widget = document.getElementById('exam-lilo-widget');
  if (!widget) return;
  
  const status = getLiloStatus();
  const liloCatEl = widget.querySelector('.lilo-cat');
  liloCatEl.className = `lilo-cat ${liloState.skin ? 'skin-' + liloState.skin : ''} ${status}`;
  
  const indicator = widget.querySelector('.lilo-food-indicator');
  if (indicator) indicator.innerText = `🐟 ${liloState.foodCount}`;
}

function spawnFishAnimation(fromEl) {
  if (!fromEl) return;
  
  const rect = fromEl.getBoundingClientRect();
  const startX = rect.left + rect.width / 2;
  const startY = rect.top;
  
  const liloWidget = document.getElementById('exam-lilo-widget');
  let endX = window.innerWidth - 80;
  let endY = window.innerHeight - 120;
  
  if (liloWidget && !liloWidget.classList.contains('hidden')) {
    const liloRect = liloWidget.getBoundingClientRect();
    endX = liloRect.left + liloRect.width / 2;
    endY = liloRect.top + liloRect.height / 2;
  }
  
  const fish = document.createElement('span');
  fish.className = 'fish-snack';
  fish.innerText = '🐟';
  fish.style.left = startX + 'px';
  fish.style.top = startY + 'px';
  fish.style.setProperty('--fish-x', (endX - startX) + 'px');
  fish.style.setProperty('--fish-y', (endY - startY) + 'px');
  
  document.body.appendChild(fish);
  setTimeout(() => fish.remove(), 1000);
}

window.renderLiloReaction = function(score) {
  const container = document.getElementById('lilo-result-reaction');
  if (!container) return;
  
  let emotion = 'think';
  let message = '';
  
  if (score >= 85) {
    emotion = 'very-happy';
    message = 'Kamu hebat! Lilo bangga! 🎉';
  } else if (score >= 70) {
    emotion = 'happy';
    message = 'Bagus! Latihan lagi ya! 💪';
  } else if (score >= 50) {
    emotion = 'think';
    message = 'Yuk belajar bareng Lilo! 📚';
  } else {
    emotion = 'hungry';
    message = 'Semangat! Jangan menyerah! 🤗';
  }
  
  container.innerHTML = `
    <div class="lilo-result-reaction">
      <div class="lilo-cat skin-${liloState.skin} ${emotion}">
        <div class="lilo-ears"><div class="lilo-ear"></div><div class="lilo-ear"></div></div>
        <div class="lilo-face">
          <div class="lilo-forehead-stripes"><span></span><span></span><span></span></div>
          <div class="lilo-eyes">
            <div class="lilo-eye"><div class="lilo-pupil"></div><div class="lilo-sparkle"></div><div class="lilo-sparkle"></div></div>
            <div class="lilo-eye"><div class="lilo-pupil"></div><div class="lilo-sparkle"></div><div class="lilo-sparkle"></div></div>
          </div>
          <div class="lilo-nose"></div>
          <div class="lilo-mouth"></div>
        </div>
        <div class="lilo-body"><div class="lilo-badge">AI</div></div>
        <div class="lilo-feet"><div class="lilo-foot"></div><div class="lilo-foot"></div></div>
        <div class="lilo-tail"></div>
      </div>
      <p class="lilo-result-message">${message}</p>
    </div>
  `;
  
  // Kasih makan Lilo setelah ujian
  const foodAmount = examMode === 'quiz' ? 5 : 20;
  feedLilo(foodAmount);
};

// ==================== FIRESTORE HELPERS ====================
async function getUserDocRef() {
  if (!currentUser) return null;
  return doc(db, "users", currentUser.uid);
}

async function getProgressRef(moduleId) {
  if (!currentUser) return null;
  return doc(db, "users", currentUser.uid, "progress", moduleId);
}

async function fetchModuleProgress(moduleId) {
  const progressRef = await getProgressRef(moduleId);
  if (!progressRef) return { completed: false, mastery: 0 };
  try {
    const snap = await getDoc(progressRef);
    if (snap.exists()) return snap.data();
    return { completed: false, mastery: 0 };
  } catch (e) {
    console.error("Gagal fetch progress modul:", e);
    return { completed: false, mastery: 0 };
  }
}

async function completeModuleProgress(moduleId) {
  if (!currentUser) {
    showToast("Kamu harus login untuk menyimpan progress!");
    return { alreadyCompleted: false };
  }
  const userDocRef = await getUserDocRef();
  const progressRef = await getProgressRef(moduleId);
  if (!userDocRef || !progressRef) return { alreadyCompleted: false };
  try {
    const result = await runTransaction(db, async (transaction) => {
      const progressSnap = await transaction.get(progressRef);
      const userSnap = await transaction.get(userDocRef);
      if (!userSnap.exists()) {
        transaction.set(userDocRef, { modulesCompleted: 1, questionsAnswered: 0, correctAnswers: 0, createdAt: serverTimestamp() });
        transaction.set(progressRef, { completed: true, mastery: 100, completedAt: serverTimestamp() });
        return { alreadyCompleted: false };
      }
      const currentProgress = progressSnap.exists() ? progressSnap.data() : { completed: false, mastery: 0 };
      if (currentProgress.completed) return { alreadyCompleted: true };
      const currentModulesCompleted = userSnap.data().modulesCompleted || 0;
      transaction.update(userDocRef, { modulesCompleted: currentModulesCompleted + 1 });
      transaction.set(progressRef, { completed: true, mastery: 100, completedAt: serverTimestamp() }, { merge: true });
      return { alreadyCompleted: false };
    });
    return result;
  } catch (e) {
    console.error("Gagal complete module:", e);
    showToast("Gagal menyimpan progress ke server. Coba lagi nanti.");
    return { alreadyCompleted: false };
  }
}

async function saveAttempt(attemptData) {
  if (!currentUser) return;
  const userDocRef = await getUserDocRef();
  if (!userDocRef) return;
  try {
    await addDoc(collection(db, "users", currentUser.uid, "attempts"), {
      type: attemptData.type, bank: attemptData.bank || '', score: attemptData.score,
      totalQuestions: attemptData.totalQuestions, correctAnswers: attemptData.correct,
      wrongAnswers: attemptData.wrong, duration: attemptData.duration || '', finishedAt: serverTimestamp()
    });
    await updateDoc(userDocRef, { questionsAnswered: increment(attemptData.totalQuestions), correctAnswers: increment(attemptData.correct) });
  } catch (e) { console.error("Gagal simpan attempt:", e); }
}

// ==================== DATABASE MATERI ====================
const materiModules = [
  { id: "module_01", cat: "Core AI", title: "1. Konsep Dasar AI", icon: "🤖", desc: "Dasar-dasar Artificial Intelligence, Turing Test, Symbolic AI vs Data-Driven AI.", estMinutes: 45, levels: Array.from({ length: 6 }, (_, i) => ({ levelNumber: i + 1, title: `Level ${i + 1}: ${['Sejarah & Fondasi AI', 'Turing Test & Kecerdasan', 'Symbolic AI vs Machine Learning', 'Agen Cerdas & Lingkungan', 'Narrow vs Broad AI', 'Masa Depan Artificial Intelligence'][i]}`, summary: "Memahami fondasi awal hingga klasifikasi sistem kecerdasan buatan.", estMinutes: 8 })) },
  { id: "module_02", cat: "Core AI", title: "2. Machine Learning", icon: "⚙️", desc: "Supervised, Unsupervised, Reinforcement Learning, Bias-Variance Tradeoff.", estMinutes: 50, levels: Array.from({ length: 6 }, (_, i) => ({ levelNumber: i + 1, title: `Level ${i + 1}: ${['Supervised Learning', 'Unsupervised Learning', 'Reinforcement Learning', 'Regression vs Classification', 'Overfitting & Underfitting', 'Evaluasi Model ML'][i]}`, summary: "Menguasai 3 paradigma utama machine learning dan validasi model.", estMinutes: 9 })) },
  { id: "module_03", cat: "Core AI", title: "3. Deep Learning", icon: "🧠", desc: "Perceptron, Multi-Layer Perceptron, Backpropagation, Gradient Descent, Activation.", estMinutes: 60, levels: Array.from({ length: 6 }, (_, i) => ({ levelNumber: i + 1, title: `Level ${i + 1}: ${['Anatomi Artificial Neuron', 'Multi-Layer Perceptron (MLP)', 'Fungsi Aktivasi (ReLU, Sigmoid)', 'Forward & Backpropagation', 'Gradient Descent Optimization', 'Vanishing Gradient & Solutions'][i]}`, summary: "Dasar arsitektur jaringan saraf tiruan mendalam.", estMinutes: 10 })) },
  { id: "module_04", cat: "Core AI", title: "4. Data Science", icon: "📊", desc: "Data Preprocessing, Feature Engineering, EDA, Cleaning, Imputation.", estMinutes: 40, levels: Array.from({ length: 6 }, (_, i) => ({ levelNumber: i + 1, title: `Level ${i + 1}: ${['Pembersihan Data (Cleaning)', 'Feature Scaling & Normalization', 'Handling Missing Values', 'Exploratory Data Analysis (EDA)', 'Feature Selection & Dimensionality', 'Pipelines & Model Deployment'][i]}`, summary: "Siklus hidup pengolahan data mentah menjadi data siap latih.", estMinutes: 8 })) },
  { id: "module_05", cat: "Advanced AI", title: "5. Generative AI", icon: "✨", desc: "GANs, Diffusion Models, Variational Autoencoders (VAE), AI Art Synthesis.", estMinutes: 55, levels: Array.from({ length: 6 }, (_, i) => ({ levelNumber: i + 1, title: `Level ${i + 1}: ${['Konsep Generative vs Discriminative', 'Generative Adversarial Networks (GANs)', 'Variational Autoencoders (VAE)', 'Diffusion Models (Stable Diffusion)', 'Latent Space & Vector Embeddings', 'Aplikasi GenAI di Industri'][i]}`, summary: "Teknologi di balik pembuatan konten sintetis (teks, gambar, audio).", estMinutes: 9 })) },
  { id: "module_06", cat: "Advanced AI", title: "6. Large Language Model", icon: "💬", desc: "Transformer, Attention Mechanism, GPT Architecture, Tokenization.", estMinutes: 65, levels: Array.from({ length: 6 }, (_, i) => ({ levelNumber: i + 1, title: `Level ${i + 1}: ${['Arsitektur Transformer & Self-Attention', 'Tokenization & Embeddings', 'Pre-training vs Fine-tuning (RLHF)', 'Decoder-Only vs Encoder-Only', 'Context Window & Memory', 'RAG (Retrieval-Augmented Generation)'][i]}`, summary: "Prinsip kerja model bahasa skala raksasa modern.", estMinutes: 11 })) },
  { id: "module_07", cat: "Advanced AI", title: "7. Prompt Engineering", icon: "🎯", desc: "Zero-Shot, Few-Shot, Chain-of-Thought (CoT), System Prompts, Guardrails.", estMinutes: 35, levels: Array.from({ length: 6 }, (_, i) => ({ levelNumber: i + 1, title: `Level ${i + 1}: ${['Anatomi Prompt Efektif', 'Zero-Shot & Few-Shot Prompting', 'Chain-of-Thought (CoT) Prompting', 'Role-Playing & System Instructions', 'Preventing Prompt Injection', 'Automated Prompt Optimization'][i]}`, summary: "Seni mengendalikan keluaran LLM dengan instruksi presisi.", estMinutes: 6 })) },
  { id: "module_08", cat: "Applications", title: "8. Etika AI", icon: "⚖️", desc: "Algorithmic Bias, AI Safety, Copyright, Deepfakes, Hallucination.", estMinutes: 30, levels: Array.from({ length: 6 }, (_, i) => ({ levelNumber: i + 1, title: `Level ${i + 1}: ${['Bias Algoritma & Data Train', 'Transparansi & Explainable AI (XAI)', 'Privasi Data & Hak Cipta', 'Ancaman Deepfake & Disinformasi', 'Keamanan AI & Alignment Problem', 'Regulasi AI Global & Etika Kerja'][i]}`, summary: "Tanggung jawab moral dan keamanan penerapan AI di masyarakat.", estMinutes: 5 })) },
  { id: "module_09", cat: "Applications", title: "9. Computer Vision", icon: "👁️", desc: "CNN, Object Detection, YOLO, Image Segmentation, Edge Detection.", estMinutes: 55, levels: Array.from({ length: 6 }, (_, i) => ({ levelNumber: i + 1, title: `Level ${i + 1}: ${['Operasi Pengolahan Citra Digital', 'Convolution & Pooling Layers', 'Object Detection (YOLO, R-CNN)', 'Image Segmentation (U-Net)', 'Facial Recognition & Pose Estimation', 'Real-time Video Analytics'][i]}`, summary: "Teknik komputer dalam memahami citra dan rekaman visual.", estMinutes: 9 })) },
  { id: "module_10", cat: "Applications", title: "10. Natural Language Processing", icon: "🔤", desc: "NLTK, Tokenization, Lemmatization, Sentiment Analysis, Word2Vec.", estMinutes: 50, levels: Array.from({ length: 6 }, (_, i) => ({ levelNumber: i + 1, title: `Level ${i + 1}: ${['Text Preprocessing (Stemming, Lemmatization)', 'Bag-of-Words & TF-IDF', 'Word Embeddings (Word2Vec, GloVe)', 'Recurrent Neural Network (RNN) & LSTM', 'Analisis Sentimen & Klasifikasi Teks', 'Machine Translation & Text Summarization'][i]}`, summary: "Pemrosesan dan analisis bahasa alami manusia oleh komputer.", estMinutes: 8 })) }
];

let userMateriProgress = safeGetJSON('oktal_materi_progress', {});
let activeModule = null;
let activeLevel = null;
let activeSlideIndex = 0;

function generateLevelSlides(moduleObj, levelObj) {
  return getSlides(moduleObj.id, levelObj.levelNumber, moduleObj, levelObj);
}

// ==================== HELPER & TOAST ====================
function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

window.showToast = function(msg) {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerText = msg;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
};

function saveMateriProgress() {
  safeSetJSON('oktal_materi_progress', userMateriProgress);
}

// ==================== ROUTER SPA & HOME ENGINE ====================
function showDOMView(viewId) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  const targetView = document.getElementById(viewId);
  if (targetView) targetView.classList.add('active');

  const bottomNav = document.getElementById('bottom-nav');
  if (bottomNav) {
    if (viewId === 'view-login' || viewId === 'view-exam') {
      bottomNav.classList.add('hidden');
    } else {
      bottomNav.classList.remove('hidden');
    }
  }

  const pathToView = { 'view-dashboard': '/dashboard', 'view-materi': '/materi', 'view-notes': '/notes', 'view-banksoal': '/banksoal', 'view-history': '/history', 'view-profile': '/profile' };
  const currentPath = pathToView[viewId] || '/dashboard';
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.toggle('active', item.getAttribute('data-route') === currentPath);
  });

  if (viewId === 'view-dashboard') { renderHomeDashboard(); updateLiloPetCard(); updateLiloSkinSelector(); }
  if (viewId === 'view-history') renderHistoryView();
  if (viewId === 'view-profile') { syncProfileUI(); updateLiloSkinSelector(); }
}

function renderHomeDashboard() {
  let completedLevels = 0, completedModules = 0;
  materiModules.forEach(m => {
    let modLevelsDone = 0;
    m.levels.forEach(l => { if (userMateriProgress[`${m.id}_l${l.levelNumber}`]) { completedLevels++; modLevelsDone++; } });
    if (modLevelsDone === m.levels.length) completedModules++;
  });
  const totalLevels = 60, totalModules = 10;
  const levelPct = Math.round((completedLevels / totalLevels) * 100), modPct = Math.round((completedModules / totalModules) * 100);
  const ringCircle = document.getElementById('home-progress-ring-circle'), ringText = document.getElementById('home-progress-pct');
  if (ringCircle && ringText) { const circumference = 2 * Math.PI * 36; ringCircle.style.strokeDasharray = String(circumference); ringCircle.style.strokeDashoffset = String(circumference - (levelPct / 100) * circumference); ringText.innerText = `${levelPct}%`; }
  const statLevels = document.getElementById('home-stat-levels'), statLevelBar = document.getElementById('home-stat-level-bar'), statModules = document.getElementById('home-stat-modules'), statModuleBar = document.getElementById('home-stat-module-bar');
  if (statLevels) statLevels.innerText = `${completedLevels} / ${totalLevels}`;
  if (statLevelBar) statLevelBar.style.width = `${levelPct}%`;
  if (statModules) statModules.innerText = `${completedModules} / ${totalModules}`;
  if (statModuleBar) statModuleBar.style.width = `${modPct}%`;
  const lastModId = userMateriProgress['last_module_id'] || 'module_01', lastLevelNum = userMateriProgress['last_level_num'] || 1;
  const targetMod = materiModules.find(m => m.id === lastModId) || materiModules[0], targetLvl = targetMod.levels.find(l => l.levelNumber === Number(lastLevelNum)) || targetMod.levels[0];
  const clTitle = document.getElementById('home-cl-title'), clSub = document.getElementById('home-cl-subtitle');
  if (clTitle) clTitle.innerText = targetMod.title;
  if (clSub) clSub.innerText = targetLvl.title;
}

const routes = {
  '/': () => showDOMView('view-login'),
  '/dashboard': () => { showDOMView('view-dashboard'); if (currentUser) loadUserStats(); },
  '/materi': () => { showDOMView('view-materi'); renderMateriHub(); },
  '/notes': () => { showDOMView('view-notes'); renderNotesGrid(notesList); },
  '/banksoal': () => showDOMView('view-banksoal'),
  '/history': () => { showDOMView('view-history'); renderHistoryView(); },
  '/profile': () => { showDOMView('view-profile'); syncProfileUI(); updateLiloSkinSelector(); },
  '/exam': () => showDOMView('view-exam'),
  '/result': () => showDOMView('view-result'),
  '/review': () => showDOMView('view-review')
};

const router = new Router(routes);

window.switchView = function(viewId) {
  const pathToView = { 'view-login': '/', 'view-dashboard': '/dashboard', 'view-materi': '/materi', 'view-notes': '/notes', 'view-banksoal': '/banksoal', 'view-history': '/history', 'view-profile': '/profile', 'view-exam': '/exam', 'view-result': '/result', 'view-review': '/review' };
  router.navigate(pathToView[viewId] || '/');
};

// ==================== AUTHENTICATION ====================
const btnLogin = document.getElementById('btn-login'), btnLogout = document.getElementById('btn-logout');
if (btnLogin) btnLogin.addEventListener('click', async () => { const provider = new GoogleAuthProvider(); try { await signInWithPopup(auth, provider); showToast("Berhasil login dengan Google! 🎉"); } catch (error) { console.error("Login gagal:", error); alert("Gagal login dengan Google."); } });
if (btnLogout) btnLogout.addEventListener('click', () => signOutUser());

window.signOutUser = function() { signOut(auth).then(() => { showToast("Telah logout dari akun."); }); };

onAuthStateChanged(auth, async (user) => {
  if (user) { currentUser = user; await syncUserData(user); await loadUserStats(); if (window.location.pathname === '/' || window.location.pathname === '') router.navigate('/dashboard'); }
  else { currentUser = null; router.navigate('/'); }
});

async function syncUserData(user) {
  try {
    const userRef = doc(db, "users", user.uid), docSnap = await getDoc(userRef);
    const userData = { uid: user.uid, name: user.displayName, email: user.email, photoURL: user.photoURL, lastLogin: serverTimestamp() };
    if (!docSnap.exists()) { userData.modulesCompleted = 0; userData.questionsAnswered = 0; userData.correctAnswers = 0; userData.createdAt = serverTimestamp(); }
    await setDoc(userRef, userData, { merge: true });
    const elemUserName = document.getElementById('user-name'), elemHeroUserName = document.getElementById('hero-user-name'), elemUserPhoto = document.getElementById('user-photo');
    if (elemUserName) elemUserName.innerText = user.displayName || 'Pengguna';
    if (elemHeroUserName) elemHeroUserName.innerText = (user.displayName || 'Pengguna').split(' ')[0];
    if (elemUserPhoto) elemUserPhoto.src = user.photoURL || 'https://via.placeholder.com/40';
  } catch (e) { console.error("Error sync user data:", e); }
}

function syncProfileUI() {
  if (!currentUser) return;
  const pName = document.getElementById('profile-page-name'), pEmail = document.getElementById('profile-page-email'), pAvatar = document.getElementById('profile-page-avatar');
  if (pName) pName.innerText = currentUser.displayName || 'Pengguna';
  if (pEmail) pEmail.innerText = currentUser.email || '';
  if (pAvatar) pAvatar.src = currentUser.photoURL || 'https://via.placeholder.com/100';
}

async function loadUserStats() {
  if (!currentUser) return;
  try {
    const q = query(collection(db, "users", currentUser.uid, "attempts"), where("type", "in", ["exam", "mini_quiz", "bank_soal"]));
    const querySnapshot = await getDocs(q);
    const pDone = document.getElementById('p-stat-done'), pAvg = document.getElementById('p-stat-avg'), pHigh = document.getElementById('p-stat-high');
    const totalExams = querySnapshot.size;
    if (pDone) pDone.innerText = totalExams;
    if (totalExams === 0) return;
    let maxScore = 0, totalScore = 0;
    querySnapshot.docs.forEach((docSnap) => { const data = docSnap.data(); if (Number(data.score) > maxScore) maxScore = Number(data.score); totalScore += Number(data.score) || 0; });
    const avg = Math.round(totalScore / totalExams);
    if (pAvg) pAvg.innerText = avg;
    if (pHigh) pHigh.innerText = maxScore;
  } catch (e) { console.error("Gagal memuat statistik:", e); }
}

// ==================== MATERI ENGINE ====================
function renderMateriHub() {
  const hubContainer = document.getElementById('materi-hub-container'), detailContainer = document.getElementById('materi-module-detail'), slideContainer = document.getElementById('materi-slide-reader');
  if (!hubContainer || !detailContainer || !slideContainer) return;
  hubContainer.classList.remove('hidden'); detailContainer.classList.add('hidden'); slideContainer.classList.add('hidden');
  let completedCount = 0;
  materiModules.forEach(m => { m.levels.forEach(l => { if (userMateriProgress[`${m.id}_l${l.levelNumber}`]) completedCount++; }); });
  const totalLevels = 60, pct = Math.round((completedCount / totalLevels) * 100);
  const totalLevelsEl = document.getElementById('total-levels-completed'), overallPctEl = document.getElementById('overall-progress-percentage');
  if (totalLevelsEl) totalLevelsEl.innerText = `${completedCount} / ${totalLevels}`;
  if (overallPctEl) overallPctEl.innerText = `${pct}%`;
  renderMateriGrid(materiModules);
}

function renderMateriGrid(modulesList) {
  const grid = document.getElementById('materi-list');
  if (!grid) return;
  grid.innerHTML = '';
  modulesList.forEach(m => {
    let completedInMod = 0;
    m.levels.forEach(l => { if (userMateriProgress[`${m.id}_l${l.levelNumber}`]) completedInMod++; });
    const modPct = Math.round((completedInMod / m.levels.length) * 100);
    const card = document.createElement('div');
    card.className = 'module-card glass-panel bubble-card';
    card.innerHTML = `<div class="mod-header"><div class="mod-icon">${m.icon}</div><span class="mod-cat">${m.cat}</span></div><h3 class="mod-title">${m.title}</h3><p class="mod-desc">${m.desc}</p><div class="mod-progress-box"><div class="mod-prog-labels"><span>${completedInMod}/6 Level</span><strong>${modPct}%</strong></div><div class="progress-bar-container"><div class="progress-bar" style="width:${modPct}%"></div></div></div><div class="mod-footer"><span class="mod-time">⏱️ ${m.estMinutes} Mnt</span><button class="btn btn-sm btn-gradient-purple bubble-btn" onclick="openModuleDetail('${m.id}')">Buka Modul →</button></div>`;
    grid.appendChild(card);
  });
}

window.handleSearchMateri = function(val) { const q = val.toLowerCase(); renderMateriGrid(materiModules.filter(m => m.title.toLowerCase().includes(q) || m.desc.toLowerCase().includes(q) || m.cat.toLowerCase().includes(q))); };
window.filterMateriCategory = function(cat, evt) { document.querySelectorAll('.cat-chip').forEach(c => c.classList.remove('active')); if (evt && evt.target) evt.target.classList.add('active'); renderMateriGrid(cat === 'all' ? materiModules : materiModules.filter(m => m.cat === cat)); };

window.openModuleDetail = function(moduleId) {
  const hubContainer = document.getElementById('materi-hub-container'), detailContainer = document.getElementById('materi-module-detail'), slideContainer = document.getElementById('materi-slide-reader');
  activeModule = materiModules.find(m => m.id === moduleId);
  if (!activeModule) return;
  hubContainer.classList.add('hidden'); slideContainer.classList.add('hidden'); detailContainer.classList.remove('hidden');
  let completedInMod = 0;
  activeModule.levels.forEach(l => { if (userMateriProgress[`${activeModule.id}_l${l.levelNumber}`]) completedInMod++; });
  detailContainer.innerHTML = `<div class="mod-detail-header glass-panel"><button class="btn btn-light btn-sm bubble-btn" onclick="renderMateriHub()">← Kembali ke Hub Materi</button><div class="mod-detail-title-row"><span class="mod-icon-lg">${activeModule.icon}</span><div><h2>${activeModule.title}</h2><p>${activeModule.desc}</p></div></div><div class="mod-detail-stats"><span>Progress Modul: <strong>${completedInMod} / 6 Level Completed</strong></span></div></div><div class="levels-grid">${activeModule.levels.map((lvl, idx) => { const isCompleted = !!userMateriProgress[`${activeModule.id}_l${lvl.levelNumber}`]; const isUnlocked = (idx === 0) || !!userMateriProgress[`${activeModule.id}_l${idx}`]; let statusBadge = `<span class="badge-status locked">🔒 Locked</span>`; if (isCompleted) statusBadge = `<span class="badge-status completed">🟢 Selesai</span>`; else if (isUnlocked) statusBadge = `<span class="badge-status progress">🟡 Siap Diisi</span>`; return `<div class="level-card glass-panel ${!isUnlocked ? 'locked-card' : ''}"><div class="lvl-card-head"><span class="lvl-num">Level ${lvl.levelNumber}</span>${statusBadge}</div><h4>${lvl.title}</h4><p>${lvl.summary}</p><div class="lvl-card-foot"><span>⏱️ ${lvl.estMinutes} Menit</span><button class="btn btn-sm ${isUnlocked ? 'btn-gradient-purple bubble-btn' : 'btn-light'}" ${!isUnlocked ? 'disabled' : ''} onclick="openSlideReader('${activeModule.id}', ${lvl.levelNumber})">${isCompleted ? '📖 Baca Ulang' : (isUnlocked ? '🚀 Mulai Level' : '🔒 Terkunci')}</button></div></div>`; }).join('')}</div>`;
};

window.openSlideReader = function(moduleId, levelNum) {
  const hubContainer = document.getElementById('materi-hub-container'), detailContainer = document.getElementById('materi-module-detail'), slideContainer = document.getElementById('materi-slide-reader');
  activeModule = materiModules.find(m => m.id === moduleId); if (!activeModule) return;
  activeLevel = activeModule.levels.find(l => l.levelNumber === Number(levelNum)); if (!activeLevel) return;
  activeSlideIndex = 0;
  userMateriProgress['last_module_id'] = activeModule.id; userMateriProgress['last_level_num'] = activeLevel.levelNumber; saveMateriProgress();
  hubContainer.classList.add('hidden'); detailContainer.classList.add('hidden'); slideContainer.classList.remove('hidden');
  renderSlideContent();
};

function renderLiloHTML(liloConfig) {
  if (!liloConfig) return '';
  const emotionClass = liloConfig.emotion || 'think';
  const positionClass = liloConfig.position || 'bottom-right';
  return `<div class="lilo-container ${positionClass}"><div class="lilo-cat skin-${liloState.skin} ${emotionClass}"><div class="lilo-ears"><div class="lilo-ear"></div><div class="lilo-ear"></div></div><div class="lilo-face"><div class="lilo-forehead-stripes"><span></span><span></span><span></span></div><div class="lilo-eyes"><div class="lilo-eye"><div class="lilo-pupil"></div><div class="lilo-sparkle"></div><div class="lilo-sparkle"></div></div><div class="lilo-eye"><div class="lilo-pupil"></div><div class="lilo-sparkle"></div><div class="lilo-sparkle"></div></div></div><div class="lilo-nose"></div><div class="lilo-mouth"></div></div><div class="lilo-body"><div class="lilo-badge">AI</div></div><div class="lilo-feet"><div class="lilo-foot"></div><div class="lilo-foot"></div></div><div class="lilo-tail"></div></div>${liloConfig.message ? `<div class="lilo-bubble">${liloConfig.message}</div>` : ''}</div>`;
}

function renderVisualHTML(visual) {
  if (!visual) return '';
  let visualHTML = '';
  switch (visual.type) {
    case "icon-grid": visualHTML = `<div class="icon-grid">${visual.icons.map((icon, i) => `<div class="icon-grid-item"><span class="icon-grid-icon">${icon}</span><span class="icon-grid-label">${visual.labels[i]}</span></div>`).join('')}</div>${visual.caption ? `<p class="visual-caption">${visual.caption}</p>` : ''}`; break;
    case "analogy-cards": visualHTML = `<div class="analogy-cards">${visual.cards.map((card, i) => { if (!card.text) return `<span class="analogy-arrow">➡️</span>`; return `<div class="analogy-card"><div class="analogy-card-icon">${card.icon}</div><div class="analogy-card-text">${card.text.replace(/\n/g, '<br>')}</div></div>`; }).join('')}</div>${visual.caption ? `<p class="visual-caption">${visual.caption}</p>` : ''}`; break;
    case "timeline": visualHTML = `<div class="timeline">${visual.events.map(event => `<div class="timeline-item"><div class="timeline-dot"></div><div class="timeline-content"><span class="timeline-year">${event.year}</span><span class="timeline-event">${event.event}</span></div></div>`).join('')}</div>${visual.caption ? `<p class="visual-caption">${visual.caption}</p>` : ''}`; break;
    case "process-flow": visualHTML = `<div class="process-flow">${visual.steps.map((step, i) => `${i > 0 ? '<span class="process-arrow">→</span>' : ''}<div class="process-step"><span class="process-step-icon">${step.icon}</span><span class="process-step-label">${step.label.replace(/\n/g, '<br>')}</span></div>`).join('')}</div>${visual.caption ? `<p class="visual-caption">${visual.caption}</p>` : ''}`; break;
    case "comparison-cards": visualHTML = `<div class="comparison-cards">${visual.cards.map(card => `<div class="comparison-card ${card.type}"><h5>${card.title}</h5><p>${card.text}</p></div>`).join('')}</div>${visual.caption ? `<p class="visual-caption">${visual.caption}</p>` : ''}`; break;
    case "funfact-card": visualHTML = `<div class="funfact-card"><div class="funfact-icon">${visual.icon}</div><div class="funfact-text">${visual.text}</div></div>`; break;
  }
  return `<div class="visual-container">${visualHTML}</div>`;
}

function renderSlideContent() {
  const slideContainer = document.getElementById('materi-slide-reader');
  if (!slideContainer || !activeModule || !activeLevel) return;
  const slides = generateLevelSlides(activeModule, activeLevel);
  const totalSlides = slides.length;
  const currentSlide = slides[activeSlideIndex];
  const progressPct = Math.round(((activeSlideIndex + 1) / totalSlides) * 100);
  let bodyHTML = '';
  if (currentSlide.content) bodyHTML += `<p class="slide-main-text">${currentSlide.content}</p>`;
  if (currentSlide.visual) bodyHTML += renderVisualHTML(currentSlide.visual);
  if (currentSlide.highlightBox) bodyHTML += `<div class="highlight-box glass-panel">📌 ${currentSlide.highlightBox}</div>`;
  if (currentSlide.bubbleBox) bodyHTML += `<div class="bubble-box">${currentSlide.bubbleBox}</div>`;
  if (currentSlide.warningBox) bodyHTML += `<div class="warning-box">⚠️ ${currentSlide.warningBox}</div>`;
  if (currentSlide.infoBox) bodyHTML += `<div class="info-box">${currentSlide.infoBox}</div>`;
  if (currentSlide.diagramSteps && Array.isArray(currentSlide.diagramSteps)) bodyHTML += `<ul class="slide-diagram-steps">${currentSlide.diagramSteps.map(step => `<li>${step}</li>`).join('')}</ul>`;
  if (currentSlide.visualComparison) bodyHTML += `<div class="visual-comparison-box"><div class="vc-item" style="background:#FEF2F2; border-left:4px solid #EF4444;"><div class="vc-label">❌ SEBELUM</div><p>${currentSlide.visualComparison.before}</p></div><div class="vc-item" style="background:#ECFDF5; border-left:4px solid #22C55E;"><div class="vc-label">✅ SESUDAH</div><p>${currentSlide.visualComparison.after}</p></div></div>`;
  if (currentSlide.accordion && Array.isArray(currentSlide.accordion)) bodyHTML += `<div class="slide-accordion">${currentSlide.accordion.map(item => `<div class="slide-accordion-item"><div class="acc-q">❓ ${item.q}</div><div class="acc-a">${item.a}</div></div>`).join('')}</div>`;
  if (currentSlide.questions && Array.isArray(currentSlide.questions)) bodyHTML += currentSlide.questions.map((qItem, qi) => `<div class="slide-quiz-item"><div class="quiz-q">📝 Soal ${qi + 1}: ${qItem.q}</div><div class="quiz-opts">${qItem.opts.map(o => `<div>${o}</div>`).join('')}</div><div class="quiz-ans">✅ Jawaban: ${qItem.ans}</div></div>`).join('');
  let liloHTML = '';
  if (currentSlide.lilo) liloHTML = renderLiloHTML(currentSlide.lilo);
  slideContainer.innerHTML = `<div class="slide-navbar glass-panel"><button class="btn btn-light btn-sm bubble-btn" onclick="openModuleDetail('${activeModule.id}')">✕ Tutup</button><div class="slide-info-pill"><span>${activeModule.title}</span> • <strong>Level ${activeLevel.levelNumber}</strong></div><button class="btn btn-sm btn-light bubble-btn" onclick="createNoteFromSlide()">📝 Catat Slide Ini</button></div><div class="sticky-slide-progress"><div class="progress-bar-container"><div class="progress-bar" style="width:${progressPct}%"></div></div><div class="slide-counter-badge">Slide ${activeSlideIndex + 1} dari ${totalSlides} (${progressPct}%)</div></div><div class="slide-canvas glass-panel">${currentSlide.lilo && currentSlide.lilo.position === 'top-right' ? liloHTML : ''}<div class="slide-header-row"><div class="slide-illus">${currentSlide.illustration || '📄'}</div><div><span class="slide-badge-sub">${currentSlide.subtitle || 'PEMBELAJARAN INTERAKTIF'}</span><h2 class="slide-title-text">${currentSlide.title}</h2></div></div>${currentSlide.lilo && currentSlide.lilo.position === 'center-top' ? liloHTML : ''}<div class="slide-body-content" style="position:relative;">${bodyHTML}${currentSlide.lilo && (currentSlide.lilo.position === 'bottom-right' || currentSlide.lilo.position === 'left' || currentSlide.lilo.position === 'center') ? liloHTML : ''}</div></div><div class="slide-controls-footer" style="display:flex;justify-content:space-between;margin-top:20px;"><button class="btn btn-light bubble-btn" ${activeSlideIndex === 0 ? 'disabled' : ''} onclick="prevSlide()">← Sebelumnya</button>${activeSlideIndex < totalSlides - 1 ? `<button class="btn btn-gradient-purple bubble-btn" onclick="nextSlide()">Berikutnya →</button>` : `<button class="btn btn-gradient-green bubble-btn" onclick="finishLevel()">🎉 Selesaikan Level</button>`}</div>`;
}

window.nextSlide = function() { const slides = generateLevelSlides(activeModule, activeLevel); if (activeSlideIndex < slides.length - 1) { activeSlideIndex++; renderSlideContent(); } };
window.prevSlide = function() { if (activeSlideIndex > 0) { activeSlideIndex--; renderSlideContent(); } };

window.finishLevel = async function() {
  userMateriProgress[`${activeModule.id}_l${activeLevel.levelNumber}`] = true;
  saveMateriProgress();
  let allDone = true;
  activeModule.levels.forEach(l => { if (!userMateriProgress[`${activeModule.id}_l${l.levelNumber}`]) allDone = false; });
  if (allDone) { const result = await completeModuleProgress(activeModule.id); showToast(result.alreadyCompleted ? `🎉 Modul "${activeModule.title}" sudah pernah diselesaikan sebelumnya.` : `🎉 MODUL SELESAI! Semua level di "${activeModule.title}" telah kamu taklukkan! 🏆`); }
  else showToast(`Selamat! Level ${activeLevel.levelNumber} Berhasil Diselesaikan 🎉`);
  openModuleDetail(activeModule.id);
};

window.createNoteFromSlide = function() {
  const slides = generateLevelSlides(activeModule, activeLevel);
  const currentSlide = slides[activeSlideIndex];
  openNoteModal();
  const titleInput = document.getElementById('note-title-input'), catInput = document.getElementById('note-cat-input'), contentInput = document.getElementById('note-content-input');
  if (titleInput) titleInput.value = `Catatan: ${activeModule.title} - Level ${activeLevel.levelNumber}`;
  if (catInput) catInput.value = 'Machine Learning';
  if (contentInput) { const rawContent = (currentSlide.content || '').replace(/<[^>]*>?/gm, ''); contentInput.value = `Topik: ${currentSlide.title}\n\nRangkuman:\n${rawContent}`; }
};

// ==================== ENGINE UJIAN (CBT) ====================
function getOptionsArray(q) {
  if (Array.isArray(q.options) && q.options.length > 0) return q.options.map(opt => ({ key: String(opt.key || opt.optionKey || '').trim().toUpperCase(), text: opt.text || opt.optionText || '' }));
  const keys = ['A', 'B', 'C', 'D', 'E'], result = [];
  keys.forEach(k => { if (q[`option${k}`]) result.push({ key: k, text: q[`option${k}`] }); });
  return result;
}

function getOptionTextByKey(q, key) { if (!key) return "Tidak dijawab"; const options = getOptionsArray(q), found = options.find(o => o.key === key); return found ? found.text : "Tidak dijawab"; }

async function loadQuestions(bankFile, count = null) {
  const jsonPath = `/data/${bankFile.toLowerCase()}.json`, res = await fetch(jsonPath);
  if (!res.ok) throw new Error(`File ${jsonPath} tidak ditemukan (HTTP ${res.status}).`);
  const data = await res.json();
  let rawQuestions = Array.isArray(data) ? data : (data.questions || []);
  if (rawQuestions.length === 0) throw new Error("Bank soal ini kosong.");
  rawQuestions = shuffleArray(rawQuestions);
  if (count && count < rawQuestions.length) rawQuestions = rawQuestions.slice(0, count);
  return rawQuestions.map(q => {
    const originalOptions = getOptionsArray(q), originalAnswerKey = String(q.answer || '').trim().toUpperCase();
    const correctOption = originalOptions.find(o => o.key === originalAnswerKey), correctText = correctOption ? correctOption.text : '';
    const shuffledOptions = shuffleArray(originalOptions), newKeys = ['A', 'B', 'C', 'D', 'E'];
    let newAnswerKey = originalAnswerKey;
    const newOptions = shuffledOptions.map((opt, idx) => { const assignedKey = newKeys[idx]; if (opt.text === correctText) newAnswerKey = assignedKey; return { key: assignedKey, text: opt.text }; });
    return { ...q, options: newOptions, answer: newAnswerKey };
  });
}

window.startExam = async function(bankFile) { examMode = 'exam'; currentBank = bankFile; try { questions = await loadQuestions(bankFile); initExamSession(bankFile); } catch (err) { console.error("Error startExam:", err); alert(`Gagal memuat bank soal: ${err.message}`); } };
window.startMiniQuiz = async function(bankFile, label) { examMode = 'quiz'; currentBank = bankFile; try { questions = await loadQuestions(bankFile, 10); initExamSession(bankFile, label); } catch (err) { console.error("Error startMiniQuiz:", err); alert(`Gagal memuat mini quiz: ${err.message}`); } };

function initExamSession(bankFile, quizLabel = null) {
  currentIndex = 0; userAnswers = new Array(questions.length).fill(null); userRagu = new Array(questions.length).fill(false); lastExamResult = null;
  const titleMap = { banksoal1: "Bank Soal 1: Dasar AI & ML", banksoal2: "Bank Soal 2: Deep Learning", banksoal3: "Bank Soal 3: Computer Vision & NLP", banksoal4: "Bank Soal 4: Etika AI & Logika" };
  const elemTitle = document.getElementById('exam-bank-title'), modeBadge = document.getElementById('exam-mode-badge');
  if (elemTitle) elemTitle.innerText = quizLabel || titleMap[bankFile.toLowerCase()] || 'Bank Soal';
  if (modeBadge) modeBadge.innerText = examMode === 'quiz' ? '⚡ Mini Quiz' : '📝 Ujian';
  const liloWidget = document.getElementById('exam-lilo-widget');
  if (liloWidget) liloWidget.classList.remove('hidden');
  updateExamLiloWidget();
  router.navigate('/exam'); startTimer(); renderQuestion();
}

function startTimer() { secondsElapsed = 0; if (timerInterval) clearInterval(timerInterval); timerInterval = setInterval(() => { secondsElapsed++; const mins = String(Math.floor(secondsElapsed / 60)).padStart(2, '0'), secs = String(secondsElapsed % 60).padStart(2, '0'); const timerElem = document.getElementById('exam-timer'); if (timerElem) timerElem.innerText = `⏱️ ${mins}:${secs}`; }, 1000); }

function renderQuestion() {
  const q = questions[currentIndex]; if (!q) return;
  const total = questions.length;
  const elemProgText = document.getElementById('exam-progress-text'), elemProgBar = document.getElementById('exam-progress-bar'), elemCategory = document.getElementById('question-category'), elemQuestion = document.getElementById('question-text'), raguBadge = document.getElementById('ragu-indicator-badge');
  if (elemProgText) elemProgText.innerText = `Soal ${currentIndex + 1}/${total}`;
  if (elemProgBar) elemProgBar.style.width = `${((currentIndex + 1) / total) * 100}%`;
  if (elemCategory) elemCategory.innerText = q.category || 'Soal AI';
  if (elemQuestion) elemQuestion.innerText = q.question;
  if (raguBadge) raguBadge.classList.toggle('hidden', !userRagu[currentIndex]);
  const optionsContainer = document.getElementById('options-container');
  if (optionsContainer) {
    optionsContainer.innerHTML = ''; const optionsList = getOptionsArray(q);
    optionsList.forEach(opt => { const item = document.createElement('div'); item.className = 'option-item'; if (userAnswers[currentIndex] === opt.key) item.classList.add('selected'); item.innerHTML = `<div class="option-key">${opt.key}</div><div>${opt.text}</div>`; item.onclick = () => { userAnswers[currentIndex] = opt.key; renderQuestion(); }; optionsContainer.appendChild(item); });
  }
  const btnPrev = document.getElementById('btn-prev'), btnNext = document.getElementById('btn-next'), btnSubmit = document.getElementById('btn-submit');
  if (btnPrev) btnPrev.style.visibility = (currentIndex === 0) ? 'hidden' : 'visible';
  if (currentIndex === total - 1) { if (btnNext) btnNext.classList.add('hidden'); if (btnSubmit) btnSubmit.classList.remove('hidden'); }
  else { if (btnNext) btnNext.classList.remove('hidden'); if (btnSubmit) btnSubmit.classList.add('hidden'); }
}

window.nextQuestion = function() { if (currentIndex < questions.length - 1) { currentIndex++; renderQuestion(); } };
window.prevQuestion = function() { if (currentIndex > 0) { currentIndex--; renderQuestion(); } };
window.toggleRaguRagu = function() { userRagu[currentIndex] = !userRagu[currentIndex]; renderQuestion(); showToast(userRagu[currentIndex] ? "Soal ditandai ragu-ragu 🚩" : "Tanda ragu-ragu dilepas"); };
window.confirmExitExam = function() { if (confirm("Apakah kamu yakin ingin keluar? Progress ujian akan hilang.")) { if (timerInterval) clearInterval(timerInterval); document.getElementById('exam-lilo-widget')?.classList.add('hidden'); switchView('view-dashboard'); } };
window.togglePaletteModal = function() { const modal = document.getElementById('palette-modal'); if (!modal) return; if (modal.classList.contains('hidden')) { renderPaletteGrid(); modal.classList.remove('hidden'); } else modal.classList.add('hidden'); };

function renderPaletteGrid() { const grid = document.getElementById('palette-grid'); if (!grid) return; grid.innerHTML = ''; questions.forEach((_, idx) => { const btn = document.createElement('button'); btn.className = 'pal-btn'; btn.innerText = idx + 1; if (idx === currentIndex) btn.classList.add('active'); if (userAnswers[idx]) btn.classList.add('answered'); if (userRagu[idx]) btn.classList.add('ragu'); btn.onclick = () => { currentIndex = idx; renderQuestion(); togglePaletteModal(); }; grid.appendChild(btn); }); }

window.openSubmitConfirmModal = function() { let answered = 0, ragu = 0, empty = 0; questions.forEach((_, idx) => { if (userAnswers[idx]) answered++; else empty++; if (userRagu[idx]) ragu++; }); const confirmAnswered = document.getElementById('confirm-answered'), confirmRagu = document.getElementById('confirm-ragu'), confirmEmpty = document.getElementById('confirm-empty'); if (confirmAnswered) confirmAnswered.innerText = answered; if (confirmRagu) confirmRagu.innerText = ragu; if (confirmEmpty) confirmEmpty.innerText = empty; document.getElementById('confirm-modal').classList.remove('hidden'); };
window.closeSubmitConfirmModal = function() { document.getElementById('confirm-modal').classList.add('hidden'); };

window.submitExam = async function() {
  closeSubmitConfirmModal(); if (timerInterval) clearInterval(timerInterval);
  let correctCount = 0, wrongCount = 0;
  questions.forEach((q, idx) => { if (userAnswers[idx] === q.answer) correctCount++; else wrongCount++; });
  const total = questions.length, score = total > 0 ? Math.round((correctCount / total) * 100) : 0;
  const mins = String(Math.floor(secondsElapsed / 60)).padStart(2, '0'), secs = String(secondsElapsed % 60).padStart(2, '0'), durationStr = `${mins}:${secs}`;
  let grade = 'E'; if (score >= 85) grade = 'A'; else if (score >= 70) grade = 'B'; else if (score >= 55) grade = 'C'; else if (score >= 40) grade = 'D';
  const gradeBadge = document.getElementById('result-grade-badge'), resScore = document.getElementById('res-score'), resDuration = document.getElementById('res-duration'), resCorrect = document.getElementById('res-correct'), resWrong = document.getElementById('res-wrong'), resultSubtitle = document.getElementById('result-subtitle');
  if (gradeBadge) gradeBadge.innerText = grade; if (resScore) resScore.innerText = score; if (resDuration) resDuration.innerText = durationStr; if (resCorrect) resCorrect.innerText = correctCount; if (resWrong) resWrong.innerText = wrongCount; if (resultSubtitle) resultSubtitle.innerText = examMode === 'quiz' ? 'Berikut ringkasan hasil Mini Quiz kamu' : 'Berikut adalah ringkasan hasil evaluasi tryout kamu';
  lastExamResult = { score, correctCount, wrongCount, total, durationStr, grade, examMode };
  const bankNames = { banksoal1: "Bank Soal 1 - Dasar AI & ML", banksoal2: "Bank Soal 2 - Deep Learning", banksoal3: "Bank Soal 3 - Computer Vision & NLP", banksoal4: "Bank Soal 4 - Etika AI & Logika" };
  examHistory.unshift({ id: Date.now(), date: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }), timestamp: new Date().toISOString(), bank: currentBank, bankName: bankNames[currentBank] || currentBank, mode: examMode, totalQuestions: total, correct: correctCount, wrong: wrongCount, score: score, grade: grade, duration: durationStr, secondsElapsed: secondsElapsed });
  if (examHistory.length > 50) examHistory = examHistory.slice(0, 50);
  saveHistory();
  document.getElementById('exam-lilo-widget')?.classList.add('hidden');
  router.navigate('/result');
  window.renderLiloReaction(score);
  if (currentUser) { const attemptData = { type: examMode === 'quiz' ? 'mini_quiz' : 'bank_soal', bank: currentBank, score: score, totalQuestions: total, correct: correctCount, wrong: wrongCount, duration: durationStr }; await saveAttempt(attemptData); await loadUserStats(); }
};

// ==================== REVIEW ====================
window.showReviewPage = function() { let correctCount = 0, wrongCount = 0; questions.forEach((q, idx) => { if (userAnswers[idx] === q.answer) correctCount++; else wrongCount++; }); const elemCountAll = document.getElementById('count-all'), elemCountCorrect = document.getElementById('count-correct'), elemCountWrong = document.getElementById('count-wrong'); if (elemCountAll) elemCountAll.innerText = questions.length; if (elemCountCorrect) elemCountCorrect.innerText = correctCount; if (elemCountWrong) elemCountWrong.innerText = wrongCount; renderReviewList('all'); router.navigate('/review'); };

function renderReviewList(filter) { const reviewList = document.getElementById('review-list'); if (!reviewList) return; reviewList.innerHTML = ''; questions.forEach((q, idx) => { const userAnsKey = userAnswers[idx]; const isCorrect = (userAnsKey === q.answer); if (filter === 'correct' && !isCorrect) return; if (filter === 'wrong' && isCorrect) return; const card = document.createElement('div'); card.className = `review-card ${isCorrect ? 'correct' : 'wrong'}`; const userAnsText = userAnsKey ? `${userAnsKey}. ${getOptionTextByKey(q, userAnsKey)}` : "Tidak dijawab"; const correctAnsText = `${q.answer}. ${getOptionTextByKey(q, q.answer)}`; card.innerHTML = `<span class="review-status-pill">${isCorrect ? '✅ Jawaban Benar' : '❌ Jawaban Salah'} (Soal ${idx + 1})</span><div class="review-question">${q.question}</div><div class="review-ans"><strong>Jawaban Kamu:</strong> ${userAnsText}</div><div class="review-ans" style="color:var(--color-green)"><strong>Jawaban Benar:</strong> ${correctAnsText}</div><div class="explanation-box"><strong>Pembahasan:</strong><br>${q.explanation || 'Tidak ada pembahasan khusus.'}</div>`; reviewList.appendChild(card); }); }

window.filterReview = function(filterType, evt) { document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active')); if (evt && evt.target) evt.target.classList.add('active'); renderReviewList(filterType); };

// ==================== RIWAYAT PENGERJAAN ====================
function renderHistoryView() {
  const listContainer = document.getElementById('history-list'), hsTotal = document.getElementById('hs-total-exams'), hsAvg = document.getElementById('hs-avg-score'), hsBest = document.getElementById('hs-best-score'), btnClear = document.getElementById('btn-clear-history');
  if (!listContainer) return;
  if (examHistory.length === 0) { listContainer.innerHTML = `<div class="history-empty-state"><div class="empty-icon">📋</div><h4>Belum ada riwayat</h4><p>Kerjakan ujian atau mini quiz untuk melihat riwayat di sini.</p></div>`; if (hsTotal) hsTotal.innerText = '0'; if (hsAvg) hsAvg.innerText = '0%'; if (hsBest) hsBest.innerText = '0%'; if (btnClear) btnClear.style.display = 'none'; return; }
  if (btnClear) btnClear.style.display = 'inline-flex';
  const totalExams = examHistory.length; let totalScore = 0, bestScore = 0;
  examHistory.forEach(h => { totalScore += h.score; if (h.score > bestScore) bestScore = h.score; });
  if (hsTotal) hsTotal.innerText = totalExams; if (hsAvg) hsAvg.innerText = `${Math.round(totalScore / totalExams)}%`; if (hsBest) hsBest.innerText = `${bestScore}%`;
  listContainer.innerHTML = examHistory.map(h => { let scoreClass = 'low'; if (h.score >= 85) scoreClass = 'great'; else if (h.score >= 70) scoreClass = 'good'; else if (h.score >= 50) scoreClass = 'okay'; return `<div class="history-item glass-panel" onclick="viewHistoryDetail('${h.id}')"><div class="history-item-left"><span class="history-item-mode ${h.mode}">${h.mode === 'quiz' ? '⚡ Mini Quiz' : '📝 Ujian'}</span><span class="history-item-title">${h.bankName}</span><span class="history-item-date">📅 ${h.date} • ⏱️ ${h.duration}</span></div><div class="history-item-right"><div class="history-score-circle ${scoreClass}">${h.score}%</div><button class="history-delete-btn" onclick="event.stopPropagation(); deleteHistoryItem('${h.id}')" title="Hapus">🗑️</button></div></div>`; }).join('');
}

window.viewHistoryDetail = function(historyId) { const item = examHistory.find(h => String(h.id) === String(historyId)); if (!item) return; const content = document.getElementById('history-detail-content'); if (!content) return; content.innerHTML = `<div class="history-detail-row"><span>Mode</span><span>${item.mode === 'quiz' ? '⚡ Mini Quiz' : '📝 Ujian Penuh'}</span></div><div class="history-detail-row"><span>Bank Soal</span><span>${item.bankName}</span></div><div class="history-detail-row"><span>Tanggal</span><span>${item.date}</span></div><div class="history-detail-row"><span>Durasi</span><span>${item.duration}</span></div><div class="history-detail-row"><span>Total Soal</span><span>${item.totalQuestions}</span></div><div class="history-detail-row"><span>Benar</span><span style="color:var(--color-green)">✅ ${item.correct}</span></div><div class="history-detail-row"><span>Salah</span><span style="color:var(--color-red)">❌ ${item.wrong}</span></div><div class="history-detail-row"><span>Skor</span><span style="font-size:1.2rem;color:var(--color-purple)"><strong>${item.score}%</strong></span></div><div class="history-detail-row"><span>Grade</span><span>${item.grade}</span></div>`; document.getElementById('history-detail-modal').classList.remove('hidden'); };
window.closeHistoryDetail = function() { document.getElementById('history-detail-modal').classList.add('hidden'); };
window.deleteHistoryItem = function(historyId) { if (confirm("Hapus riwayat ini?")) { examHistory = examHistory.filter(h => String(h.id) !== String(historyId)); saveHistory(); renderHistoryView(); showToast("Riwayat dihapus"); } };
window.clearAllHistory = function() { if (examHistory.length === 0) return; if (confirm("Hapus SEMUA riwayat pengerjaan? Tindakan ini tidak bisa dibatalkan.")) { examHistory = []; saveHistory(); renderHistoryView(); showToast("Semua riwayat telah dihapus"); } };

// ==================== CATATAN ====================
function renderNotesGrid(notes) { const grid = document.getElementById('notes-grid'); if (!grid) return; grid.innerHTML = ''; if (notes.length === 0) { grid.innerHTML = `<p style="color:var(--text-muted);grid-column:1/-1;text-align:center;">Belum ada catatan. Klik (+ Catatan Baru) untuk membuat.</p>`; return; } notes.forEach((n, idx) => { const card = document.createElement('div'); card.className = 'note-card glass-panel'; card.innerHTML = `<span class="note-tag">${n.cat}</span><h4>${n.title}</h4><p>${n.content}</p><div class="note-footer"><span>${n.date}</span><button style="background:none;border:none;cursor:pointer;" onclick="deleteNote(${idx})">🗑️ Hapus</button></div>`; grid.appendChild(card); }); }
window.openNoteModal = function() { document.getElementById('note-modal').classList.remove('hidden'); };
window.closeNoteModal = function() { document.getElementById('note-modal').classList.add('hidden'); };
window.saveNote = function() { const title = document.getElementById('note-title-input').value.trim(), cat = document.getElementById('note-cat-input').value, content = document.getElementById('note-content-input').value.trim(); if (!title || !content) { alert("Judul dan isi catatan wajib diisi!"); return; } notesList.unshift({ title, cat, content, date: new Date().toLocaleDateString('id-ID') }); safeSetJSON('oktal_notes', notesList); document.getElementById('note-title-input').value = ''; document.getElementById('note-content-input').value = ''; closeNoteModal(); renderNotesGrid(notesList); showToast("Catatan berhasil disimpan 📝"); };
window.deleteNote = function(idx) { if (confirm("Hapus catatan ini?")) { notesList.splice(idx, 1); safeSetJSON('oktal_notes', notesList); renderNotesGrid(notesList); showToast("Catatan dihapus"); } };
window.handleSearchNotes = function(val) { const filtered = notesList.filter(n => n.title.toLowerCase().includes(val.toLowerCase()) || n.content.toLowerCase().includes(val.toLowerCase())); renderNotesGrid(filtered); };

// ==================== MODAL OVERLAY CLICK TO CLOSE ====================
document.addEventListener('click', function(e) { if (e.target.classList.contains('modal-overlay')) { if (e.target.id === 'palette-modal') togglePaletteModal(); if (e.target.id === 'confirm-modal') closeSubmitConfirmModal(); if (e.target.id === 'note-modal') closeNoteModal(); if (e.target.id === 'history-detail-modal') closeHistoryDetail(); } });

// ==================== INIT LILO ON LOAD ====================
document.addEventListener('DOMContentLoaded', () => { updateLiloPetCard(); updateLiloSkinSelector(); });