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
  const entries = Object.entries(OKTAL_BLUEPRINT || {});

  if (!entries.length) return 0;

  const totalWeight = entries.reduce(
    (sum, [, weight]) => sum + Number(weight || 0),
    0
  ) || 100;

  const weightedScore = entries.reduce(
    (sum, [category, weight]) => {
      const mastery = masteryData?.[category];
      const accuracy = Number(mastery?.accuracy || 0);

      return sum + (accuracy * Number(weight || 0));
    },
    0
  );

  return Math.round(weightedScore / totalWeight);
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
  // V4: exam widget sekarang adalah Lilo Hint Bot.
  // Legacy pet skin/food tidak lagi dirender di exam.
  const widget = document.getElementById('exam-lilo-widget');
  if (!widget) return;

  if (typeof updateLiloHintAvailability === 'function') {
    updateLiloHintAvailability();
  }

  if(typeof initLiloBubbleDrag === 'function'){
    initLiloBubbleDrag();

    requestAnimationFrame(()=>{
      restoreLiloBubblePosition();
    });
  }
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
  if (viewId === 'view-profile') syncProfileUI();
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

  const resolved=errorNotebook.filter(x=>x.resolved);

  const modal=document.getElementById('v4-error-modal');
  const list=document.getElementById('v4-error-list');
  const summary=document.getElementById('v4-error-modal-summary');

  if(!modal || !list || !summary){
    showToast('Kesalahan Belajar belum tersedia.');
    return;
  }

  summary.innerHTML=`
    <div>
      <strong>${unresolved.length}</strong>
      <span>Perlu dipelajari</span>
    </div>

    <div>
      <strong>${resolved.length}</strong>
      <span>Sudah dikuasai</span>
    </div>
  `;

  if(!unresolved.length){
    list.innerHTML=`
      <div class="v4-error-empty">
        <div>🎉</div>
        <h3>Semua aman!</h3>
        <p>
          Belum ada kesalahan yang perlu kamu perbaiki.
          Kalau nanti ada soal yang salah, OKTAL akan menyimpannya di sini.
        </p>
      </div>
    `;
  }else{
    list.innerHTML=unresolved.map((x,i)=>{
      const topic=escapeLiloHTML(
        x.topic ||
        x.category ||
        'Konsep belum teridentifikasi'
      );

      const category=escapeLiloHTML(
        x.category ||
        'Materi AI'
      );

      const wrong=Math.max(1,Number(x.wrongCount)||1);

      const explanation=escapeLiloHTML(
        x.explanation ||
        'Coba pelajari kembali konsep dasarnya, lalu kerjakan soal serupa.'
      );

      return `
        <article class="v4-error-item">

          <div class="v4-error-item-top">
            <span class="v4-error-number">
              ${String(i+1).padStart(2,'0')}
            </span>

            <div class="v4-error-item-title">
              <small>${category}</small>
              <h3>${topic}</h3>
            </div>

            <span class="v4-error-times">
              ${wrong}× salah
            </span>
          </div>

          <div class="v4-error-meaning">
            <span>APA ARTINYA?</span>

            <p>
              Kamu pernah salah pada konsep ini.
              Semakin sering salah, semakin penting konsep ini
              untuk kamu pelajari lagi.
            </p>
          </div>

          <div class="v4-error-explanation">
            <span>YANG PERLU DIPAHAMI</span>
            <p>${explanation}</p>
          </div>

        </article>
      `;
    }).join('');
  }

  modal.classList.remove('hidden');
  document.body.classList.add('v4-error-open');
};

window.closeErrorNotebookV4=function(event){
  if(event && event.target !== event.currentTarget) return;

  document
    .getElementById('v4-error-modal')
    ?.classList.add('hidden');

  document.body.classList.remove('v4-error-open');
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
  '/profile': () => { showDOMView('view-profile'); syncProfileUI(); },
  '/exam': () => showDOMView('view-exam'),
  '/result': () => showDOMView('view-result'),
  '/review': () => showDOMView('view-review')
};

const router = new Router(routes);


window.navigateBottomV4 = function(path) {
  const validRoutes = [
    '/dashboard',
    '/history',
    '/profile'
  ];

  if (!validRoutes.includes(path)) return;

  router.navigate(path);

  document
    .querySelectorAll('#bottom-nav .nav-item')
    .forEach(item => {
      item.classList.toggle(
        'active',
        item.dataset.route === path
      );
    });

  window.scrollTo({
    top: 0,
    behavior: 'instant'
  });
};

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

function getModeMetaV4(mode = '') {
  const modes = {
    diagnostic: {
      label: 'Diagnostic',
      icon: '🧭',
      group: 'training'
    },
    smart: {
      label: 'Smart Practice',
      icon: '🎯',
      group: 'training'
    },
    smart_practice: {
      label: 'Smart Practice',
      icon: '🎯',
      group: 'training'
    },
    olympiad: {
      label: 'Olympiad Training',
      icon: '🏆',
      group: 'training'
    },
    bank: {
      label: 'Bank Soal',
      icon: '📚',
      group: 'bank'
    },
    quiz: {
      label: 'Mini Quiz',
      icon: '⚡',
      group: 'training'
    },
    simulation: {
      label: 'Full Simulation',
      icon: '⏱️',
      group: 'simulation'
    },
    exam: {
      label: 'Simulation',
      icon: '⏱️',
      group: 'simulation'
    }
  };

  return modes[mode] || {
    label: 'Latihan',
    icon: '🧠',
    group: 'training'
  };
}

function getBankNameV4(bank = '') {
  const banks = {
    banksoal1: 'Bank A · Concept',
    banksoal2: 'Bank B · Application',
    banksoal3: 'Bank C · Analysis',
    banksoal4: 'Bank D · Reasoning'
  };

  return banks[bank] || bank || 'OKTAL Training';
}

function getLocalProfileStatsV4() {
  const history = Array.isArray(examHistory)
    ? examHistory
    : [];

  const total = history.length;

  const totalQuestions = history.reduce(
    (sum, h) => sum + (Number(h.totalQuestions) || 0),
    0
  );

  const totalScore = history.reduce(
    (sum, h) => sum + (Number(h.score) || 0),
    0
  );

  const avg = total
    ? Math.round(totalScore / total)
    : 0;

  const best = history.reduce(
    (max, h) => Math.max(max, Number(h.score) || 0),
    0
  );

  return {
    total,
    totalQuestions,
    avg,
    best
  };
}

function renderProfileMasteryV4() {
  const root =
    document.getElementById('profile-mastery-list');

  if (!root) return;

  root.innerHTML = Object.keys(OKTAL_BLUEPRINT)
    .map(category => {
      const data = masteryData?.[category];

      const attempts =
        Number(data?.attempts) ||
        Number(data?.total) ||
        0;

      const correct =
        Number(data?.correct) ||
        0;

      const accuracy = attempts > 0
        ? Math.round((correct / attempts) * 100)
        : 0;

      return `
        <div class="v4-profile-mastery-item">
          <div class="v4-profile-mastery-top">
            <span>${category}</span>
            <strong>
              ${attempts ? accuracy + '%' : 'Belum dites'}
            </strong>
          </div>

          <div class="v4-profile-mastery-track">
            <div style="width:${accuracy}%"></div>
          </div>
        </div>
      `;
    })
    .join('');
}

function renderProfileFocusV4() {
  const title =
    document.getElementById('profile-focus-title');

  const text =
    document.getElementById('profile-focus-text');

  if (!title || !text) return;

  const weak = getWeakestCategories(1);
  const unresolved =
    errorNotebook.filter(x => !x.resolved);

  if (!examHistory.length) {
    title.textContent = 'Mulai Diagnostic';
    text.textContent =
      'Petakan kemampuan awalmu sebelum masuk latihan adaptif.';
    return;
  }

  if (unresolved.length >= 3) {
    title.textContent =
      `${unresolved.length} kesalahan perlu direview`;

    text.textContent =
      'Perbaiki kesalahan lama sebelum menambah materi baru.';
    return;
  }

  if (weak.length) {
    title.textContent =
      `Perkuat ${weak[0].category}`;

    text.textContent =
      `Area ini masih menjadi prioritas utama latihanmu.`;
    return;
  }

  title.textContent = 'Lanjutkan latihan';
  text.textContent =
    'Pertahankan konsistensi dan tingkatkan readiness.';
}

function syncProfileUI() {
  if (!currentUser) return;

  const name =
    document.getElementById('profile-page-name');

  const email =
    document.getElementById('profile-page-email');

  const avatar =
    document.getElementById('profile-page-avatar');

  if (name)
    name.textContent =
      currentUser.displayName || 'Pengguna';

  if (email)
    email.textContent =
      currentUser.email || '';

  if (avatar)
    avatar.src =
      currentUser.photoURL ||
      'https://via.placeholder.com/100';

  const stats = getLocalProfileStatsV4();

  const done = document.getElementById('p-stat-done');
  const avg = document.getElementById('p-stat-avg');
  const high = document.getElementById('p-stat-high');
  const q =
    document.getElementById('p-stat-questions');

  if (done) done.textContent = stats.total;
  if (avg) avg.textContent = `${stats.avg}%`;
  if (high) high.textContent = `${stats.best}%`;
  if (q) q.textContent = stats.totalQuestions;

  const readiness =
    calculateCompetitionReadiness();

  const readinessText =
    document.getElementById('profile-readiness');

  const readinessBar =
    document.getElementById('profile-readiness-bar');

  const readinessNote =
    document.getElementById('profile-readiness-note');

  if (readinessText)
    readinessText.textContent = `${readiness}%`;

  if (readinessBar)
    readinessBar.style.width = `${readiness}%`;

  if (readinessNote) {
    if (!stats.total) {
      readinessNote.textContent =
        'Mulai latihan untuk memetakan kemampuanmu.';
    } else if (readiness < 40) {
      readinessNote.textContent =
        'Fondasi masih perlu diperkuat.';
    } else if (readiness < 70) {
      readinessNote.textContent =
        'Kemampuan berkembang. Fokus pada area lemah.';
    } else if (readiness < 85) {
      readinessNote.textContent =
        'Sudah kuat. Tingkatkan konsistensi olimpiade.';
    } else {
      readinessNote.textContent =
        'Readiness tinggi. Pertahankan performa.';
    }
  }

  renderProfileMasteryV4();
  renderProfileFocusV4();
}

async function loadUserStats() {
  // Profile V4 memakai local learning history sebagai
  // sumber statistik utama agar seluruh mode langsung sinkron.
  syncProfileUI();
}


// ==================== MATERI ENGINE ====================





function getOptionsArray(q) {
  if (!q) return [];

  const raw = q.options;

  // Format baru:
  // [{key:"A", text:"..."}, ...]
  if (Array.isArray(raw)) {
    return raw.map((opt, idx) => {
      if (opt && typeof opt === 'object') {
        return {
          key: String(
            opt.key ||
            String.fromCharCode(65 + idx)
          ).trim().toUpperCase(),
          text: String(
            opt.text ??
            opt.value ??
            opt.label ??
            ''
          )
        };
      }

      return {
        key: String.fromCharCode(65 + idx),
        text: String(opt ?? '')
      };
    });
  }

  // Format object:
  // {"A":"...", "B":"..."}
  if (raw && typeof raw === 'object') {
    return Object.entries(raw).map(([key, value]) => ({
      key: String(key).trim().toUpperCase(),
      text: String(
        value?.text ??
        value?.value ??
        value ??
        ''
      )
    }));
  }

  // Fallback format legacy:
  // optionA, optionB, ...
  return ['A','B','C','D','E']
    .map(key => ({
      key,
      text: String(
        q[`option${key}`] ??
        q[key] ??
        ''
      )
    }))
    .filter(opt => opt.text.trim());
}

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

window.startExam = async function(bankFile) { examMode = 'bank'; currentBank = bankFile; try { questions = await loadQuestions(bankFile); initExamSession(bankFile); } catch (err) { console.error("Error startExam:", err); alert(`Gagal memuat bank soal: ${err.message}`); } };
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
  if (modeBadge) {
    const modeLabels = {
      quiz: '⚡ MINI QUIZ',
      bank: '📚 BANK SOAL',
      diagnostic: '🧭 DIAGNOSTIC',
      smart: '🎯 SMART PRACTICE',
      olympiad: '🏆 OLYMPIAD',
      simulation: '⏳ FULL SIMULATION'
    };
    modeBadge.innerText = modeLabels[examMode] || '🧠 LATIHAN';
  }
  const liloWidget = document.getElementById('exam-lilo-widget');
  if (liloWidget) liloWidget.classList.remove('hidden');
  updateExamLiloWidget();
  router.navigate('/exam'); startTimer(); renderQuestion();
}

function startTimer() {
  if (timerInterval) clearInterval(timerInterval);

  const competition = examMode === 'simulation';

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

  // Lilo Hint Bot hanya membaca state soal aktif.
  resetLiloForQuestion();
  updateLiloHintAvailability();
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
  const bankNames = {
    banksoal1: "Bank A · Concept",
    banksoal2: "Bank B · Application",
    banksoal3: "Bank C · Analysis",
    banksoal4: "Bank D · Reasoning"
  };
  examHistory.unshift({ id: Date.now(), date: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }), timestamp: new Date().toISOString(), bank: currentBank, bankName: bankNames[currentBank] || currentBank, mode: examMode, totalQuestions: total, correct: correctCount, wrong: wrongCount, score: score, grade: grade, duration: durationStr, secondsElapsed: secondsElapsed });
  if (examHistory.length > 50) examHistory = examHistory.slice(0, 50);
  saveHistory();
  document.getElementById('exam-lilo-widget')?.classList.add('hidden');
  router.navigate('/result');
  window.renderLiloReaction(score);
  if (currentUser) { const attemptData = { type: examMode === 'quiz' ? 'mini_quiz' : 'bank_soal', bank: currentBank, score: score, totalQuestions: total, correct: correctCount, wrong: wrongCount, duration: durationStr }; await saveAttempt(attemptData); await loadUserStats(); }
};

// ==================== REVIEW ====================
window.showReviewPage = function() {
  if (!Array.isArray(questions) || !questions.length) {
    showToast("Data pembahasan tidak tersedia.");
    return;
  }

  router.navigate('/review');

  setTimeout(() => {
    let correctCount = 0;
    let wrongCount = 0;

    questions.forEach((q, idx) => {
      if (userAnswers[idx] === q.answer) {
        correctCount++;
      } else {
        wrongCount++;
      }
    });

    const all = document.getElementById('count-all');
    const correct = document.getElementById('count-correct');
    const wrong = document.getElementById('count-wrong');

    if (all) all.textContent = questions.length;
    if (correct) correct.textContent = correctCount;
    if (wrong) wrong.textContent = wrongCount;

    document.querySelectorAll('.review-tabs .tab-btn')
      .forEach(btn => btn.classList.remove('active'));

    document.querySelector('.review-tabs .tab-btn')
      ?.classList.add('active');

    renderReviewList('all');
  }, 0);
};

function getReviewOptionText(q, key) {
  if (!key) return '';

  const option = getOptionsArray(q)
    .find(
      x => String(x.key).toUpperCase() ===
           String(key).toUpperCase()
    );

  return option?.text || '';
}

function escapeReviewHTML(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function renderReviewList(filter = 'all') {
  const reviewList =
    document.getElementById('review-list');

  if (!reviewList) return;

  reviewList.innerHTML = '';

  questions.forEach((q, idx) => {
    const userAnsKey = userAnswers[idx] || null;
    const isCorrect = userAnsKey === q.answer;

    if (filter === 'correct' && !isCorrect) return;
    if (filter === 'wrong' && isCorrect) return;

    const userText = userAnsKey
      ? `${userAnsKey}. ${getReviewOptionText(q, userAnsKey)}`
      : 'Tidak dijawab';

    const correctText =
      `${q.answer}. ${getReviewOptionText(q, q.answer)}`;

    const explanation =
      q.explanation ||
      q.pembahasan ||
      'Tidak ada pembahasan khusus.';

    const card = document.createElement('article');

    card.className =
      `review-card ${isCorrect ? 'correct' : 'wrong'}`;

    card.innerHTML = `
      <span class="review-status-pill">
        ${isCorrect ? '✅ Jawaban Benar' : '❌ Jawaban Salah'}
        · Soal ${idx + 1}
      </span>

      <div class="review-question">
        ${escapeReviewHTML(q.question)}
      </div>

      <div class="review-ans">
        <strong>Jawaban Kamu:</strong>
        ${escapeReviewHTML(userText)}
      </div>

      <div class="review-ans"
           style="color:var(--color-green)">
        <strong>Jawaban Benar:</strong>
        ${escapeReviewHTML(correctText)}
      </div>

      <div class="explanation-box">
        <strong>💡 Pembahasan</strong><br>
        ${escapeReviewHTML(explanation)}
      </div>
    `;

    reviewList.appendChild(card);
  });

  if (!reviewList.children.length) {
    reviewList.innerHTML = `
      <div class="history-empty-state">
        <div class="empty-icon">🔎</div>
        <h4>Tidak ada soal</h4>
        <p>Tidak ada jawaban pada filter ini.</p>
      </div>
    `;
  }
}

window.filterReview = function(filterType, evt) {
  document.querySelectorAll('.review-tabs .tab-btn')
    .forEach(btn => btn.classList.remove('active'));

  const button = evt?.currentTarget || evt?.target;
  button?.classList.add('active');

  renderReviewList(filterType);
};


// ==================== RIWAYAT V4 ====================

let historyFilterV4 = 'all';

function normalizeHistoryItemV4(h) {
  const mode = h?.mode || 'bank';
  const meta = getModeMetaV4(mode);

  return {
    ...h,
    mode,
    meta,
    score: Number(h?.score) || 0,
    correct: Number(h?.correct) || 0,
    wrong: Number(h?.wrong) || 0,
    totalQuestions:
      Number(h?.totalQuestions) || 0,
    bankName:
      getBankNameV4(h?.bank)
  };
}

function renderHistoryView() {
  const list =
    document.getElementById('history-list');

  if (!list) return;

  const history = (Array.isArray(examHistory)
    ? examHistory
    : [])
    .map(normalizeHistoryItemV4);

  const total = history.length;

  const totalQuestions = history.reduce(
    (sum, h) => sum + h.totalQuestions,
    0
  );

  const avg = total
    ? Math.round(
        history.reduce(
          (sum, h) => sum + h.score,
          0
        ) / total
      )
    : 0;

  const best = history.reduce(
    (max, h) => Math.max(max, h.score),
    0
  );

  const totalEl =
    document.getElementById('hs-total-exams');

  const avgEl =
    document.getElementById('hs-avg-score');

  const bestEl =
    document.getElementById('hs-best-score');

  const questionsEl =
    document.getElementById('hs-total-questions');

  const clear =
    document.getElementById('btn-clear-history');

  if (totalEl) totalEl.textContent = total;
  if (avgEl) avgEl.textContent = `${avg}%`;
  if (bestEl) bestEl.textContent = `${best}%`;
  if (questionsEl)
    questionsEl.textContent = totalQuestions;

  if (clear)
    clear.style.display = total ? '' : 'none';

  let visible = history;

  if (historyFilterV4 !== 'all') {
    visible = history.filter(
      h => h.meta.group === historyFilterV4
    );
  }

  if (!visible.length) {
    list.innerHTML = `
      <div class="v4-history-empty">
        <div>📭</div>
        <h3>
          ${total
            ? 'Tidak ada sesi pada filter ini'
            : 'Belum ada riwayat'}
        </h3>
        <p>
          ${total
            ? 'Pilih kategori lain untuk melihat sesi.'
            : 'Selesaikan latihan pertama untuk mulai merekam progres.'}
        </p>
      </div>
    `;
    return;
  }

  list.innerHTML = visible.map(h => {
    let scoreClass = 'low';

    if (h.score >= 85) scoreClass = 'great';
    else if (h.score >= 70) scoreClass = 'good';
    else if (h.score >= 50) scoreClass = 'okay';

    return `
      <article class="v4-history-card"
               onclick="viewHistoryDetail('${h.id}')">

        <div class="v4-history-icon">
          ${h.meta.icon}
        </div>

        <div class="v4-history-content">
          <div class="v4-history-card-top">
            <span class="v4-history-mode ${h.meta.group}">
              ${h.meta.label}
            </span>

            <small>${h.date || ''}</small>
          </div>

          <h3>${h.bankName}</h3>

          <div class="v4-history-meta">
            <span>✓ ${h.correct}</span>
            <span>✕ ${h.wrong}</span>
            <span>◷ ${h.duration || '00:00'}</span>
            <span>${h.totalQuestions} soal</span>
          </div>
        </div>

        <div class="v4-history-score ${scoreClass}">
          ${h.score}%
        </div>

        <button class="v4-history-delete"
                title="Hapus"
                onclick="
                  event.stopPropagation();
                  deleteHistoryItem('${h.id}')
                ">
          ×
        </button>
      </article>
    `;
  }).join('');
}

window.filterHistoryV4 = function(filter, evt) {
  historyFilterV4 = filter;

  document
    .querySelectorAll('#v4-history-filter button')
    .forEach(btn =>
      btn.classList.remove('active')
    );

  evt?.currentTarget?.classList.add('active');

  renderHistoryView();
};

window.viewHistoryDetail = function(historyId) {
  const raw = examHistory.find(
    h => String(h.id) === String(historyId)
  );

  if (!raw) return;

  const item = normalizeHistoryItemV4(raw);

  const content =
    document.getElementById(
      'history-detail-content'
    );

  if (!content) return;

  content.innerHTML = `
    <div class="v4-history-detail-hero">
      <div>${item.meta.icon}</div>
      <span>${item.meta.label}</span>
      <strong>${item.score}%</strong>
    </div>

    <div class="history-detail-row">
      <span>Sesi</span>
      <span>${item.bankName}</span>
    </div>

    <div class="history-detail-row">
      <span>Tanggal</span>
      <span>${item.date || '-'}</span>
    </div>

    <div class="history-detail-row">
      <span>Durasi</span>
      <span>${item.duration || '00:00'}</span>
    </div>

    <div class="history-detail-row">
      <span>Total soal</span>
      <span>${item.totalQuestions}</span>
    </div>

    <div class="history-detail-row">
      <span>Benar</span>
      <span>✅ ${item.correct}</span>
    </div>

    <div class="history-detail-row">
      <span>Salah</span>
      <span>❌ ${item.wrong}</span>
    </div>

    <div class="history-detail-row">
      <span>Grade</span>
      <span>${item.grade || '-'}</span>
    </div>
  `;

  document
    .getElementById('history-detail-modal')
    ?.classList.remove('hidden');
};

window.closeHistoryDetail = function() {
  document
    .getElementById('history-detail-modal')
    ?.classList.add('hidden');
};

window.deleteHistoryItem = function(historyId) {
  if (!confirm('Hapus riwayat ini?')) return;

  examHistory = examHistory.filter(
    h => String(h.id) !== String(historyId)
  );

  saveHistory();
  renderHistoryView();
  syncProfileUI();
  showToast('Riwayat dihapus');
};

window.clearAllHistory = function() {
  if (!examHistory.length) return;

  if (!confirm(
    'Hapus semua riwayat belajar?'
  )) return;

  examHistory = [];
  saveHistory();

  renderHistoryView();
  syncProfileUI();

  showToast('Semua riwayat dihapus');
};


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
    error.textContent =
      `${unresolved.length} kesalahan belum dikuasai`;
  }

  const errorNumber =
    document.getElementById('v4-error-count-number');

  const errorSummary =
    document.getElementById('v4-error-summary');

  const errorCategory =
    document.getElementById('v4-error-weak-category');

  const errorTopic =
    document.getElementById('v4-error-weak-topic');

  const errorRate =
    document.getElementById('v4-error-resolved-rate');

  const errorBar =
    document.getElementById('v4-error-progress-bar');

  const allErrors = Array.isArray(errorNotebook)
    ? errorNotebook
    : [];

  const resolvedCount =
    allErrors.filter(x => x.resolved).length;

  const resolvedRate = allErrors.length
    ? Math.round((resolvedCount / allErrors.length) * 100)
    : 100;

  if(errorNumber)
    errorNumber.textContent = unresolved.length;

  if(errorSummary){
    errorSummary.textContent = unresolved.length
      ? `${unresolved.length} kesalahan masih perlu kamu kuasai.`
      : 'Semua kesalahan yang tercatat sudah dikuasai.';
  }

  const categoryCounts = {};

  unresolved.forEach(x => {
    const category =
      normalizeLearningCategory(x.category || '');

    if(category){
      categoryCounts[category] =
        (categoryCounts[category] || 0) +
        (Number(x.wrongCount) || 1);
    }
  });

  const topCategory =
    Object.entries(categoryCounts)
      .sort((a,b) => b[1] - a[1])[0];

  const topError =
    [...unresolved].sort(
      (a,b) =>
        (Number(b.wrongCount) || 1) -
        (Number(a.wrongCount) || 1)
    )[0];

  if(errorCategory)
    errorCategory.textContent =
      topCategory?.[0] || 'Tidak ada';

  if(errorTopic)
    errorTopic.textContent =
      topError?.topic || 'Tidak ada';

  if(errorRate)
    errorRate.textContent = `${resolvedRate}%`;

  if(errorBar)
    errorBar.style.width = `${resolvedRate}%`;

  const map=document.getElementById('v4-mastery-map');

  if(map){
    const weakByCategory = new Map(
      weak.map(x => [x.category, x])
    );

    const categories = Object.keys(OKTAL_BLUEPRINT);

    map.innerHTML = categories.map(category => {
      const item = weakByCategory.get(category);

      const attempted = Number(item?.attempted) || 0;
      const accuracy = Number(item?.accuracy) || 0;

      let status = 'Belum dites';
      let statusClass = 'untested';

      if(attempted){
        if(accuracy >= 85){
          status = 'Dikuasai';
          statusClass = 'mastered';
        }else if(accuracy >= 70){
          status = 'Kuat';
          statusClass = 'strong';
        }else if(accuracy >= 50){
          status = 'Berkembang';
          statusClass = 'developing';
        }else{
          status = 'Prioritas';
          statusClass = 'priority';
        }
      }

      return `
        <div class="v4-mastery-item ${!attempted ? 'is-untested' : ''}">
          <div class="v4-mastery-info">
            <div class="v4-mastery-name-row">
              <strong>${category}</strong>
              <span class="v4-mastery-status ${statusClass}">
                ${status}
              </span>
            </div>

            <small>
              ${attempted
                ? `${attempted} soal dikerjakan`
                : `${OKTAL_BLUEPRINT[category]} indikator`}
            </small>
          </div>

          <div class="v4-mastery-right">
            <div class="v4-mastery-track">
              <span style="width:${accuracy}%"></span>
            </div>

            <b>${attempted ? accuracy + '%' : '—'}</b>
          </div>
        </div>
      `;
    }).join('');
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
      nextMode='simulation';
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
  setTimeout(renderErrorNotebookV4,0);
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


// ===== LILO HINT BOT V1 =====

let liloHintQuestionKey = null;
let liloHintLevel = 0;

function getLiloCurrentQuestion(){
  if(
    !Array.isArray(questions) ||
    currentIndex < 0 ||
    currentIndex >= questions.length
  ){
    return null;
  }

  return questions[currentIndex];
}

function isLiloSimulationLocked(){
  return String(examMode || '').toLowerCase() === 'simulation';
}

function getLiloQuestionKey(q){
  return String(
    q?.id ||
    `${currentIndex}-${q?.question || ''}`
  );
}

function escapeLiloHTML(value){
  return String(value ?? '')
    .replaceAll('&','&amp;')
    .replaceAll('<','&lt;')
    .replaceAll('>','&gt;')
    .replaceAll('"','&quot;')
    .replaceAll("'","&#039;");
}

function cleanLiloExplanation(q){
  let text=String(
    q?.explanation ||
    q?.pembahasan ||
    ''
  ).trim();

  /*
    Hilangkan pola pembuka yang berpotensi langsung
    membocorkan huruf jawaban.
  */
  text=text
    .replace(
      /^(jawaban|kunci|answer)\s*(yang\s*benar\s*)?[:\-]?\s*[A-D][\.\)\:\-]?\s*/i,
      ''
    )
    .replace(
      /\b(jawaban|pilihan|opsi)\s+(yang\s+)?benar\s+(adalah\s+)?[A-D]\b/gi,
      'pilihan yang tepat'
    )
    .replace(
      /\b(kunci|answer)\s*[:\-]\s*[A-D]\b/gi,
      ''
    );

  return text.trim();
}

function liloFirstSentence(text){
  if(!text) return '';

  const match=text.match(/^(.{1,220}?[.!?])(?:\s|$)/);

  return (match ? match[1] : text.slice(0,220))
    .trim();
}

function liloConceptHint(q){
  const category=q?.category || 'konsep AI';
  const topic=q?.topic || q?.subtopic || '';

  if(topic){
    return `Fokus dulu ke konsep “${topic}” dalam ${category}. Coba ingat definisi, tujuan, dan ciri utamanya sebelum melihat pilihan.`;
  }

  return `Fokus dulu ke konsep inti dari ${category}. Tanyakan: sebenarnya soal ini sedang menguji definisi, fungsi, perbedaan, atau penerapan?`;
}

function liloSpecificHint(q){
  const explanation=cleanLiloExplanation(q);
  const sentence=liloFirstSentence(explanation);

  if(sentence){
    return `Petunjuk tambahan: ${sentence} Gunakan ide itu untuk mengeliminasi pilihan yang tidak sesuai.`;
  }

  const topic=q?.topic || q?.category || 'konsep utama';

  return `Cari pilihan yang paling konsisten dengan “${topic}”. Jangan pilih hanya karena istilahnya terdengar paling teknis.`;
}

function liloReasoningHint(q){
  const category=q?.category || 'materi ini';
  const topic=q?.topic || q?.subtopic || category;

  return `Coba pecah soalnya jadi 3 langkah: (1) tentukan apa yang sebenarnya ditanyakan, (2) hubungkan dengan konsep “${topic}”, lalu (3) eliminasi pilihan yang bertentangan dengan konsep tersebut. Pilih berdasarkan alasan, bukan tebakan.`;
}

function getLiloHint(q,level){
  if(level === 1) return liloConceptHint(q);
  if(level === 2) return liloSpecificHint(q);
  return liloReasoningHint(q);
}

function resetLiloForQuestion(){
  const q=getLiloCurrentQuestion();
  if(!q) return;

  const key=getLiloQuestionKey(q);

  if(key !== liloHintQuestionKey){
    liloHintQuestionKey=key;
    liloHintLevel=0;

    const message=document.getElementById('lilo-tutor-message');

    if(message){
      message.innerHTML=`
        <span class="lilo-message-icon">💡</span>
        <div>
          <strong>Mentok?</strong>
          <p>Mulai dari Hint 1. Aku akan bantu sedikit demi sedikit.</p>
        </div>
      `;
    }
  }

  updateLiloTutorContext();
  updateLiloHintButtons();
}

function updateLiloTutorContext(){
  const q=getLiloCurrentQuestion();
  const box=document.getElementById('lilo-tutor-context');

  if(!q || !box) return;

  const category=q.category || 'Soal AI';
  const topic=q.topic || q.subtopic || '';

  box.innerHTML=`
    <span>SOAL ${currentIndex+1}</span>
    <strong>${escapeLiloHTML(category)}</strong>
    ${topic
      ? `<small>${escapeLiloHTML(topic)}</small>`
      : ''}
  `;
}

function updateLiloHintButtons(){
  [1,2,3].forEach(level=>{
    const button=document.getElementById(`lilo-hint-${level}`);
    if(!button) return;

    button.classList.toggle(
      'used',
      liloHintLevel >= level
    );
  });
}



// ==================== LILO BUBBLE DRAG V2.1 ====================

function getLiloBubblePosition(){
  try{
    return JSON.parse(
      localStorage.getItem('oktal_lilo_bubble_position_v21')
    );
  }catch{
    return null;
  }
}

function saveLiloBubblePosition(left, top){
  localStorage.setItem(
    'oktal_lilo_bubble_position_v21',
    JSON.stringify({left, top})
  );
}

function clampLiloBubble(widget, left, top){
  const margin = 8;

  const maxLeft = Math.max(
    margin,
    window.innerWidth - widget.offsetWidth - margin
  );

  const maxTop = Math.max(
    margin,
    window.innerHeight - widget.offsetHeight - margin
  );

  return {
    left: Math.min(Math.max(margin, left), maxLeft),
    top: Math.min(Math.max(margin, top), maxTop)
  };
}

function restoreLiloBubblePosition(){
  const widget = document.getElementById('exam-lilo-widget');
  if(!widget) return;

  const saved = getLiloBubblePosition();
  if(!saved) return;

  const pos = clampLiloBubble(
    widget,
    Number(saved.left) || 8,
    Number(saved.top) || 100
  );

  widget.style.left = pos.left + 'px';
  widget.style.top = pos.top + 'px';
  widget.style.right = 'auto';
  widget.style.bottom = 'auto';
}

function initLiloBubbleDrag(){
  const widget = document.getElementById('exam-lilo-widget');

  if(!widget || widget.dataset.bubbleDragReady === '1')
    return;

  widget.dataset.bubbleDragReady = '1';

  let dragging = false;
  let moved = false;

  let startX = 0;
  let startY = 0;

  let offsetX = 0;
  let offsetY = 0;

  const DRAG_THRESHOLD = 7;

  widget.addEventListener('pointerdown', e => {
    if(e.button !== undefined && e.button !== 0)
      return;

    const rect = widget.getBoundingClientRect();

    startX = e.clientX;
    startY = e.clientY;

    offsetX = e.clientX - rect.left;
    offsetY = e.clientY - rect.top;

    dragging = true;
    moved = false;

    widget.classList.add('lilo-bubble-grabbing');

    widget.setPointerCapture?.(e.pointerId);
  });

  widget.addEventListener('pointermove', e => {
    if(!dragging) return;

    const distance = Math.hypot(
      e.clientX - startX,
      e.clientY - startY
    );

    if(distance < DRAG_THRESHOLD && !moved)
      return;

    moved = true;

    e.preventDefault();

    const pos = clampLiloBubble(
      widget,
      e.clientX - offsetX,
      e.clientY - offsetY
    );

    widget.style.left = pos.left + 'px';
    widget.style.top = pos.top + 'px';

    widget.style.right = 'auto';
    widget.style.bottom = 'auto';

    saveLiloBubblePosition(pos.left, pos.top);
  });

  const finishDrag = e => {
    if(!dragging) return;

    dragging = false;

    widget.classList.remove('lilo-bubble-grabbing');

    if(moved){
      /*
       * Browser tetap dapat menghasilkan click setelah pointerup.
       * Flag ini membuat onclick openLiloTutor() mengabaikan click
       * yang berasal dari drag.
       */
      widget.dataset.justDragged = '1';

      setTimeout(()=>{
        widget.dataset.justDragged = '0';
      }, 120);
    }
  };

  widget.addEventListener('pointerup', finishDrag);
  widget.addEventListener('pointercancel', finishDrag);

  /*
   * Capture phase: hentikan click hasil drag SEBELUM inline onclick.
   */
  widget.addEventListener('click', e => {
    if(widget.dataset.justDragged === '1'){
      e.preventDefault();
      e.stopImmediatePropagation();
      widget.dataset.justDragged = '0';
    }
  }, true);

  window.addEventListener('resize', ()=>{
    if(widget.classList.contains('hidden'))
      return;

    const rect = widget.getBoundingClientRect();

    const pos = clampLiloBubble(
      widget,
      rect.left,
      rect.top
    );

    widget.style.left = pos.left + 'px';
    widget.style.top = pos.top + 'px';
    widget.style.right = 'auto';
    widget.style.bottom = 'auto';

    saveLiloBubblePosition(pos.left, pos.top);
  });

  restoreLiloBubblePosition();
}

function bootLiloBubbleDrag(){
  initLiloBubbleDrag();

  requestAnimationFrame(()=>{
    restoreLiloBubblePosition();
  });
}

document.addEventListener(
  'DOMContentLoaded',
  bootLiloBubbleDrag
);


// ==================== LILO FLOATING V2 ====================

let liloSoundEnabled =
  localStorage.getItem('oktal_lilo_sound') !== 'off';

let liloLastMeow = 0;
let liloAudioContext = null;

function updateLiloSoundButton(){
  const btn = document.getElementById('lilo-sound-toggle');
  if(!btn) return;

  btn.textContent = liloSoundEnabled ? '🔊' : '🔇';
  btn.title = liloSoundEnabled ? 'Matikan suara Lilo' : 'Nyalakan suara Lilo';
}

window.toggleLiloSound=function(event){
  event?.stopPropagation();

  liloSoundEnabled = !liloSoundEnabled;

  localStorage.setItem(
    'oktal_lilo_sound',
    liloSoundEnabled ? 'on' : 'off'
  );

  updateLiloSoundButton();

  if(liloSoundEnabled){
    playLiloMeow(true);
  }
};

function playLiloMeow(force=false){
  if(!liloSoundEnabled) return;

  const now = Date.now();

  if(!force && now - liloLastMeow < 1600)
    return;

  liloLastMeow = now;

  try{
    const AudioCtx =
      window.AudioContext ||
      window.webkitAudioContext;

    if(!AudioCtx) return;

    if(!liloAudioContext)
      liloAudioContext = new AudioCtx();

    const ctx = liloAudioContext;

    if(ctx.state === 'suspended')
      ctx.resume();

    const t = ctx.currentTime;

    /*
     * Lilo V2.1:
     * warm "mrrr" + brighter "meow"
     * sedikit lebih keras tapi tetap aman/nyaman.
     */
    const master = ctx.createGain();
    master.gain.setValueAtTime(0.72, t);
    master.connect(ctx.destination);

    // ---------- MRRR ----------
    const mrr = ctx.createOscillator();
    const mrrGain = ctx.createGain();

    mrr.type = 'triangle';

    mrr.frequency.setValueAtTime(185, t);
    mrr.frequency.linearRampToValueAtTime(225, t + .18);
    mrr.frequency.linearRampToValueAtTime(195, t + .34);

    mrrGain.gain.setValueAtTime(.0001, t);
    mrrGain.gain.exponentialRampToValueAtTime(.22, t + .035);
    mrrGain.gain.exponentialRampToValueAtTime(.08, t + .28);
    mrrGain.gain.exponentialRampToValueAtTime(.0001, t + .39);

    mrr.connect(mrrGain);
    mrrGain.connect(master);

    mrr.start(t);
    mrr.stop(t + .40);

    // ---------- MEOW ----------
    const meow = ctx.createOscillator();
    const meowGain = ctx.createGain();

    meow.type = 'sine';

    meow.frequency.setValueAtTime(430, t + .22);
    meow.frequency.exponentialRampToValueAtTime(
      820,
      t + .36
    );
    meow.frequency.exponentialRampToValueAtTime(
      610,
      t + .55
    );
    meow.frequency.exponentialRampToValueAtTime(
      390,
      t + .78
    );

    meowGain.gain.setValueAtTime(.0001, t + .20);
    meowGain.gain.exponentialRampToValueAtTime(
      .34,
      t + .28
    );
    meowGain.gain.exponentialRampToValueAtTime(
      .20,
      t + .52
    );
    meowGain.gain.exponentialRampToValueAtTime(
      .0001,
      t + .82
    );

    meow.connect(meowGain);
    meowGain.connect(master);

    meow.start(t + .20);
    meow.stop(t + .84);

    // ---------- tiny cute harmonic ----------
    const cute = ctx.createOscillator();
    const cuteGain = ctx.createGain();

    cute.type = 'sine';

    cute.frequency.setValueAtTime(860, t + .31);
    cute.frequency.exponentialRampToValueAtTime(
      1180,
      t + .40
    );
    cute.frequency.exponentialRampToValueAtTime(
      760,
      t + .62
    );

    cuteGain.gain.setValueAtTime(.0001, t + .29);
    cuteGain.gain.exponentialRampToValueAtTime(
      .075,
      t + .35
    );
    cuteGain.gain.exponentialRampToValueAtTime(
      .0001,
      t + .66
    );

    cute.connect(cuteGain);
    cuteGain.connect(master);

    cute.start(t + .29);
    cute.stop(t + .68);

    const avatar =
      document.querySelector('.lilo-tutor-big-avatar');

    const bubbleAvatar =
      document.querySelector('.lilo-tutor-avatar');

    [avatar,bubbleAvatar].forEach(el=>{
      if(!el) return;

      el.classList.remove('lilo-meowing');

      void el.offsetWidth;

      el.classList.add('lilo-meowing');

      setTimeout(
        ()=>el.classList.remove('lilo-meowing'),
        850
      );
    });

  }catch(err){
    console.warn('Lilo sound gagal:',err);
  }
}

function getLiloSavedPosition(){
  try{
    return JSON.parse(
      localStorage.getItem('oktal_lilo_position_v2')
    );
  }catch{
    return null;
  }
}

function saveLiloPosition(left,top){
  localStorage.setItem(
    'oktal_lilo_position_v2',
    JSON.stringify({left,top})
  );
}

function clampLiloPosition(panel,left,top){
  const margin = 10;

  const maxLeft =
    Math.max(margin,window.innerWidth-panel.offsetWidth-margin);

  const maxTop =
    Math.max(margin,window.innerHeight-panel.offsetHeight-margin);

  return {
    left:Math.min(Math.max(margin,left),maxLeft),
    top:Math.min(Math.max(margin,top),maxTop)
  };
}

function restoreLiloPosition(){
  const panel =
    document.querySelector('.lilo-tutor-panel');

  if(!panel) return;

  // HP mulai dari posisi nyaman.
  if(window.innerWidth <= 699){
    const saved = getLiloSavedPosition();

    if(!saved) return;

    const pos = clampLiloPosition(
      panel,
      saved.left,
      saved.top
    );

    panel.style.left = pos.left+'px';
    panel.style.top = pos.top+'px';
    return;
  }

  const saved = getLiloSavedPosition();

  if(saved){
    const pos = clampLiloPosition(
      panel,
      saved.left,
      saved.top
    );

    panel.style.left = pos.left+'px';
    panel.style.top = pos.top+'px';
  }
}

function initLiloDrag(){
  const panel =
    document.querySelector('.lilo-tutor-panel');

  const handle =
    document.querySelector('.lilo-tutor-handle');

  if(!panel || !handle || handle.dataset.dragReady)
    return;

  handle.dataset.dragReady='1';

  let dragging=false;
  let offsetX=0;
  let offsetY=0;

  const startDrag=(clientX,clientY)=>{
    const rect=panel.getBoundingClientRect();

    dragging=true;
    offsetX=clientX-rect.left;
    offsetY=clientY-rect.top;

    panel.classList.add('lilo-dragging');

    document.body.style.userSelect='none';
  };

  const moveDrag=(clientX,clientY)=>{
    if(!dragging) return;

    const pos=clampLiloPosition(
      panel,
      clientX-offsetX,
      clientY-offsetY
    );

    panel.style.left=pos.left+'px';
    panel.style.top=pos.top+'px';

    saveLiloPosition(pos.left,pos.top);
  };

  const endDrag=()=>{
    if(!dragging) return;

    dragging=false;

    panel.classList.remove('lilo-dragging');

    document.body.style.userSelect='';
  };

  handle.addEventListener('pointerdown',e=>{
    if(e.button !== undefined && e.button !== 0)
      return;

    e.preventDefault();

    handle.setPointerCapture?.(e.pointerId);

    startDrag(e.clientX,e.clientY);
  });

  handle.addEventListener('pointermove',e=>{
    moveDrag(e.clientX,e.clientY);
  });

  handle.addEventListener('pointerup',endDrag);
  handle.addEventListener('pointercancel',endDrag);

  window.addEventListener('resize',()=>{
    const rect=panel.getBoundingClientRect();

    const pos=clampLiloPosition(
      panel,
      rect.left,
      rect.top
    );

    panel.style.left=pos.left+'px';
    panel.style.top=pos.top+'px';
  });
}


window.openLiloTutor=function(){
  if(isLiloSimulationLocked()){
    showToast('🔒 Lilo dinonaktifkan saat Full Simulation.');
    return;
  }

  const q=getLiloCurrentQuestion();

  if(!q){
    showToast('Soal belum tersedia.');
    return;
  }

  resetLiloForQuestion();

  document
    .getElementById('lilo-tutor-overlay')
    ?.classList.remove('hidden');

  document.body.classList.add('lilo-tutor-open');

  updateLiloSoundButton();

  requestAnimationFrame(()=>{
    initLiloDrag();
    restoreLiloPosition();
  });

  playLiloMeow();
};

window.closeLiloTutor=function(event){
  if(
    event &&
    event.target !== event.currentTarget
  ) return;

  document
    .getElementById('lilo-tutor-overlay')
    ?.classList.add('hidden');

  document.body.classList.remove('lilo-tutor-open');
};

window.showLiloHint=function(level){
  if(isLiloSimulationLocked()){
    showToast('🔒 Hint tidak tersedia saat Full Simulation.');
    return;
  }

  const q=getLiloCurrentQuestion();
  if(!q) return;

  level=Math.max(1,Math.min(3,Number(level)||1));

  /*
    Hint harus dibuka berurutan.
  */
  if(level > liloHintLevel + 1){
    showToast(`Buka Hint ${liloHintLevel + 1} dulu.`);
    return;
  }

  liloHintLevel=Math.max(liloHintLevel,level);

  const hint=getLiloHint(q,level);
  const message=document.getElementById('lilo-tutor-message');

  if(message){
    const labels={
      1:'Arah pertama',
      2:'Lebih spesifik',
      3:'Cara berpikir'
    };

    message.innerHTML=`
      <span class="lilo-message-icon">🐱</span>

      <div>
        <strong>${labels[level]}</strong>
        <p>${escapeLiloHTML(hint)}</p>
      </div>
    `;
  }

  updateLiloHintButtons();

  if(level === 1){
    playLiloMeow();
  }
};

function updateLiloHintAvailability(){
  const trigger=document.getElementById('exam-lilo-widget');

  if(!trigger) return;

  if(isLiloSimulationLocked()){
    trigger.classList.add('lilo-locked');

    const small=trigger.querySelector('small');
    if(small) small.textContent='Dikunci saat simulasi';
  }else{
    trigger.classList.remove('lilo-locked');

    const small=trigger.querySelector('small');
    if(small) small.textContent='Butuh hint?';
  }
}

document.addEventListener('keydown',event=>{
  if(event.key === 'Escape'){
    window.closeLiloTutor();
    if(typeof window.closeErrorNotebookV4 === 'function'){
      window.closeErrorNotebookV4();
    }
  }
});


// ===== ERROR NOTEBOOK V4 UI BRIDGE =====

function renderErrorNotebookV4(){
  const active=errorNotebook.filter(x=>!x.resolved);
  const mastered=errorNotebook.filter(x=>x.resolved);
  const total=active.length+mastered.length;

  const activeEl=document.getElementById('v4-error-active');
  const masteredEl=document.getElementById('v4-error-mastered');
  const focusEl=document.getElementById('v4-error-focus');
  const summaryEl=document.getElementById('v4-error-summary');
  const countEl=document.getElementById('v4-error-count');
  const progressEl=document.getElementById('v4-error-progress-bar');
  const progressText=document.getElementById('v4-error-progress-text');

  const progress=total
    ? Math.round((mastered.length/total)*100)
    : 100;

  if(activeEl) activeEl.textContent=active.length;
  if(masteredEl) masteredEl.textContent=mastered.length;

  if(progressEl)
    progressEl.style.width=`${progress}%`;

  if(progressText)
    progressText.textContent=`${progress}%`;

  if(countEl)
    countEl.textContent=`${active.length} kesalahan perlu dipelajari`;

  if(!active.length){
    if(focusEl) focusEl.textContent='Aman';

    if(summaryEl){
      summaryEl.textContent=
        'Belum ada kesalahan aktif. Terus latihan supaya OKTAL bisa menemukan bagian yang perlu kamu perkuat.';
    }

    return;
  }

  const sorted=[...active].sort(
    (a,b)=>(b.wrongCount||0)-(a.wrongCount||0)
  );

  const focus=
    sorted[0]?.topic ||
    sorted[0]?.category ||
    'Konsep utama';

  if(focusEl)
    focusEl.textContent=focus;

  if(summaryEl){
    summaryEl.textContent=
      `Ada ${active.length} bagian yang perlu kamu pelajari lagi. Mulai dari ${focus}.`;
  }
}
