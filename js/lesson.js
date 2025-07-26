// --- Firebase Initialization ---
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

// --- DOM Elements ---
const lessonPage = document.getElementById('lesson-page');
const lessonGrid = document.getElementById('lesson-grid');
const closeLessonBtn = document.getElementById('close-lesson-btn');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');

// เพิ่มการตรวจสอบ DOM elements ที่จำเป็น
if (!lessonPage || !lessonGrid || !closeLessonBtn || !prevBtn || !nextBtn) {
    console.error("Essential DOM elements not found. Cannot initialize lesson page.");
    document.body.innerHTML = '<p style="text-align: center; color: red; font-size: 1.5em;">เกิดข้อผิดพลาดในการโหลดหน้าบทเรียน: ส่วนประกอบหน้าจอไม่สมบูรณ์</p>';
    throw new Error("Missing DOM elements");
}


// --- Audio Caching System ---
let audioCache = {};
let isAudioPreloaded = false;
const baseUrl = "./";

const allCharIds = ["ก", "ข", "ฃ", "ค", "ฅ", "ฆ", "ง", "จ", "ฉ", "ช", "ซ", "ฌ", "ญ", "ฎ", "ฏ", "ฐ", "ฑ", "ฒ", "ณ", "ด", "ต", "ถ", "ท", "ธ", "น", "บ", "ป", "ผ", "ฝ", "พ", "ฟ", "ภ", "ม", "ย", "ร", "ล", "ว", "ศ", "ษ", "ส", "ห", "ฬ", "อ", "ฮ"];
const allChars = allCharIds.map(id => ({ id: id, img: `${baseUrl}${id}.png` }));

let currentCardIndex = 0;

// --- Event Listeners ---
closeLessonBtn.onclick = () => {
    window.location.href = 'game01.html';
};

prevBtn.onclick = showPrevCard;
nextBtn.onclick = showNextCard;

window.addEventListener('resize', () => requestAnimationFrame(() => showCard(currentCardIndex)));

// --- Audio Preloading and Playback Functions ---
function preloadAllGameAudio(callback) {
    if (isAudioPreloaded) {
        if (callback) callback();
        return;
    }
    const audioFiles = {};
    allCharIds.forEach(id => audioFiles[id] = `${id}.mp3`);

    const audioKeys = Object.keys(audioFiles);
    const totalAudio = audioKeys.length;
    let loadedCount = 0;

    if (lessonGrid) {
        lessonGrid.innerHTML = '<h2 style="color: #00796b; text-align: center; width: 100%;">กำลังโหลดเสียง...</h2>';
    }
    console.log(`Starting audio preloading for ${totalAudio} files.`);

    if (totalAudio === 0) {
        isAudioPreloaded = true;
        if (callback) callback();
        return;
    }

    audioKeys.forEach(key => {
        const url = `${baseUrl}${audioFiles[key]}`;
        fetch(url)
            .then(response => response.ok ? response.blob() : Promise.reject(`Error loading ${url}`))
            .then(blob => {
                const blobUrl = URL.createObjectURL(blob);
                audioCache[key] = new Audio(blobUrl);
                console.log(`Loaded audio: ${key}`);
            })
            .catch(error => {
                console.warn(`Could not load audio ${key} (${url}):`, error);
            })
            .finally(() => {
                loadedCount++;
                console.log(`Preloaded: ${loadedCount}/${totalAudio}`);
                if (loadedCount === totalAudio) {
                    isAudioPreloaded = true;
                    console.log("All audio assets processed.");
                    setTimeout(callback, 50); 
                }
            });
    });
}

function playSound(soundKey) {
    if (audioCache[soundKey]) {
        audioCache[soundKey].currentTime = 0;
        audioCache[soundKey].play().catch(e => console.warn("Audio playback prevented:", e));
    } else {
        console.warn(`Audio for key "${soundKey}" not in cache.`);
    }
}

// --- Lesson Page Functions ---
function showCard(index = currentCardIndex) {
    if (!lessonGrid) {
        console.error("lessonGrid element not found in showCard.");
        return;
    }

    if (allChars.length === 0) {
        lessonGrid.innerHTML = '<p style="text-align: center; color: #555; font-size: 1.2em;">ไม่มีข้อมูลพยัญชนะสำหรับแสดง.</p>';
        prevBtn.disabled = true;
        nextBtn.disabled = true;
        return;
    }

    if (index < 0) index = 0;
    if (index >= allChars.length) index = allChars.length - 1;
    currentCardIndex = index;

    lessonGrid.innerHTML = ''; // Clear previous card content

    const char = allChars[currentCardIndex];
    if (!char) {
        lessonGrid.innerHTML = '<p style="text-align: center; color: red; font-size: 1.2em;">เกิดข้อผิดพลาด: ไม่พบข้อมูลพยัญชนะ</p>';
        updateNavigationButtons();
        return;
    }

    const card = document.createElement('div');
    card.className = 'lesson-card';
    
    const text = document.createElement('span');
    text.textContent = char.id;
    
    const img = document.createElement('img');
    img.src = char.img;
    img.alt = char.id;

    // เพิ่มพยัญชนะก่อน แล้วตามด้วยรูปภาพ
    card.appendChild(text); 
    card.appendChild(img);
    
    card.onclick = () => playSound(char.id); // ยังคงให้คลิกเพื่อเล่นเสียงซ้ำได้
    lessonGrid.appendChild(card);
    console.log(`Displaying card for: ${char.id}`);
    
    // เล่นเสียงทันทีเมื่อการ์ดปรากฏ
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
    if (prevBtn) prevBtn.disabled = (currentCardIndex === 0);
    if (nextBtn) nextBtn.disabled = (currentCardIndex === allChars.length - 1);
}

// --- Initial setup on page load ---
auth.onAuthStateChanged(user => {
    if (user) {
        console.log("User authenticated. Starting preloading.");
        preloadAllGameAudio(() => {
            console.log("Audio preloading complete. Showing first card.");
            showCard(0); // Show the first card after preloading
        });
    } else {
        console.log("User not authenticated. Redirecting to login.");
        window.location.href = 'login.html';
    }
});