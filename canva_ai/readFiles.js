const fs = require('fs');
const path = require('path');

const folderPath = '.'; 
const outputFileName = 'file_list.txt'; // ชื่อไฟล์ที่จะบันทึก

fs.readdir(folderPath, (err, files) => {
    if (err) {
        console.error('ไม่สามารถอ่านโฟลเดอร์ได้:', err);
        return;
    }

    // นำชื่อไฟล์ทั้งหมดมาต่อกันโดยขึ้นบรรทัดใหม่
    const fileContent = files.join('\n');

    // บันทึกรายชื่อลงในไฟล์
    fs.writeFile(outputFileName, fileContent, (err) => {
        if (err) {
            console.error('เกิดข้อผิดพลาดในการบันทึกไฟล์:', err);
            return;
        }
        // path.resolve() ใช้เพื่อแสดงตำแหน่งที่อยู่เต็มๆ ของไฟล์ที่บันทึก
        console.log(`✅ บันทึกรายชื่อไฟล์เรียบร้อยแล้วที่: ${path.resolve(outputFileName)}`);
    });
});