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
let currentUser = null;

// --- 2. DOM Elements ---
const loadingOverlay = document.getElementById('loading-overlay');
const progressBarFill = document.getElementById('progress-bar-fill');
const progressText = document.getElementById('progress-text');
const lobbyContainer = document.querySelector('.lobby-container');
const profilePic = document.getElementById('profilePic');
const userInfo = document.getElementById('userInfo');
const scoreDisplay = document.getElementById('scoreDisplay').querySelector('span');
const game01RankDisplay = document.getElementById('game01-rank-display');
const logoutBtn = document.getElementById('logoutBtn');

// --- 3. ค่าคงที่ของเกม (เพื่อให้สอดคล้องกับ game01.js) ---
const MAX_SCORE_GAME01 = 180440;
const imageBaseUrl = "images/"; // Path สำหรับรูปภาพ Rank

// --- 4. ตรวจสอบสถานะการล็อกอิน ---
auth.onAuthStateChanged(user => {
    if (user) {
        currentUser = user;
        // เริ่มโหลดข้อมูลสำหรับล็อบบี้
        loadLobbyData(user);
    } else {
        // ถ้าผู้ใช้ไม่ได้ล็อกอิน ให้เปลี่ยนเส้นทางไปหน้า login.html
        window.location.href = 'login.html';
    }
});

// --- 5. ฟังก์ชันหลักสำหรับโหลดข้อมูลล็อบบี้ ---
async function loadLobbyData(user) {
    // แสดงหน้าจอโหลด
    updateProgress(10, 'กำลังตรวจสอบข้อมูลผู้ใช้...');

    // ตั้งค่าข้อมูลโปรไฟล์พื้นฐาน
    const photoURL = user.photoURL || 'https://i.imgur.com/sC22S2A.png';
    const displayName = user.displayName || user.email.split('@')[0];

    profilePic.src = photoURL;
    userInfo.innerHTML = `สวัสดี, <strong>${displayName}</strong>!`;

    updateProgress(40, 'กำลังดึงข้อมูลคะแนน...');

    // ดึงข้อมูลคะแนนจาก Firestore
    try {
        const userScoreRef = db.collection('userScores').doc(user.uid);
        const doc = await userScoreRef.get();

        let totalScore = 0;
        let game01Score = 0;

        if (doc.exists && doc.data().scores) {
            const scores = doc.data().scores;
            // คำนวณคะแนนรวม (ถ้ามีเกมอื่นในอนาคต)
            totalScore = Object.values(scores).reduce((sum, score) => sum + score, 0);
            game01Score = scores.game01 || 0;
        }

        updateProgress(70, 'กำลังคำนวณ Rank...');

        // แสดงผลคะแนนรวม
        scoreDisplay.textContent = totalScore.toLocaleString();

        // แสดงผล Rank ของเกมที่ 1
        const rankGame01 = getRankForScore(game01Score, MAX_SCORE_GAME01);
        if (game01Score > 0) {
            game01RankDisplay.innerHTML = `<img src="${imageBaseUrl}${rankGame01.image}" alt="${rankGame01.rank}" class="rank-medal-lobby" title="Rank: ${rankGame01.rank}">`;
        } else {
            // ถ้ายังไม่มีคะแนน อาจจะแสดงเป็นรูปว่างๆ หรือข้อความ
            game01RankDisplay.innerHTML = `<img src="${imageBaseUrl}neutral.png" alt="ยังไม่มี Rank" class="rank-medal-lobby" title="ยังไม่ได้เล่น">`;
        }

        updateProgress(100, 'เตรียมพร้อมสำเร็จ!');

        // ซ่อนหน้าจอโหลดและแสดงล็อบบี้
        setTimeout(() => {
            loadingOverlay.style.display = 'none';
            lobbyContainer.style.display = 'block';
        }, 500);

    } catch (error) {
        console.error("เกิดข้อผิดพลาดในการโหลดข้อมูล:", error);
        userInfo.textContent = "ไม่สามารถโหลดข้อมูลได้";
        loadingOverlay.style.display = 'none';
        lobbyContainer.style.display = 'block';
    }
}

// --- 6. ฟังก์ชันเสริม ---

/**
 * คำนวณ Rank จากคะแนน (เหมือนกับใน game01.js)
 * @param {number} score คะแนนที่ได้
 * @param {number} maxScore คะแนนสูงสุดของเกมนั้น
 * @returns {{rank: string, image: string}} Object ที่มีชื่อ Rank และชื่อไฟล์รูปภาพ
 */
function getRankForScore(score, maxScore) {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 60) return { rank: 'เพชร', image: 'diamond.png' };
    if (percentage >= 50) return { rank: 'ทอง', image: 'gold-medal.png' };
    if (percentage >= 40) return { rank: 'เงิน', image: 'silver-Coin.png' };
    if (percentage >= 30) return { rank: 'ทองแดง', image: 'bronze-Medal.png' };
    return { rank: 'เข้าร่วม', image: 'neutral.png' };
}

/**
 * อัปเดตแถบความคืบหน้าการโหลด
 * @param {number} percentage เปอร์เซ็นต์ที่โหลด
 * @param {string} text ข้อความที่แสดง
 */
function updateProgress(percentage, text) {
    if (progressBarFill) progressBarFill.style.width = `${percentage}%`;
    if (progressText) progressText.textContent = `${percentage}%`;
    // สามารถเพิ่มข้อความสถานะได้ถ้าต้องการ
    // const progressStatus = document.querySelector('.loading-box p');
    // if (progressStatus) progressStatus.textContent = text;
}


// --- 7. Event Listeners ---
logoutBtn.addEventListener('click', () => {
    auth.signOut();
});
