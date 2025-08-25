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

// ✅ FIX: รอให้ HTML โหลดเสร็จก่อนเริ่มทำงาน
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

    let countdownInterval, selected = [],
        gameChars = [];
    const TOTAL_TIME = 180;
    const LIVES = 3;
    let lives = LIVES;
    let baseScore = 0,
        bonusScore = 0;
    let timeLeft = TOTAL_TIME,
        completedLessons = 0;
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
            audioCache[soundKey].play().catch(e => {});
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
    
    // ... (ส่วนที่เหลือของฟังก์ชันทั้งหมดจะอยู่ที่นี่) ...
    // (เนื้อหาตั้งแต่ function startRound() จนถึง calculateAndApplyLayout() ให้คัดลอกมาวางต่อตรงนี้)
    function startRound(){matchedPairsInRound=0;roundCoinContainer.innerHTML="";gameGrid.innerHTML="";selected=[];const e=[];for(let t=0;t<CHARS_PER_ROUND;t++){if(0===gameChars.length)break;const o=Math.floor(Math.random()*gameChars.length),n=gameChars.splice(o,1)[0];e.push(n)}if(pairsInCurrentRound=e.length,0===pairsInCurrentRound)return void triggerFinalWinSequence();let t=shuffle([...e.map(e=>({...e,type:"char"})),...e.map(e=>({...e,type:"img"}))]);t.forEach(e=>{const t=document.createElement("div");t.classList.add("card"),t.dataset.id=e.id,"char"===e.type?t.textContent=e.id:(img=document.createElement("img"),img.src=e.img,t.appendChild(img)),t.onclick=()=>selectCard(t,e),t.onmouseenter=()=>playSound("hover"),gameGrid.appendChild(t)}),requestAnimationFrame(calculateAndApplyLayout)}function shuffle(e){for(let t=e.length-1;t>0;t--){const o=Math.floor(Math.random()*(t+1));[e[t],e[o]]=[e[o],e[t]]}return e}function selectCard(e,t){if(!(selected.length>=2||e.classList.contains("selected")||timeLeft<=0||lives<=0)){playSound("click"),e.classList.add("selected"),selected.push({div:e,id:t.id});const[o,n]=selected;if(o.id===n.id)playSound("coin"),playSound(o.id),baseScore+=10,addCollectedCoin(),o.div.classList.add("matched"),n.div.classList.add("matched"),selected=[],matchedPairsInRound++,setTimeout(()=>{o.div.remove(),n.div.remove(),matchedPairsInRound===pairsInCurrentRound&&triggerRoundCompleteSequence()},500);else playSound("wrong"),baseScore-=10,removeCollectedCoin(),setTimeout(()=>{o.div.classList.remove("selected"),n.div.classList.remove("selected"),selected=[]},1e3),baseScore+bonusScore<0&&handleScoreGameOver();updateScoreDisplay()}}function triggerRoundCompleteSequence(){const e=document.createElement("span");e.className="trophy-icon",e.textContent="🏆",progressSection.appendChild(e);const t=roundCoinContainer.querySelectorAll(".round-coin-img"),o=e.getBoundingClientRect();playSound("roundEndCoin"),t.forEach((e,n)=>{const a=e.getBoundingClientRect(),i=document.createElement("img");i.src=e.src,i.className="flying-coin",document.body.appendChild(i),i.style.left=`${a.left}px`,i.style.top=`${a.top}px`,setTimeout(()=>{const e=(o.left+o.width/2)-(a.left+a.width/2),t=(o.top+o.height/2)-(a.top+a.height/2);i.style.transform=`translate(${e}px, ${t}px) scale(0)`,i.style.opacity="0"},50*n),e.style.opacity="0"}),setTimeout(()=>{document.querySelectorAll(".flying-coin").forEach(e=>e.remove()),e.classList.add("earned","trophy-levelup"),playSound("levelUp"),completedLessons++,setTimeout(startRound,1200)},600+50*t.length)}async function triggerFinalWinSequence(){clearInterval(countdownInterval),bonusScore=1e3*timeLeft,updateScoreDisplay();let e=baseScore+bonusScore;if(currentUser){const t=db.collection("userScores").doc(currentUser.uid);try{const o=await t.get(),n=o.exists&&o.data().scores?.game01?o.data().scores.game01:0;e>n&&(await t.set({scores:{game01:e}},{merge:!0}),displayBestRank())}catch(e){console.error("Score saving failed: ",e)}}const t=getRankForScore(e),o=document.createElement("div");o.className="end-game-animation-container";const n=document.createElement("img");n.src=imageBaseUrl+"icon/"+t.image,n.className="final-rank-medal",o.appendChild(n),document.body.appendChild(o);const a=progressSection.querySelectorAll(".trophy-icon"),i=bestRankDisplay.getBoundingClientRect();a.length>0,a.forEach((e,t)=>{const n=e.getBoundingClientRect(),s=document.createElement("span");s.textContent="🏆",s.className="flying-trophy-endgame",o.appendChild(s),s.style.left=`${n.left}px`,s.style.top=`${n.top}px`,setTimeout(()=>{const e=(i.left+i.width/2)-(n.left+n.width/2),t=(i.top+i.height/2)-(n.top+n.height/2);s.style.transform=`translate(${e}px, ${t}px) scale(0)`,s.style.opacity="0"},100*t),e.style.opacity="0"}),setTimeout(()=>{n.style.left=`${i.left+(i.width/2)-75}px`,n.style.top=`${i.top+(i.height/2)-75}px`,n.classList.add("show"),playSound("win"),setTimeout(()=>{const e=`<h2>ภารกิจสำเร็จ!</h2>\n                                  <div class="final-rank-display"><img src="${imageBaseUrl}icon/${t.image}" alt="${t.rank}"><h3>คุณได้รับ Rank: ${t.rank}</h3></div>\n                                  <p>คะแนนรวม: ${totalScore.toLocaleString()}</p>`,n=createGameOverControls();showPopup(e,n),o.remove()},1500)},1e3+100*a.length)}function getRankForScore(e,t){const o=e/t*100;return o>=60?{rank:"เพชร",image:"diamond.png"}:o>=50?{rank:"ทอง",image:"gold-medal.png"}:o>=40?{rank:"เงิน",image:"silver-Coin.png"}:o>=30?{rank:"ทองแดง",image:"bronze-Medal.png"}:{rank:"เข้าร่วม",image:"neutral.png"}}async function displayBestRank(){if(!currentUser||!bestRankDisplay)return;const e=db.collection("userScores").doc(currentUser.uid);try{const t=await e.get();if(t.exists&&t.data().scores?.game01){const e=t.data().scores.game01,o=getRankForScore(e,MAX_SCORE);bestRankDisplay.innerHTML=`<img src="${imageBaseUrl}icon/${o.image}" title="Rank สูงสุด: ${o.rank}">`}else bestRankDisplay.innerHTML=""}catch(e){console.error("Could not display best rank:",e)}}function handleGameOver(e){clearInterval(countdownInterval),playSound("gameover"),showPopup(`<h2>${e}</h2><p>ลองอีกครั้งนะ!</p>`,createGameOverControls())}function handleScoreGameOver(){clearInterval(countdownInterval),playSound("gameover");const e="<h2>คะแนนหมด!</h2><p>คะแนนของคุณติดลบ เกมจะเริ่มต้นใหม่</p>";showPopup(e,createGameOverControls())}function updateLivesDisplay(){livesDisplay&&(livesDisplay.innerHTML="❤️".repeat(lives)+"💔".repeat(LIVES-lives))}function updateScoreDisplay(){let e=(baseScore||0)+(bonusScore||0);scoreValue&&(scoreValue.textContent=e.toLocaleString())}function updateTimerBar(){if(timerFill){const e=timeLeft/TOTAL_TIME*100;timerFill.style.width=`${e}%`,3===lives?timerFill.style.backgroundColor="#28a745":2===lives?timerFill.style.backgroundColor="#ffc107":timerFill.style.backgroundColor="#dc3545"}}function addCollectedCoin(){const e=document.createElement("img");e.src=`${imageBaseUrl}icon/Coin.png`,e.className="round-coin-img",roundCoinContainer.appendChild(e),setTimeout(()=>e.classList.add("collected"),10)}function removeCollectedCoin(){const e=roundCoinContainer.querySelector(".round-coin-img.collected:last-child");e&&(e.classList.remove("collected"),setTimeout(()=>{e.parentNode&&e.remove()},400))}function showPopup(e,t){popupText&&popupControls&&popup&&(popupText.innerHTML=e,popupControls.innerHTML="",t&&popupControls.appendChild(t),popup.style.display="flex")}function closePopup(){popup&&(popup.style.display="none")}function createGameOverControls(){const e=document.createElement("div");e.style.display="flex",e.style.gap="15px";const t=document.createElement("button");t.textContent="เล่นใหม่",t.className="btn btn-success",t.onclick=restartGame;const o=document.createElement("a");return o.textContent="กลับหน้าหลัก",o.className="btn btn-secondary",o.href="index.html",e.appendChild(t),e.appendChild(o),e}function showLessonPage(){preloadAllGameAudio(()=>{closePopup(),lessonGrid.innerHTML="",allChars.forEach(e=>{const t=document.createElement("div");t.className="lesson-card";const o=document.createElement("img");o.src=e.img;const n=document.createElement("span");n.textContent=e.id,t.appendChild(o),t.appendChild(n),t.onclick=()=>playSound(e.id),lessonGrid.appendChild(t)}),lessonPage.style.display="flex",requestAnimationFrame(calculateLessonLayout)})}function calculateLessonLayout(){if(!lessonGrid.offsetParent)return;const e=lessonPage.querySelector("h2"),t=e?e.offsetHeight+20:0,o=lessonPage.clientWidth-30,n=lessonPage.clientHeight-t-20;let a={cols:0,cardSize:0};for(let e=4;e<=11;e++){const t=Math.ceil(allChars.length/e),i=(o-(e-1)*15)/e,s=(n-(t-1)*15)/t,l=Math.floor(Math.min(i,s));l>a.cardSize&&(a={cols:e,cardSize:l})}lessonGrid.style.gridTemplateColumns=`repeat(${a.cols}, ${a.cardSize}px)`;const i=lessonGrid.querySelectorAll(".lesson-card");i.forEach(e=>{e.style.width=`${a.cardSize}px`,e.style.height=`${a.cardSize}px`;const t=e.querySelector("span");t&&(t.style.fontSize=`${a.cardSize*.3}px`)})}function calculateAndApplyLayout(){if(!gameGrid.offsetParent)return;const e=gameGrid.children.length;if(0===e)return;const t=gameArea.querySelector(".title-container"),o=t?t.offsetHeight+15:0,n=gameArea.clientWidth,a=gameArea.clientHeight-o;let i={cols:0,cardSize:0};for(let t=3;t<=e;t++){const s=Math.ceil(e/t),l=(n-(t-1)*10)/t,r=(a-(s-1)*10)/s,c=Math.floor(Math.min(l,r));c>i.cardSize&&(i={cols:t,cardSize:c})}if(0===i.cols){const t=Math.ceil(Math.sqrt(e)),o=Math.ceil(e/t),s=(n-(t-1)*10)/t,l=(a-(o-1)*10)/o;i.cardSize=Math.floor(Math.min(s,l)),i.cols=t}i.cardSize*=.98,gameGrid.style.gridTemplateColumns=`repeat(${i.cols}, ${i.cardSize}px)`;const s=gameGrid.querySelectorAll(".card");s.forEach(e=>{e.style.width=`${i.cardSize}px`,e.style.height=`${i.cardSize}px`,e.style.fontSize=`${i.cardSize*.5}px`})}


    // --- Event Listeners ---
    // ✅ FIX: กำหนด Event Listener ภายใน DOMContentLoaded
    closeLessonBtn.onclick = () => lessonPage.style.display = 'none';
    profilePicGame.onclick = openSidebar;
    sidebarOverlay.onclick = closeSidebar;
    sidebarCloseBtn.onclick = closeSidebar;
    logoutBtn.onclick = () => auth.signOut();

    // ✅ FIX: ทำให้ฟังก์ชันที่เรียกจาก HTML เป็น Global
    window.startGame = startGame;
    window.restartGame = restartGame;
    window.showLessonPage = showLessonPage;

});