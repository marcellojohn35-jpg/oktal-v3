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

// ==================== V3.2 CBT ENGINE ====================
const CBT_DURATION = 90 * 60;
let cbtRemaining = CBT_DURATION;
let cbtWarnings = new Set();

function saveExamSessionV3() {
  if (!questions.length) return;

  safeSetJSON('oktal_exam_session_v3', {
    currentBank,
    examMode,
    questions,
    currentIndex,
    userAnswers,
    userRagu,
    secondsElapsed,
    cbtRemaining,
    savedAt: Date.now()
  });
}

function clearExamSessionV3() {
  localStorage.removeItem('oktal_exam_session_v3');
}

function getSavedExamV3() {
  return safeGetJSON('oktal_exam_session_v3', null);
}

window.resumeExamV3 = function() {
  const x = getSavedExamV3();

  if (!x?.questions?.length) {
    showToast('Tidak ada ujian tersimpan.');
    return;
  }

  currentBank = x.currentBank;
  examMode = x.examMode;
  questions = x.questions;
  currentIndex = x.currentIndex || 0;
  userAnswers = x.userAnswers || [];
  userRagu = x.userRagu || [];
  secondsElapsed = x.secondsElapsed || 0;
  cbtRemaining = x.cbtRemaining ?? CBT_DURATION;

  router.navigate('/exam');

  setTimeout(() => {
    renderQuestion();
    startTimer();
  }, 100);
};

console.log('⏱️ OKTAL V3 CBT Engine active');


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

let masteryData = safeGetJSON('oktal_mastery_v3', {});
let errorNotebook = safeGetJSON('oktal_error_notebook_v3', []);

const OKTAL_BLUEPRINT = {
  "Basic AI Concepts": 15,
  "Machine Learning": 15,
  "Deep Learning": 10,
  "Data Science for AI": 10,
  "Generative AI & LLM": 15,
  "NLP": 8,
  "Computer Vision": 7,
  "AI Ethics, Regulation & Security": 10,
  "AI Applications": 5,
  "Logic & Computational Thinking": 5
};

// ==================== V3 LEARNING ENGINE ====================

function normalizeLearningCategory(category = '') {
  const x = String(category).toLowerCase();

  if (x.includes('deep')) return 'Deep Learning';
  if (x.includes('machine')) return 'Machine Learning';
  if (x.includes('data')) return 'Data Science for AI';
  if (x.includes('generative') || x.includes('llm')) return 'Generative AI & LLM';
  if (x.includes('nlp') || x.includes('natural language')) return 'NLP';
  if (x.includes('vision')) return 'Computer Vision';
  if (x.includes('ethic') || x.includes('regulation') || x.includes('security') || x.includes('etika') || x.includes('regulasi') || x.includes('keamanan'))
    return 'AI Ethics, Regulation & Security';
  if (x.includes('application') || x.includes('penerapan'))
    return 'AI Applications';
  if (x.includes('logic') || x.includes('computational') || x.includes('case') || x.includes('logika') || x.includes('kasus') || x.includes('komputasional'))
    return 'Logic & Computational Thinking';
  if (x.includes('basic') || x.includes('konsep dasar'))
    return 'Basic AI Concepts';

  return category || 'Uncategorized';
}

function saveLearningEngine() {
  safeSetJSON('oktal_mastery_v3', masteryData);
  safeSetJSON('oktal_error_notebook_v3', errorNotebook);
}

function getQuestionTopic(q) {
  return q.topic || q.subtopic || normalizeLearningCategory(q.category);
}

function recordLearningAttempt(q, selectedAnswer, isCorrect) {
  if (!q) return;

  const category = normalizeLearningCategory(q.category);
  const topic = getQuestionTopic(q);

  if (!masteryData[category]) {
    masteryData[category] = {
      attempted: 0,
      correct: 0,
      wrong: 0,
      accuracy: 0,
      topics: {},
      lastSeen: null
    };
  }

  const c = masteryData[category];

  c.attempted++;
  isCorrect ? c.correct++ : c.wrong++;
  c.accuracy = Math.round((c.correct / c.attempted) * 100);
  c.lastSeen = Date.now();

  if (!c.topics[topic]) {
    c.topics[topic] = {
      attempted: 0,
      correct: 0,
      wrong: 0,
      accuracy: 0
    };
  }

  const t = c.topics[topic];

  t.attempted++;
  isCorrect ? t.correct++ : t.wrong++;
  t.accuracy = Math.round((t.correct / t.attempted) * 100);

  const qid = String(q.id ?? q.question ?? '');

  if (!isCorrect) {
    let err = errorNotebook.find(x => String(x.id) === qid);

    if (!err) {
      err = {
        id: qid,
        question: q.question || q.pertanyaan || '',
        category,
        topic,
        difficulty: q.difficulty || 'Unknown',
        wrongCount: 0,
        resolved: false
      };

      errorNotebook.push(err);
    }

    err.wrongCount++;
    err.lastWrongAt = Date.now();
    err.selectedAnswer = selectedAnswer;
    err.correctAnswer = q.answer;
    err.explanation = q.explanation || q.pembahasan || '';
    err.resolved = false;

  } else {
    const err = errorNotebook.find(x => String(x.id) === qid);

    if (err) {
      err.resolved = true;
      err.resolvedAt = Date.now();
    }
  }

  saveLearningEngine();
}

function getWeakestCategories(limit = 3) {
  return Object.entries(masteryData)
    .filter(([_, x]) => x.attempted > 0)
    .sort((a,b) => {
      if (a[1].accuracy !== b[1].accuracy)
        return a[1].accuracy - b[1].accuracy;

      return b[1].wrong - a[1].wrong;
    })
    .slice(0, limit)
    .map(([category,data]) => ({
      category,
      ...data
    }));
}

function getWeakestTopics(limit = 5) {
  const rows = [];

  Object.entries(masteryData).forEach(([category,data]) => {
    Object.entries(data.topics || {}).forEach(([topic,t]) => {
      if (t.attempted > 0) {
        rows.push({
          category,
          topic,
          ...t
        });
      }
    });
  });

  return rows
    .sort((a,b) => {
      if (a.accuracy !== b.accuracy)
        return a.accuracy - b.accuracy;

      return b.wrong - a.wrong;
    })
    .slice(0,limit);
}

function calculateCompetitionReadiness() {
  let weighted = 0;
  let weightUsed = 0;

  Object.entries(OKTAL_BLUEPRINT).forEach(([category,weight]) => {
    const data = masteryData[category];

    if (data && data.attempted > 0) {
      weighted += data.accuracy * weight;
      weightUsed += weight;
    }
  });

  if (!weightUsed) return 0;

  return Math.round(weighted / weightUsed);
}

async function loadAllQuestionBanksV3() {
  const all = [];

  for (let i=1;i<=4;i++) {
    try {
      const r = await fetch(`/data/banksoal${i}.json`);
      const data = await r.json();

      const arr = Array.isArray(data)
        ? data
        : (data.questions || []);

      arr.forEach(q => {
        q.__bank = i;
        all.push(q);
      });

    } catch(e) {
      console.warn('V3 gagal load bank', i, e);
    }
  }

  return all;
}

window.startWeaknessPractice = async function() {
  const all = await loadAllQuestionBanksV3();

  if (!all.length) {
    showToast('Bank soal gagal dimuat.');
    return;
  }

  const weakCategories = getWeakestCategories(5).map(x => x.category);

  const unresolvedIds = new Set(
    errorNotebook
      .filter(x => !x.resolved)
      .map(x => String(x.id))
  );

  let scored = all.map(q => {
    let score = Math.random();

    const category = normalizeLearningCategory(q.category);
    const qid = String(q.id ?? q.question ?? '');

    if (unresolvedIds.has(qid))
      score += 100;

    const weakIndex = weakCategories.indexOf(category);

    if (weakIndex >= 0)
      score += 50 - (weakIndex * 5);

    return {q,score};
  });

  scored.sort((a,b) => b.score-a.score);

  questions = scored
    .slice(0,10)
    .map(x => x.q);

  currentBank = 'Weakness';
  examMode = 'weakness';

  currentIndex = 0;
  userAnswers = new Array(questions.length).fill(null);
  userRagu = new Array(questions.length).fill(false);
  secondsElapsed = 0;

  router.navigate('/exam');

  setTimeout(() => {
    renderQuestion();
    if (typeof startTimer === 'function')
      startTimer();
  },100);
};

window.getOktalLearningStats = function() {
  return {
    readiness: calculateCompetitionReadiness(),
    weakestCategories: getWeakestCategories(5),
    weakestTopics: getWeakestTopics(10),
    mastery: masteryData,
    unresolvedErrors: errorNotebook.filter(x => !x.resolved),
    errorNotebook
  };
};

console.log('🧠 OKTAL V3 Learning Engine active');


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

  const pathToView = { 'view-dashboard': '/dashboard', 'view-notes': '/notes', 'view-history': '/history', 'view-profile': '/profile' };
  const currentPath = pathToView[viewId] || '/dashboard';
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.toggle('active', item.getAttribute('data-route') === currentPath);
  });

  if (viewId === 'view-dashboard') { setTimeout(bootV4Dashboard, 0); }
  if (viewId === 'view-history') renderHistoryView();
  if (viewId === 'view-profile') { syncProfileUI(); updateLiloSkinSelector(); }
}


// ==================== V3.2 LEARNING DASHBOARD ====================

function getLiloRecommendationV3() {
  const weak = getWeakestCategories(3);
  const errors = errorNotebook.filter(x => !x.resolved);

  if (!weak.length) {
    return {
      title: 'Mulai pemetaan kemampuan',
      text: 'Kerjakan latihan agar Lilo bisa menemukan topik terkuat dan terlemahmu.'
    };
  }

  const w = weak[0];

  if (w.accuracy < 50) {
    return {
      title: `Fokus ${w.category}`,
      text: `Akurasi kamu baru ${w.accuracy}%. Pelajari konsepnya lalu kerjakan 10 Soal Kelemahan.`
    };
  }

  if (errors.length >= 5) {
    return {
      title: 'Bereskan Error Notebook',
      text: `Masih ada ${errors.length} kesalahan yang belum dikuasai. Prioritaskan retry.`
    };
  }

  return {
    title: `Naikkan ${w.category}`,
    text: `Akurasi ${w.accuracy}%. Kamu sudah lumayan, sekarang dorong sampai minimal 80%.`
  };
}

function renderLearningDashboardV3() {
  const dashboard=document.getElementById('view-dashboard');
  if(!dashboard) return;

  let root=document.getElementById('v3-learning-dashboard');

  if(!root){
    root=document.createElement('section');
    root.id='v3-learning-dashboard';
    root.className='v3-learning-dashboard';

    const navbar=dashboard.querySelector('.dash-navbar');

    if(navbar) navbar.insertAdjacentElement('afterend',root);
    else dashboard.prepend(root);
  }

  const readiness=calculateCompetitionReadiness();
  const weak=getWeakestCategories(3);
  const weakTopics=getWeakestTopics(3);
  const unresolved=errorNotebook.filter(x=>!x.resolved);
  const recommendation=getLiloRecommendationV3();

  const weakHTML=weak.length
    ? weak.map(x=>`
        <div class="v3-mastery-row">
          <div class="v3-mastery-info">
            <b>${x.category}</b>
            <small>${x.attempted} soal dikerjakan</small>
          </div>
          <strong class="v3-mastery-score">${x.accuracy}%</strong>
        </div>
      `).join('')
    : `<div class="v3-empty">Belum ada data kemampuan.</div>`;

  const topicHTML=weakTopics.length
    ? weakTopics.map(x=>`
        <span class="v3-topic-chip">${x.topic} · ${x.accuracy}%</span>
      `).join('')
    : `<span class="v3-topic-chip">Belum terdeteksi</span>`;

  root.innerHTML=`
    <div class="v3-top">
      <div>
        <div class="v3-label">🐟 LILO LEARNING INTELLIGENCE</div>
        <h2 class="v3-title">Competition Readiness</h2>
      </div>

      <div class="v3-score">${readiness}%</div>
    </div>

    <div class="v3-readiness-track">
      <div
        class="v3-readiness-fill"
        style="width:${readiness}%"
      ></div>
    </div>

    <section class="v3-section">
      <h3 class="v3-section-title">🎯 Kelemahan Utama</h3>

      <div class="v3-mastery-list">
        ${weakHTML}
      </div>

      <div class="v3-topic-list">
        ${topicHTML}
      </div>
    </section>

    <div class="v3-secondary-grid">
      <article class="v3-mini-card">
        <h3>📕 Error Notebook</h3>

        <div class="v3-error-number">
          ${unresolved.length}
        </div>

        <p class="v3-muted">
          kesalahan belum dikuasai
        </p>

        <button
          class="v3-text-button"
          onclick="showErrorNotebookV3()"
        >
          Lihat Kesalahan
        </button>
      </article>

      <article class="v3-mini-card">
        <h3>🐟 ${recommendation.title}</h3>

        <p class="v3-recommendation">
          ${recommendation.text}
        </p>
      </article>
    </div>

    <button
      class="v3-primary-action"
      onclick="startWeaknessPractice()"
    >
      🎯 Latihan 10 Soal Kelemahan
    </button>

    ${getSavedExamV3() ? `
      <button
        class="v3-resume-action"
        onclick="resumeExamV3()"
      >
        ▶️ Lanjutkan Ujian
      </button>
    ` : ''}
  `;
}

window.showErrorNotebookV3=function(){
  const unresolved=errorNotebook
    .filter(x=>!x.resolved)
    .sort((a,b)=>(b.wrongCount||0)-(a.wrongCount||0));

  if(!unresolved.length){
    showToast('🎉 Tidak ada kesalahan aktif.');
    return;
  }

  const lines=unresolved.slice(0,10).map((x,i)=>
    `${i+1}. ${x.topic} — ${x.wrongCount}x salah`
  );

  alert(
    `📕 ERROR NOTEBOOK\n\n${lines.join('\n')}\n\nKerjakan 10 Soal Kelemahan untuk memperbaikinya.`
  );
};



const routes = {
  '/': () => showDOMView('view-login'),
  '/dashboard': () => {
    showDOMView('view-dashboard');
    if(currentUser) loadUserStats();
    setTimeout(bootV4Dashboard,0);
  },

  '/notes': () => { showDOMView('view-notes'); renderNotesGrid(notesList); },
  '/history': () => { showDOMView('view-history'); renderHistoryView(); },
  '/profile': () => { showDOMView('view-profile'); syncProfileUI(); updateLiloSkinSelector(); },
  '/exam': () => showDOMView('view-exam'),
  '/result': () => showDOMView('view-result'),
  '/review': () => showDOMView('view-review')
};

const router = new Router(routes);

window.switchView = function(viewId) {
  const pathToView = { 'view-login': '/', 'view-dashboard': '/dashboard', 'view-notes': '/notes', 'view-history': '/history', 'view-profile': '/profile', 'view-exam': '/exam', 'view-result': '/result', 'view-review': '/review' };
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
  currentIndex = 0;
  userAnswers = new Array(questions.length).fill(null);
  userRagu = new Array(questions.length).fill(false);
  lastExamResult = null;

  // Fresh session: reset timer state.
  // Resume session tidak melewati initExamSession().
  secondsElapsed = 0;
  cbtRemaining = CBT_DURATION;
  cbtWarnings.clear();
  const titleMap = { banksoal1: "Bank Soal 1: Dasar AI & ML", banksoal2: "Bank Soal 2: Deep Learning", banksoal3: "Bank Soal 3: Computer Vision & NLP", banksoal4: "Bank Soal 4: Etika AI & Logika" };
  const elemTitle = document.getElementById('exam-bank-title'), modeBadge = document.getElementById('exam-mode-badge');
  if (elemTitle) elemTitle.innerText = quizLabel || titleMap[bankFile.toLowerCase()] || 'Bank Soal';
  if (modeBadge) modeBadge.innerText = examMode === 'quiz' ? '⚡ Mini Quiz' : '📝 Ujian';
  const liloWidget = document.getElementById('exam-lilo-widget');
  if (liloWidget) liloWidget.classList.remove('hidden');
  updateExamLiloWidget();
  router.navigate('/exam'); startTimer(); renderQuestion();
}

function startTimer() {
  if (timerInterval) clearInterval(timerInterval);

  const competition = examMode === 'exam';

  if (competition && (!Number.isFinite(cbtRemaining) || cbtRemaining <= 0)) {
    cbtRemaining = CBT_DURATION;
  }

  timerInterval = setInterval(() => {
    secondsElapsed++;
    const timerElem = document.getElementById('exam-timer');

    if (competition) {
      cbtRemaining--;

      const mins = String(Math.floor(cbtRemaining / 60)).padStart(2,'0');
      const secs = String(cbtRemaining % 60).padStart(2,'0');

      if (timerElem) timerElem.innerText = `⏳ ${mins}:${secs}`;

      const warnings = {
        600: '10 menit',
        300: '5 menit',
        60: '1 menit'
      };

      if (warnings[cbtRemaining] && !cbtWarnings.has(cbtRemaining)) {
        cbtWarnings.add(cbtRemaining);
        showToast(`⚠️ Sisa waktu ${warnings[cbtRemaining]}!`);
      }

      if (cbtRemaining <= 0) {
        clearInterval(timerInterval);
        timerInterval = null;
        showToast('⏰ Waktu habis. Ujian dikumpulkan otomatis.');
        window.submitExam();
        return;
      }
    } else {
      const mins = String(Math.floor(secondsElapsed / 60)).padStart(2,'0');
      const secs = String(secondsElapsed % 60).padStart(2,'0');
      if (timerElem) timerElem.innerText = `⏱️ ${mins}:${secs}`;
    }

    if (secondsElapsed % 5 === 0) saveExamSessionV3();
  }, 1000);
}

function renderQuestion() {
  saveExamSessionV3();
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
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  clearExamSessionV3();

  // V3: capture learning data before result calculation
  try {
    questions.forEach((q, i) => {
      const selected = userAnswers[i];
      if (selected === null || selected === undefined) return;

      recordLearningAttempt(
        q,
        selected,
        selected === q.answer
      );
    });
  } catch (e) {
    console.error('V3 attempt tracking error:', e);
  }


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


// ==================== V4 ADAPTIVE LEARNING ====================

const V4_BANKS=[
  'banksoal1',
  'banksoal2',
  'banksoal3',
  'banksoal4'
];

function renderV4Dashboard(){
  const score=document.getElementById('v4-readiness-score');
  if(!score) return;

  const readiness=calculateCompetitionReadiness();
  const weak=getWeakestCategories(10);
  const weakTopics=getWeakestTopics(3);
  const unresolved=errorNotebook.filter(x=>!x.resolved);

  score.textContent=`${readiness}%`;

  const bar=document.getElementById('v4-readiness-bar');
  if(bar) bar.style.width=`${readiness}%`;

  const error=document.getElementById('v4-error-count');
  if(error){
    error.textContent=
      `${unresolved.length} kesalahan belum dikuasai`;
  }

  const map=document.getElementById('v4-mastery-map');

  if(map){
    map.innerHTML=weak.length
      ? weak.map(x=>`
          <div class="v4-mastery-item">
            <div>
              <strong>${x.category}</strong>
              <small>${x.attempted} soal</small>
            </div>

            <div class="v4-mastery-right">
              <div class="v4-mastery-track">
                <span style="width:${x.accuracy}%"></span>
              </div>
              <b>${x.accuracy}%</b>
            </div>
          </div>
        `).join('')
      : `<div class="v4-empty">
           Belum ada data. Mulai Diagnostic.
         </div>`;
  }

  const title=document.getElementById('v4-focus-title');
  const text=document.getElementById('v4-focus-text');

  if(!weak.length){
    if(title) title.textContent='Mulai Diagnostic';
    if(text) text.textContent=
      'Petakan kemampuanmu di seluruh silabus AI.';
  }else{
    const w=weak[0];

    if(title) title.textContent=`Fokus: ${w.category}`;

    if(text){
      text.textContent=weakTopics.length
        ? `Prioritas berikutnya: ${weakTopics
            .map(x=>x.topic).join(', ')}.`
        : `Akurasi kategori ini ${w.accuracy}%.`;
    }
  }
}

async function startV4Practice(mode){
  try{
    let bank='banksoal1';
    let count=20;
    let label='Latihan';
    let nextMode='quiz';

    if(mode==='diagnostic'){
      bank='banksoal1';
      count=20;
      label='Diagnostic';
    }

    else if(mode==='smart'){
      const weak=getWeakestCategories(1);
      const weakest=weak?.[0];

      /*
       * Smart Practice menggunakan variant B sebagai
       * latihan aplikasi, kemudian memprioritaskan kategori
       * terlemah jika data mastery tersedia.
       */
      bank='banksoal2';
      count=20;
      label=weakest?.category
        ? `Smart Practice · ${weakest.category}`
        : 'Smart Practice';
    }

    else if(mode==='olympiad'){
      bank='banksoal4';
      count=20;
      label='Olympiad Training';
    }

    else if(mode==='simulation'){
      bank=V4_BANKS[
        Math.floor(Math.random()*V4_BANKS.length)
      ];

      count=null;
      label='Full Simulation';
      nextMode='exam';
    }

    examMode=nextMode;
    currentBank=bank;

    questions=await loadQuestions(bank,count);

    /*
     * Smart Practice: prioritaskan kategori terlemah
     * tanpa merusak fallback 20 soal.
     */
    if(mode==='smart'){
      const weak=getWeakestCategories(1);
      const category=weak?.[0]?.category;

      if(category){
        const full=await loadQuestions(bank);

        const targeted=full.filter(
          q=>q.category===category
        );

        const others=full.filter(
          q=>q.category!==category
        );

        questions=[
          ...targeted,
          ...others
        ].slice(0,20);
      }
    }

    initExamSession(bank,label);

  }catch(err){
    console.error('V4 practice error:',err);
    showToast(`Gagal: ${err?.message || String(err)}`);
  }
}

function bindV4Dashboard(){
  const bindings={
    'v4-diagnostic':'diagnostic',
    'v4-smart':'smart',
    'v4-smart-start':'smart',
    'v4-olympiad':'olympiad',
    'v4-simulation':'simulation'
  };

  Object.entries(bindings).forEach(([id,mode])=>{
    const el=document.getElementById(id);

    if(el && !el.dataset.v4Bound){
      el.dataset.v4Bound='1';

      el.addEventListener('click',()=>{
        startV4Practice(mode);
      });
    }
  });
}

function bootV4Dashboard(){
  renderV4Dashboard();
  bindV4Dashboard();
  bindV4Navigation();
}


// ==================== V4 NAVIGATION ====================

function openV4Training(){
  router.navigate('/dashboard');

  setTimeout(()=>{
    const target=document.querySelector('.v4-modes');

    if(target){
      target.scrollIntoView({
        behavior:'smooth',
        block:'center'
      });
    }
  },80);
}

function bindV4Navigation(){
  const training=document.getElementById('nav-training');

  if(training && !training.dataset.bound){
    training.dataset.bound='1';
    training.addEventListener('click',openV4Training);
  }
}

document.addEventListener('DOMContentLoaded',()=>{
  bindV4Navigation();
});
