# 🌿 BumiMetrics - Dashboard Prediksi Iklim & Risiko Kesehatan Tropis (Kota Batam)

[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg)](https://opensource.org/licenses/MIT)
[![Netlify Status](https://img.shields.io/badge/Deploy-Netlify%20Ready-00C7B7?logo=netlify)](https://app.netlify.com/drop)
[![Data Period](https://img.shields.io/badge/Dataset-1996--2026%20(30%20Tahun)-006c49)](#-dataset--pemodelan-ai)
[![AI Engine](https://img.shields.io/badge/AI%20Model-VAR%20%26%20ML%20(R%C2%B2%3D0.917)-006398)](#-fitur-utama)

**BumiMetrics** adalah platform analitik dan sistem peringatan dini (*Early Warning System*) berbasis kecerdasan buatan (AI) yang menghubungkan **data iklim riil 30 tahun (1996–2025)** dengan **risiko lonjakan penyakit tropis** di Kota Batam, Kepulauan Riau.

Sistem dirancang dengan bahasa yang **ramah, bersahabat, dan mudah dipahami oleh siapa saja**, serta dapat dijalankan **100% Offline (Lokal)** maupun dideploy secara online ke **Netlify**.

---

## 🌟 Fitur Utama

1. **📊 Kabar Cuaca & Risiko (Dashboard Utama)**:
   - Pantauan 4 KPI Hero: Suhu Rata-rata, Kelembapan Udara, Curah Hujan, dan Skor Tingkat Bahaya Sakit (*Circular Gauge Meter*).
   - Panel Analisis & Catatan Pintar Asisten AI dengan 3 Preskripsi Tindakan Prioritas.
   - Peta Musim 12 Bulan (Heatmap) dan Grafik Runtun Waktu Interaktif (1996–2026).
2. **🦟 Cek Bahaya Sakit (4 Skenario Fokus Tropis)**:
   - **Pancaroba**: Nyamuk DBD, Cikungunya, & Zika.
   - **Kemarau Panas**: Batuk Pilek (ISPA), Asap Karhutla, & Diare.
   - **Hujan Lebat / Banjir**: Kencing Tikus (Leptospirosis) & Tipes.
   - **Udara Lembap**: Batuk Paru (TBC) & Jamur Kulit.
3. **🤖 Tanya Dokter AI & Simulasi (AI Studio)**:
   - **Galeri Pertanyaan 1-Klik**: Klik pertanyaan siap jawab tanpa perlu mengetik panjang.
   - **Simulator Cuaca Interaktif**: Geser slider suhu, kelembapan, dan curah hujan untuk simulasi prediksi risiko instan.
   - **Tabel Hubungan Cuaca**: Matriks korelasi data riil 30 tahun.
4. **📢 Warta & Info Warga**:
   - Feed laporan real-time dari masyarakat dan poskesdes setempat.
   - Formulir pelaporan isu lingkungan (genangan, tumpukan sampah, asap).
5. **🛡️ Tips Jaga Diri & Panduan SOP**:
   - Panduan pencegahan praktis, SOP puskesmas, dan daftar nomor darurat Batam.
6. **📂 Navigasi Fleksibel (Collapsible Sidebar)**:
   - Tombol buka/tutup menu sidebar di desktop dan slide-in drawer di HP/smartphone.

---

## 🏗️ Struktur Proyek

```text
BumiMetrics/
├── index.html                                  # Web App Utama (HTML5 + Tailwind UIX)
├── netlify.toml                                # Konfigurasi Hosting Netlify (SPA & Security)
├── _redirects                                  # Routing SPA
├── start_local_ai.bat                          # Launcher Server AI Lokal (Port 8765)
├── README.md                                   # Dokumentasi Proyek
├── LICENSE                                     # Lisensi MIT
│
├── css/
│   ├── style.css                               # Desain Sistem & Variabel Global
│   ├── components.css                          # Komponen UI (Card, Sidebar, Gauge, Chat)
│   └── responsive.css                          # Optimasi Layar HP & Laptop
│
├── js/
│   ├── data-engine.js                          # Pengelola Dataset Runtun Waktu 1996-2026
│   ├── local-ai-engine.js                      # Mesin Inferensi AI Lokal & Chatbot
│   ├── charts.js                               # Visualisasi Multi-Variable Chart.js
│   ├── community.js                            # Pengelola Warta Komunitas & Laporan
│   └── app.js                                  # Controller Utama Aplikasi & Event Binding
│
├── data/
│   ├── trained_var_climate_1996_2026.json      # Dataset Runtun Waktu 31 Tahun (372 Bulan)
│   ├── disease_matrix.json                     # Matriks Korelasi & Ambang Batas Risiko
│   ├── model_metrics.json                      # Metrik Akurasi Model AI (R²=0.917)
│   └── raw/
│       └── Hasil_Ekstraksi_Iklim_Lengkap_1996_2025.xlsx  # Data Excel Asli Observasi Batam
│
├── scripts/
│   ├── local_ai_server.py                      # Server FastAPI AI Lokal (Port 8765)
│   ├── train_models.py                         # Skrip Ekstraksi Data & Pelatihan Model VAR
│   ├── build_netlify.py                        # Skrip Build Folder Deploy Netlify
│   └── requirements.txt                        # Dependensi Python
│
└── netlify_deploy/                             # Folder Siap Deploy ke Netlify
```

---

## 🚀 Cara Menjalankan Aplikasi

### Opsi 1: Menjalankan Langsung di Browser (Offline & Tanpa Instalasi Apapun)
1. Cukup buka file **`index.html`** langsung dengan browser apa saja (Google Chrome, Microsoft Edge, Firefox, Safari).
2. Aplikasi langsung berjalan penuh menggunakan mesin komputasi AI client-side berkecepatan tinggi.

---

### Opsi 2: Menjalankan Bersama Server Python AI Lokal (Rekomendasi Peneliti)
1. Buka terminal/cmd dan install dependensi:
   ```bash
   pip install -r scripts/requirements.txt
   ```
2. Jalankan server AI lokal dengan mengklik ganda file **`start_local_ai.bat`** (atau jalankan `python scripts/local_ai_server.py`).
3. Server akan aktif pada: **`http://127.0.0.1:8765`**.
4. Buka **`index.html`** di browser. Status navbar akan menampilkan badge hijau **"Asisten AI Aktif"**.

---

## 🌐 Cara Deploy ke Netlify

### Cara A: Drag & Drop (Paling Praktis)
1. Jalankan build script untuk memastikan aset ter-package lengkap:
   ```bash
   python scripts/build_netlify.py
   ```
2. Buka **[https://app.netlify.com/drop](https://app.netlify.com/drop)**.
3. Tarik (**Drag**) folder **`netlify_deploy`** dan lepaskan (**Drop**) ke browser.
4. Situs Anda langsung Live Online dengan URL HTTPS gratis.

### Cara B: Terhubung ke GitHub
1. Push repositori ini ke akun GitHub Anda.
2. Buat site baru di Netlify dan pilih repositori GitHub ini.
3. Konfigurasi `netlify.toml` akan otomatis menangani seluruh proses deployment secara otomatis setiap kali Anda melakukan `git push`.

---

## 🔬 Dataset & Pemodelan AI
- **Sumber Data**: Data observasi iklim mikro stasiun BMKG Hang Nadim Kota Batam (1996 – 2025).
- **Variabel Iklim**: Suhu Rata-rata (°C), Kelembapan Udara (%), Curah Hujan Bulanan (mm).
- **Metode**: *Vector Autoregression (VAR)* dengan *Random Forest Regressor*.
- **Akurasi Model Suhu ($R^2$)**: **0.9173** (MSE: 0.0324).
- **Akurasi Model Hujan ($R^2$)**: **0.8533**.

---

## 📄 Lisensi
Didistribusikan di bawah Lisensi **MIT**. Silakan gunakan, kembangkan, dan modifikasi secara bebas untuk kebutuhan edukasi, penelitian, dan masyarakat.
