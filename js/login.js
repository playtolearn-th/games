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

// --- 2. ตรวจสอบสถานะการล็อกอิน ---
// หน้านี้มีหน้าที่ตรงข้ามกับ main.js
auth.onAuthStateChanged(user => {
  if (user) {
    // ถ้าผู้ใช้ล็อกอินอยู่แล้ว ให้ส่งกลับไปหน้าหลัก (index.html) ทันที
    console.log("User is already logged in. Redirecting to lobby.");
    window.location.href = 'index.html';
  }
  // ถ้าผู้ใช้ยังไม่ล็อกอิน ก็ไม่ต้องทำอะไร ให้แสดงฟอร์มตามปกติ
});

// --- 3. ฟังก์ชันสำหรับการลงทะเบียนและเข้าสู่ระบบ ---

async function register() {
  const name = document.getElementById('register-name').value;
  const email = document.getElementById('register-email').value;
  const password = document.getElementById('register-password').value;
  const confirmPassword = document.getElementById('register-confirm-password').value;

  if (password !== confirmPassword) {
    alert("รหัสผ่านไม่ตรงกัน กรุณาลองใหม่อีกครั้ง");
    return;
  }

  try {
    const userCredential = await auth.createUserWithEmailAndPassword(email, password);
    await userCredential.user.updateProfile({
      displayName: name
    });
    // เมื่อลงทะเบียนสำเร็จ onAuthStateChanged จะทำงานและส่งไปหน้า index.html
  } catch (error) {
    console.error("Error registering:", error);
    alert("เกิดข้อผิดพลาดในการลงทะเบียน: " + error.message);
  }
}

async function login() {
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;

  try {
    await auth.signInWithEmailAndPassword(email, password);
    // เมื่อล็อกอินสำเร็จ onAuthStateChanged จะทำงานและส่งไปหน้า index.html
  } catch (error) {
    console.error("Error logging in:", error);
    alert("อีเมลหรือรหัสผ่านไม่ถูกต้อง: " + error.message);
  }
}

async function loginWithGoogle() {
  try {
    const provider = new firebase.auth.GoogleAuthProvider();
    await auth.signInWithPopup(provider);
    // เมื่อล็อกอินสำเร็จ onAuthStateChanged จะทำงานและส่งไปหน้า index.html
  } catch (error) {
    console.error("Error with Google login:", error);
    alert("เกิดข้อผิดพลาดในการล็อกอินด้วย Google: " + error.message);
  }
}