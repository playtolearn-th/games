<script>
(function(){
  // กันลูป: ถ้าอยู่หน้า index หรือ login ไม่ต้องวิ่ง gate
  const path = location.pathname.toLowerCase();
  if (path.endsWith('/index.html') || path.endsWith('/login.html') || path === '/' ) return;

  const auth = firebase.auth();
  // ใช้ onAuthStateChanged ครั้งเดียวเพื่อเช็คสถานะเร็วๆ แล้วตัดสินใจ
  const unsub = auth.onAuthStateChanged(function(user){
    unsub(); // เลิกฟังทันทีเพื่อกันยิงซ้ำ
    if (!user) {
      const here = location.href;
      const idx = new URL('index.html', location.href).href;
      // ส่งไป index พร้อมพารามฯ redirect ชี้กลับมาหน้านี้
      location.replace(idx + (idx.includes('?') ? '&' : '?') + 'redirect=' + encodeURIComponent(here));
    }
    // ถ้า user มีค่า ก็ปล่อยให้โหลดเพจต่อได้ตามปกติ
  });
})();
</script>
