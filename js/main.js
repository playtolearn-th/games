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

// --- DOM Elements ---
const loadingOverlay = document.getElementById('loading-overlay');
const progressBarFill = document.getElementById('progress-bar-fill');
const progressText = document.getElementById('progress-text');
const lobbyContainer = document.querySelector('.lobby-container');

// --- 2. ตรวจสอบสถานะการล็อกอินของผู้ใช้ ---
auth.onAuthStateChanged(user => {
    if (user) {
        if (localStorage.getItem('assets_preloaded_v4') === 'true') {
            loadingOverlay.style.display = 'none';
            lobbyContainer.style.display = 'block';
            displayUserData(user);
        } else {
            loadingOverlay.style.display = 'flex';
            preloadGameAssets(() => {
                localStorage.setItem('assets_preloaded_v4', 'true');
                loadingOverlay.style.display = 'none';
                lobbyContainer.style.display = 'block';
                displayUserData(user);
            });
        }

        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                auth.signOut();
            });
        }
    } else {
        window.location.href = 'login.html';
    }
});

// --- 3. ฟังก์ชันสำหรับดึงและแสดงข้อมูลผู้ใช้ ---
async function displayUserData(user) {
    const userInfoDiv = document.getElementById('userInfo');
    const scoreSpan = document.querySelector('#scoreDisplay span');
    const profilePic = document.getElementById('profilePic');

    if (profilePic) profilePic.src = user.photoURL || 'https://i.imgur.com/sC22S2A.png';
    if (userInfoDiv) userInfoDiv.textContent = `สวัสดี, ${user.displayName || 'ผู้เล่น'}`;

    const userScoreRef = db.collection('userScores').doc(user.uid);
    try {
        const doc = await userScoreRef.get();
        const bestScore = doc.exists ? (doc.data().bestScore || 0) : 0;
        if (scoreSpan) scoreSpan.textContent = bestScore.toLocaleString();
    } catch (error) {
        console.error("Error fetching score:", error);
        if (scoreSpan) scoreSpan.textContent = 'N/A';
    }
}

// --- 4. ฟังก์ชัน Preloading (เวอร์ชันป้องกันการค้าง) ---
function preloadGameAssets(onComplete) {
    const baseUrl = "./";
    const allCharIds = ["ก", "ข", "ฃ", "ค", "ฅ", "ฆ", "ง", "จ", "ฉ", "ช", "ซ", "ฌ", "ญ", "ฎ", "ฏ", "ฐ", "ฑ", "ฒ", "ณ", "ด", "ต", "ถ", "ท", "ธ", "น", "บ", "ป", "ผ", "ฝ", "พ", "ฟ", "ภ", "ม", "ย", "ร", "ล", "ว", "ศ", "ษ", "ส", "ห", "ฬ", "อ", "ฮ"];
    let assetsToLoad = [];
    allCharIds.forEach(id => assetsToLoad.push({ type: 'image', url: `${baseUrl}${id}.png` }));
    allCharIds.forEach(id => assetsToLoad.push({ type: 'audio', url: `${baseUrl}${id}.mp3` }));

    // --- รายการไฟล์ที่มีอยู่จริงในโปรเจกต์ ---
    const otherAssets = [
        "Coin.png", "diamond.png", "coin.mp3", "coin-upaif.mp3", "error.mp3",
        "game-over.mp3", "goodresult.mp3", "hover.mp3", "mouse-click.mp3",
        "round-clear.mp3"
    ];
    // --- จบรายการไฟล์ ---

    otherAssets.forEach(asset => assetsToLoad.push({ type: asset.endsWith('.png') ? 'image' : 'audio', url: `${baseUrl}${asset}` }));

    let loadedCount = 0;
    const totalAssets = assetsToLoad.length;
    if (totalAssets === 0) {
        onComplete();
        return;
    }

    const updateProgress = () => {
        loadedCount++;
        const percentage = Math.round((loadedCount / totalAssets) * 100);
        if (progressBarFill) progressBarFill.style.width = `${percentage}%`;
        if (progressText) progressText.textContent = `${percentage}%`;
    };

    const promises = assetsToLoad.map(asset => {
        return new Promise((resolve) => {
            const handleLoad = () => {
                updateProgress();
                resolve();
            };

            if (asset.type === 'image') {
                const img = new Image();
                img.src = asset.url;
                img.onload = handleLoad;
                img.onerror = () => {
                    console.warn(`Could not load image: ${asset.url}`);
                    handleLoad();
                };
            } else if (asset.type === 'audio') {
                fetch(asset.url)
                    .then(response => {
                        if (response.ok) return response.blob();
                        throw new Error(`Failed to fetch: ${asset.url}`);
                    })
                    .then(blob => handleLoad())
                    .catch(error => {
                        console.warn(error);
                        handleLoad();
                    });
            }
        });
    });

    Promise.all(promises).then(() => {
        console.log("All assets processed.");
        setTimeout(onComplete, 500);
    });
}