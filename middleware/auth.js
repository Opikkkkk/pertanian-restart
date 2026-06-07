// middleware/auth.js

// Memastikan user sudah login
const isAuthenticated = (req, res, next) => {
    if (req.session && req.session.userId) {
        return next();
    }
    res.redirect('/login');
};

// Memastikan user memiliki role tertentu (RBAC)
const authorizeRole = (role) => {
    return (req, res, next) => {
        if (req.session && req.session.role === role) {
            return next();
        }
        res.status(403).send('Akses Ditolak: Anda tidak memiliki izin untuk melihat halaman ini.');
    };
};

module.exports = { isAuthenticated, authorizeRole };