// utils/logger.js
const fs = require('fs');
const path = require('path');

// Buat file security.log di folder utama project
const logStream = fs.createWriteStream(path.join(__dirname, '../security.log'), { flags: 'a' });

const logSecurityEvent = (eventType, ip, details) => {
    // Format waktu lokal (WIB)
    const timestamp = new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });
    
    // Format log: [WAKTU] [JENIS_KEJADIAN] [IP] - [DETAIL]
    const logMessage = `[${timestamp}] [${eventType}] IP: ${ip} - ${details}\n`;
    
    // Tulis ke file security.log
    logStream.write(logMessage);
    
    // Tampilkan juga di terminal (opsional, untuk memudahkan pantauan saat presentasi)
    console.log(`🛡️ ${logMessage.trim()}`);
};

module.exports = logSecurityEvent;