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

        // --- ส่วนที่เพิ่มเข้ามา ---
        const photoURL = user.photoURL || 'https://i.imgur.com/sC22S2A.png';
        if (profilePicGame) {
            profilePicGame.src = photoURL;
        }
        // --- จบส่วนที่เพิ่มเข้ามา ---

        console.log("Game page: User is logged in.", currentUser.uid);
    } else {
        console.log("Game page: No user logged in. Redirecting...");
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

// Sound elements
const hoverSound = document.getElementById("hoverSound");
const clickSound = document.getElementById("clickSound");
const wrongSound = document.getElementById("wrongSound");
const coinSound = document.getElementById("coinSound");
const gameoverSound = document.getElementById("gameoverSound");
const roundEndCoinSound = document.getElementById("roundEndCoinSound");
const goodResultSound = document.getElementById("goodResultSound");
const loseLifeSound = document.getElementById("loseLifeSound"); // เพิ่มเสียงเสียชีวิต

let countdownInterval, selected = [],
    gameChars = [];
const TOTAL_TIME = 132;
const LIVES = 3; // <--- เพิ่มค่าคงที่สำหรับชีวิต
let lives = LIVES; // <--- เพิ่มตัวแปรชีวิต
let baseScore = 0,
    bonusScore = 0,
    totalScore = 0;
let timeLeft = TOTAL_TIME,
    completedLessons = 0;
const CHARS_PER_ROUND = 12;
const baseUrl = "./";
const allCharIds = ["ก", "ข", "ฃ", "ค", "ฅ", "ฆ", "ง", "จ", "ฉ", "ช", "ซ", "ฌ", "ญ", "ฎ", "ฏ", "ฐ", "ฑ", "ฒ", "ณ", "ด", "ต", "ถ", "ท", "ธ", "น", "บ", "ป", "ผ", "ฝ", "พ", "ฟ", "ภ", "ม", "ย", "ร", "ล", "ว", "ศ", "ษ", "ส", "ห", "ฬ", "อ", "ฮ"];
const allChars = allCharIds.map(id => ({ id: id, img: `${baseUrl}${id}.png` })); // Cleaned up: No .sound property needed
let matchedPairsInRound = 0;
let pairsInCurrentRound = 0;

// --- Event Listeners ---
closeLessonBtn.onclick = () => lessonPage.style.display = 'none';
window.addEventListener('resize', () => {
    requestAnimationFrame(() => {
        calculateAndApplyLayout();
        calculateLessonLayout();
    });
});

// --- Game Functions ---
function playAudio(audio) {
    if (audio) {
        audio.currentTime = 0;
        audio.play().catch(e => console.error("Audio play failed:", e));
    }
}

// --- Game Functions ---
function startGame() {
    startBtn.style.display = "none";
    // lessonBtn.style.display = "none";
    restartBtn.style.display = "inline-block";

    baseScore = 0;
    bonusScore = 0;
    completedLessons = 0;
    lives = LIVES; // <--- รีเซ็ตชีวิตเมื่อเริ่มเกม
    updateScoreDisplay();
    updateTrophyDisplay();
    updateLivesDisplay(); // <--- อัปเดตการแสดงผลชีวิต

    gameChars = [...allChars];
    startRound();
}

function restartGame() {
    closePopup();
    startGame();
}

function startRound() {
    clearInterval(countdownInterval);
    timeLeft = TOTAL_TIME;
    updateTimerBar();
    matchedPairsInRound = 0;
    roundCoinContainer.innerHTML = '';

    countdownInterval = setInterval(() => {
        timeLeft--;
        const timePerLife = TOTAL_TIME / LIVES; // คำนวณเวลาต่อชีวิต (60 / 3 = 20)
        const expectedLives = Math.ceil(timeLeft / timePerLife); // คำนวณชีวิตที่ควรจะเหลือ

        if (expectedLives < lives && timeLeft > 0) {
            lives = expectedLives; // อัปเดตชีวิตให้ตรงกับเวลา
            updateLivesDisplay(); // อัปเดตการแสดงผลหัวใจ
            playAudio(loseLifeSound); // เล่นเสียงเสียชีวิต
        }
        // --- จบส่วนที่เพิ่มเข้ามา ---

        updateTimerBar(); // อัปเดตแถบเวลา (ตอนนี้จะเปลี่ยนสีตามชีวิตด้วย)

        if (timeLeft <= 0) {
            handleGameOver("หมดเวลา!");
        }
    }, 1000);



    gameGrid.innerHTML = "";
    selected = [];

    const roundChars = [];
    for (let i = 0; i < CHARS_PER_ROUND; i++) {
        if (gameChars.length === 0) break;
        const randomIndex = Math.floor(Math.random() * gameChars.length);
        const selectedChar = gameChars.splice(randomIndex, 1)[0];
        roundChars.push(selectedChar);
    }

    pairsInCurrentRound = roundChars.length;

    if (pairsInCurrentRound === 0) {
        triggerFinalWinSequence();
        return;
    }

    let cardsData = shuffle([...roundChars.map(c => ({...c, type: 'char' })), ...roundChars.map(c => ({...c, type: 'img' }))]);

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
        cardDiv.onmouseenter = () => playAudio(hoverSound);
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

    playAudio(clickSound);
    div.classList.add("selected");
    selected.push({ div, id: card.id, soundUrl: card.sound });

    if (selected.length === 2) {
        const [first, second] = selected;
        if (first.id === second.id) {
            playAudio(coinSound);
            new Audio(first.soundUrl).play();
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
            // --- เมื่อจับคู่ผิด (เพิ่มตรรกะชีวิต) ---
            playAudio(wrongSound);
            playAudio(loseLifeSound); // เล่นเสียงเสียชีวิต
            lives--; // <--- ลดชีวิต
            updateLivesDisplay(); // <--- อัปเดตการแสดงผล
            baseScore -= 10;
            removeCollectedCoin();

            setTimeout(() => {
                first.div.classList.remove("selected");
                second.div.classList.remove("selected");
                selected = [];
            }, 1000);

            if (lives <= 0) { // <--- เช็คว่าชีวิตหมดหรือไม่
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

// --- ฟังก์ชันที่แก้ไข ---
function triggerRoundCompleteSequence() {
    playAudio(roundEndCoinSound);
    let timeBonus = 0;
    if (timeLeft >= 45) timeBonus = 3;
    else if (timeLeft >= 30) timeBonus = 2;
    else if (timeLeft >= 15) timeBonus = 1;
    for (let i = 0; i < timeBonus; i++) {
        setTimeout(() => addCollectedCoin(true), i * 150);
    }
    bonusScore += timeBonus * 5;
    updateScoreDisplay();
    setTimeout(() => {
        playAudio(goodResultSound);
        completedLessons++;
        updateTrophyDisplay();
        setTimeout(startRound, 2000);
    }, 1500);
}

async function triggerFinalWinSequence() {
    clearInterval(countdownInterval);
    totalScore = baseScore + bonusScore;
    if (currentUser) {
        const userScoreRef = db.collection('userScores').doc(currentUser.uid);
        try {
            await db.runTransaction(async(transaction) => {
                const doc = await transaction.get(userScoreRef);
                const currentBest = doc.exists ? (doc.data().bestScore || 0) : 0;
                const newTotalScore = currentBest + totalScore;
                transaction.set(userScoreRef, {
                    bestScore: newTotalScore,
                    lastPlayed: firebase.firestore.FieldValue.serverTimestamp()
                }, { merge: true });
            });
            console.log("Score updated successfully!");
        } catch (e) { console.error("Transaction failed: ", e); }
    }
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 1001 };
    const interval = setInterval(() => {
        const timeLeft = animationEnd - Date.now();
        if (timeLeft <= 0) return clearInterval(interval);
        const particleCount = 50 * (timeLeft / duration);
        confetti({...defaults, particleCount, origin: { x: Math.random(), y: Math.random() - 0.2 } });
    }, 250);
    const popupContent = `<h2>ภารกิจสำเร็จ!</h2><p>คะแนนที่ได้รับ: ${totalScore}</p><p>คะแนนของคุณถูกเพิ่มในคะแนนรวมแล้ว</p>`;
    const controls = createLobbyButton();
    showPopup(popupContent, controls);
}

function handleGameOver(message) {
    clearInterval(countdownInterval);
    playAudio(gameoverSound);
    showPopup(`<h2>${message}</h2><p>ลองอีกครั้งนะ!</p>`, createSingleButtonPopup("เริ่มใหม่", restartGame));
}

function handleScoreGameOver() {
    clearInterval(countdownInterval);
    playAudio(gameoverSound);
    const popupContent = `<h2>คะแนนหมด!</h2><p>คะแนนของคุณติดลบ เกมจะเริ่มต้นใหม่</p>`;
    showPopup(popupContent, createSingleButtonPopup("เริ่มเกมใหม่", restartGame));
}

// --- Helper & UI Functions ---

// <--- เพิ่มฟังก์ชัน updateLivesDisplay ---
function updateLivesDisplay() {
    livesDisplay.innerHTML = '❤️'.repeat(lives) + '💔'.repeat(LIVES - lives);
}

function updateScoreDisplay() {
    totalScore = baseScore + bonusScore;
    scoreValue.textContent = totalScore;
}

function updateTrophyDisplay() {
    progressSection.innerHTML = '🏆'.repeat(completedLessons);
}

function updateTimerBar() {
    const percentage = (timeLeft / TOTAL_TIME) * 100;
    timerFill.style.width = `${percentage}%`;

    // เปลี่ยนสีตามจำนวนชีวิตที่เหลือ
    if (lives === 3) {
        timerFill.style.backgroundColor = '#28a745'; // สีเขียว
    } else if (lives === 2) {
        timerFill.style.backgroundColor = '#ffc107'; // สีเหลือง
    } else {
        timerFill.style.backgroundColor = '#dc3545'; // สีแดง
    }
}

function addCollectedCoin(isBonus = false) {
    const collectedCoin = document.createElement("img");
    collectedCoin.src = `${baseUrl}Coin.png`;
    collectedCoin.className = 'round-coin-img';
    if (isBonus) {
        collectedCoin.classList.add('bonus');
    }
    roundCoinContainer.appendChild(collectedCoin);
    setTimeout(() => {
        collectedCoin.classList.add('collected');
    }, 10);
}

function removeCollectedCoin() {
    const lastCoin = roundCoinContainer.querySelector('.round-coin-img.collected:last-child');
    if (lastCoin) {
        lastCoin.classList.remove('collected');
        setTimeout(() => {
            if (lastCoin.parentNode) {
                lastCoin.remove();
            }
        }, 400);
    }
}

function showPopup(msg, controls) {
    popupText.innerHTML = msg;
    popupControls.innerHTML = '';
    if (controls) popupControls.appendChild(controls);
    popup.style.display = "flex";
}

function closePopup() { popup.style.display = "none"; }

function createSingleButtonPopup(text, onClickAction) {
    const controls = document.createElement('div');
    const btn = document.createElement('button');
    btn.textContent = text;
    btn.className = 'btn btn-success';
    btn.onclick = onClickAction;
    controls.appendChild(btn);
    return controls;
}

function createLobbyButton() {
    const controls = document.createElement('div');
    const backBtn = document.createElement('a');
    backBtn.href = 'index.html';
    backBtn.textContent = 'กลับไปหน้าหลัก';
    backBtn.className = 'btn btn-primary';
    controls.appendChild(backBtn);
    return controls;
}

function showLessonPage() {
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
        card.onclick = () => new Audio(char.sound).play();
        lessonGrid.appendChild(card);
    });
    lessonPage.style.display = 'flex';
    requestAnimationFrame(calculateLessonLayout);
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