// routes/panenRoutes.js
const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../config/db');
const { isAuthenticated, authorizeRole } = require('../middleware/auth');
const upload = require('../middleware/upload');
const logSecurityEvent = require('../utils/logger');

const router = express.Router();

// Tampilkan Dashboard (RBAC diterapkan di query)
router.get('/dashboard', isAuthenticated, async (req, res) => {
    try {
        let query = '';
        let params = [];

        // Admin melihat semua data, Petani hanya melihat data miliknya
        if (req.session.role === 'admin') {
            query = `SELECT panen.*, users.username FROM panen 
                     JOIN users ON panen.user_id = users.id ORDER BY tanggal DESC`;
        } else {
            query = `SELECT * FROM panen WHERE user_id = ? ORDER BY tanggal DESC`;
            params = [req.session.userId];
        }

        const [hasilPanen] = await db.execute(query, params);
        res.render('dashboard', { user: req.session, dataPanen: hasilPanen });
    } catch (err) {
        console.error(err);
        res.status(500).send('Terjadi kesalahan pada server');
    }
});

// ==================== FITUR KHUSUS ADMIN ====================

// 1. Tampilkan Form Edit Data
router.get('/edit-data/:id', isAuthenticated, authorizeRole('admin'), async (req, res) => {
    try {
        const [panen] = await db.execute('SELECT * FROM panen WHERE id = ?', [req.params.id]);
        if (panen.length === 0) {
            // CATAT LOG: Indikasi scanning ID / Insecure Direct Object Reference (IDOR)
            logSecurityEvent('DATA_SCANNING', req.ip, `User ID: ${req.session.userId} mencoba mengakses/mencari data Panen ID ${req.params.id} yang tidak ada.`);
            return res.status(404).send('Data tidak ditemukan');
        }
        
        res.render('edit-data', { error: null, data: panen[0] });
    } catch (err) {
        console.error(err);
        res.status(500).send('Terjadi kesalahan pada server');
    }
});

// 2. Proses Update Data (Dengan Proteksi SQL Injection & Upload Opsional)
// 2. Proses Update Data 
router.post('/edit-data/:id', isAuthenticated, authorizeRole('admin'), upload.single('foto_bukti'), [
    body('komoditas')
        .trim()
        .matches(/^[a-zA-Z0-9\s]+$/).withMessage('Ditolak: Komoditas hanya boleh berisi huruf dan angka. Simbol dilarang!')
        .escape(),
    body('jumlah_kg').isInt({ min: 1 }).withMessage('Jumlah harus berupa angka positif')
], async (req, res) => {
    const errors = validationResult(req);
    const idData = req.params.id;

    if (!errors.isEmpty()) {
        // CATAT LOG: Indikasi serangan saat update data
        logSecurityEvent('MALICIOUS_INPUT', req.ip, `User ID: ${req.session.userId} memasukkan karakter ilegal saat Edit Data ID ${idData}. Target: ${req.body.komoditas}`);
        
        // Ambil data lama jika validasi gagal
        const [panen] = await db.execute('SELECT * FROM panen WHERE id = ?', [idData]);
        
        // PENTING: Harus ada kata 'return'
        return res.render('edit-data', { error: errors.array()[0].msg, data: panen[0] });
    }

    const { komoditas, jumlah_kg } = req.body;

    try {
        if (req.file) {
            await db.execute(
                'UPDATE panen SET komoditas = ?, jumlah_kg = ?, foto_bukti = ? WHERE id = ?',
                [komoditas, jumlah_kg, req.file.filename, idData]
            );
        } else {
            await db.execute(
                'UPDATE panen SET komoditas = ?, jumlah_kg = ? WHERE id = ?',
                [komoditas, jumlah_kg, idData]
            );
        }
        res.redirect('/dashboard');
    } catch (err) {
        console.error(err);
        res.status(500).send('Terjadi kesalahan pada server');
    }
});

// 3. Proses Hapus Data (Menggunakan POST untuk mencegah CSRF bypass)
router.post('/hapus-data/:id', isAuthenticated, authorizeRole('admin'), async (req, res) => {
    try {
        // Proteksi SQL Injection terjamin karena menggunakan Prepared Statement (?)
        await db.execute('DELETE FROM panen WHERE id = ?', [req.params.id]);
        res.redirect('/dashboard');
    } catch (err) {
        console.error(err);
        res.status(500).send('Terjadi kesalahan saat menghapus data');
    }
});

// Tampilkan Form Input Data (Hanya Petani yang boleh akses)
router.get('/input-data', isAuthenticated, authorizeRole('petani'), (req, res) => {
    res.render('input-data', { error: null, success: null });
});

// Proses Input Data Panen (Secure File Upload Opsional & Input Validation)
router.post('/input-data', isAuthenticated, authorizeRole('petani'), upload.single('foto_bukti'), [
    // VALIDASI KETAT: Hanya boleh huruf, angka, dan spasi.
    body('komoditas')
        .trim()
        .matches(/^[a-zA-Z0-9\s]+$/).withMessage('Ditolak: Komoditas hanya boleh berisi huruf dan angka. Simbol dilarang!')
        .escape(),
    body('jumlah_kg').isInt({ min: 1 }).withMessage('Jumlah harus berupa angka positif')
], async (req, res) => {
    
    // Handle multer errors
    if (req.file === undefined && req.body.error) {
        return res.render('input-data', { error: req.body.error, success: null });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        // CATAT LOG: Indikasi serangan XSS/SQLi
        logSecurityEvent('MALICIOUS_INPUT', req.ip, `User ID: ${req.session.userId} memasukkan karakter ilegal di form Panen. Target: Komoditas=${req.body.komoditas}`);
        
        // PENTING: Harus ada kata 'return' agar proses BERHENTI dan tidak lanjut ke database
        return res.render('input-data', { error: errors.array()[0].msg, success: null });
    }

    const { komoditas, jumlah_kg } = req.body;
    const fotoPath = req.file ? req.file.filename : null;

    try {
        await db.execute(
            'INSERT INTO panen (user_id, komoditas, jumlah_kg, foto_bukti) VALUES (?, ?, ?, ?)',
            [req.session.userId, komoditas, jumlah_kg, fotoPath]
        );
        res.render('input-data', { error: null, success: 'Data panen berhasil disimpan!' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Terjadi kesalahan pada server');
    }
});

module.exports = router;