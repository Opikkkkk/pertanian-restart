// routes/authRoutes.js
const express = require('express');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const db = require('../config/db');
const { loginLimiter } = require('../middleware/rateLimiter');
const logSecurityEvent = require('../utils/logger'); // <-- IMPORT LOGGER

const router = express.Router();

// Tampilkan form login
router.get('/login', (req, res) => {
    if (req.session.userId) return res.redirect('/dashboard');
    res.render('login', { error: null });
});

// Proses login dengan Rate Limiter (Mode Pantau) dan Validasi Input
router.post('/login', loginLimiter, [
    body('username').trim().isAlphanumeric().withMessage('Username hanya boleh huruf dan angka').escape(),
    body('password').trim().notEmpty().withMessage('Password tidak boleh kosong')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        logSecurityEvent('INVALID_INPUT', req.ip, `Input login mengandung karakter ilegal. Username: ${req.body.username}`);
        return res.render('login', { error: errors.array()[0].msg });
    }

    const { username, password } = req.body;

    try {
        const [users] = await db.execute('SELECT * FROM users WHERE username = ?', [username]);
        
        if (users.length === 0) {
            // CATAT LOG: Username tidak ada (indikasi scanning)
            logSecurityEvent('FAILED_LOGIN', req.ip, `Username tidak ditemukan: ${username}`);
            return res.render('login', { error: 'Username atau password salah' });
        }

        const user = users[0];
        
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            // CATAT LOG: Password salah (indikasi menebak password)
            logSecurityEvent('FAILED_LOGIN', req.ip, `Password salah untuk target: ${username}`);
            return res.render('login', { error: 'Username atau password salah' });
        }

        // CATAT LOG: Login berhasil
        logSecurityEvent('SUCCESS_LOGIN', req.ip, `Berhasil masuk sebagai: ${username}`);

        req.session.userId = user.id;
        req.session.username = user.username;
        req.session.role = user.role;

        res.redirect('/dashboard');
    } catch (err) {
        console.error(err);
        res.status(500).send('Terjadi kesalahan pada server');
    }
});

// Proses logout
router.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        res.redirect('/login');
    });
});

module.exports = router;