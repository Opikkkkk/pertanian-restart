# 🌾 Sistem Pertanian Secure - Blue Team

Aplikasi web pencatatan hasil panen pertanian yang dirancang dengan arsitektur **Blue Team** untuk memenuhi Evaluasi Akhir Semester (EAS) Keamanan Jaringan Institut Teknologi Nasional (Itenas). Sistem ini dibangun menggunakan Node.js (Express) dan dilengkapi dengan berbagai lapisan keamanan untuk menahan serangan dari *Red Team*.

---

## 🚀 Panduan Instalasi & Menjalankan Website

Ikuti langkah-langkah di bawah ini untuk menjalankan aplikasi di lingkungan lokal (Localhost).

### 1. Persiapan Sistem (Prerequisites)
Pastikan sistem kamu sudah terinstal perangkat lunak berikut:
* **Node.js** (Direkomendasikan versi 22.x atau terbaru)
* **Laragon / XAMPP** (Untuk menjalankan *service* MySQL)
* **HeidiSQL / phpMyAdmin** (Untuk manajemen database)
* **Git** (Opsional, untuk *cloning* repositori)

### 2. Kloning Repositori & Instalasi Modul
Buka terminal dan jalankan perintah berikut:

```bash
# Clone repositori ini
git clone [https://github.com/username/eas-blue-team-pertanian.git](https://github.com/username/eas-blue-team-pertanian.git)

# Masuk ke dalam direktori proyek
cd eas-blue-team-pertanian

# Instal semua dependensi Node.js yang dibutuhkan
npm install
