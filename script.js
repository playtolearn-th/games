 const firebaseConfig = {
            apiKey: "AIzaSyA1DVvalDuthN0-pUwECByT7-Ur5uTlsEE",
            authDomain: "thai-phairater.firebaseapp.com",
            projectId: "thai-phairater",
            storageBucket: "thai-phairater.appspot.com",
            messagingSenderId: "995255977727",
            appId: "1:995255977727:web:c0c1170665a19ab5136eca"
        };
        firebase.initializeApp(firebaseConfig);
        const auth = firebase.auth();
        let currentUser = null;

        // --- DOM Elements ---
        const mainWrapper = document.getElementById('main-wrapper'), authContainer = document.getElementById('authContainer'), gameArea = document.getElementById('gameArea'), gameGrid = document.getElementById('game'), topBar = document.getElementById('topBar'), restartBtn = document.getElementById('restartBtn'), popup = document.getElementById('popup'), popupBox = document.getElementById('popupBox'), popupText = document.getElementById('popupText'), popupControls = document.getElementById('popupControls'), popupBtn = document.getElementById('popupBtn'), profileIconContainer = document.getElementById('profileIconContainer'), profileIconImg = document.getElementById('profileIconImg'), sidebar = document.getElementById('sidebar'), sidebarOverlay = document.getElementById('sidebar-overlay'), sidebarCloseBtn = document.getElementById('sidebarCloseBtn'), sidebarProfileImg = document.getElementById('sidebarProfileImg'), sidebarUserName = document.getElementById('sidebarUserName'), sidebarUserEmail = document.getElementById('sidebarUserEmail'), sidebarLogoutBtn = document.getElementById('sidebarLogoutBtn'), scoreValue = document.getElementById('scoreValue'), scoreDisplay = document.getElementById('scoreDisplay'), livesDisplay = document.getElementById('livesDisplay'), timerFill = document.getElementById('timerFill'), progressSection = document.getElementById('progressSection'), roundCoinContainer = document.getElementById('roundCoinContainer'), finalRewardsContainer = document.getElementById('finalRewardsContainer');
        const loadingScreen = document.getElementById('loading-screen');
        const progressBar = document.getElementById('progress-bar');
        const progressText = document.getElementById('progress-text');
        const lessonPage = document.getElementById('lesson-page');
        const lessonGrid = document.getElementById('lesson-grid');
        const closeLessonBtn = document.getElementById('close-lesson-btn');
        const lessonBtn = document.getElementById('lessonBtn');
        const startBtn = document.getElementById('startBtn');
        const level2Area = document.getElementById('level2Area');
        const level2Title = document.getElementById('level2-title');
        const targetSequenceContainer = document.getElementById('target-sequence-container');
        const sourceConsonantsContainer = document.getElementById('source-consonants-container');

        // --- Game Logic Variables ---
        let countdownInterval, selected = [], gameChars = [];
        const TOTAL_TIME = 60, LIVES = 3;
        let baseScore = 0, bonusScore = 0, totalScore = 0;
        let scoreFromPreviousLevels = 0;
        let lives = LIVES, timeLeft = TOTAL_TIME, completedLessons = 0;
        let level1Diamonds = 0;
        const CHARS_PER_ROUND = 12; 
        const LEVEL2_CHARS_PER_ROUND = 11;
        let currentLevel = 1; 
        let level2CurrentRound = 0;
        let level2Chars = [];
        let expectedCharIndex = 0; 
        const hoverSound = document.getElementById("hoverSound"), clickSound = document.getElementById("clickSound"), wrongSound = document.getElementById("wrongSound"), gameoverSound = document.getElementById("gameoverSound"), winSound = document.getElementById("winSound"), coinSound = document.getElementById("coinSound"), levelUpSound = document.getElementById("levelUpSound"), coinSwooshSound = document.getElementById("coinSwooshSound"), loseLifeSound = document.getElementById("loseLifeSound"), roundEndCoinSound = document.getElementById("roundEndCoinSound"), goodResultSound = document.getElementById("goodResultSound"), diamondSound = document.getElementById("diamondSound");
        const baseUrl = "https://phairater.github.io/thai-sounds/";
        const allCharIds = [ "ก", "ข", "ฃ", "ค", "ฅ", "ฆ", "ง", "จ", "ฉ", "ช", "ซ", "ฌ", "ญ", "ฎ", "ฏ", "ฐ", "ฑ", "ฒ", "ณ", "ด", "ต", "ถ", "ท", "ธ", "น", "บ", "ป", "ผ", "ฝ", "พ", "ฟ", "ภ", "ม", "ย", "ร", "ล", "ว", "ศ", "ษ", "ส", "ห", "ฬ", "อ", "ฮ"];
        const allChars = allCharIds.map(id => ({ id: id, img: `${baseUrl}${id}.png`, sound: `${baseUrl}${id}.mp3` }));
        let matchedPairsInRound = 0;
        let pairsInCurrentRound = 0;

        // --- Helper Functions ---
        function playAudio(audio) {
            audio.currentTime = 0;
            audio.play().catch(e => console.error("Audio play failed:", e));
        }
        function playEndRoundSoundSequence() {
            playAudio(roundEndCoinSound);
            setTimeout(() => playAudio(goodResultSound), 1000);
        }
        function shuffle(array) {
            for (let i = array.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [array[i], array[j]] = [array[j], array[i]];
            }
            return array;
        }

        // --- Layout Functions ---
        function calculateAndApplyLayout() {
            if (!gameGrid || gameGrid.children.length === 0) return;
            const numCards = Array.from(gameGrid.children).filter(c => !c.classList.contains('matched')).length;
            if (numCards === 0) return;
            const gap = 10;
            const gameAreaStyle = window.getComputedStyle(gameArea);
            const availableWidth = gameArea.clientWidth - (parseInt(gameAreaStyle.paddingLeft) + parseInt(gameAreaStyle.paddingRight));
            const titleContainer = gameArea.querySelector('.title-container');
            const titleContainerHeight = titleContainer ? titleContainer.offsetHeight : 0;
            const availableHeight = gameArea.clientHeight - (titleContainerHeight + 20);
            let bestLayout = { cols: 0, cardSize: 0 };
            for (let cols = 3; cols <= numCards / 2; cols++) {
                if (numCards % cols !== 0 && cols > numCards / 2) continue;
                const rows = Math.ceil(numCards / cols);
                const sizeW = (availableWidth - (cols - 1) * gap) / cols;
                const sizeH = (availableHeight - (rows - 1) * gap) / rows;
                const cardSize = Math.floor(Math.min(sizeW, sizeH));
                if (cardSize > bestLayout.cardSize) { bestLayout = { cols, cardSize }; }
            }
            if (bestLayout.cols === 0) {
                bestLayout.cols = Math.ceil(Math.sqrt(numCards));
                const rows = Math.ceil(numCards / bestLayout.cols);
                const sizeW = (availableWidth - (bestLayout.cols - 1) * gap) / bestLayout.cols;
                const sizeH = (availableHeight - (rows - 1) * gap) / rows;
                bestLayout.cardSize = Math.floor(Math.min(sizeW, sizeH));
            }
            gameGrid.style.gridTemplateColumns = `repeat(${bestLayout.cols}, ${bestLayout.cardSize}px)`;
            const cards = gameGrid.querySelectorAll('.card');
            cards.forEach(card => card.style.fontSize = `${bestLayout.cardSize * 0.5}px`);
        }

        function calculateLessonLayout() {
            if (!lessonGrid || lessonGrid.children.length === 0) return;
            const numCards = lessonGrid.children.length;
            const gap = 15;
            const availableWidth = lessonGrid.clientWidth;
            const availableHeight = lessonGrid.clientHeight;

            let bestLayout = { cols: 0, cardSize: 0 };
            for (let cols = 3; cols <= 10; cols++) {
                const rows = Math.ceil(numCards / cols);
                const sizeW = (availableWidth - (cols - 1) * gap) / cols;
                const sizeH = (availableHeight - (rows - 1) * gap) / rows;
                const cardSize = Math.floor(Math.min(sizeW, sizeH));
                if (cardSize > bestLayout.cardSize) {
                    bestLayout = { cols, cardSize };
                }
            }
             if (bestLayout.cols === 0) {
                 bestLayout.cols = Math.ceil(Math.sqrt(numCards));
                 const rows = Math.ceil(numCards / bestLayout.cols);
                 const sizeW = (availableWidth - (bestLayout.cols - 1) * gap) / bestLayout.cols;
                 const sizeH = (availableHeight - (rows - 1) * gap) / rows;
                 bestLayout.cardSize = Math.floor(Math.min(sizeW, sizeH));
             }
            lessonGrid.style.gridTemplateColumns = `repeat(${bestLayout.cols}, ${bestLayout.cardSize}px)`;
            const cards = lessonGrid.querySelectorAll('.lesson-card span');
            cards.forEach(span => span.style.fontSize = `${bestLayout.cardSize * 0.25}px`);
        }
        
        function calculateLevel2Layout() {
            const numItems = level2Chars.length;
            if (numItems === 0) return;
            const gap = 10;
            const containerStyle = window.getComputedStyle(level2Area);
            const availableWidth = level2Area.clientWidth - (parseInt(containerStyle.paddingLeft) + parseInt(containerStyle.paddingRight));
            const titleContainer = level2Area.querySelector('.title-container');
            const titleHeight = titleContainer ? titleContainer.offsetHeight : 0;
            const availableHeight = level2Area.clientHeight - titleHeight - 40; 

            const totalGridHeight = availableHeight / 2;
            const rows = 2; 
            const cols = Math.ceil(numItems / rows);

            const sizeW = (availableWidth - (cols - 1) * gap) / cols;
            const sizeH = (totalGridHeight - (rows - 1) * gap) / rows;
            const itemSize = Math.floor(Math.min(sizeW, sizeH, 100));

            targetSequenceContainer.style.gridTemplateColumns = `repeat(${numItems}, ${itemSize}px)`;
            sourceConsonantsContainer.style.gridTemplateColumns = `repeat(${cols}, ${itemSize}px)`;

            document.querySelectorAll('.target-slot, .source-char').forEach(el => {
                el.style.fontSize = `${itemSize * 0.5}px`;
            });
        }
        
        function showPopup(msg, controls) {
            popupText.innerHTML = msg;
            popupControls.innerHTML = ''; // Clear previous buttons
            if (controls) {
                popupControls.appendChild(controls);
            }
            popup.style.display = "flex";
        }
        function closePopup() { popup.style.display = "none"; }
        
        function preloadAllAssets(callback, text = "กำลังโหลดข้อมูลเกม...") {
            loadingScreen.querySelector('.loading-text').textContent = text;
            progressBar.style.width = '0%';
            progressText.innerText = '0%';
            let assetUrls = [];
            allChars.forEach(char => {
                assetUrls.push(char.img);
                assetUrls.push(char.sound);
            });
            document.querySelectorAll('audio').forEach(audioTag => { if (audioTag.src) assetUrls.push(audioTag.src); });
            assetUrls.push(`${baseUrl}Coin.png`, `${baseUrl}diamond.png`, 'https://i.imgur.com/sC22S2A.png', 'https://img.icons8.com/color/48/000000/google-logo.png');
            assetUrls = [...new Set(assetUrls)];
            let assetsLoaded = 0;
            const totalAssets = assetUrls.length;
            if (totalAssets === 0) return loadingComplete();
            function assetLoadedCallback() {
                assetsLoaded++;
                const percentage = Math.round((assetsLoaded / totalAssets) * 100);
                progressBar.style.width = percentage + '%';
                progressText.innerText = percentage + '%';
                if (assetsLoaded === totalAssets) setTimeout(loadingComplete, 500);
            }
            function loadingComplete() { if (callback) callback(); }
            assetUrls.forEach(url => {
                const ext = url.split('.').pop().toLowerCase().split('?')[0];
                if (['jpg', 'jpeg', 'png', 'gif', 'svg'].includes(ext)) {
                    const img = new Image();
                    img.src = url;
                    img.onload = assetLoadedCallback;
                    img.onerror = assetLoadedCallback;
                } else { fetch(url).then(assetLoadedCallback).catch(assetLoadedCallback); }
            });
        }
        
        function updateScoreDisplay() {
            totalScore = scoreFromPreviousLevels + baseScore + bonusScore;
            scoreValue.textContent = totalScore;
        }
        function updateLivesDisplay() { livesDisplay.innerHTML = '❤️'.repeat(lives) + '💔'.repeat(LIVES - lives); }
        function updateTrophyDisplay() {
            progressSection.innerHTML = '';
            for (let i = 1; i <= completedLessons; i++) {
                const trophy = document.createElement('span');
                trophy.className = 'trophy-icon earned';
                trophy.textContent = '🏆';
                progressSection.appendChild(trophy);
            }
        }
        function updateTimerBar() {
            const percentage = (timeLeft / TOTAL_TIME) * 100;
            timerFill.style.width = `${percentage}%`;
            if (percentage <= 25) timerFill.style.backgroundColor = '#dc3545';
            else if (percentage <= 50) timerFill.style.backgroundColor = '#ffc107';
            else timerFill.style.backgroundColor = '#28a745';
        }
        function initializeGameUI() {
            updateScoreDisplay();
            timeLeft = TOTAL_TIME;
            updateLivesDisplay();
            updateTrophyDisplay();
            updateTimerBar();
            finalRewardsContainer.innerHTML = '';
        }
        function initializeGameState() {
            clearInterval(countdownInterval);
            currentLevel = 1;
            scoreFromPreviousLevels = 0;
            baseScore = 0; bonusScore = 0; totalScore = 0;
            lives = LIVES; completedLessons = 0;
            level1Diamonds = 0;
            gameGrid.innerHTML = "";
            initializeGameUI();
        }
        function resetGame() {
            clearInterval(countdownInterval);
            currentLevel = 1;
            scoreFromPreviousLevels = 0;
            baseScore = 0; bonusScore = 0; totalScore = 0;
            lives = LIVES; completedLessons = 0;
            level1Diamonds = 0;
            gameGrid.innerHTML = "";
            level2Area.style.display = 'none';
            gameArea.style.display = 'flex';
            startBtn.style.display = "inline-block";
            lessonBtn.style.display = "inline-block";
            restartBtn.style.display = "none";
            initializeGameUI();
        }

        function animateTrophiesToDiamonds(finalCallback) {
            const trophies = progressSection.querySelectorAll('.trophy-icon.earned');
            const targetContainer = finalRewardsContainer;
            if (trophies.length === 0) {
                if (finalCallback) finalCallback();
                return;
            }

            const flightDuration = 800;
            const allTrophiesFlying = [];

            trophies.forEach((trophy) => {
                const startRect = trophy.getBoundingClientRect();
                const flyingTrophy = document.createElement('span');
                flyingTrophy.textContent = '🏆';
                flyingTrophy.className = 'flying-trophy';
                document.body.appendChild(flyingTrophy);
                flyingTrophy.style.left = `${startRect.left}px`;
                flyingTrophy.style.top = `${startRect.top}px`;
                trophy.style.opacity = '0';
                allTrophiesFlying.push(flyingTrophy);
            });

            setTimeout(() => {
                 const targetRect = profileIconImg.getBoundingClientRect();
                 const targetCenterX = targetRect.left + targetRect.width;
                 const targetCenterY = targetRect.top + targetRect.height / 2;

                 playAudio(coinSwooshSound);
                 allTrophiesFlying.forEach(flyingTrophy => {
                    const startRect = flyingTrophy.getBoundingClientRect();
                    const deltaX = targetCenterX - (startRect.left + startRect.width / 2);
                    const deltaY = targetCenterY - (startRect.top + startRect.height / 2);
                    flyingTrophy.style.transform = `translate(${deltaX}px, ${deltaY}px) scale(0)`;
                    flyingTrophy.style.opacity = '0';
                 });

                 setTimeout(() => {
                    allTrophiesFlying.forEach(t => t.remove());
                    level1Diamonds++;
                    const diamondEl = document.createElement('img');
                    diamondEl.src = `${baseUrl}diamond.png`;
                    diamondEl.className = 'final-reward-item diamond';
                    targetContainer.appendChild(diamondEl);
                    playAudio(diamondSound);
                    setTimeout(() => diamondEl.classList.add('show'), 50);
                    if (finalCallback) finalCallback();
                 }, flightDuration);
            }, 200);
        }

        function triggerFinalWinSequence() {
            clearInterval(countdownInterval);
            const popupContent = `<h2>ภารกิจสำเร็จ! ✨</h2><p>คะแนนด่านนี้: ${baseScore}</p><p>โบนัสเวลา: ${bonusScore}</p><hr style="margin: 10px 0;"><p><strong>คะแนนรวม: ${totalScore}</strong></p>`;
            const duration = 5 * 1000;
            const animationEnd = Date.now() + duration;
            const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 1001 };
            function randomInRange(min, max) { return Math.random() * (max - min) + min; }
            const interval = setInterval(function() {
                const timeLeft = animationEnd - Date.now();
                if (timeLeft <= 0) return clearInterval(interval);
                const particleCount = 50 * (timeLeft / duration);
                confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } }));
                confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } }));
            }, 250);
            
            completedLessons++;
            
            const controls = document.createElement('div');
            const newGameBtn = document.createElement('button');
            newGameBtn.textContent = "เริ่มเกมใหม่";
            newGameBtn.style.backgroundColor = '#28a745';
            newGameBtn.onclick = () => { closePopup(); resetGame(); };
            controls.appendChild(newGameBtn);
            
            showPopup(popupContent, controls);
            
            const lvl2Controls = level2Area.querySelector('.controls button');
            if (lvl2Controls) lvl2Controls.style.display = 'none';
            if(restartBtn) restartBtn.style.display = 'none';
        }
        
        function triggerRoundCompleteSequence() {
            playEndRoundSoundSequence();
            let bonusCoins = 0;
            if (timeLeft >= 45) bonusCoins = 3;
            else if (timeLeft >= 30) bonusCoins = 2;
            else if (timeLeft >= 15) bonusCoins = 1;
            bonusScore += bonusCoins * 5;
            updateScoreDisplay();
            for (let i = 0; i < bonusCoins; i++) {
                setTimeout(() => addCollectedCoin(true), i * 150);
            }
            const bonusAnimDelay = bonusCoins * 150;

            setTimeout(() => {
                const allCoinsInBar = roundCoinContainer.querySelectorAll('.round-coin-img');
                let isDummyTarget = false;
                let targetTrophy = progressSection.children[completedLessons];

                const proceedToNextStepAfterAnimation = () => {
                    if (isDummyTarget && targetTrophy) {
                        targetTrophy.remove();
                    }
                    completedLessons++;
                    updateTrophyDisplay();
                    
                    const newTrophy = progressSection.children[completedLessons - 1];
                    if (newTrophy) {
                        newTrophy.classList.add('trophy-levelup');
                        playAudio(levelUpSound);
                    }

                    if (gameChars.length > 0) {
                        setTimeout(startRound, 500);
                    } else {
                        animateTrophiesToDiamonds(() => {
                            scoreFromPreviousLevels = baseScore + bonusScore;
                            baseScore = 0;
                            bonusScore = 0;
                            
                            const controls = document.createElement('div');
                            const nextLevelBtn = document.createElement('button');
                            nextLevelBtn.textContent = "เล่นด่านที่ 2";
                            nextLevelBtn.style.backgroundColor = '#007bff';
                            nextLevelBtn.onclick = () => { closePopup(); startLevel2(); };
                            
                            const exitBtn = document.createElement('button');
                            exitBtn.textContent = "ออกจากเกม";
                            exitBtn.style.backgroundColor = '#6c757d';
                            exitBtn.onclick = () => { closePopup(); resetGame(); };
                            
                            controls.appendChild(nextLevelBtn);
                            controls.appendChild(exitBtn);

                            showPopup("<h2>ผ่านด่านที่ 1! 🎉</h2><p>เก่งมาก! ไปต่อด่านต่อไปกันเลย</p>", controls);
                        });
                    }
                };

                if (!targetTrophy) {
                    targetTrophy = document.createElement('span');
                    targetTrophy.className = 'trophy-icon';
                    targetTrophy.style.opacity = '0';
                    progressSection.appendChild(targetTrophy);
                    isDummyTarget = true;
                }
                
                if (allCoinsInBar.length === 0) {
                    proceedToNextStepAfterAnimation();
                    return;
                }

                const targetRect = targetTrophy.getBoundingClientRect();
                playAudio(coinSwooshSound);
                allCoinsInBar.forEach((coin, index) => {
                    const startRect = coin.getBoundingClientRect();
                    coin.classList.add('is-flying');
                    coin.style.left = `${startRect.left}px`;
                    coin.style.top = `${startRect.top}px`;
                    coin.style.margin = '0';
                    const deltaX = (targetRect.left + targetRect.width / 2) - (startRect.left + startRect.width / 2);
                    const deltaY = (targetRect.top + targetRect.height / 2) - (startRect.top + startRect.height / 2);
                    setTimeout(() => {
                        coin.style.transform = `translate(${deltaX}px, ${deltaY}px) scale(0)`;
                        coin.style.opacity = '0';
                    }, 50 * index);
                });
                
                setTimeout(proceedToNextStepAfterAnimation, 800 + 50 * allCoinsInBar.length);

            }, bonusAnimDelay);
        }

        function addCollectedCoin(isBonus = false) {
            const collectedCoin = document.createElement("img");
            collectedCoin.src = `${baseUrl}Coin.png`;
            collectedCoin.className = 'round-coin-img';
            if (isBonus) { collectedCoin.classList.add('bonus'); }
            roundCoinContainer.appendChild(collectedCoin);
            setTimeout(() => { collectedCoin.classList.add('collected'); }, 10);
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

        function startGame() {
            startBtn.style.display = "none";
            lessonBtn.style.display = "none";
            restartBtn.style.display = "inline-block";
            restartBtn.textContent = "เริ่มใหม่";
            
            currentLevel = 1;
            scoreFromPreviousLevels = 0;
            baseScore = 0;
            bonusScore = 0;
            lives = LIVES;
            completedLessons = 0;

            initializeGameUI();
            gameChars = shuffle([...allChars]);
            startRound();
        }

        function restartGame() {
            closePopup();
            resetGame();
        }
        
        function startRound() {
    clearInterval(countdownInterval);
    timeLeft = TOTAL_TIME;
    updateTimerBar();
    matchedPairsInRound = 0;
    roundCoinContainer.innerHTML = '';
    
    countdownInterval = setInterval(() => {
        if (--timeLeft <= 0) { // ไม่ต้องเช็ค lives <= 0 ที่นี่ เพราะการผิดพลาดจะจัดการทันที
            timeLeft = 0; // ป้องกันค่าติดลบ
            updateTimerBar();
            handleGameOver("หมดเวลา!");
        }
        updateTimerBar();
    }, 1000);
    
    gameGrid.innerHTML = "";
    selected = [];
    const roundChars = gameChars.splice(0, CHARS_PER_ROUND);
    pairsInCurrentRound = roundChars.length;
    
    if (pairsInCurrentRound === 0) {
        // ไม่มีพยัญชนะเหลือแล้ว = จบด่าน 1
        triggerRoundCompleteSequence(); 
        return;
    }
    
    let cardsData = [];
    roundChars.forEach(char => {
        cardsData.push({ type: 'char', id: char.id, sound: char.sound });
        cardsData.push({ type: 'img', id: char.id, img: char.img, sound: char.sound });
    });
    
    shuffle(cardsData).forEach(cardData => {
        const cardDiv = document.createElement("div");
        cardDiv.classList.add("card");
        cardDiv.dataset.id = cardData.id;
        
        if (cardData.type === 'char') {
            cardDiv.textContent = cardData.id;
        } else {
            const img = document.createElement("img");
            img.src = cardData.img;
            img.alt = cardData.id;
            cardDiv.appendChild(img);
        }
        
        cardDiv.onclick = () => selectCard(cardDiv, cardData);
        cardDiv.onmouseenter = () => playAudio(hoverSound);
        gameGrid.appendChild(cardDiv);
    });
    
    // คำนวณ Layout หลังสร้างการ์ดเสร็จ
    requestAnimationFrame(calculateAndApplyLayout);
}
        function selectCard(div, card) {
            if (selected.length >= 2 || div.classList.contains("selected") || div.classList.contains("matched") || timeLeft <= 0 || lives <= 0) return;
            div.classList.add("selected");
            playAudio(clickSound);
            selected.push({ div, id: card.id, soundUrl: card.sound });
            if (selected.length === 2) {
                const [first, second] = selected;
                if (first.id === second.id) {
                    playAudio(coinSound);
                    new Audio(first.soundUrl).play();
                    baseScore += 10;
                    updateScoreDisplay();
                    matchedPairsInRound++;
                    addCollectedCoin();
                    first.div.classList.add("matched");
                    second.div.classList.add("matched");
                    selected = [];
                    setTimeout(() => {
                        first.div.remove();
                        second.div.remove();
                        if (matchedPairsInRound === pairsInCurrentRound) {
                            clearInterval(countdownInterval);
                            triggerRoundCompleteSequence(); 
                        }
                    }, 400);
                } else {
                    playAudio(wrongSound);
                    baseScore -= 10;
                    updateScoreDisplay();
                    removeCollectedCoin();

                    if (totalScore < 0) {
                        setTimeout(handleScoreGameOver, 500);
                    } else {
                        setTimeout(() => {
                            first.div.classList.remove("selected");
                            second.div.classList.remove("selected");
                            selected = [];
                        }, 1000);
                    }
                }
            }
        }
        
        function startLevel2() {
            currentLevel = 2;
            gameArea.style.display = 'none';
            level2Area.style.display = 'flex';
            restartBtn.style.display = 'inline-block';
            level2CurrentRound = 0;
            startLevel2Round();
        }

        function startLevel2Round() {
            const startIndex = level2CurrentRound * LEVEL2_CHARS_PER_ROUND;
            const endIndex = startIndex + LEVEL2_CHARS_PER_ROUND;
            level2Chars = allChars.slice(startIndex, endIndex);

            if (level2Chars.length === 0) {
                triggerFinalWinSequence();
                return;
            }

            level2Title.textContent = `ด่านที่ 2: เรียงลำดับ (รอบที่ ${level2CurrentRound + 1}/${Math.ceil(allChars.length/LEVEL2_CHARS_PER_ROUND)})`;
            
            let shuffledChars = shuffle([...level2Chars]);
            expectedCharIndex = 0;

            targetSequenceContainer.innerHTML = '';
            sourceConsonantsContainer.innerHTML = '';

            level2Chars.forEach(() => {
                const slot = document.createElement('div');
                slot.className = 'target-slot';
                targetSequenceContainer.appendChild(slot);
            });

            shuffledChars.forEach(char => {
                const charDiv = document.createElement('div');
                charDiv.className = 'source-char';
                charDiv.textContent = char.id;
                charDiv.dataset.id = char.id;
                charDiv.onclick = () => selectSequenceChar(charDiv, char);
                sourceConsonantsContainer.appendChild(charDiv);
            });
            
            requestAnimationFrame(calculateLevel2Layout);

            clearInterval(countdownInterval);
            countdownInterval = setInterval(() => {
                if (--timeLeft <= 0 || lives <= 0) {
                    handleGameOver();
                }
                updateTimerBar();
            }, 1000);
        }

        function selectSequenceChar(charDiv, char) {
            if (lives <= 0 || timeLeft <= 0) return;
            const expectedChar = level2Chars[expectedCharIndex];
            if (char.id === expectedChar.id) {
                playAudio(coinSound);
                new Audio(char.sound).play();
                baseScore += 10;
                updateScoreDisplay();
                
                charDiv.classList.add('used');
                const targetSlot = targetSequenceContainer.children[expectedCharIndex];
                targetSlot.textContent = char.id;
                targetSlot.classList.add('correct');
                
                expectedCharIndex++;

                if (expectedCharIndex === level2Chars.length) {
                    level2CurrentRound++;
                    if ( (level2CurrentRound * LEVEL2_CHARS_PER_ROUND) >= allChars.length ) {
                        triggerFinalWinSequence();
                    } else {
                        playAudio(goodResultSound);
                        showPopup(`<h2>ผ่านรอบ!</h2><p>เตรียมตัวสำหรับรอบต่อไป...</p>`, createSingleButtonPopup("ไปต่อ", () => { closePopup(); startLevel2Round(); }));
                    }
                }
            } else {
                playAudio(wrongSound);
                baseScore -= 10;
                updateScoreDisplay();

                if (totalScore < 0) {
                    setTimeout(handleScoreGameOver, 500);
                } else {
                    charDiv.style.animation = 'shake 0.5s';
                    setTimeout(() => charDiv.style.animation = '', 500);
                }
            }
        }
        
        function createSingleButtonPopup(text, onClickAction) {
            const controls = document.createElement('div');
            const btn = document.createElement('button');
            btn.textContent = text;
            btn.style.backgroundColor = '#28a745';
            btn.onclick = onClickAction;
            controls.appendChild(btn);
            return controls;
        }

        function handleGameOver() {
            clearInterval(countdownInterval);
            playAudio(gameoverSound);
            showPopup("💔 พลาดแล้ว! ลองอีกครั้งนะ", createSingleButtonPopup("เล่นด่านนี้ใหม่", () => {
                closePopup();
                restartCurrentLevel();
            }));
            restartBtn.style.display = 'none';
            lessonBtn.style.display = "inline-block";
        }
        function handleScoreGameOver() {
            clearInterval(countdownInterval);
            playAudio(gameoverSound);
            
            showPopup("<h2>คะแนนหมด!</h2><p>คะแนนของคุณติดลบ เกมจะเริ่มต้นใหม่ทั้งหมด</p>", createSingleButtonPopup("เริ่มเกมใหม่", () => {
                closePopup();
                resetGame();
            }));
            
            restartBtn.style.display = 'none';
        }
        
        function restartCurrentLevel() {
            closePopup();
            lives = LIVES;
            baseScore = 0;
            bonusScore = 0;
            updateLivesDisplay();
            updateScoreDisplay(); 
            if (currentLevel === 1) {
                gameChars = shuffle([...allChars]);
                startRound();
            } else if (currentLevel === 2) {
                startLevel2();
            }
        }

        // --- Auth and Init ---
        function updateAuthUI() {
            if (currentUser) {
                loadingScreen.style.display = 'none';
                authContainer.style.display = 'none';
                gameArea.style.display = 'flex';
                topBar.style.display = 'flex';
                profileIconContainer.style.display = 'block';
                const photoURL = currentUser.photoURL || 'https://i.imgur.com/sC22S2A.png';
                const displayName = currentUser.displayName || currentUser.email.split('@')[0];
                profileIconImg.src = photoURL;
                sidebarProfileImg.src = photoURL;
                sidebarUserName.textContent = displayName;
                sidebarUserEmail.textContent = currentUser.email;
                resetGame();
            } else {
                loadingScreen.style.display = 'none';
                authContainer.style.display = 'flex';
                gameArea.style.display = 'none';
                level2Area.style.display = 'none';
                topBar.style.display = 'none';
                profileIconContainer.style.display = 'none';
                closeSidebar();
            }
        }
        function openSidebar() { sidebar.classList.add('open'); sidebarOverlay.style.display = 'block'; }
        function closeSidebar() { sidebar.classList.remove('open'); sidebarOverlay.style.display = 'none'; }
        
async function register() {
    // ดึงข้อมูลจากฟอร์มลงทะเบียน
    const name = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const confirmPassword = document.getElementById('register-confirm-password').value;

    // ตรวจสอบว่ารหัสผ่านตรงกันหรือไม่
    if (password !== confirmPassword) {
        alert("รหัสผ่านไม่ตรงกัน กรุณาลองใหม่อีกครั้ง");
        return;
    }

    try {
        // สร้างผู้ใช้ใหม่ใน Firebase Authentication
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        
        // อัปเดตชื่อผู้ใช้ (Display Name)
        await userCredential.user.updateProfile({
            displayName: name
        });
        
        // onAuthStateChanged จะจัดการอัปเดต UI ให้เองเมื่อลงทะเบียนสำเร็จ
        console.log("Registered and logged in successfully:", userCredential.user);

    } catch (error) {
        console.error("Error registering:", error);
        alert("เกิดข้อผิดพลาดในการลงทะเบียน: " + error.message);
    }
}

async function login() {
    // ดึงข้อมูลจากฟอร์มล็อกอิน
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    try {
        // สั่งให้ Firebase ล็อกอินด้วยอีเมลและรหัสผ่าน
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        
        // onAuthStateChanged จะจัดการอัปเดต UI ให้เองเมื่อล็อกอินสำเร็จ
        console.log("Logged in successfully:", userCredential.user);

    } catch (error) {
        console.error("Error logging in:", error);
        alert("อีเมลหรือรหัสผ่านไม่ถูกต้อง: " + error.message);
    }
}

async function loginWithGoogle() {
    try {
        // สร้างตัวจัดการสำหรับล็อกอินด้วย Google
        const provider = new firebase.auth.GoogleAuthProvider();
        
        // แสดงหน้าต่าง Popup ของ Google เพื่อให้ผู้ใช้ล็อกอิน
        const result = await auth.signInWithPopup(provider);

        // onAuthStateChanged จะจัดการอัปเดต UI ให้เองเมื่อล็อกอินสำเร็จ
        console.log("Logged in with Google successfully:", result.user);

    } catch (error) {
        console.error("Error with Google login:", error);
        alert("เกิดข้อผิดพลาดในการล็อกอินด้วย Google: " + error.message);
    }
}
async function logout() {
    try {
        // สั่งให้ Firebase ทำการ Sign Out
        await auth.signOut();
        
        // เมื่อ Sign Out สำเร็จ ไม่ต้องทำอะไรเพิ่ม
        // เพราะ onAuthStateChanged จะตรวจจับการเปลี่ยนแปลงและอัปเดตหน้าเว็บให้เอง
        console.log("User logged out successfully.");

    } catch (error) {
        // หากเกิดข้อผิดพลาดขึ้น
        console.error("Error logging out:", error);
        alert("เกิดข้อผิดพลาดในการออกจากระบบ: " + error.message);
    }
}        
        function showLessonPage() {
            lessonGrid.innerHTML = ''; 
            allChars.forEach(char => {
                const card = document.createElement('div');
                card.className = 'lesson-card';
                const img = document.createElement('img');
                img.src = char.img;
                img.alt = char.id;
                const text = document.createElement('span');
                text.textContent = char.id;
                card.appendChild(img);
                card.appendChild(text);
                card.onclick = () => { new Audio(char.sound).play(); };
                lessonGrid.appendChild(card);
            });
            lessonPage.style.display = 'flex';
            requestAnimationFrame(calculateLessonLayout);
        }

        function hideLessonPage() { lessonPage.style.display = 'none'; }

        // --- Event Listeners ---
        auth.onAuthStateChanged((user) => {
            currentUser = user;
            if (user) {
                preloadAllAssets(updateAuthUI, "กำลังโหลดไฟล์เกม...");
            } else {
                updateAuthUI();
            }
        });

        profileIconContainer.onclick = openSidebar;
        sidebarOverlay.onclick = closeSidebar;
        sidebarCloseBtn.onclick = closeSidebar;
        sidebarLogoutBtn.onclick = logout;
        closeLessonBtn.onclick = hideLessonPage;
        
        let resizeTimeout;
        function handleScreenChange() {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                setFullHeight();
                if (lessonPage.style.display === 'flex') {
                    calculateLessonLayout();
                } else if (gameArea.style.display === 'flex' && currentLevel === 1) {
                    calculateAndApplyLayout();
                } else if (level2Area.style.display === 'flex') {
                    calculateLevel2Layout();
                }
            }, 100);
        }

        window.addEventListener('resize', handleScreenChange);
        window.addEventListener('orientationchange', handleScreenChange);
        
        function setFullHeight() {
            const vh = window.innerHeight * 0.01;
            document.documentElement.style.setProperty('--vh', `${vh}px`);
        }
        window.addEventListener('load', () => { setFullHeight(); });
