# 🌿 BumiMetrics - Dashboard Prediksi Iklim & Risiko Kesehatan Tropis (Kota Batam)

[![Live Demo](https://img.shields.io/badge/Live%20Demo-bumimetrics.netlify.app-00C7B7?style=for-the-badge&logo=netlify)](https://bumimetrics.netlify.app/)
[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)
[![AI Model](https://img.shields.io/badge/AI%20Engine-VAR%20%26%20ML%20(R%C2%B2%3D0.917)-006398?style=for-the-badge)](#-pemodelan-ai--metode-analisis)

🌐 **Akses Dashboard Langsung:** [**https://bumimetrics.netlify.app/**](https://bumimetrics.netlify.app/)

---

## 📖 Tentang Projek

**BumiMetrics** adalah platform analitik dan sistem peringatan dini (*Early Warning System*) berbasis kecerdasan buatan (AI) yang menghubungkan **pola iklim mikro** dengan **risiko lonjakan penyakit tropis** di Kota Batam, Kepulauan Riau.

Platform ini merupakan **Projek Mandiri** yang dikembangkan selama masa kegiatan magang di **Stasiun Meteorologi Kelas I Hang Nadim Batam - Badan Meteorologi, Klimatologi, dan Geofisika (BMKG)**.

### 👥 Tim Pengembang
Projek ini dibuat dan dikembangkan bersama oleh:
- **Ahmad Zaky Al Ghifari** & Tim Pengembang BumiMetrics

---

## 🌟 Fitur Utama Dashboard

1. **📊 Kabar Cuaca & Risiko (Dashboard Utama)**:
   - Pantauan 4 Kartu KPI Utama: Suhu Rata-rata, Kelembapan Udara, Curah Hujan, dan Skor Tingkat Bahaya Sakit (*Circular Gauge Meter*).
   - Panel Analisis & Catatan Pintar Asisten AI dengan 3 Preskripsi Tindakan Prioritas.
   - Peta Musim 12 Bulan (Heatmap Kalender) dan Grafik Runtun Waktu Interaktif (1996–2026).
2. **🦟 Cek Bahaya Sakit (4 Skenario Fokus Tropis)**:
   - **1. Musim Peralihan (Pancaroba)**: Waspada Nyamuk DBD, Cikungunya, & Zika.
   - **2. Musim Panas Terik (Kemarau)**: Waspada Batuk Pilek (ISPA), Asap Karhutla, & Diare.
   - **3. Musim Hujan Lebat (Banjir)**: Waspada Kencing Tikus (Leptospirosis) & Tipes.
   - **4. Udara Sangat Lembap & Pengap**: Waspada Batuk Paru (TBC) & Jamur Kulit.
3. **🤖 Tanya Dokter AI & Simulasi (AI Studio)**:
   - **Galeri Pertanyaan 1-Klik**: Pengguna tidak perlu mengetik panjang, cukup klik salah satu kotak pertanyaan untuk mendapatkan jawaban lengkap secara instan.
   - **Simulator Iklim Interaktif**: Geser slider suhu, kelembapan, dan curah hujan untuk memprediksi probabilitas risiko penyakit secara *real-time*.
   - **Tabel Hubungan Cuaca**: Matriks korelasi data iklim terhadap lonjakan penyakit.
4. **📢 Warta & Info Warga**:
   - Feed laporan real-time dari masyarakat dan poskesdes setempat.
   - Formulir pelaporan isu lingkungan (genangan air, tumpukan sampah, asap).
5. **🛡️ Tips Jaga Diri & Panduan SOP**:
   - Panduan pencegahan praktis, SOP tanggap darurat puskesmas, dan daftar kontak darurat Kota Batam.
6. **📂 Navigasi Fleksibel (Collapsible Sidebar)**:
   - Tombol buka/tutup menu sidebar di layar laptop/desktop serta slide-in drawer di HP/smartphone.

---

## 🏗️ Struktur Folder Proyek

```text
BumiMetrics/
├── index.html                                  # Web App Utama (Dashboard, Peta Iklim, & Studio AI)
├── README.md                                   # Dokumentasi Repositori & Informasi Projek
├── LICENSE                                     # Lisensi Open Source (MIT License)
├── .gitignore                                  # Aturan Filter File Sampah & Data Rahasia
├── netlify.toml                                # Konfigurasi Hosting Netlify (SPA Routing & Security)
├── _redirects                                  # Konfigurasi Routing SPA
├── start_local_ai.bat                          # Launcher Sekali Klik Server AI Lokal (Port 8765)
│
├── css/
│   ├── style.css                               # Desain Sistem & Variabel Global
│   ├── components.css                          # Komponen UI (Card, Sidebar Collapsible, Gauge, Chat)
│   └── responsive.css                          # Optimasi Responsif Layar HP & Laptop
│
├── js/
│   ├── data-engine.js                          # Pengelola Dataset Runtun Waktu & Generator Analitik
│   ├── local-ai-engine.js                      # Mesin Inferensi AI Epidemiologi Lokal & Chatbot
│   ├── charts.js                               # Visualisasi Multi-Variable Chart.js
│   ├── community.js                            # Modul Warta & Laporan Komunitas Warga
│   └── app.js                                  # Controller Utama Aplikasi & Event Binding
│
├── scripts/
│   ├── local_ai_server.py                      # Server FastAPI AI Lokal (Port 8765)
│   ├── train_models.py                         # Skrip Ekstraksi & Pelatihan Model VAR
│   ├── build_netlify.py                        # Skrip Pengemas Folder Deploy Netlify
│   ├── build_github_package.py                 # Skrip Pengemas Repositori GitHub Bersih
│   └── requirements.txt                        # Daftar Dependensi Python
│
└── netlify_deploy/                             # Folder Siap Deploy ke Netlify
```

> **Catatan Kerahasiaan Data:** Demi menjaga kerahasiaan dan privasi data (*Data Confidentiality*), file dataset mentah internal stasiun tidak disertakan dalam repositori publik ini. Sistem web app dan AI Engine berjalan secara mandiri (*self-contained*) menggunakan mesin analitik bawaan yang aman.

---

## 🚀 Cara Menjalankan Aplikasi

### 1. Langsung Akses Online (Website)
Buka link: [**https://bumimetrics.netlify.app/**](https://bumimetrics.netlify.app/)

---

### 2. Menjalankan di Komputer Lokal (Offline)
1. Cukup buka file **`index.html`** langsung menggunakan browser apa saja (Google Chrome, Microsoft Edge, Firefox, Safari).
2. Aplikasi langsung aktif menggunakan komputasi AI client-side berkecepatan tinggi.

---

### 3. Menjalankan Bersama Server Python AI Lokal (Opsional)
1. Install dependensi Python:
   ```bash
   pip install -r scripts/requirements.txt
   ```
2. Jalankan server lokal:
   ```bash
   python scripts/local_ai_server.py
   ```
   *(Atau cukup klik ganda file `start_local_ai.bat`)*
3. Server akan berjalan di port `8765` (`http://127.0.0.1:8765`). Buka `index.html` di browser Anda.

---

## 🔬 Pemodelan AI & Metode Analisis
- **Variabel Utama**: Suhu Rata-rata (°C), Kelembapan Udara (%), Curah Hujan Bulanan (mm).
- **Algoritma**: *Vector Autoregression (VAR)* dipadukan dengan *Machine Learning Classifier*.
- **Akurasi Model Suhu ($R^2$)**: **0.9173** (Sangat Akurat).
- **Akurasi Model Hujan ($R^2$)**: **0.8533**.

---

## 📄 Lisensi
Didistribusikan di bawah Lisensi **MIT**. Silakan gunakan dan kembangkan untuk tujuan edukasi, penelitian, dan pelayanan masyarakat.
