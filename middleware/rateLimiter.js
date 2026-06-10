// middleware/rateLimiter.js
const { rateLimit } = require('express-rate-limit');
const logSecurityEvent = require('../utils/logger');

// Memantau percobaan login berlebih tanpa melakukan Ban IP
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 menit
    max: 5, // Batas wajar
    handler: (req, res, next) => {
        // CATAT KE SECURITY LOG: Terdeteksi Brute Force
        logSecurityEvent('BRUTE_FORCE_WARNING', req.ip, `Mencoba login lebih dari 5 kali. Target username: ${req.body.username || 'unknown'}`);
        
        // PENTING: Lanjutkan ke proses berikutnya (TIDAK DI-BAN)
        next();
    },
    standardHeaders: true, 
    legacyHeaders: false, 
});

module.exports = { loginLimiter };