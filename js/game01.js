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
    } else {
        window.location.href = 'login.html';
    }
});

// --- 3. DOM Elements ---
const gameArea = document.getElementById('gameArea');
const gameGrid = document.getElementById('game');
const restartBtn = document.getElementById('restartBtn');
const startBtn = document.getElementById('startBtn');
const lessonBtn = document.getElementById('lessonBtn');
const popup = document.getElementById('popup');
const popupText = document.getElementById('popupText');
const popupControls = document.getElementById('popupControls');
const scoreValue = document.getElementById('scoreValue');
const timerFill = document.getElementById('timerFill');
const progressSection = document.getElementById('progressSection');
const roundCoinContainer = document.getElementById('roundCoinContainer');
const lessonPage = document.getElementById('lesson-page');
const lessonGrid = document.getElementById('lesson-grid');
const closeLessonBtn = document.getElementById('close-lesson-btn');
const livesDisplay = document.getElementById('livesDisplay');
const profilePicGame = document.getElementById('profilePic-game');
const sidebar = document.getElementById('sidebar');
const sidebarOverlay = document.getElementById('sidebar-overlay');
const sidebarCloseBtn = document.getElementById('sidebarCloseBtn');
const sidebarProfileImg = document.getElementById('sidebarProfileImg');
const sidebarUserName = document.getElementById('sidebarUserName');
const sidebarUserEmail = document.getElementById('sidebarUserEmail');
const logoutBtn = document.getElementById('logoutBtn');

// --- Audio Caching System ---
let audioCache = {};
let isAudioPreloaded = false;

// --- Game Variables ---
let countdownInterval, selected = [], gameChars = [];
const TOTAL_TIME = 132;
const LIVES = 3;
let lives = LIVES;
let baseScore = 0, bonusScore = 0;
let timeLeft = TOTAL_TIME, completedLessons = 0;
const CHARS_PER_ROUND = 12;
const baseUrl = "./";
const allCharIds = ["ก", "ข", "ฃ", "ค", "ฅ", "ฆ", "ง", "จ", "ฉ", "ช", "ซ", "ฌ", "ญ", "ฎ", "ฏ", "ฐ", "ฑ", "ฒ", "ณ", "ด", "ต", "ถ", "ท", "ธ", "น", "บ", "ป", "ผ", "ฝ", "พ", "ฟ", "ภ", "ม", "ย", "ร", "ล", "ว", "ศ", "ษ", "ส", "ห", "ฬ", "อ", "ฮ"];
const allChars = allCharIds.map(id => ({ id: id, img: `${baseUrl}${id}.png` })); // Cleaned up: No .sound property needed
let matchedPairsInRound = 0;
let pairsInCurrentRound = 0;

// --- Event Listeners ---
closeLessonBtn.onclick = () => lessonPage.style.display = 'none';
window.addEventListener('resize', () => requestAnimationFrame(() => {
    calculateAndApplyLayout();
    calculateLessonLayout();
}));
profilePicGame.onclick = openSidebar;
sidebarOverlay.onclick = closeSidebar;
sidebarCloseBtn.onclick = closeSidebar;
logoutBtn.onclick = () => auth.signOut();

// --- Sidebar Functions ---
function openSidebar() { if (sidebar) sidebar.classList.add('open'); if (sidebarOverlay) sidebarOverlay.style.display = 'block'; }
function closeSidebar() { if (sidebar) sidebar.classList.remove('open'); if (sidebarOverlay) sidebarOverlay.style.display = 'none'; }

// --- Audio Preloading and Playback Functions ---
function preloadAllGameAudio(callback) {
    if (isAudioPreloaded) {
        if (callback) callback();
        return;
    }
    const audioFiles = {
        'hover': 'hover.mp3', 'click': 'mouse-click.mp3', 'wrong': 'wrong.mp3',
        'coin': 'coin.mp3', 'gameover': 'game-over.mp3', 'roundEnd': 'round-clear.mp3',
        'goodResult': 'goodresult.mp3', 'loseLife': 'error.mp3'
    };
    allCharIds.forEach(id => audioFiles[id] = `${id}.mp3`);

    const audioKeys = Object.keys(audioFiles);
    const totalAudio = audioKeys.length;
    let loadedCount = 0;
    showPopup(`<h2>กำลังเตรียมเสียง... (0/${totalAudio})</h2>`, null);

    audioKeys.forEach(key => {
        const url = `${baseUrl}${audioFiles[key]}`;
        fetch(url)
            .then(response => response.blob())
            .then(blob => {
                const blobUrl = URL.createObjectURL(blob);
                audioCache[key] = new Audio(blobUrl);
            })
            .catch(error => console.warn(`Could not load audio ${key}:`, error))
            .finally(() => {
                loadedCount++;
                popupText.innerHTML = `<h2>กำลังเตรียมเสียง... (${loadedCount}/${totalAudio})</h2>`;
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
        audioCache[soundKey].play().catch(e => console.error(`Failed to play sound: ${soundKey}`, e));
    }
}

// --- Game Functions ---
function startGame() {
    startBtn.style.display = "none";
    restartBtn.style.display = "inline-block";
    preloadAllGameAudio(() => {
        closePopup();
        baseScore = 0; bonusScore = 0; completedLessons = 0;
        lives = LIVES;
        updateScoreDisplay();
        updateTrophyDisplay();
        updateLivesDisplay();
        gameChars = [...allChars]; 
        startRound();
    });
}

function restartGame() { closePopup(); startGame(); }

function startRound() {
    clearInterval(countdownInterval);
    timeLeft = TOTAL_TIME;
    updateTimerBar();
    matchedPairsInRound = 0;
    roundCoinContainer.innerHTML = '';
    countdownInterval = setInterval(() => {
        timeLeft--;
        const timePerLife = TOTAL_TIME / LIVES;
        const expectedLives = Math.ceil(timeLeft / timePerLife);
        if (expectedLives < lives && timeLeft > 0) {
            lives = expectedLives;
            updateLivesDisplay();
            playSound('loseLife');
        }
        updateTimerBar();
        if (timeLeft <= 0) {
            handleGameOver("หมดเวลา!");
        }
    }, 1000);

    gameGrid.innerHTML = "";
    selected = [];
    const roundChars = [];
    let tempGameChars = [...gameChars];
    for (let i = 0; i < CHARS_PER_ROUND; i++) {
        if (tempGameChars.length === 0) break;
        const randomIndex = Math.floor(Math.random() * tempGameChars.length);
        const selectedChar = tempGameChars.splice(randomIndex, 1)[0];
        roundChars.push(selectedChar);
    }
    gameChars = tempGameChars;

    pairsInCurrentRound = roundChars.length;
    if (pairsInCurrentRound === 0) {
        triggerFinalWinSequence();
        return;
    }

    let cardsData = shuffle([...roundChars.map(c => ({ ...c, type: 'char' })), ...roundChars.map(c => ({ ...c, type: 'img' }))]);
    cardsData.forEach(cardData => {
        const cardDiv = document.createElement("div");
        cardDiv.classList.add("card");
        cardDiv.dataset.id = cardData.id;
        if (cardData.type === 'char') {
            cardDiv.textContent = cardData.id;
        } else {
            const img = document.createElement("img");
            img.src = cardData.img;
            cardDiv.appendChild(img);
        }
        cardDiv.onclick = () => selectCard(cardDiv, cardData);
        cardDiv.onmouseenter = () => playSound('hover');
        gameGrid.appendChild(cardDiv);
    });
    requestAnimationFrame(calculateAndApplyLayout);
}

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function selectCard(div, card) {
    if (selected.length >= 2 || div.classList.contains("selected") || timeLeft <= 0 || lives <= 0) return;
    playSound('click');
    div.classList.add("selected");
    selected.push({ div, id: card.id });
    if (selected.length === 2) {
        const [first, second] = selected;
        if (first.id === second.id) {
            playSound('coin');
            playSound(first.id);
            baseScore += 10;
            addCollectedCoin();
            first.div.classList.add("matched");
            second.div.classList.add("matched");
            const tempSelected = selected;
            selected = [];
            matchedPairsInRound++;
            setTimeout(() => {
                tempSelected[0].div.remove();
                tempSelected[1].div.remove();
                if (matchedPairsInRound === pairsInCurrentRound) {
                    clearInterval(countdownInterval);
                    triggerRoundCompleteSequence();
                }
            }, 500);
        } else {
            playSound('wrong');
            playSound('loseLife');
            lives--;
            updateLivesDisplay();
            baseScore -= 10;
            removeCollectedCoin();
            setTimeout(() => {
                first.div.classList.remove("selected");
                second.div.classList.remove("selected");
                selected = [];
            }, 1000);
            if (lives <= 0) {
                handleGameOver("ชีวิตหมด!");
                return;
            }
            if ((baseScore + bonusScore) < 0) {
                handleScoreGameOver();
            }
        }
        updateScoreDisplay();
    }
}

function triggerRoundCompleteSequence() {
    playSound('roundEnd');
    const timeBonusInMillis = timeLeft * 1000;
    bonusScore += timeBonusInMillis;
    updateScoreDisplay();
    setTimeout(() => {
        playSound('goodResult');
        completedLessons++;
        updateTrophyDisplay();
        const roundPopupContent = `<h2>ผ่านรอบ!</h2><p>คะแนนโบนัสเวลา: ${timeBonusInMillis.toLocaleString()}</p>`;
        showPopup(roundPopupContent, createSingleButtonPopup("รอบต่อไป", () => {
            closePopup();
            startRound();
        }));
    }, 1000);
}

async function triggerFinalWinSequence() {
    clearInterval(countdownInterval);
    const totalScore = baseScore + bonusScore;
    if (currentUser) {
        const userScoreRef = db.collection('userScores').doc(currentUser.uid);
        try {
            await db.runTransaction(async (transaction) => {
                const doc = await transaction.get(userScoreRef);
                const currentBest = doc.exists ? (doc.data().bestScore || 0) : 0;
                const newTotalScore = currentBest + totalScore;
                transaction.set(userScoreRef, { bestScore: newTotalScore, lastPlayed: firebase.firestore.FieldValue.serverTimestamp() }, { merge: true });
            });
        } catch (e) { console.error("Transaction failed: ", e); }
    }
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 1001 };
    const interval = setInterval(() => {
        const timeLeft = animationEnd - Date.now();
        if (timeLeft <= 0) return clearInterval(interval);
        const particleCount = 50 * (timeLeft / duration);
        confetti({ ...defaults, particleCount, origin: { x: Math.random(), y: Math.random() - 0.2 } });
    }, 250);
    const popupContent = `<h2>ภารกิจสำเร็จ!</h2><p>คะแนนจากการจับคู่: ${baseScore.toLocaleString()}</p><p>คะแนนโบนัสเวลาสะสม: ${bonusScore.toLocaleString()}</p><hr style="margin: 10px 0;"><p><strong>คะแนนรวมทั้งหมด: ${totalScore.toLocaleString()}</strong></p><p style="font-size:0.9em; color:#666;">คะแนนของคุณถูกเพิ่มในคะแนนรวมแล้ว</p>`;
    const controls = createLobbyButton();
    showPopup(popupContent, controls);
}

function handleGameOver(message) {
    clearInterval(countdownInterval);
    playSound('gameover');
    showPopup(`<h2>${message}</h2><p>ลองอีกครั้งนะ!</p>`, createSingleButtonPopup("เริ่มใหม่", restartGame));
}

function handleScoreGameOver() {
    clearInterval(countdownInterval);
    playSound('gameover');
    const popupContent = `<h2>คะแนนหมด!</h2><p>คะแนนของคุณติดลบ เกมจะเริ่มต้นใหม่</p>`;
    showPopup(popupContent, createSingleButtonPopup("เริ่มเกมใหม่", restartGame));
}

function updateLivesDisplay() { if(livesDisplay) livesDisplay.innerHTML = '❤️'.repeat(lives) + '💔'.repeat(LIVES - lives); }
function updateScoreDisplay() { let totalScore = (baseScore || 0) + (bonusScore || 0); if(scoreValue) scoreValue.textContent = totalScore.toLocaleString(); }
function updateTrophyDisplay() { if(progressSection) progressSection.innerHTML = '🏆'.repeat(completedLessons); }
function updateTimerBar() {
    if(timerFill) {
        const percentage = (timeLeft / TOTAL_TIME) * 100;
        timerFill.style.width = `${percentage}%`;
        if (lives === 3) timerFill.style.backgroundColor = '#28a745';
        else if (lives === 2) timerFill.style.backgroundColor = '#ffc107';
        else timerFill.style.backgroundColor = '#dc3545';
    }
}
function addCollectedCoin() {
    const collectedCoin = document.createElement("img");
    collectedCoin.src = `${baseUrl}Coin.png`;
    collectedCoin.className = 'round-coin-img';
    roundCoinContainer.appendChild(collectedCoin);
    setTimeout(() => collectedCoin.classList.add('collected'), 10);
}
function removeCollectedCoin() {
    const lastCoin = roundCoinContainer.querySelector('.round-coin-img.collected:last-child');
    if (lastCoin) {
        lastCoin.classList.remove('collected');
        setTimeout(() => { if (lastCoin.parentNode) lastCoin.remove(); }, 400);
    }
}
function showPopup(msg, controls) {
    if(popup) {
        popupText.innerHTML = msg;
        popupControls.innerHTML = '';
        if (controls) popupControls.appendChild(controls);
        popup.style.display = "flex";
    }
}
function closePopup() { if(popup) popup.style.display = "none"; }
function createSingleButtonPopup(text, onClickAction) {
    const controls = document.createElement('div');
    const btn = document.createElement('button');
    btn.textContent = text;
    btn.className = 'btn btn-success';
    btn.onclick = onClickAction;
    return controls;
}
function createLobbyButton() {
    const controls = document.createElement('div');
    const backBtn = document.createElement('a');
    backBtn.href = 'index.html';
    backBtn.textContent = 'กลับไปหน้าหลัก';
    backBtn.className = 'btn btn-primary';
    return controls;
}
function showLessonPage() {
    preloadAllGameAudio(() => {
        closePopup();
        lessonGrid.innerHTML = '';
        allChars.forEach(char => {
            const card = document.createElement('div');
            card.className = 'lesson-card';
            const img = document.createElement('img');
            img.src = char.img;
            const text = document.createElement('span');
            text.textContent = char.id;
            card.appendChild(img);
            card.appendChild(text);
            card.onclick = () => playSound(char.id);
            lessonGrid.appendChild(card);
        });
        lessonPage.style.display = 'flex';
        requestAnimationFrame(calculateLessonLayout);
    });
}

function calculateLessonLayout() {
    if (!lessonGrid.offsetParent) return;
    const lessonHeader = lessonPage.querySelector('h2');
    const headerHeight = lessonHeader ? lessonHeader.offsetHeight + 20 : 0;
    const availableWidth = lessonPage.clientWidth - 30;
    const availableHeight = lessonPage.clientHeight - headerHeight - 20;
    let bestLayout = { cols: 0, cardSize: 0 };
    for (let cols = 4; cols <= 11; cols++) {
        const rows = Math.ceil(allChars.length / cols);
        const sizeW = (availableWidth - (cols - 1) * 15) / cols;
        const sizeH = (availableHeight - (rows - 1) * 15) / rows;
        const cardSize = Math.floor(Math.min(sizeW, sizeH));
        if (cardSize > bestLayout.cardSize) {
            bestLayout = { cols, cardSize };
        }
    }
    lessonGrid.style.gridTemplateColumns = `repeat(${bestLayout.cols}, ${bestLayout.cardSize}px)`;
    const cards = lessonGrid.querySelectorAll('.lesson-card');
    cards.forEach(card => {
        card.style.width = `${bestLayout.cardSize}px`;
        card.style.height = `${bestLayout.cardSize}px`;
        const span = card.querySelector('span');
        if (span) span.style.fontSize = `${bestLayout.cardSize * 0.3}px`;
    });
}

function calculateAndApplyLayout() {
    if (!gameGrid.offsetParent) return;
    const numCards = gameGrid.children.length;
    if (numCards === 0) return;
    const titleContainer = gameArea.querySelector('.title-container');
    const titleHeight = titleContainer ? titleContainer.offsetHeight + 15 : 0;
    const availableWidth = gameArea.clientWidth;
    const availableHeight = gameArea.clientHeight - titleHeight;
    let bestLayout = { cols: 0, cardSize: 0 };
    for (let cols = 3; cols <= numCards; cols++) {
        const rows = Math.ceil(numCards / cols);
        const sizeW = (availableWidth - (cols - 1) * 10) / cols;
        const sizeH = (availableHeight - (rows - 1) * 10) / rows;
        const cardSize = Math.floor(Math.min(sizeW, sizeH));
        if (cardSize > bestLayout.cardSize) {
            bestLayout = { cols, cardSize };
        }
    }
    if (bestLayout.cols === 0) {
        const cols = Math.ceil(Math.sqrt(numCards));
        const rows = Math.ceil(numCards / cols);
        const sizeW = (availableWidth - (cols - 1) * 10) / cols;
        const sizeH = (availableHeight - (rows - 1) * 10) / rows;
        bestLayout.cardSize = Math.floor(Math.min(sizeW, sizeH));
        bestLayout.cols = cols;
    }
    bestLayout.cardSize *= 0.98;
    gameGrid.style.gridTemplateColumns = `repeat(${bestLayout.cols}, ${bestLayout.cardSize}px)`;
    const cards = gameGrid.querySelectorAll('.card');
    cards.forEach(card => {
        card.style.width = `${bestLayout.cardSize}px`;
        card.style.height = `${bestLayout.cardSize}px`;
        card.style.fontSize = `${bestLayout.cardSize * 0.5}px`;
    });
}
