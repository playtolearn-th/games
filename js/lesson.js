// --- Firebase Initialization ---
// กำหนดค่าคอนฟิกูเรชันสำหรับ Firebase
const firebaseConfig = {
    apiKey: "AIzaSyCmKRzrsXDhHtbmhG56jM-0OYqp3YvXc48", // คีย์ API สำหรับโปรเจกต์ Firebase ของคุณ
    authDomain: "playtolearn-e3356.firebaseapp.com", // โดเมนสำหรับ Authentication
    projectId: "playtolearn-e3356", // ID โปรเจกต์ Firebase
    storageBucket: "playtolearn-e3356.firebasestorage.app", // Bucket สำหรับจัดเก็บไฟล์
    messagingSenderId: "233629701249", // ID ผู้ส่งข้อความ
    appId: "1:233629701249:web:5ee775473bc00be1566980", // ID แอปพลิเคชัน Firebase
    measurementId: "G-SXMFQT0TLG" // ID การวัดผล (Google Analytics)
};

// เริ่มต้น Firebase ด้วยค่าคอนฟิกูเรชัน
firebase.initializeApp(firebaseConfig);

// ใช้ DOMContentLoaded เพื่อให้แน่ใจว่า DOM โหลดเสร็จสมบูรณ์ก่อนทำงาน
document.addEventListener('DOMContentLoaded', function() {
    // --- DOM Elements ---
    const lessonPage = document.getElementById('lesson-page');
    const lessonGrid = document.getElementById('lesson-grid');
    const prevImgBtn = document.getElementById('prevImgBtn');
    const nextImgBtn = document.getElementById('nextImgBtn');

    // ตรวจสอบว่าองค์ประกอบหลักอยู่ครบถ้วนหรือไม่
    if (!lessonPage || !lessonGrid || !prevImgBtn || !nextImgBtn) {
        console.error("Essential DOM elements not found. Cannot initialize lesson page.");
        document.body.innerHTML = '<p style="text-align: center; color: red; font-size: 1.5em;">เกิดข้อผิดพลาดในการโหลดหน้าบทเรียน: ส่วนประกอบหน้าจอไม่สมบูรณ์</p>';
        throw new Error("Missing DOM elements");
    }

    // --- State and Caching System ---
    let audioCache = {}; // Object สำหรับเก็บไฟล์เสียงที่โหลดแล้ว (เป็น Audio Object)
    let isPreloading = false; // Flag ป้องกันการโหลดซ้ำซ้อน
    const baseUrl = "./"; // Base URL สำหรับไฟล์ asset
    
    // ID ของพยัญชนะไทยทั้งหมด
    const allCharIds = ["ก", "ข", "ฃ", "ค", "ฅ", "ฆ", "ง", "จ", "ฉ", "ช", "ซ", "ฌ", "ญ", "ฎ", "ฏ", "ฐ", "ฑ", "ฒ", "ณ", "ด", "ต", "ถ", "ท", "ธ", "น", "บ", "ป", "ผ", "ฝ", "พ", "ฟ", "ภ", "ม", "ย", "ร", "ล", "ว", "ศ", "ษ", "ส", "ห", "ฬ", "อ", "ฮ"];
    
    // สร้าง Array ของ Object ที่มี id, path รูปภาพ และจะเพิ่ม blob url เข้าไปทีหลัง
    const allChars = allCharIds.map(id => ({
        id: id,
        imgSrc: `${baseUrl}${id}.png`, // Path ดั้งเดิมของรูปภาพ
        audioSrc: `${baseUrl}${id}.mp3`, // Path ดั้งเดิมของเสียง
        imgBlobUrl: null // จะถูกเติมค่าหลังจากการโหลดล่วงหน้า
    }));

    let currentCardIndex = 0; // Index ของการ์ดที่กำลังแสดง

    // --- Event Listeners ---
    prevImgBtn.onclick = showPrevCard;
    nextImgBtn.onclick = showNextCard;
    window.addEventListener('resize', () => requestAnimationFrame(() => showCard(currentCardIndex)));


    // --- Asset Preloading and Playback ---

    /**
     * โหลดไฟล์เสียงและรูปภาพทั้งหมดล่วงหน้าโดยใช้ Fetch API
     * เพื่อเก็บเป็น Blob URL ป้องกันการดาวน์โหลดโดยตรงและให้โหลดเสร็จก่อนเริ่ม
     * @param {Function} callback - ฟังก์ชันที่จะเรียกใช้เมื่อโหลดทุกอย่างเสร็จสิ้น
     */
    function preloadAllAssets(callback) {
        if (isPreloading || allChars.every(char => char.imgBlobUrl && audioCache[char.id])) {
            if (callback) callback();
            return;
        }
        isPreloading = true;

        lessonGrid.innerHTML = '<h2 style="color: #00796b; text-align: center; width: 100%;">กำลังเตรียมข้อมูล...</h2>';
        console.log(`Starting asset preloading for ${allChars.length * 2} files.`);

        const assetPromises = [];

        allChars.forEach(char => {
            // สร้าง Promise สำหรับโหลดไฟล์เสียง
            assetPromises.push(
                fetch(char.audioSrc)
                    .then(response => {
                        if (!response.ok) throw new Error(`Network response was not ok for audio: ${char.id}`);
                        return response.blob();
                    })
                    .then(blob => {
                        const blobUrl = URL.createObjectURL(blob);
                        audioCache[char.id] = new Audio(blobUrl);
                    })
                    .catch(error => console.warn(`Could not load audio for ${char.id}:`, error))
            );

            // สร้าง Promise สำหรับโหลดไฟล์รูปภาพ
            assetPromises.push(
                fetch(char.imgSrc)
                    .then(response => {
                        if (!response.ok) throw new Error(`Network response was not ok for image: ${char.id}`);
                        return response.blob();
                    })
                    .then(blob => {
                        // เก็บ Blob URL ที่สร้างขึ้นไว้ใน object ของพยัญชนะนั้นๆ
                        char.imgBlobUrl = URL.createObjectURL(blob);
                    })
                    .catch(error => console.warn(`Could not load image for ${char.id}:`, error))
            );
        });

        // Promise.allSettled จะรอให้ทุก promise ทำงานเสร็จ (ไม่ว่าจะสำเร็จหรือล้มเหลว)
        Promise.allSettled(assetPromises).then(() => {
            console.log("All asset preloading has been settled.");
            isPreloading = false;
            // ใช้ setTimeout เล็กน้อยเพื่อให้ UI ลื่นไหลขึ้น
            setTimeout(callback, 100);
        });
    }

    function playSound(soundKey) {
        if (audioCache[soundKey]) {
            audioCache[soundKey].currentTime = 0;
            audioCache[soundKey].play().catch(e => console.warn("Audio playback prevented:", e));
        } else {
            console.warn(`Audio for key "${soundKey}" not in cache or failed to load.`);
        }
    }


    // --- Lesson Page Functions ---

    function showCard(index = currentCardIndex) {
        if (!lessonGrid) return;
        if (allChars.length === 0) {
            lessonGrid.innerHTML = '<p>ไม่มีข้อมูลพยัญชนะสำหรับแสดง.</p>';
            prevImgBtn.classList.add('disabled');
            nextImgBtn.classList.add('disabled');
            return;
        }

        if (index < 0) index = 0;
        if (index >= allChars.length) index = allChars.length - 1;
        currentCardIndex = index;

        lessonGrid.innerHTML = '';

        const char = allChars[currentCardIndex];
        if (!char) {
            lessonGrid.innerHTML = '<p>เกิดข้อผิดพลาด: ไม่พบข้อมูลพยัญชนะ</p>';
            updateNavigationButtons();
            return;
        }

        const card = document.createElement('div');
        card.className = 'lesson-card';
        
        const text = document.createElement('span');
        text.textContent = char.id;
        
        const img = document.createElement('img');
        
        // --- จุดสำคัญ: ใช้ Blob URL ที่โหลดไว้ล่วงหน้า ---
        // หาก imgBlobUrl โหลดไม่สำเร็จ (เป็น null) จะกลับไปใช้ path เดิมเพื่อป้องกัน error
        img.src = char.imgBlobUrl || char.imgSrc;
        img.alt = char.id;

        card.appendChild(text);
        card.appendChild(img);
        
        card.onclick = () => playSound(char.id);
        lessonGrid.appendChild(card);
        console.log(`Displaying card for: ${char.id}`);
        
        playSound(char.id);
        updateNavigationButtons();
    }

    function showNextCard() {
        if (currentCardIndex < allChars.length - 1) {
            currentCardIndex++;
            showCard();
        }
    }

    function showPrevCard() {
        if (currentCardIndex > 0) {
            currentCardIndex--;
            showCard();
        }
    }

    function updateNavigationButtons() {
        if (prevImgBtn) {
            prevImgBtn.classList.toggle('disabled', currentCardIndex === 0);
        }
        if (nextImgBtn) {
            nextImgBtn.classList.toggle('disabled', currentCardIndex === allChars.length - 1);
        }
    }

    // --- Initialization ---
    console.log("Starting lesson page without authentication check.");
    // เรียกใช้ฟังก์ชันโหลดข้อมูลทั้งหมด
    preloadAllAssets(() => {
        console.log("All assets preloaded. Showing the first card.");
        // เมื่อโหลดเสร็จแล้ว จึงแสดงการ์ดใบแรก
        showCard(0);
    });
});