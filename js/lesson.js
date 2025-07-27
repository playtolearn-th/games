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
// const auth = firebase.auth(); // ตัวแปรนี้ไม่ได้ถูกเรียกใช้โดยตรงในการตรวจสอบสถานะล็อกอินแล้ว จึงคอมเมนต์ออก

// ใช้ DOMContentLoaded เพื่อให้แน่ใจว่า DOM โหลดเสร็จสมบูรณ์ก่อนทำงาน
document.addEventListener('DOMContentLoaded', function() { // เมื่อ DOM โหลดเสร็จสิ้น
    // --- DOM Elements ---
    const lessonPage = document.getElementById('lesson-page'); // อ้างอิงถึง element 'lesson-page'
    const lessonGrid = document.getElementById('lesson-grid'); // อ้างอิงถึง element 'lesson-grid' (พื้นที่แสดงการ์ด)
    const prevImgBtn = document.getElementById('prevImgBtn'); // อ้างอิงถึงปุ่มรูปภาพ 'ก่อนหน้า'
    const nextImgBtn = document.getElementById('nextImgBtn'); // อ้างอิงถึงปุ่มรูปภาพ 'ถัดไป'

    // เพิ่มการตรวจสอบ DOM elements ที่จำเป็นเมื่อเริ่มต้นสคริปต์
    if (!lessonPage || !lessonGrid || !prevImgBtn || !nextImgBtn) { // ตรวจสอบว่าองค์ประกอบหลักอยู่ครบถ้วนหรือไม่
        console.error("Essential DOM elements not found. Cannot initialize lesson page."); // แสดงข้อผิดพลาดในคอนโซล
        // แสดงข้อความแจ้งเตือนผู้ใช้บนหน้าจอหากองค์ประกอบไม่สมบูรณ์
        document.body.innerHTML = '<p style="text-align: center; color: red; font-size: 1.5em;">เกิดข้อผิดพลาดในการโหลดหน้าบทเรียน: ส่วนประกอบหน้าจอไม่สมบูรณ์</p>';
        throw new Error("Missing DOM elements"); // หยุดการทำงานของสคริปต์
    }


    // --- Audio Caching System ---
    let audioCache = {}; // Object สำหรับเก็บไฟล์เสียงที่โหลดแล้ว
    let isAudioPreloaded = false; // Flag เพื่อตรวจสอบว่าโหลดเสียงครบแล้วหรือยัง
    const baseUrl = "./"; // Base URL สำหรับไฟล์ asset (รูปภาพและเสียง)

    // ID ของพยัญชนะไทยทั้งหมด
    const allCharIds = ["ก", "ข", "ฃ", "ค", "ฅ", "ฆ", "ง", "จ", "ฉ", "ช", "ซ", "ฌ", "ญ", "ฎ", "ฏ", "ฐ", "ฑ", "ฒ", "ณ", "ด", "ต", "ถ", "ท", "ธ", "น", "บ", "ป", "ผ", "ฝ", "พ", "ฟ", "ภ", "ม", "ย", "ร", "ล", "ว", "ศ", "ษ", "ส", "ห", "ฬ", "อ", "ฮ"];
    // สร้าง Array ของ Object ที่มี id พยัญชนะและ path รูปภาพ
    const allChars = allCharIds.map(id => ({ id: id, img: `${baseUrl}${id}.png` }));

    let currentCardIndex = 0; // Index ของการ์ดที่กำลังแสดงอยู่

    // --- Event Listeners ---
    prevImgBtn.onclick = showPrevCard; // กำหนดฟังก์ชันเมื่อคลิกปุ่ม 'ก่อนหน้า'
    nextImgBtn.onclick = showNextCard; // กำหนดฟังก์ชันเมื่อคลิกปุ่ม 'ถัดไป'

    // เพิ่ม Event Listener สำหรับการปรับขนาดหน้าจอ เพื่อเรียก showCard ใหม่ให้การ์ดปรับขนาดตาม
    window.addEventListener('resize', () => requestAnimationFrame(() => showCard(currentCardIndex)));

    // --- Audio Preloading and Playback Functions ---
    function preloadAllGameAudio(callback) { // ฟังก์ชันสำหรับโหลดไฟล์เสียงทั้งหมดล่วงหน้า
        if (isAudioPreloaded) { // ถ้าโหลดไว้แล้ว
            if (callback) callback(); // เรียก callback ทันที
            return; // ออกจากฟังก์ชัน
        }
        const audioFiles = {}; // Object สำหรับเก็บชื่อไฟล์เสียง
        allCharIds.forEach(id => audioFiles[id] = `${id}.mp3`); // เพิ่มไฟล์เสียงของพยัญชนะทั้งหมด

        const audioKeys = Object.keys(audioFiles); // ได้คีย์ (ชื่อไฟล์) ของเสียงทั้งหมด
        const totalAudio = audioKeys.length; // จำนวนไฟล์เสียงทั้งหมด
        let loadedCount = 0; // ตัวนับไฟล์ที่โหลดเสร็จแล้ว

        if (lessonGrid) { // ถ้า lessonGrid มีอยู่
            // แสดงข้อความกำลังโหลดเสียงบนหน้าจอ
            lessonGrid.innerHTML = '<h2 style="color: #00796b; text-align: center; width: 100%;">กำลังโหลดเสียง...</h2>';
        }
        console.log(`Starting audio preloading for ${totalAudio} files.`); // แสดงในคอนโซล

        if (totalAudio === 0) { // ถ้าไม่มีไฟล์เสียงให้โหลด
            isAudioPreloaded = true; // ตั้งค่าสถานะเป็นโหลดแล้ว
            if (callback) callback(); // เรียก callback ทันที
            return; // ออกจากฟังก์ชัน
        }

        audioKeys.forEach(key => { // วนลูปโหลดไฟล์เสียงแต่ละไฟล์
            const url = `${baseUrl}${audioFiles[key]}`; // สร้าง URL ของไฟล์เสียง
            fetch(url) // ใช้ Fetch API โหลดไฟล์
                .then(response => response.ok ? response.blob() : Promise.reject(`Error loading ${url}`)) // ตรวจสอบ response และแปลงเป็น blob
                .then(blob => { // เมื่อโหลดสำเร็จ
                    const blobUrl = URL.createObjectURL(blob); // สร้าง Object URL จาก blob
                    audioCache[key] = new Audio(blobUrl); // เก็บ Audio object ไว้ใน cache
                    console.log(`Loaded audio: ${key}`); // แสดงในคอนโซล
                })
                .catch(error => { // หากโหลดไฟล์ไม่สำเร็จ
                    console.warn(`Could not load audio ${key} (${url}):`, error); // แสดงคำเตือนในคอนโซล
                })
                .finally(() => { // ไม่ว่าจะสำเร็จหรือไม่ก็ตาม
                    loadedCount++; // เพิ่มตัวนับไฟล์ที่โหลดเสร็จ
                    console.log(`Preloaded: ${loadedCount}/${totalAudio}`); // แสดงสถานะความคืบหน้า
                    if (loadedCount === totalAudio) { // ถ้าโหลดครบทุกไฟล์
                        isAudioPreloaded = true; // ตั้งค่าสถานะเป็นโหลดแล้ว
                        console.log("All audio assets processed."); // แสดงในคอนโซลเมื่อโหลดครบ
                        // ใช้ setTimeout เพื่อให้แน่ใจว่า DOM มีเวลาอัปเดตหลังจากแสดงข้อความโหลดก่อนที่จะแสดงการ์ด
                        setTimeout(callback, 50); 
                    }
                });
        });
    }

    function playSound(soundKey) { // ฟังก์ชันสำหรับเล่นเสียง
        if (audioCache[soundKey]) { // ถ้าไฟล์เสียงอยู่ใน cache
            audioCache[soundKey].currentTime = 0; // ตั้งเวลาเล่นกลับไปเริ่มต้น
            audioCache[soundKey].play().catch(e => console.warn("Audio playback prevented:", e)); // เล่นเสียงและดักจับ error การเล่นอัตโนมัติ
        } else { // ถ้าไฟล์เสียงไม่อยู่ใน cache
            console.warn(`Audio for key "${soundKey}" not in cache.`); // แสดงคำเตือน
        }
    }

    // --- Lesson Page Functions ---
    function showCard(index = currentCardIndex) { // ฟังก์ชันสำหรับแสดงการ์ดพยัญชนะ
        if (!lessonGrid) { // ตรวจสอบว่า lessonGrid มีอยู่หรือไม่
            console.error("lessonGrid element not found in showCard."); // แสดงข้อผิดพลาด
            return; // ออกจากฟังก์ชัน
        }

        if (allChars.length === 0) { // หากไม่มีข้อมูลพยัญชนะ
            lessonGrid.innerHTML = '<p style="text-align: center; color: #555; font-size: 1.2em;">ไม่มีข้อมูลพยัญชนะสำหรับแสดง.</p>'; // แสดงข้อความ
            prevImgBtn.classList.add('disabled'); // ปิดใช้งานปุ่ม 'ก่อนหน้า'
            nextImgBtn.classList.add('disabled'); // ปิดใช้งานปุ่ม 'ถัดไป'
            return; // ออกจากฟังก์ชัน
        }

        if (index < 0) index = 0; // ปรับ index ไม่ให้ต่ำกว่า 0
        if (index >= allChars.length) index = allChars.length - 1; // ปรับ index ไม่ให้เกินจำนวนพยัญชนะ
        currentCardIndex = index; // อัปเดต index ของการ์ดปัจจุบัน

        lessonGrid.innerHTML = ''; // ล้างเนื้อหาการ์ดเดิม

        const char = allChars[currentCardIndex]; // ดึงข้อมูลพยัญชนะปัจจุบัน
        if (!char) { // หากไม่พบข้อมูลพยัญชนะ
            lessonGrid.innerHTML = '<p style="text-align: center; color: red; font-size: 1.2em;">เกิดข้อผิดพลาด: ไม่พบข้อมูลพยัญชนะ</p>'; // แสดงข้อความผิดพลาด
            updateNavigationButtons(); // อัปเดตสถานะปุ่มนำทาง
            return; // ออกจากฟังก์ชัน
        }

        const card = document.createElement('div'); // สร้าง div สำหรับการ์ด
        card.className = 'lesson-card'; // กำหนด class
        
        const text = document.createElement('span'); // สร้าง span สำหรับตัวอักษรพยัญชนะ
        text.textContent = char.id; // กำหนดข้อความตัวอักษร
        
        const img = document.createElement('img'); // สร้าง img สำหรับรูปภาพ
        img.src = char.img; // กำหนด source รูปภาพ
        img.alt = char.id; // กำหนด alt text

        card.appendChild(text); // เพิ่มตัวอักษรลงในการ์ด (อยู่ด้านซ้าย/บน)
        card.appendChild(img); // เพิ่มรูปภาพลงในการ์ด (อยู่ด้านขวา/ล่าง)
        
        card.onclick = () => playSound(char.id); // กำหนดฟังก์ชันเมื่อคลิกการ์ด (เล่นเสียงซ้ำ)
        lessonGrid.appendChild(card); // เพิ่มการ์ดลงใน lessonGrid
        console.log(`Displaying card for: ${char.id}`); // แสดงในคอนโซล
        
        playSound(char.id); // เล่นเสียงทันทีเมื่อการ์ดปรากฏ

        updateNavigationButtons(); // อัปเดตสถานะปุ่มนำทาง
    }

    function showNextCard() { // ฟังก์ชันสำหรับแสดงการ์ดถัดไป
        if (currentCardIndex < allChars.length - 1) { // ถ้าไม่ใช่การ์ดสุดท้าย
            currentCardIndex++; // เพิ่ม index
            showCard(); // แสดงการ์ดใหม่
        }
    }

    function showPrevCard() { // ฟังก์ชันสำหรับแสดงการ์ดก่อนหน้า
        if (currentCardIndex > 0) { // ถ้าไม่ใช่การ์ดแรก
            currentCardIndex--; // ลด index
            showCard(); // แสดงการ์ดใหม่
        }
    }

    function updateNavigationButtons() { // ฟังก์ชันสำหรับอัปเดตสถานะปุ่มนำทาง
        if (prevImgBtn) { // ถ้าปุ่ม 'ก่อนหน้า' มีอยู่
            if (currentCardIndex === 0) { // ถ้าอยู่การ์ดแรก
                prevImgBtn.classList.add('disabled'); // เพิ่ม class 'disabled'
            } else {
                prevImgBtn.classList.remove('disabled'); // ลบ class 'disabled'
            }
        }
        if (nextImgBtn) { // ถ้าปุ่ม 'ถัดไป' มีอยู่
            if (currentCardIndex === allChars.length - 1) { // ถ้าอยู่การ์ดสุดท้าย
                nextImgBtn.classList.add('disabled'); // เพิ่ม class 'disabled'
            } else {
                nextImgBtn.classList.remove('disabled'); // ลบ class 'disabled'
            }
        }
    }

    // เรียกใช้ preloadAllGameAudio โดยตรงเมื่อ DOM โหลดเสร็จสิ้น (ไม่ต้องตรวจสอบล็อกอิน)
    console.log("Starting lesson page without authentication check."); // แสดงในคอนโซล
    preloadAllGameAudio(() => { // เริ่มโหลดไฟล์เสียงทั้งหมด
        console.log("Audio preloading complete. Showing first card."); // แสดงในคอนโซลเมื่อโหลดเสร็จ
        showCard(0); // แสดงการ์ดใบแรกหลังจากโหลดเสียงเสร็จสิ้น
    });
}); // สิ้นสุด DOMContentLoaded listener