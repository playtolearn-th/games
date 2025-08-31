// js/firebase-init.js
(function () {
  // ป้องกันกรณีโหลดไฟล์นี้ก่อน SDK
  if (typeof firebase === 'undefined') {
    console.error('Firebase SDK ยังไม่ถูกโหลดก่อน firebase-init.js');
    return;
  }

  // ใช้ config นี้ (storageBucket ต้องเป็น *.appspot.com)
  const firebaseConfig = {
    apiKey: "AIzaSyCmKRzrsXDhHtbmhG56jM-0OYqp3YvXc48",
    authDomain: "playtolearn-e3356.firebaseapp.com",
    projectId: "playtolearn-e3356",
    storageBucket: "playtolearn-e3356.appspot.com",
    messagingSenderId: "233629701249",
    appId: "1:233629701249:web:5ee775473bc00be1566980",
    measurementId: "G-SXMFQT0TLG"
  };

  // init ครั้งเดียว
  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }

  // ให้จำสถานะล็อกอินไว้ในเบราว์เซอร์
  firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL).catch(() => {});

  // (ออปชัน) ถ้าอยากให้ไฟล์อื่นเรียกใช้ง่ายๆ
  // window.FB = { auth: firebase.auth(), db: firebase.firestore() };
})();
