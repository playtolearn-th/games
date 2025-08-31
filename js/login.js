/* js/login.js — Firebase Auth (Email/Password + Google)
 * มี: แปล error ไทย, redirect ด้วย ?redirect=, สลับแท็บไป "เข้าสู่ระบบ" อัตโนมัติเมื่ออีเมลซ้ำ
 * ใช้ compat SDK เพื่อเข้ากันกับโค้ดเดิม
 */

// --- 1. การตั้งค่า Firebase (จากโปรเจ็กต์ของครู) ---
const firebaseConfig = {
  apiKey: "AIzaSyCmKRzrsXDhHtbmhG56jM-0OYqp3YvXc48",
  authDomain: "playtolearn-e3356.firebaseapp.com",
  projectId: "playtolearn-e3356",
  storageBucket: "playtolearn-e3356.firebasestorage.app",
  messagingSenderId: "233629701249",
  appId: "1:233629701249:web:5ee775473bc00be1566980",
  measurementId: "G-SXMFQT0TLG"
};
if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

// ตั้งค่า session ให้คงอยู่ในแท็บ (เปลี่ยนเป็น LOCAL ก็ได้)
// firebase.auth.Auth.Persistence.LOCAL, SESSION, NONE
auth.setPersistence(firebase.auth.Auth.Persistence.SESSION).catch(console.warn);

// --- 2. Helper DOM/Utils ---
const $ = (sel) => document.querySelector(sel);
const alertBox = $("#alert");
const loginForm = $("#loginForm");
const registerForm = $("#registerForm");
const loginBtn = $("#loginBtn");
const registerBtn = $("#registerBtn");
const googleBtn = $("#googleBtn");

function showAlert(type, msg) {
  alertBox.className = `alert alert-${type}`;
  alertBox.textContent = msg;
  alertBox.classList.remove("d-none");
}
function hideAlert() {
  alertBox.className = "alert d-none";
  alertBox.textContent = "";
}
document.addEventListener("input", () => hideAlert());

document.querySelectorAll("[data-toggle='pw']").forEach((eye) => {
  eye.addEventListener("click", () => {
    const target = document.querySelector(eye.dataset.target);
    if (!target) return;
    target.type = target.type === "password" ? "text" : "password";
  });
});

function setLoading(formEl, isLoading) {
  if (!formEl) return;
  const btns = formEl.querySelectorAll("button, input, select");
  btns.forEach((b) => (b.disabled = !!isLoading));
  formEl.classList.toggle("is-loading", !!isLoading);
}

function translateError(code, message) {
  const map = {
    "auth/invalid-email": "อีเมลไม่ถูกต้อง",
    "auth/user-disabled": "บัญชีถูกระงับการใช้งาน",
    "auth/user-not-found": "ไม่พบบัญชีผู้ใช้",
    "auth/wrong-password": "รหัสผ่านไม่ถูกต้อง",
    "auth/weak-password": "รหัสผ่านสั้นเกินไป (อย่างน้อย 6 ตัวอักษร)",
    "auth/email-already-in-use": "อีเมลนี้ถูกใช้ลงทะเบียนแล้ว",
    "auth/popup-closed-by-user": "ปิดหน้าต่างก่อนทำรายการเสร็จ",
    "auth/cancelled-popup-request": "กำลังเปิดหน้าต่างเข้าสู่ระบบอยู่",
    "auth/popup-blocked": "เบราว์เซอร์บล็อกป๊อปอัป กรุณาอนุญาต",
    "auth/network-request-failed": "เครือข่ายขัดข้อง กรุณาลองใหม่",
    "auth/quota-exceeded": "โควต้าเกินกำหนด กรุณาลองใหม่ภายหลัง",
    "auth/too-many-requests": "พยายามหลายครั้งเกินไป กรุณาลองใหม่ภายหลัง",
  };
  return map[code] || message || "เกิดข้อผิดพลาด";
}

// อ่านค่า redirect จาก URL เช่น login.html?redirect=/games/index.html
function getRedirectPath() {
  const url = new URL(window.location.href);
  const r = url.searchParams.get("redirect");
  return r && r.startsWith("/") ? r : "index.html";
}

// --- 3. ตรวจสถานะผู้ใช้: ถ้าล็อกอินอยู่แล้วให้ไปหน้า redirect ---
auth.onAuthStateChanged(user => {
  if (user) {
    // ถ้าต้องการบังคับยืนยันอีเมลก่อนเข้าใช้งาน:
    // if (!user.emailVerified) { showAlert("warning","กรุณายืนยันอีเมลก่อนใช้งาน"); return; }
    window.location.replace(getRedirectPath());
  }
});

// --- 4. Register (อีเมล/รหัสผ่าน) ---
async function register() {
  hideAlert();
  setLoading(registerForm, true);

  const name = $("#register-name").value.trim();
  const email = $("#register-email").value.trim();
  const password = $("#register-password").value;
  const confirmPassword = $("#register-confirm-password").value;

  if (password !== confirmPassword) {
    showAlert("warning", "รหัสผ่านและยืนยันรหัสผ่านไม่ตรงกัน");
    setLoading(registerForm, false);
    return;
  }

  try {
    const cred = await auth.createUserWithEmailAndPassword(email, password);
    await cred.user.updateProfile({ displayName: name });

    // ส่งอีเมลยืนยัน (ไม่บังคับ แต่อยากแนะนำ)
    try { await cred.user.sendEmailVerification(); } catch (_) { }

    showAlert("success", "สร้างบัญชีสำเร็จ! กำลังเข้าสู่ระบบ…");
    // onAuthStateChanged จะ redirect ให้อยู่แล้ว
  } catch (error) {
    if (error.code === "auth/email-already-in-use") {
      showAlert("warning", "อีเมลนี้ถูกใช้ลงทะเบียนแล้ว กรุณาเข้าสู่ระบบแทน หรือเลือกอีเมลใหม่");
      // สลับไปแท็บ "เข้าสู่ระบบ" อัตโนมัติ
      $("#login-tab")?.click();
      // เติมอีเมลให้ด้วยเพื่อสะดวก
      $("#login-email").value = email;
      $("#login-password").focus();
    } else if (error.code === "auth/weak-password") {
      showAlert("warning", "รหัสผ่านสั้นเกินไป ต้องมีอย่างน้อย 6 ตัวอักษร");
    } else if (error.code === "auth/invalid-email") {
      showAlert("warning", "รูปแบบอีเมลไม่ถูกต้อง");
    } else {
      showAlert("danger", translateError(error.code, error.message));
    }
  } finally {
    setLoading(registerForm, false);
  }
}

// --
