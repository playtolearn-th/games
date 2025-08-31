<!-- ใส่ในทุกหน้าที่ต้องใช้ Firebase ก่อนสคริปต์อื่นๆ -->
<script src="https://www.gstatic.com/firebasejs/9.6.0/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/9.6.0/firebase-auth-compat.js"></script>
<script>
  (function(){
    const firebaseConfig = {
      apiKey: "AIzaSyCmKRzrsXDhHtbmhG56jM-0OYqp3YvXc48",
      authDomain: "playtolearn-e3356.firebaseapp.com",
      projectId: "playtolearn-e3356",
      storageBucket: "playtolearn-e3356.appspot.com",
      messagingSenderId: "233629701249",
      appId: "1:233629701249:web:5ee775473bc00be1566980",
      measurementId: "G-SXMFQT0TLG"
    };
    if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
    firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL).catch(()=>{});
  })();
</script>
