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

// --- 2. ฟังก์ชันแสดงผลคะแนน ---
async function displayUserScores(user) {
    const scoreElement = document.getElementById('score-display-game01'); 
    
    if (!user || !scoreElement) {
        if (scoreElement) scoreElement.textContent = "N/A";
        return;
    }

    try {
        const userScoreRef = db.collection("userScores").doc(user.uid);
        const doc = await userScoreRef.get();

        if (doc.exists && doc.data().scores?.game01) {
            const score = doc.data().scores.game01;
            scoreElement.textContent = `คะแนนสูงสุด: ${score.toLocaleString()}`;
        } else {
            scoreElement.textContent = "ยังไม่มีคะแนน";
        }
    } catch (error) {
        console.error("เกิดข้อผิดพลาดในการดึงข้อมูลคะแนน:", error);
        scoreElement.textContent = "โหลดไม่ได้";
    }
}

// --- 3. ตรวจสอบสถานะการล็อกอิน และแสดงผลข้อมูลผู้ใช้ ---
document.addEventListener('DOMContentLoaded', () => {
    auth.onAuthStateChanged(user => {
        const profilePic = document.getElementById('profile-pic');
        const userName = document.getElementById('user-name');
        const logoutBtn = document.getElementById('logout-btn');

        if (user) {
            // ✅ ส่วนสำคัญ: กำหนดรูปโปรไฟล์และชื่อผู้ใช้
            const photoURL = user.photoURL || 'images/icon/default-profile.png'; // ใช้รูปสำรองถ้าไม่มี
            const displayName = user.displayName || user.email.split('@')[0];
            
            if (profilePic) profilePic.src = photoURL;
            if (userName) userName.textContent = displayName;
            
            if (logoutBtn) {
                logoutBtn.style.display = 'block';
                logoutBtn.onclick = () => auth.signOut();
            }

            displayUserScores(user);
        } else {
            // ถ้าผู้ใช้ยังไม่ได้ล็อกอิน ให้ไปที่หน้า login
            window.location.href = 'login.html';
        }
    });
});