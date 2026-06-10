// app.js
const express = require('express');
const session = require('express-session');
const helmet = require('helmet');
const csrf = require('csurf');
const path = require('path');
const logSecurityEvent = require('./utils/logger');

const app = express();
const PORT = 3000;

// ================= IMPORT ROUTES =================
const authRoutes = require('./routes/authRoutes');
const panenRoutes = require('./routes/panenRoutes');

// ================= KONFIGURASI KEAMANAN GLOBAL =================

// 1. Helmet untuk HTTP Headers Security (Mitigasi XSS dan Clickjacking)
// Dengan CSP yang memungkinkan Tailwind CDN
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "https://cdn.tailwindcss.com", "'unsafe-inline'"],
            scriptSrcAttr: ["'unsafe-inline'"], // <--- TAMBAHKAN BARIS INI
            styleSrc: ["'self'", "https://cdn.tailwindcss.com", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "http:", "https:"],
            fontSrc: ["'self'", "https:"],
            connectSrc: ["'self'"],
            frameSrc: ["'self'"],
            formAction: ["'self'"],
            upgradeInsecureRequests: null,
        }
    },
    crossOriginOpenerPolicy: false,
    crossOriginResourcePolicy: false
}));

// 2. Body Parser untuk form input
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// 3. Konfigurasi Session yang Aman
app.use(session({
    secret: 'kunci-rahasia-pertanian-blue-team-2026', 
    resave: false,
    saveUninitialized: true,
    cookie: { 
        httpOnly: true, // Mencegah pencurian cookie lewat skrip XSS
        secure: false,  // Set true jika nanti menggunakan HTTPS
        maxAge: 1000 * 60 * 60 // Expire dalam 1 jam
    }
}));

// 4. CSRF Protection
const csrfProtection = csrf({ cookie: false });
app.use(csrfProtection);

// Middleware untuk mendistribusikan token CSRF ke semua view EJS
app.use((req, res, next) => {
    res.locals.csrfToken = req.csrfToken();
    res.locals.userRole = req.session.role || null; // Lempar data role ke view
    next();
});

// Setup View Engine EJS (EJS otomatis melakukan escape pada output, menambah proteksi XSS)
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ================= SERVE STATIC UPLOADS =================
// Serve images dari folder uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ================= ROUTING SEMENTARA =================

// Route dasar
app.get('/', (req, res) => {
    res.redirect('/login');
});

// Route login (Akan kita buatkan view-nya nanti)
app.get('/login', (req, res) => {
    res.render('login', { error: null });
});

// ================= GUNAKAN ROUTES =================
app.use('/', authRoutes);
app.use('/', panenRoutes);

// ================= ERROR HANDLING =================
// Error handler untuk Multer (File Upload Errors)
app.use(function (err, req, res, next) {
    if (err.code === 'LIMIT_FILE_SIZE') {
        logSecurityEvent('UPLOAD_VIOLATION', req.ip, `Mencoba upload file terlalu besar (Melebihi 2MB). UserID: ${req.session.userId || 'Guest'}`);
        return res.render('input-data', { 
            error: '⚠️ File terlalu besar! Maksimal ukuran file adalah 2MB. Silakan pilih file yang lebih kecil.',
            success: null 
        });
    }
    if (err.message && err.message.includes('Hanya diperbolehkan mengunggah file gambar')) {
        logSecurityEvent('UPLOAD_MALICIOUS', req.ip, `Mencoba upload file non-gambar (Indikasi Web Shell). Target file: ${err.message}`);
        return res.render('input-data', { 
            error: '⚠️ ' + err.message,
            success: null 
        });
    }
    next(err);
});

// Menangkap error CSRF Token (jika Red Team mencoba memanipulasi form)
app.use(function (err, req, res, next) {
    if (err.code !== 'EBADCSRFTOKEN') return next(err);
    
    // CATAT LOG: Terjadi serangan CSRF
    logSecurityEvent('CSRF_ATTACK', req.ip, `Token CSRF tidak valid saat mencoba POST data. Indikasi manipulasi form.`);
    
    res.status(403).send('Terdeteksi pelanggaran keamanan: CSRF Token tidak valid.');
});

app.listen(PORT, () => {
    console.log(`Server Berjalan di http://localhost:${PORT}`);
});