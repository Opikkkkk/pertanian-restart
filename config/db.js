// config/db.js
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: 'localhost',
    user: 'root', // Default user Laragon
    password: '', // Kosongkan jika default Laragon tidak ber-password
    database: 'pertanian_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Test koneksi saat server berjalan
pool.getConnection()
    .then(conn => {
        console.log('Database pertanian_db terhubung dengan aman.');
        conn.release();
    })
    .catch(err => {
        console.error('Koneksi database gagal:', err);
    });

module.exports = pool;