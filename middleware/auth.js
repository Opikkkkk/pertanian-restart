// middleware/auth.js
const logSecurityEvent = require('../utils/logger');

// Memastikan user sudah login
const isAuthenticated = (req, res, next) => {
    if (req.session && req.session.userId) {
        return next();
    }
    // CATAT LOG: Seseorang mencoba akses halaman dalam tanpa login
    logSecurityEvent('UNAUTHORIZED_ACCESS', req.ip, `Mencoba mengakses rute terlindungi tanpa login: ${req.originalUrl}`);
    res.redirect('/login');
};

// Memastikan user memiliki role tertentu (RBAC)
const authorizeRole = (role) => {
    return (req, res, next) => {
        if (req.session && req.session.role === role) {
            return next();
        }
        // CATAT LOG: Pelanggaran hak akses (Privilege Escalation Attempt)
        logSecurityEvent('RBAC_VIOLATION', req.ip, `User ID: ${req.session.userId || 'Unknown'} (Role: ${req.session.role || 'None'}) mencoba memaksa masuk ke rute khusus ${role}: ${req.originalUrl}`);
        
        res.status(403).send('Akses Ditolak: Anda tidak memiliki izin untuk melihat halaman ini.');
    };
};

module.exports = { isAuthenticated, authorizeRole };