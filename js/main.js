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

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// --- 3. ค่าคงที่ของเกม ---
const MAX_SCORE_GAME01 = 180440;
const MAX_SCORE_LESSON03 = 12080; // เพิ่มคะแนนสูงสุดของบทที่ 3
const imageBaseUrl = "images/"; // Path สำหรับรูปภาพ Rank


// --- 6. ฟังก์ชันเสริม ---
function getRankForScore(score, maxScore) {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 60) return { rank: 'เพชร', image: 'diamond.png' };
    if (percentage >= 50) return { rank: 'ทอง', image: 'gold-medal.png' };
    if (percentage >= 40) return { rank: 'เงิน', image: 'silver-Coin.png' };
    if (percentage >= 30) return { rank: 'ทองแดง', image: 'bronze-Medal.png' };
    return { rank: 'เข้าร่วม', image: 'neutral.png' };
}

function updateProgress(percentage, text) {
    const progressBarFill = document.getElementById('progress-bar-fill');
    const progressText = document.getElementById('progress-text');
    if (progressBarFill) progressBarFill.style.width = `${percentage}%`;
    if (progressText) progressText.textContent = `${percentage}%`;
}

// --- Main execution logic ---
document.addEventListener('DOMContentLoaded', () => {
    // --- 2. DOM Elements ---
    const loadingOverlay = document.getElementById('loading-overlay');
    const lobbyContainer = document.querySelector('.lobby-container');
    const profilePic = document.getElementById('profilePic');
    const userInfo = document.getElementById('userInfo');
    const scoreDisplay = document.getElementById('scoreDisplay').querySelector('span');
    const game01RankDisplay = document.getElementById('game01-rank-display');
    const lesson3RankDisplay = document.getElementById('lesson3-rank-display');
    const logoutBtn = document.getElementById('logoutBtn');

    let currentUser = null;

    // --- 5. ฟังก์ชันหลักสำหรับโหลดข้อมูลล็อบบี้ ---
    async function loadLobbyData(user) {
        updateProgress(10, 'กำลังตรวจสอบข้อมูลผู้ใช้...');

        const photoURL = user.photoURL || 'https://i.imgur.com/sC22S2A.png';
        const displayName = user.displayName || user.email.split('@')[0];

        if (profilePic) profilePic.src = photoURL;
        if (userInfo) userInfo.innerHTML = `สวัสดี, <strong>${displayName}</strong>!`;

        updateProgress(40, 'กำลังดึงข้อมูลคะแนน...');

        try {
            const userScoreRef = db.collection('userScores').doc(user.uid);
            const doc = await userScoreRef.get();

            let totalScore = 0;
            let game01Score = 0;
            let lesson3Score = 0;

            if (doc.exists && doc.data().scores) {
                const scores = doc.data().scores;
                totalScore = Object.values(scores).reduce((sum, score) => sum + score, 0);
                game01Score = scores.game01 || 0;
                lesson3Score = scores.lesson3 || 0;
            }

            updateProgress(70, 'กำลังคำนวณ Rank...');

            if (scoreDisplay) scoreDisplay.textContent = totalScore.toLocaleString();

            // แสดงผล Rank ของเกมที่ 1
            const rankGame01 = getRankForScore(game01Score, MAX_SCORE_GAME01);
            if (game01RankDisplay) {
                if (game01Score > 0) {
                    game01RankDisplay.innerHTML = `<img src="${imageBaseUrl}${rankGame01.image}" alt="${rankGame01.rank}" class="rank-medal-lobby" title="Rank: ${rankGame01.rank}">`;
                } else {
                    game01RankDisplay.innerHTML = `<img src="${imageBaseUrl}neutral.png" alt="ยังไม่มี Rank" class="rank-medal-lobby" title="ยังไม่ได้เล่น">`;
                }
            }

            // แสดงผล Rank ของบทที่ 3
            const rankLesson03 = getRankForScore(lesson3Score, MAX_SCORE_LESSON03);
            if (lesson3RankDisplay) {
                if (lesson3Score > 0) {
                    lesson3RankDisplay.innerHTML = `<img src="${imageBaseUrl}${rankLesson03.image}" alt="${rankLesson03.rank}" class="rank-medal-lobby" title="Rank: ${rankLesson03.rank}">`;
                } else {
                    lesson3RankDisplay.innerHTML = `<img src="${imageBaseUrl}neutral.png" alt="ยังไม่มี Rank" class="rank-medal-lobby" title="ยังไม่ได้เล่น">`;
                }
            }

            updateProgress(100, 'เตรียมพร้อมสำเร็จ!');

            setTimeout(() => {
                if (loadingOverlay) loadingOverlay.style.display = 'none';
                if (lobbyContainer) lobbyContainer.style.display = 'block';
            }, 500);

        } catch (error) {
            console.error("เกิดข้อผิดพลาดในการโหลดข้อมูล:", error);
            if (userInfo) userInfo.textContent = "ไม่สามารถโหลดข้อมูลได้";
            if (loadingOverlay) loadingOverlay.style.display = 'none';
            if (lobbyContainer) lobbyContainer.style.display = 'block';
        }
    }

    // --- 7. Event Listeners ---
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            auth.signOut();
        });
    }

    // --- 4. ตรวจสอบสถานะการล็อกอิน ---
    auth.onAuthStateChanged(user => {
        if (user) {
            currentUser = user;
            loadLobbyData(user);
        } else {
            window.location.href = 'login.html';
        }
    });
});
