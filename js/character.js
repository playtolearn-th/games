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

document.addEventListener('DOMContentLoaded', () => {

    // --- 3. DOM Elements และ Game Variables ---
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
    const bestRankDisplay = document.getElementById('best-rank-display');

    // --- Audio Caching System ---
    let audioCache = {};
    let isAudioPreloaded = false;

    let countdownInterval, selected = [], gameChars = [];
    const TOTAL_TIME = 180;
    const LIVES = 3;
    let lives = LIVES;
    let baseScore = 0, bonusScore = 0;
    let timeLeft = TOTAL_TIME, completedLessons = 0;
    const CHARS_PER_ROUND = 12;

    const imageBaseUrl = "images/";
    const soundBaseUrl = "sounds/";
    const allCharIds = ["ก", "ข", "ฃ", "ค", "ฅ", "ฆ", "ง", "จ", "ฉ", "ช", "ซ", "ฌ", "ญ", "ฎ", "ฏ", "ฐ", "ฑ", "ฒ", "ณ", "ด", "ต", "ถ", "ท", "ธ", "น", "บ", "ป", "ผ", "ฝ", "พ", "ฟ", "ภ", "ม", "ย", "ร", "ล", "ว", "ศ", "ษ", "ส", "ห", "ฬ", "อ", "ฮ"];
    const allChars = allCharIds.map(id => ({ id: id, img: `${imageBaseUrl}character/${id}.png` }));

    let matchedPairsInRound = 0;
    let pairsInCurrentRound = 0;
    const MAX_SCORE = 180440;

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
            'hover': 'effect/hover.mp3', 'click': 'effect/mouse-click.mp3', 'wrong': 'effect/wrong.mp3',
            'coin': 'effect/coin.mp3', 'gameover': 'effect/game-over.mp3', 'goodResult': 'effect/goodresult.mp3',
            'loseLife': 'effect/error.mp3', 'roundEndCoin': 'effect/coin-upaif.mp3', 'levelUp': 'effect/game-level-up.mp3', 'win': 'effect/winning.mp3'
        };
        allCharIds.forEach(id => audioFiles[id] = `character/${id}.mp3`);
        const audioKeys = Object.keys(audioFiles);
        const totalAudio = audioKeys.length;
        let loadedCount = 0;
        showPopup(`<h2>กำลังเตรียมเสียง... (0/${totalAudio})</h2>`, null);
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
            audioCache[soundKey].play().catch(e => { /* Ignore autoplay errors */ });
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
            timeLeft = TOTAL_TIME;
            updateScoreDisplay();
            progressSection.innerHTML = '';
            updateLivesDisplay();
            clearInterval(countdownInterval);
            countdownInterval = setInterval(() => {
                if (timeLeft > 0) timeLeft--;
                const timePerLife = TOTAL_TIME / LIVES;
                const expectedLives = Math.ceil(timeLeft / timePerLife);
                if (expectedLives < lives && timeLeft > 0) {
                    lives = expectedLives;
                    updateLivesDisplay();
                    playSound('loseLife');
                }
                updateTimerBar();
                if (timeLeft <= 0) handleGameOver("หมดเวลา!");
            }, 1000);
            gameChars = [...allChars];
            startRound();
        });
    }

    function restartGame() {
        closePopup();
        startGame();
    }

    function startRound() {
        matchedPairsInRound = 0;
        roundCoinContainer.innerHTML = "";
        gameGrid.innerHTML = "";
        selected = [];
        const roundChars = [];
        for (let i = 0; i < CHARS_PER_ROUND; i++) {
            if (gameChars.length === 0) break;
            const randomIndex = Math.floor(Math.random() * gameChars.length);
            const char = gameChars.splice(randomIndex, 1)[0];
            roundChars.push(char);
        }
        pairsInCurrentRound = roundChars.length;
        if (pairsInCurrentRound === 0) {
            triggerFinalWinSequence();
            return;
        }
        let cardsToPlace = shuffle([
            ...roundChars.map(char => ({...char, type: "char" })),
            ...roundChars.map(char => ({...char, type: "img" }))
        ]);
        cardsToPlace.forEach(cardData => {
            const cardDiv = document.createElement("div");
            cardDiv.classList.add("card");
            cardDiv.dataset.id = cardData.id;
            if (cardData.type === "char") {
                cardDiv.textContent = cardData.id;
            } else {
                const img = document.createElement("img");
                img.src = cardData.img;
                cardDiv.appendChild(img);
            }
            cardDiv.onclick = () => selectCard(cardDiv, cardData);
            cardDiv.onmouseenter = () => playSound("hover");
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

    function selectCard(cardDiv, cardData) {
        if (selected.length >= 2 || cardDiv.classList.contains("selected") || timeLeft <= 0 || lives <= 0) {
            return;
        }
        playSound("click");
        cardDiv.classList.add("selected");
        selected.push({ div: cardDiv, id: cardData.id });
        if (selected.length < 2) return;

        const [firstCard, secondCard] = selected;
        if (firstCard.id === secondCard.id) {
            playSound("coin");
            playSound(firstCard.id);
            baseScore += 10;
            addCollectedCoin();
            firstCard.div.classList.add("matched");
            secondCard.div.classList.add("matched");
            selected = [];
            matchedPairsInRound++;
            setTimeout(() => {
                firstCard.div.remove();
                secondCard.div.remove();
                if (matchedPairsInRound === pairsInCurrentRound) {
                    triggerRoundCompleteSequence();
                }
            }, 500);
        } else {
            playSound("wrong");
            baseScore -= 10;
            removeCollectedCoin();
            setTimeout(() => {
                firstCard.div.classList.remove("selected");
                secondCard.div.classList.remove("selected");
                selected = [];
            }, 1000);
            if (baseScore + bonusScore < 0) {
                handleScoreGameOver();
            }
        }
        updateScoreDisplay();
    }

    function triggerRoundCompleteSequence() {
        const trophyIcon = document.createElement("span");
        trophyIcon.className = "trophy-icon";
        trophyIcon.textContent = "🏆";
        progressSection.appendChild(trophyIcon);

        const coins = roundCoinContainer.querySelectorAll(".round-coin-img");
        const trophyRect = trophyIcon.getBoundingClientRect();
        playSound("roundEndCoin");

        coins.forEach((coin, index) => {
            const coinRect = coin.getBoundingClientRect();
            const flyingCoin = document.createElement("img");
            flyingCoin.src = coin.src;
            flyingCoin.className = "flying-coin";
            document.body.appendChild(flyingCoin);
            flyingCoin.style.left = `${coinRect.left}px`;
            flyingCoin.style.top = `${coinRect.top}px`;
            setTimeout(() => {
                const deltaX = (trophyRect.left + trophyRect.width / 2) - (coinRect.left + coinRect.width / 2);
                const deltaY = (trophyRect.top + trophyRect.height / 2) - (coinRect.top + coinRect.height / 2);
                flyingCoin.style.transform = `translate(${deltaX}px, ${deltaY}px) scale(0)`;
                flyingCoin.style.opacity = "0";
            }, 50 * index);
            coin.style.opacity = "0";
        });
        setTimeout(() => {
            document.querySelectorAll(".flying-coin").forEach(fc => fc.remove());
            trophyIcon.classList.add("earned", "trophy-levelup");
            playSound("levelUp");
            completedLessons++;
            setTimeout(startRound, 1200);
        }, 600 + 50 * coins.length);
    }

    async function triggerFinalWinSequence() {
        clearInterval(countdownInterval);
        bonusScore = timeLeft * 1000;
        updateScoreDisplay();
        let finalScore = baseScore + bonusScore;

        if (currentUser) {
            const userScoreRef = db.collection("userScores").doc(currentUser.uid);
            try {
                const doc = await userScoreRef.get();
                const bestScore = doc.exists && doc.data().scores?.game01 ? doc.data().scores.game01 : 0;
                if (finalScore > bestScore) {
                    await userScoreRef.set({ scores: { game01: finalScore } }, { merge: true });
                    displayBestRank();
                }
            } catch (error) {
                console.error("Score saving failed: ", error);
            }
        }
        
        const rankInfo = getRankForScore(finalScore, MAX_SCORE);
        
        const animationContainer = document.createElement("div");
        animationContainer.className = "end-game-animation-container";
        const medalImg = document.createElement("img");
        medalImg.src = `${imageBaseUrl}icon/${rankInfo.image}`;
        medalImg.className = "final-rank-medal";
        animationContainer.appendChild(medalImg);
        document.body.appendChild(animationContainer);
        
        const trophyIcons = progressSection.querySelectorAll(".trophy-icon");
        const bestRankRect = bestRankDisplay.getBoundingClientRect();

        if (trophyIcons.length > 0) {
            trophyIcons.forEach((trophy, index) => {
                const trophyRect = trophy.getBoundingClientRect();
                const flyingTrophy = document.createElement("span");
                flyingTrophy.textContent = "🏆";
                flyingTrophy.className = "flying-trophy-endgame";
                animationContainer.appendChild(flyingTrophy);
                flyingTrophy.style.left = `${trophyRect.left}px`;
                flyingTrophy.style.top = `${trophyRect.top}px`;
                setTimeout(() => {
                    const deltaX = (bestRankRect.left + bestRankRect.width / 2) - (trophyRect.left + trophyRect.width / 2);
                    const deltaY = (bestRankRect.top + bestRankRect.height / 2) - (trophyRect.top + trophyRect.height / 2);
                    flyingTrophy.style.transform = `translate(${deltaX}px, ${deltaY}px) scale(0)`;
                    flyingTrophy.style.opacity = "0";
                }, 100 * index);
                trophy.style.opacity = "0";
            });
        }

        setTimeout(() => {
            medalImg.style.left = `${bestRankRect.left + (bestRankRect.width / 2) - 75}px`;
            medalImg.style.top = `${bestRankRect.top + (bestRankRect.height / 2) - 75}px`;
            medalImg.classList.add("show");
            
            // หมายเหตุ: เสียง 'win' อาจไม่เล่นอัตโนมัติเนื่องจากนโยบายของเบราว์เซอร์
            playSound("win"); 

            setTimeout(() => {
                const popupContent = `<h2>ภารกิจสำเร็จ!</h2>
                                      <div class="final-rank-display"><img src="${imageBaseUrl}icon/${rankInfo.image}" alt="${rankInfo.rank}"><h3>คุณได้รับ Rank: ${rankInfo.rank}</h3></div>
                                      <p>คะแนนรวม: ${finalScore.toLocaleString()}</p>`;
                const controls = createGameOverControls();
                showPopup(popupContent, controls);
                animationContainer.remove();
            }, 1500);
        }, 1000 + 100 * trophyIcons.length);
    }

    function getRankForScore(score, maxScore) {
        const percentage = (score / maxScore) * 100;
        if (percentage >= 60) return { rank: "เพชร", image: "diamond.png" };
        if (percentage >= 50) return { rank: "ทอง", image: "gold-medal.png" };
        if (percentage >= 40) return { rank: "เงิน", image: "silver-Coin.png" };
        if (percentage >= 30) return { rank: "ทองแดง", image: "bronze-Medal.png" };
        return { rank: "เข้าร่วม", image: "neutral.png" };
    }

    async function displayBestRank() {
        if (!currentUser || !bestRankDisplay) return;
        const userScoreRef = db.collection("userScores").doc(currentUser.uid);
        try {
            const doc = await userScoreRef.get();
            if (doc.exists && doc.data().scores?.game01) {
                const bestScore = doc.data().scores.game01;
                const rankInfo = getRankForScore(bestScore, MAX_SCORE);
                bestRankDisplay.innerHTML = `<img src="${imageBaseUrl}icon/${rankInfo.image}" title="Rank สูงสุด: ${rankInfo.rank}">`;
            } else {
                bestRankDisplay.innerHTML = "";
            }
        } catch (error) {
            console.error("Could not display best rank:", error);
        }
    }

    function handleGameOver(message) {
        clearInterval(countdownInterval);
        playSound("gameover");
        showPopup(`<h2>${message}</h2><p>ลองอีกครั้งนะ!</p>`, createGameOverControls());
    }

    function handleScoreGameOver() {
        clearInterval(countdownInterval);
        playSound("gameover");
        const message = "<h2>คะแนนหมด!</h2><p>คะแนนของคุณติดลบ เกมจะเริ่มต้นใหม่</p>";
        showPopup(message, createGameOverControls());
    }

    function updateLivesDisplay() {
        if (livesDisplay) {
            livesDisplay.innerHTML = "❤️".repeat(lives) + "💔".repeat(LIVES - lives);
        }
    }

    function updateScoreDisplay() {
        let totalScore = (baseScore || 0) + (bonusScore || 0);
        if (scoreValue) {
            scoreValue.textContent = totalScore.toLocaleString();
        }
    }

    function updateTimerBar() {
        if (timerFill) {
            const percentage = (timeLeft / TOTAL_TIME) * 100;
            timerFill.style.width = `${percentage}%`;
            if (lives === 3) timerFill.style.backgroundColor = "#28a745";
            else if (lives === 2) timerFill.style.backgroundColor = "#ffc107";
            else timerFill.style.backgroundColor = "#dc3545";
        }
    }

    function addCollectedCoin() {
        const coinImg = document.createElement("img");
        coinImg.src = `${imageBaseUrl}icon/Coin.png`;
        coinImg.className = "round-coin-img";
        roundCoinContainer.appendChild(coinImg);
        setTimeout(() => coinImg.classList.add("collected"), 10);
    }

    function removeCollectedCoin() {
        const lastCoin = roundCoinContainer.querySelector(".round-coin-img.collected:last-child");
        if (lastCoin) {
            lastCoin.classList.remove("collected");
            setTimeout(() => {
                if (lastCoin.parentNode) lastCoin.remove();
            }, 400);
        }
    }

    function showPopup(htmlContent, controlsElement) {
        if (popupText && popupControls && popup) {
            popupText.innerHTML = htmlContent;
            popupControls.innerHTML = "";
            if (controlsElement) {
                popupControls.appendChild(controlsElement);
            }
            popup.style.display = "flex";
        }
    }

    function closePopup() {
        if (popup) {
            popup.style.display = "none";
        }
    }

    function createGameOverControls() {
        const div = document.createElement("div");
        div.style.display = "flex";
        div.style.gap = "15px";
        const playAgainBtn = document.createElement("button");
        playAgainBtn.textContent = "เล่นใหม่";
        playAgainBtn.className = "btn btn-success";
        playAgainBtn.onclick = restartGame;
        const homeLink = document.createElement("a");
        homeLink.textContent = "กลับหน้าหลัก";
        homeLink.className = "btn btn-secondary";
        homeLink.href = "index.html";
        div.appendChild(playAgainBtn);
        div.appendChild(homeLink);
        return div;
    }

    function showLessonPage() {
        preloadAllGameAudio(() => {
            closePopup();
            lessonGrid.innerHTML = "";
            allChars.forEach(char => {
                const card = document.createElement("div");
                card.className = "lesson-card";
                const img = document.createElement("img");
                img.src = char.img;
                const span = document.createElement("span");
                span.textContent = char.id;
                card.appendChild(img);
                card.appendChild(span);
                card.onclick = () => playSound(char.id);
                lessonGrid.appendChild(card);
            });
            lessonPage.style.display = "flex";
            requestAnimationFrame(calculateLessonLayout);
        });
    }

    function calculateLessonLayout() {
        if (!lessonGrid.offsetParent) return;
        const titleElem = lessonPage.querySelector("h2");
        const titleHeight = titleElem ? titleElem.offsetHeight + 20 : 0;
        const availableWidth = lessonPage.clientWidth - 30;
        const availableHeight = lessonPage.clientHeight - titleHeight - 20;
        let bestLayout = { cols: 0, cardSize: 0 };

        for (let cols = 4; cols <= 11; cols++) {
            const rows = Math.ceil(allChars.length / cols);
            const cardWidth = (availableWidth - (cols - 1) * 15) / cols;
            const cardHeight = (availableHeight - (rows - 1) * 15) / rows;
            const cardSize = Math.floor(Math.min(cardWidth, cardHeight));
            if (cardSize > bestLayout.cardSize) {
                bestLayout = { cols: cols, cardSize: cardSize };
            }
        }
        lessonGrid.style.gridTemplateColumns = `repeat(${bestLayout.cols}, ${bestLayout.cardSize}px)`;
        const cards = lessonGrid.querySelectorAll(".lesson-card");
        cards.forEach(card => {
            card.style.width = `${bestLayout.cardSize}px`;
            card.style.height = `${bestLayout.cardSize}px`;
            const span = card.querySelector("span");
            if (span) {
                span.style.fontSize = `${bestLayout.cardSize * 0.3}px`;
            }
        });
    }

    function calculateAndApplyLayout() {
        if (!gameGrid.offsetParent) return;
        const numCards = gameGrid.children.length;
        if (numCards === 0) return;
        const titleContainer = gameArea.querySelector(".title-container");
        const titleHeight = titleContainer ? titleContainer.offsetHeight + 15 : 0;
        const availableWidth = gameArea.clientWidth;
        const availableHeight = gameArea.clientHeight - titleHeight;
        let bestLayout = { cols: 0, cardSize: 0 };
        
        for (let cols = 3; cols <= numCards; cols++) {
            const rows = Math.ceil(numCards / cols);
            const cardWidth = (availableWidth - (cols - 1) * 10) / cols;
            const cardHeight = (availableHeight - (rows - 1) * 10) / rows;
            const cardSize = Math.floor(Math.min(cardWidth, cardHeight));
            if (cardSize > bestLayout.cardSize) {
                bestLayout = { cols: cols, cardSize: cardSize };
            }
        }
        if (bestLayout.cols === 0) {
            const cols = Math.ceil(Math.sqrt(numCards));
            const rows = Math.ceil(numCards / cols);
            const cardWidth = (availableWidth - (cols - 1) * 10) / cols;
            const cardHeight = (availableHeight - (rows - 1) * 10) / rows;
            bestLayout.cardSize = Math.floor(Math.min(cardWidth, cardHeight));
            bestLayout.cols = cols;
        }
        bestLayout.cardSize *= 0.98;
        
        gameGrid.style.gridTemplateColumns = `repeat(${bestLayout.cols}, ${bestLayout.cardSize}px)`;
        const cards = gameGrid.querySelectorAll(".card");
        cards.forEach(card => {
            card.style.width = `${bestLayout.cardSize}px`;
            card.style.height = `${bestLayout.cardSize}px`;
            card.style.fontSize = `${bestLayout.cardSize * 0.5}px`;
        });
    }

    // --- Event Listeners ---
    closeLessonBtn.onclick = () => lessonPage.style.display = 'none';
    profilePicGame.onclick = openSidebar;
    sidebarOverlay.onclick = closeSidebar;
    sidebarCloseBtn.onclick = closeSidebar;
    logoutBtn.onclick = () => auth.signOut();

    // ทำให้ฟังก์ชันที่เรียกจาก HTML เป็น Global
    window.startGame = startGame;
    window.restartGame = restartGame;
    window.showLessonPage = showLessonPage;
});