// middleware/rateLimiter.js
const { rateLimit } = require('express-rate-limit');

// Membatasi percobaan login (Maksimal 5 kali per 15 menit)
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 5, 
    message: 'Terlalu banyak percobaan login dari IP ini, silakan coba lagi setelah 15 menit.',
    standardHeaders: true, 
    legacyHeaders: false, 
});

module.exports = { loginLimiter };