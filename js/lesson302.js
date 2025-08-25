// --- 1. การตั้งค่า Firebase ---
const firebaseConfig = {
  apiKey: "AIzaSyCmKRzrsXDhHtbmhG56jM-0OYqp3YvXc48",
  authDomain: "playtolearn-e3356.firebaseapp.com",
  projectId: "playtolearn-e3356",
  storageBucket: "playtolearn-e3356.firebasestorage.app",
  messagingSenderId: "233629701249",
  appId: "1:233629701249:web:5ee775473bc00be1566980",
  measurementId: "G-SXMFQT0TLG"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
let currentUser = null;

// --- 2. ตรวจสอบการล็อกอิน และ Setup UI ---
auth.onAuthStateChanged(user => {
  if (user) {
    currentUser = user;
    const photoURL = user.photoURL || 'https://i.imgur.com/sC22S2A.png';
    const displayName = user.displayName || user.email.split('@')[0];
    if (profilePicGame) profilePicGame.src = photoURL;
    if (sidebarProfileImg) sidebarProfileImg.src = photoURL;
    if (sidebarUserName) sidebarUserName.textContent = displayName;
    if (sidebarUserEmail) sidebarUserEmail.textContent = user.email;
    displayBestRank();
  } else {
    window.location.href = 'login.html';
  }
});

// --- 3. DOM Elements ---
const startBtn = document.getElementById('startBtn');
const restartBtn = document.getElementById('restartBtn');
const gameContent = document.getElementById('game-content');
const imageContainer = document.getElementById('image-container');
const sentenceBuilder = document.getElementById('sentence-builder');
const wordOptions = document.getElementById('word-options');
const checkBtn = document.getElementById('checkBtn');
const nextBtn = document.getElementById('nextBtn');
const scoreValue = document.getElementById('scoreValue');
const progressSection = document.getElementById('progressSection');
const profilePicGame = document.getElementById('profilePic-game');
const sidebar = document.getElementById('sidebar');
const sidebarOverlay = document.getElementById('sidebar-overlay');
const sidebarCloseBtn = document.getElementById('sidebarCloseBtn');
const sidebarProfileImg = document.getElementById('sidebarProfileImg');
const sidebarUserName = document.getElementById('sidebarUserName');
const sidebarUserEmail = document.getElementById('sidebarUserEmail');
const logoutBtn = document.getElementById('logoutBtn');
const bestRankDisplay = document.getElementById('best-rank-display');
const popup = document.getElementById('popup');
const popupText = document.getElementById('popupText');
const popupControls = document.getElementById('popupControls');

// --- Game Data ---
const imageBaseUrl = "images/";
// ✅ FIX 1: แก้ไข Path หลักของเสียงให้ถูกต้อง (ต้องมี "s")
const soundBaseUrl = "sounds/"; 
const sentenceData = [
    // หมายเหตุ: รูปภาพเหล่านี้มาจากบทที่ 3 จึงจะถูกโหลดจากโฟลเดอร์ lesson03
  { id: 1, image: 'ไก่.png', words: ['ภูผา', 'มี', 'ไก่'], answer: ['ภูผา มี ไก่'] },
  { id: 2, image: 'ลูกช้าง.png', words: ['ลูกช้าง', 'ตัวโต'], answer: ['ลูกช้าง ตัวโต'] },
  { id: 3, image: 'ชู.png', words: ['ฉัน', 'ชู', 'มือ'], answer: ['ฉัน ชู มือ'] },
  { id: 4, image: 'จ้อง.png', words: ['ไก่', 'จ้อง', 'ลูกช้าง'], answer: ['ไก่ จ้อง ลูกช้าง', 'ลูกช้าง จ้อง ไก่'] },
  { id: 5, image: 'ร้อง.png', words: ['เด็ก', 'ร้อง', 'เพลง'], answer: ['เด็ก ร้อง เพลง'] },
  { id: 6, image: 'เรียก.png', words: ['ฉัน', 'เรียก', 'เพื่อน', 'มา', 'เล่น'], answer: ['ฉัน เรียก เพื่อน มา เล่น', 'เพื่อน เรียก ฉัน มา เล่น'] },
  { id: 7, image: 'เพื่อน.png', words: ['ฉัน', 'รัก', 'เพื่อน'], answer: ['ฉัน รัก เพื่อน', 'เพื่อน รัก ฉัน'] },
  { id: 8, image: 'เด็ก.png', words: ['เด็ก', 'น่า', 'รัก'], answer: ['เด็ก น่า รัก'] },
  { id: 9, image: null, words: ['พ่อ', 'พา', 'หนู', 'ไป', 'โรงเรียน'], answer: ['พ่อ พา หนู ไป โรงเรียน'] },
  { id: 10, image: null, words: ['ลูกช้าง', 'ตัวโต', 'มาก'], answer: ['ลูกช้าง ตัวโต มาก'] },
  { id: 11, image: null, words: ['เรา', 'มา', 'เล่น', 'กัน'], answer: ['เรา มา เล่น กัน'] },
  { id: 12, image: null, words: ['ลูกช้าง', 'ร้อง', 'แฮ็ก', 'แฮ็ก'], answer: ['ลูกช้าง ร้อง แฮ็ก แฮ็ก'] }
];

// --- Game Variables ---
let audioCache = {};
let isAudioPreloaded = false;
let score = 0;
let currentSentenceIndex = 0;
let shuffledSentences = [];

// --- Sidebar Functions ---
function openSidebar() { if (sidebar) sidebar.classList.add('open'); if (sidebarOverlay) sidebarOverlay.style.display = 'block'; }
function closeSidebar() { if (sidebar) sidebar.classList.remove('open'); if (sidebarOverlay) sidebarOverlay.style.display = 'none'; }

// --- Audio Functions ---
function preloadAllGameAudio(callback) {
  if (isAudioPreloaded) {
    if (callback) callback();
    return;
  }
  // ✅ FIX 2: แก้ไข Path เสียงประกอบต่างๆ ให้ถูกต้อง
  const audioFiles = { 
    'correct': 'effect/coin.mp3', 
    'wrong': 'effect/wrong.mp3', 
    'win': 'effect/winning.mp3', 
    'click': 'effect/mouse-click.mp3' 
  };
  const audioKeys = Object.keys(audioFiles);
  const totalAudio = audioKeys.length;
  let loadedCount = 0;

  showPopup(`<h2>กำลังเตรียมเสียง...</h2>`, null);

  audioKeys.forEach(key => {
    const url = `${soundBaseUrl}${audioFiles[key]}`;
    fetch(url)
      .then(response => response.ok ? response.blob() : Promise.reject(`Error loading ${url}`))
      .then(blob => {
        const blobUrl = URL.createObjectURL(blob);
        audioCache[key] = new Audio(blobUrl);
      })
      .catch(error => console.warn(`Could not load audio ${key}:`, error))
      .finally(() => {
        loadedCount++;
        if (loadedCount === totalAudio) {
          isAudioPreloaded = true;
          if (callback) callback();
        }
      });
  });
}

function playSound(soundKey) {
  if (audioCache[soundKey]) {
    audioCache[soundKey].currentTime = 0;
    audioCache[soundKey].play().catch(e => console.error(`Could not play sound: ${soundKey}`, e));
  }
}

// --- Game Logic ---
function startGame() {
  preloadAllGameAudio(() => {
    closePopup();
    startBtn.style.display = "none";
    restartBtn.style.display = "inline-block";
    gameContent.style.display = "flex";

    score = 0;
    currentSentenceIndex = 0;
    updateScoreDisplay();

    shuffledSentences = shuffle([...sentenceData]);
    displaySentence();
    updateProgress();
  });
}

function restartGame() {
  closePopup();
  startGame();
}

function displaySentence() {
  const currentSentence = shuffledSentences[currentSentenceIndex];

  // Display Image
  if (currentSentence.image) {
    // ✅ FIX 3: แก้ไข Path รูปภาพประกอบให้ถูกต้อง
    imageContainer.innerHTML = `<img src="${imageBaseUrl}lesson03/${currentSentence.image}" alt="รูปประกอบ">`;
    imageContainer.style.display = "flex";
  } else {
    imageContainer.innerHTML = '';
    imageContainer.style.display = "none";
  }

  // Clear previous words
  sentenceBuilder.innerHTML = '';
  wordOptions.innerHTML = '';

  // Create word buttons
  const shuffledWords = shuffle([...currentSentence.words]);
  shuffledWords.forEach(word => {
    const wordBtn = document.createElement('button');
    wordBtn.className = 'word-btn';
    wordBtn.textContent = word;
    wordBtn.onclick = () => moveWord(wordBtn);
    wordOptions.appendChild(wordBtn);
  });

  nextBtn.style.display = 'none';
  checkBtn.style.display = 'inline-block';
}

// ปรับปรุงฟังก์ชัน moveWord ให้กระชับขึ้น
function moveWord(wordBtn) {
    playSound('click');
    const fromContainer = wordBtn.parentElement;
    const toContainer = fromContainer === wordOptions ? sentenceBuilder : wordOptions;
    toContainer.appendChild(wordBtn);
}

function checkAnswer() {
  const builtSentence = Array.from(sentenceBuilder.children)
    .map(btn => btn.textContent)
    .join(' ');

  const correctAnswers = shuffledSentences[currentSentenceIndex].answer;

  if (correctAnswers.includes(builtSentence)) {
    playSound('correct');
    score += 10;
    updateScoreDisplay();
    showFeedback(true);
    checkBtn.style.display = 'none';
    nextBtn.style.display = 'inline-block';
  } else {
    playSound('wrong');
    showFeedback(false);
  }
}

function nextSentence() {
  currentSentenceIndex++;
  updateProgress();
  if (currentSentenceIndex < shuffledSentences.length) {
    displaySentence();
  } else {
    handleGameEnd();
  }
}

function handleGameEnd() {
  playSound('win');
  saveScore();
  const popupContent = `<h2>ยินดีด้วย!</h2><p>คุณเล่นครบทุกประโยคแล้ว</p><p>คะแนนรวม: ${score}</p>`;
  const controls = createGameOverControls();
  showPopup(popupContent, controls);
}

async function saveScore() {
  if (currentUser) {
    const userScoreRef = db.collection('userScores').doc(currentUser.uid);
    try {
      const doc = await userScoreRef.get();
      const existingBest = doc.exists ? (doc.data().scores?.lesson302 || 0) : 0;
      if (score > existingBest) {
        await userScoreRef.set({ scores: { lesson302: score } }, { merge: true });
        displayBestRank();
      }
    } catch (e) { console.error("Score saving failed: ", e); }
  }
}

async function displayBestRank() {
  // ฟังก์ชันนี้ไม่ได้ใช้งานในเกมนี้ แต่มีไว้เพื่อให้โครงสร้างสอดคล้องกัน
}

// --- UI and Utility Functions ---
function updateScoreDisplay() {
  scoreValue.textContent = score;
}

function updateProgress() {
  progressSection.innerHTML = ''; // Clear previous progress
  for (let i = 0; i < shuffledSentences.length; i++) {
    const dot = document.createElement('span');
    dot.className = 'progress-dot';
    if (i < currentSentenceIndex) {
      dot.classList.add('completed');
    } else if (i === currentSentenceIndex) {
      dot.classList.add('current');
    }
    progressSection.appendChild(dot);
  }
}

function showFeedback(isCorrect) {
  const feedbackText = isCorrect ? "ถูกต้อง!" : "ลองอีกครั้ง";
  const feedbackClass = isCorrect ? "correct-feedback" : "wrong-feedback";

  const feedbackElement = document.createElement('div');
  feedbackElement.textContent = feedbackText;
  feedbackElement.className = `feedback-popup ${feedbackClass}`;

  document.body.appendChild(feedbackElement);

  setTimeout(() => {
    feedbackElement.remove();
  }, 1000);
}

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function showPopup(msg, controls) {
  if (popupText && popupControls && popup) {
    popupText.innerHTML = msg;
    popupControls.innerHTML = '';
    if (controls) popupControls.appendChild(controls);
    popup.style.display = "flex";
  }
}

function closePopup() { if (popup) popup.style.display = "none"; }

function createGameOverControls() {
  const controls = document.createElement('div');
  controls.style.display = 'flex';
  controls.style.gap = '15px';
  const restartBtnPopup = document.createElement('button');
  restartBtnPopup.textContent = 'เล่นใหม่';
  restartBtnPopup.className = 'btn btn-success';
  restartBtnPopup.onclick = restartGame;
  const lobbyBtnPopup = document.createElement('a');
  lobbyBtnPopup.textContent = 'กลับหน้าหลัก';
  lobbyBtnPopup.className = 'btn btn-secondary';
  lobbyBtnPopup.href = 'index.html';
  controls.appendChild(restartBtnPopup);
  controls.appendChild(lobbyBtnPopup);
  return controls;
}

// --- Event Listeners ---
checkBtn.addEventListener('click', checkAnswer);
nextBtn.addEventListener('click', nextSentence);
profilePicGame.addEventListener('click', openSidebar);
sidebarOverlay.addEventListener('click', closeSidebar);
sidebarCloseBtn.addEventListener('click', closeSidebar);
logoutBtn.addEventListener('click', () => auth.signOut());