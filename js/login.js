/* login.js — Firebase Auth (Email/Password + Google) + Firestore user profile
 * - รวมข้อมูลผู้ใช้ไว้ที่เดียว (users/{uid})
 * - ถ้าไม่มีรูปโปรไฟล์ (photoURL) จะกำหนด avatarEmoji แบบ "สุ่มคงที่" จาก uid
 * - รองรับ fallback Google: Popup → Redirect
 * - แปล error เป็นไทย + มี helper redirect ด้วย ?redirect=
 * ใช้ร่วมกับ Firebase compat SDK v9.x (app-compat, auth-compat, firestore-compat)
 */

/* =========================
 * 1) Firebase Config (ของครู)
 * ========================= */
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
const db = firebase.firestore();

// ให้ session อยู่ในแท็บนี้ (เปลี่ยนเป็น LOCAL หากต้องการจำข้ามการปิดเบราว์เซอร์)
auth.setPersistence(firebase.auth.Auth.Persistence.SESSION).catch(console.warn);


/* ============================================
 * 2) Emoji Pool (single-codepoint เป็นหลัก)
 *    เน้นอิโมจิพื้นฐานที่ “ขึ้นทุกแพลตฟอร์ม”
 *    (ใบหน้าคน/สัตว์/ผลไม้/วัตถุ/สัญลักษณ์)
 * ============================================ */
const EMOJI_POOL = [
  "😀", "😃", "😄", "😁", "😆", "😊", "🙂", "😉", "😌", "😍",
  "😘", "😗", "😙", "😚", "😋", "😜", "🤪", "😝", "🫠", "🤗",
  "🤩", "🥳", "😎", "🤓", "😺", "😸", "😹", "😻", "😼", "🙀",
  "🐵", "🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼", "🐨",
  "🐯", "🦁", "🐮", "🐷", "🐸", "🐵", "🐔", "🐣", "🐧", "🦆",
  "🐦", "🦉", "🦇", "🐺", "🦄", "🐴", "🐢", "🐍", "🦎", "🦖",
  "🐙", "🦑", "🦐", "🦀", "🐟", "🐠", "🐡", "🐬", "🐳", "🐋",
  "🌸", "🌼", "🌻", "🌺", "🌷", "🌹", "🌞", "🌝", "⭐", "🌟",
  "🌈", "⚡", "🔥", "❄️", "💧", "☂️", "🌊", "⛰️", "🏝️", "🌆",
  "🍎", "🍊", "🍋", "🍌", "🍉", "🍇", "🍓", "🍒", "🍍", "🥭",
  "🥝", "🍑", "🍐", "🍅", "🥕", "🌽", "🥔", "🍞", "🧀", "🍗",
  "🍕", "🍔", "🌭", "🍟", "🌮", "🌯", "🥙", "🍱", "🍣", "🍤",
  "🍪", "🍩", "🍰", "🧁", "🍫", "🍬", "🍭", "🍨", "🍦", "🥤",
  "☕", "🧃", "🧋", "🧉", "🫖", "🍵", "🍻", "🥂", "🍹", "🍸",
  "🎈", "🎉", "🎊", "🎁", "🎂", "🧸", "🎨", "🎵", "🎶", "🎤",
  "🎧", "🎹", "🥁", "🎸", "🎺", "🎻", "⚽", "🏀", "🏈", "⚾",
  "🎾", "🏐", "🏓", "🏸", "🥅", "🥇", "🥈", "🥉", "🏆", "🛼",
  "🚲", "🛴", "🛹", "🪁", "✏️", "📚", "📖", "🖍️", "🧩", "🧮",
  "🧠", "💡", "🔎", "🔧", "🧰", "🧪", "🔬", "🔭", "🧭", "🗺️",
  "💎", "💰", "🪙", "⚙️", "🧱", "🪵", "🧵", "🧶", "🧷", "📌",
  "📎", "📐", "📏", "🔗", "✂️", "📦", "📫", "📮", "🖊️", "🖋️",
  "📅", "📆", "🕰️", "⏰", "⏱️", "⏳", "🔋", "🔌", "💾", "💿",
  "🖥️", "🖨️", "⌨️", "🖱️", "💻", "📱", "📷", "🎥", "📺", "📻",
  "🏠", "🏫", "🏥", "🏟️", "🏖️", "🎡", "🎢", "🎠", "🗽", "⛩️",
  "📣", "📯", "🔔", "🔒", "🔓", "🔑", "🧲", "🪄", "🪀", "🪄"
];

/* ==============================
 * 3) Emoji จาก uid แบบ "คงที่"
 * ============================== */
function djb2(str) {
  let h = 5381;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) + h) + str.charCodeAt(i);
  }
  return Math.abs(h);
}
function pickDeterministicEmoji(key) {
  const idx = djb2(key) % EMOJI_POOL.length;
  return EMOJI_POOL[idx];
}


/* =======================
 * 4) Helper UI/Utilities
 * ======================= */
const $ = (sel) => document.querySelector(sel);
const alertBox = $("#alert");
const loginForm = $("#loginForm");
const registerForm = $("#registerForm");
const loginBtn = $("#loginBtn");
const registerBtn = $("#registerBtn");
const googleBtn = $("#googleBtn");

function showAlert(type, msg) {
  if (!alertBox) { alert(msg); return; }
  alertBox.className = `alert alert-${type}`;
  alertBox.textContent = msg;
  alertBox.classList.remove("d-none");
}
function hideAlert() {
  if (!alertBox) return;
  alertBox.className = "alert d-none";
  alertBox.textContent = "";
}
document.addEventListener("input", hideAlert);

function setLoading(formEl, isLoading) {
  if (!formEl) return;
  formEl.classList.toggle("is-loading", !!isLoading);
  formEl.querySelectorAll("button,input,select").forEach(el => el.disabled = !!isLoading);
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
    "auth/operation-not-supported-in-this-environment": "การทำงานนี้ไม่รองรับในสภาพแวดล้อมปัจจุบัน",
    "auth/operation-not-allowed": "ผู้ให้บริการนี้ยังไม่ได้เปิดใช้งานใน Firebase Console (Auth → Sign-in method)",
    "auth/network-request-failed": "เครือข่ายขัดข้อง กรุณาลองใหม่",
    "auth/unauthorized-domain": "โดเมนนี้ยังไม่อยู่ใน Authorized domains ของ Firebase",
    "auth/too-many-requests": "พยายามหลายครั้งเกินไป กรุณาลองใหม่ภายหลัง",
  };
  return map[code] || message || "เกิดข้อผิดพลาด";
}

// อ่าน redirect จาก URL เช่น login.html?redirect=/games/index.html
function getRedirectPath() {
  const url = new URL(window.location.href);
  const r = url.searchParams.get("redirect");
  if (r && r.startsWith("/")) return r;
  // คำนวณ base ของไฟล์ปัจจุบัน (รองรับเว็บใต้โฟลเดอร์ เช่น /games/)
  const base = window.location.pathname.replace(/\/[^/]*$/, "/");
  return base + "index.html";
}


/* ============================================
 * 5) รวมศูนย์ข้อมูลผู้ใช้ใน Firestore (users/{uid})
 *    - ถ้ามี photoURL: เก็บ photoURL และ avatarEmoji = null
 *    - ถ้าไม่มี photoURL: สร้าง avatarEmoji แบบคงที่ตาม uid
 *    - ถ้ามีเอกสารอยู่แล้วและมี avatarEmoji แล้ว จะคงเดิม
 * ============================================ */
async function ensureUserDoc(user, extra = {}) {
  if (!user) return;
  const ref = db.collection("users").doc(user.uid);
  const snap = await ref.get();

  const providerIds = (user.providerData || []).map(p => p?.providerId).filter(Boolean);
  const now = firebase.firestore.FieldValue.serverTimestamp();

  let baseEmoji = pickDeterministicEmoji(user.uid);
  if (snap.exists && snap.data()?.avatarEmoji) {
    baseEmoji = snap.data().avatarEmoji; // คงอิโมจิเดิม
  }

  await ref.set({
    uid: user.uid,
    email: user.email || null,
    displayName: user.displayName || (user.email ? user.email.split("@")[0] : null),
    photoURL: user.photoURL || null,                 // ถ้า null ฝั่ง UI ใช้ avatarEmoji แทน
    avatarEmoji: user.photoURL ? null : baseEmoji,   // ไม่มีรูป → ใช้ emoji
    providerIds,
    lastLoginAt: now,
    createdAt: snap.exists ? (snap.data().createdAt || now) : now,
    ...extra
  }, { merge: true });
}


/* ======================================
 * 6) onAuthStateChanged → redirect อัตโนมัติ
 * ====================================== */
auth.onAuthStateChanged(async (user) => {
  if (user) {
    try { await ensureUserDoc(user); } catch (e) { console.warn("ensureUserDoc error:", e); }
    window.location.replace(getRedirectPath());
  }
});


/* ==========================
 * 7) Register (Email/Password)
 * ========================== */
async function register() {
  hideAlert();
  const form = registerForm;
  setLoading(form, true);

  const name = $("#register-name")?.value?.trim() || "";
  const email = $("#register-email")?.value?.trim() || "";
  const password = $("#register-password")?.value || "";
  const confirm = $("#register-confirm-password")?.value || "";

  if (password !== confirm) {
    showAlert("warning", "รหัสผ่านและยืนยันรหัสผ่านไม่ตรงกัน");
    setLoading(form, false);
    return;
  }

  try {
    const cred = await auth.createUserWithEmailAndPassword(email, password);
    if (name) { await cred.user.updateProfile({ displayName: name }); }
    await ensureUserDoc(cred.user, { role: "student" });
    // onAuthStateChanged จะ redirect ให้อยู่แล้ว
  } catch (err) {
    if (err.code === "auth/email-already-in-use") {
      showAlert("warning", "อีเมลนี้ถูกใช้ลงทะเบียนแล้ว กรุณาเข้าสู่ระบบ");
      // สลับไปแท็บ Login พร้อมใส่อีเมลให้
      $("#login-tab")?.click();
      $("#login-email") && ($("#login-email").value = email);
      $("#login-password")?.focus();
    } else {
      showAlert("danger", translateError(err.code, err.message));
    }
  } finally {
    setLoading(form, false);
  }
}


/* =======================
 * 8) Login (Email/Password)
 * ======================= */
async function login() {
  hideAlert();
  const form = loginForm;
  setLoading(form, true);

  const email = $("#login-email")?.value?.trim() || "";
  const password = $("#login-password")?.value || "";

  try {
    const cred = await auth.signInWithEmailAndPassword(email, password);
    await ensureUserDoc(cred.user); // อัปเดตข้อมูลล่าสุด
    // onAuthStateChanged จะ redirect ให้อยู่แล้ว
  } catch (err) {
    showAlert("danger", translateError(err.code, err.message));
  } finally {
    setLoading(form, false);
  }
}


/* ===========================
 * 9) Google Sign-In (Popup→Redirect)
 * =========================== */
async function loginWithGoogle() {
  hideAlert();
  const form = loginForm;
  setLoading(form, true);

  try {
    const provider = new firebase.auth.GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });

    // ลอง popup ก่อน
    const cred = await auth.signInWithPopup(provider);
    await ensureUserDoc(cred.user);
    // onAuthStateChanged จะ redirect ให้อยู่แล้ว
  } catch (err) {
    console.warn("Popup sign-in failed, trying redirect:", err?.code || err);
    const fallbackCodes = new Set([
      "auth/popup-blocked",
      "auth/cancelled-popup-request",
      "auth/popup-closed-by-user",
      "auth/unauthorized-domain",
      "auth/operation-not-supported-in-this-environment",
      "auth/operation-not-allowed"
    ]);
    if (fallbackCodes.has(err?.code)) {
      try {
        const provider = new firebase.auth.GoogleAuthProvider();
        provider.setCustomParameters({ prompt: "select_account" });
        await auth.signInWithRedirect(provider);
        return; // กลับจาก redirect แล้ว onAuthStateChanged จะทำงานเอง
      } catch (err2) {
        showAlert("danger", translateError(err2.code, err2.message));
      }
    } else {
      showAlert("danger", translateError(err.code, err.message));
    }
  } finally {
    setLoading(form, false);
  }
}


/* ====================================
 * 10) ผูกอีเวนต์ให้ฟอร์ม/ปุ่ม (เผื่อไม่มี onsubmit ใน HTML)
 * ==================================== */
loginForm?.addEventListener("submit", (e) => { e.preventDefault(); login(); });
registerForm?.addEventListener("submit", (e) => { e.preventDefault(); register(); });
googleBtn?.addEventListener("click", () => loginWithGoogle());
