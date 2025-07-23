// --- 1. การตั้งค่า Firebase ---
// (ใช้ firebaseConfig object เดียวกันกับที่คุณมีในโปรเจกต์เดิม)
const firebaseConfig = {
    apiKey: "AIzaSyCmKRzrsXDhHtbmhG56jM-0OYqp3YvXc48",
    authDomain: "playtolearn-e3356.firebaseapp.com",
    projectId: "playtolearn-e3356",
    storageBucket: "playtolearn-e3356.firebasestorage.app",
    messagingSenderId: "233629701249",
    appId: "1:233629701249:web:5ee775473bc00be1566980",
    measurementId: "G-SXMFQT0TLG"
};

// เริ่มต้นการเชื่อมต่อกับ Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();


// --- 2. ตรวจสอบสถานะการล็อกอินของผู้ใช้ ---
auth.onAuthStateChanged(user => {
    if (user) {
        // --- ถ้าผู้ใช้ล็อกอินอยู่ ---
        console.log("User is logged in:", user.uid);
        displayUserData(user); // เรียกฟังก์ชันเพื่อแสดงข้อมูล

        // ทำให้ปุ่ม Logout ใช้งานได้
        const logoutBtn = document.getElementById('logoutBtn');
        logoutBtn.addEventListener('click', () => {
            auth.signOut().then(() => {
                console.log("User logged out");
                // onAuthStateChanged จะทำงานอีกครั้งและส่งไปหน้า login เอง
            }).catch(error => {
                console.error("Logout Error:", error);
            });
        });

    } else {
        // --- ถ้าผู้ใช้ยังไม่ได้ล็อกอิน ---
        console.log("User is not logged in. Redirecting to login page.");
        // ส่งผู้ใช้ไปที่หน้า login.html (เราจะต้องสร้างหน้านี้ต่อไป)
        window.location.href = 'login.html';
    }
});


// --- 3. ฟังก์ชันสำหรับดึงและแสดงข้อมูลผู้ใช้ ---
async function displayUserData(user) {
    const userInfoDiv = document.getElementById('userInfo');
    const scoreSpan = document.querySelector('#scoreDisplay span');

    // แสดงชื่อผู้ใช้
    userInfoDiv.textContent = `สวัสดี, ${user.displayName || 'ผู้เล่น'}`;

    // ดึงคะแนนจาก Firestore
    const userScoreRef = db.collection('userScores').doc(user.uid);
    try {
        const doc = await userScoreRef.get();

        if (doc.exists) {
            // ถ้ามีข้อมูลคะแนนอยู่แล้ว ให้นำมาแสดง
            // เราจะแสดง bestScore เป็นคะแนนรวมในหน้าล็อบบี้
            const bestScore = doc.data().bestScore || 0;
            scoreSpan.textContent = bestScore;
        } else {
            // ถ้าเป็นผู้เล่นใหม่ที่ยังไม่มีข้อมูลคะแนน ให้แสดงเป็น 0
            scoreSpan.textContent = '0';
        }
    } catch (error) {
        console.error("Error fetching score:", error);
        scoreSpan.textContent = 'N/A';
    }
}