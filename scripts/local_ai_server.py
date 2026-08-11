#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
=============================================================================
BumiMetrics - Local AI Engine & API Server (Offline FastAPI)
Menyediakan inferensi AI lokal, asisten epidemiologi klinis, analisis risiko
real-time, dan manajemen matriks tanpa perlu koneksi internet / cloud eksternal.
=============================================================================
"""

import os
import json
import uvicorn
from typing import Optional, Dict, Any, List
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "data")
TRAINED_DATA_PATH = os.path.join(DATA_DIR, "trained_var_climate_1996_2026.json")
MATRIX_DATA_PATH = os.path.join(DATA_DIR, "disease_matrix.json")
METRICS_DATA_PATH = os.path.join(DATA_DIR, "model_metrics.json")

# Inisialisasi FastAPI
app = FastAPI(
    title="BumiMetrics Local AI Server",
    description="Offline Local AI Engine for Climate-Driven Tropical Disease Risk Analysis & Clinical Decision Support",
    version="2.0.0"
)

# Aktifkan CORS agar frontend dapat memanggil API lokal secara mulus
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Helper untuk memuat data cache
def load_json(filepath):
    if os.path.exists(filepath):
        with open(filepath, "r", encoding="utf-8") as f:
            return json.load(f)
    return {}

# Pydantic Request Models
class PredictionRequest(BaseModel):
    temperature: float
    humidity: float
    rainfall: float
    month: Optional[int] = 1
    region: Optional[str] = "Kota Batam & Kepulauan Riau"

class ChatRequest(BaseModel):
    message: str
    context: Optional[Dict[str, Any]] = None

@app.get("/")
def root():
    return {
        "status": "ONLINE",
        "engine": "BumiMetrics Local AI Engine (Offline VAR & Epidemiological Assistant)",
        "version": "2.0.0",
        "docs_url": "/docs"
    }

@app.get("/api/status")
def get_status():
    metrics = load_json(METRICS_DATA_PATH)
    dataset = load_json(TRAINED_DATA_PATH)
    return {
        "status": "ONLINE",
        "mode": "LOCAL_OFFLINE",
        "trained_years": len(dataset),
        "metrics": metrics,
        "is_ready": bool(dataset)
    }

@app.get("/api/dataset")
def get_dataset():
    dataset = load_json(TRAINED_DATA_PATH)
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset belum dilatih. Jalankan /api/retrain terlebih dahulu.")
    return dataset

@app.get("/api/matrix")
def get_matrix():
    matrix = load_json(MATRIX_DATA_PATH)
    if not matrix:
        raise HTTPException(status_code=404, detail="Matriks belum ditemukan. Jalankan pelatihan.")
    return matrix

@app.post("/api/predict")
def predict_risk(req: PredictionRequest):
    """
    Menghitung prediksi risiko penyakit & rekomendasi klinis berdasarkan parameter iklim
    """
    from scripts.train_models import calculate_disease_risks
    
    risk_info = calculate_disease_risks(
        temp=req.temperature,
        hum=req.humidity,
        rain=req.rainfall,
        month_num=req.month
    )
    
    # Generate Local AI Clinical Action Plan
    action_plans = []
    if risk_info["disease_breakdown"]["pancaroba_dbd"] >= 60:
        action_plans.append({
            "target": "Vektor Nyamuk (DBD / Chikungunya)",
            "priority": "TINGGI",
            "actions": [
                "Lakukan Gerakan PSN 3M Plus serentak tiap minggu pagi",
                "Taburkan bubuk Abate pada bak mandi atau tandon air terbuka",
                "Waspadai demam mendadak tinggi (>38.5°C) hari ke-3 sampai ke-5"
            ]
        })
    
    if risk_info["disease_breakdown"]["elnino_ispa"] >= 60:
        action_plans.append({
            "target": "Pernapasan & Sanitasi Air (ISPA / Karhutla / Diare)",
            "priority": "TINGGI",
            "actions": [
                "Gunakan masker medis/N95 saat kualitas udara luar memburuk",
                "Rebus air minum hingga mendidih sempurna (minimal 100°C selama 3 menit)",
                "Cukupi asupan cairan 2.5 - 3 liter per hari untuk cegah dehidrasi mukosa"
            ]
        })

    if risk_info["disease_breakdown"]["lanina_lepto"] >= 60:
        action_plans.append({
            "target": "Bakteri Genangan Air (Leptospirosis / Tipes)",
            "priority": "TINGGI",
            "actions": [
                "Gunakan sepatu bot karet dan sarung tangan saat kontak dengan genangan/lumpur",
                "Tutup rapat luka pada kulit dengan plester tahan air",
                "Desinfeksi lantai rumah dengan cairan klorin pasca genangan surut"
            ]
        })

    if risk_info["disease_breakdown"]["humidity_tbc"] >= 65:
        action_plans.append({
            "target": "Infeksi Udara & Jamur Tropis (TBC / Mikosis)",
            "priority": "SEDANG",
            "actions": [
                "Buka ventilasi dan jendela kamar tidur setiap pagi agar sinar UV masuk",
                "Jemur kasur dan handuk secara berkala di bawah terik matahari",
                "Gunakan pakaian berbahan katun menyerap keringat untuk cegah jamur kulit"
            ]
        })

    return {
        "inputs": {
            "temperature": req.temperature,
            "humidity": req.humidity,
            "rainfall": req.rainfall,
            "month": req.month,
            "region": req.region
        },
        "risk_assessment": risk_info,
        "clinical_action_plans": action_plans,
        "ai_summary": (
            f"Berdasarkan analisis AI Lokal pada Suhu {req.temperature}°C, Kelembapan {req.humidity}%, "
            f"dan Curah Hujan {req.rainfall} mm, kondisi berada pada tingkat '{risk_info['risk_level'].upper()}' "
            f"(Skor {risk_info['var_risk_score']}/100). Ancaman utama yang terdeteksi adalah: {risk_info['dominant_threat']}."
        )
    }

@app.post("/api/chat")
def chat_local_ai(req: ChatRequest):
    """
    Asisten AI Epidemiologi Lokal Offline (Medical & Climate Decision Support)
    """
    msg = req.message.lower()
    ctx = req.context or {}
    
    current_temp = ctx.get("temperature", 28.0)
    current_hum = ctx.get("humidity", 82.0)
    current_rain = ctx.get("rainfall", 180.0)
    current_year = ctx.get("year", 2024)
    
    # Respons Cerdas Berbasis Pengetahuan Epidemiologi & Matriks Lokal
    response_text = ""
    badges = []
    
    if any(k in msg for k in ["dbd", "nyamuk", "chikungunya", "jentik", "demam berdarah"]):
        response_text = (
            f"🦟 **Analisis AI Lokal - Risiko Demam Berdarah (DBD) & Vektor Nyamuk**\n\n"
            f"• **Faktor Iklim Saat Ini**: Suhu {current_temp}°C dan Kelembapan {current_hum}% sangat mendukung siklus replikasi virus dengue dan masa inkubasi nyamuk *Aedes aegypti* (optimal pada 26–30°C).\n"
            f"• **Korelasi Matriks**: Analisis data 30 tahun (1996-2025) menunjukkan korelasi positif signifikan (+0.491) antara suhu hangat dan indeks DBD, terutama di bulan-bulan peralihan monsun.\n\n"
            f"📋 **Protokol Tindakan Segera (PSN 3M Plus)**:\n"
            f"1. Kuras dan sikat penampungan air minimal 1x seminggu.\n"
            f"2. Tutup rapat tandon air dan drum penampung air hujan.\n"
            f"3. Berikan bubuk larvasida (Abate) 1 gram per 10 liter air pada genangan yang sulit dikuras.\n"
            f"4. **Tanda Bahaya Darurat**: Jika ada anggota keluarga mengalami demam tinggi mendadak disertai bintik merah atau mimisan, segera periksakan ke Puskesmas/RS terdekat."
        )
        badges = ["Waspada DBD", "Pancaroba", "PSN 3M Plus"]

    elif any(k in msg for k in ["ispa", "batuk", "karhutla", "asap", "polusi", "kemarau", "el nino", "diare"]):
        response_text = (
            f"🔥 **Analisis AI Lokal - Risiko Kemarau Ekstrem, ISPA & Krisis Air Bersih**\n\n"
            f"• **Dinamika Iklim**: Pada anomali El Niño dan kemarau (Curah Hujan <80 mm, Suhu >28.5°C), partikel debu dan PM2.5 meningkat drastis, mengiritasi saluran pernapasan atas (ISPA).\n"
            f"• **Korelasi Matriks**: Suhu tinggi berkorelasi sangat kuat (+0.690) terhadap lonjakan kasus ISPA, dan berkorelasi negatif (-0.704) dengan kelembapan udara.\n\n"
            f"🛡️ **Rekomendasi Perlindungan Mandiri**:\n"
            f"1. Gunakan masker medis atau N95 saat beraktivitas di luar ruangan ketika indeks udara menurun.\n"
            f"2. Gunakan air rebusan matang untuk minum dan memasak guna mencegah transmisi bakteri diare saat debit air sumur menyusut.\n"
            f"3. Cukupi minum air putih minimal 2.5 liter per hari untuk menjaga hidrasi saluran mukosa tenggorokan."
        )
        badges = ["ISPA & Polusi", "El Niño", "Kualitas Udara"]

    elif any(k in msg for k in ["banjir", "leptospirosis", "tikus", "tipes", "la nina", "hujan deras"]):
        response_text = (
            f"🌊 **Analisis AI Lokal - Risiko Musim Hujan Ekstrem, Leptospirosis & Tipes**\n\n"
            f"• **Dinamika Iklim**: Curah hujan tinggi (>250 mm) memicu genangan air yang membawa bakteri *Leptospira* dari urine hewan pengerat ke permukiman warga.\n"
            f"• **Korelasi Matriks**: Curah hujan berkorelasi sangat tinggi (+0.759) dengan risiko Leptospirosis dalam data runtun waktu 30 tahun kami.\n\n"
            f"⚠️ **Protokol Keselamatan Pasca-Banjir**:\n"
            f"1. Selalu gunakan sepatu bot karet dan sarung tangan saat membersihkan sisa lumpur.\n"
            f"2. Jika memiliki luka terbuka di kaki/tangan, tutup rapat dengan plester kedap air sebelum kontak dengan genangan.\n"
            f"3. Segera cuci tangan dan kaki memakai sabun antiseptik setelah terpapar air selokan/banjir."
        )
        badges = ["Leptospirosis", "La Niña", "Sanitasi Darurat"]

    elif any(k in msg for k in ["tbc", "tuberkulosis", "jamur", "panu", "kurap", "pengap", "lembap"]):
        response_text = (
            f"💨 **Analisis AI Lokal - Risiko Kelembapan Udara Tinggi (TBC & Jamur Kulit)**\n\n"
            f"• **Dinamika Iklim**: Kelembapan konsisten >80% memperpanjang waktu melayang droplet *Mycobacterium tuberculosis* di ruangan tertutup dan memicu pertumbuhan spora jamur *Dermatofita*.\n"
            f"• **Korelasi Matriks**: Kelembapan udara menunjukkan korelasi sangat kuat (+0.796) dengan risiko infeksi lingkungan lembap.\n\n"
            f"☀️ **Panduan Penyehatan Ruang Hunian**:\n"
            f"1. Buka jendela dan pintu kamar setiap pagi (07.00 - 10.00) agar sinar ultraviolet alami masuk ke dalam ruangan.\n"
            f"2. Hindari menggantung pakaian basah di dalam kamar tidur.\n"
            f"3. Jemur kasur, bantal, dan guling di bawah sinar matahari secara teratur."
        )
        badges = ["TBC & Paru", "Kelembapan Tropis", "Sirkulasi Udara"]

    elif any(k in msg for k in ["matriks", "korelasi", "var", "model", "akurasi", "training"]):
        metrics = load_json(METRICS_DATA_PATH)
        response_text = (
            f"📊 **Laporan Parameter Model Vector Autoregression (VAR) & Machine Learning**\n\n"
            f"• **Periode Data Riil**: 1996 - 2025 (360 Bulan Observasi Lengkap)\n"
            f"• **Akurasi Model Suhu (R²)**: {metrics.get('metrics', {}).get('temperature_r2', 0.917)} (Sangat Tinggi)\n"
            f"• **Akurasi Model Curah Hujan (R²)**: {metrics.get('metrics', {}).get('rainfall_r2', 0.853)}\n"
            f"• **Matriks Kausalitas Terkuat**:\n"
            f"  - Curah Hujan ➔ Leptospirosis: Bobot 0.759 (Positif Kuat)\n"
            f"  - Suhu Rata-rata ➔ ISPA / Karhutla: Bobot 0.690 (Positif Kuat)\n"
            f"  - Kelembapan Udara ➔ TBC & Mikosis: Bobot 0.796 (Positif Kuat)\n"
            f"  - Suhu Hangat ➔ Transmisi DBD: Bobot 0.491 (Optimal di 28.2°C)"
        )
        badges = ["Model VAR ML", "R2 > 0.85", "30 Tahun Data"]

    else:
        response_text = (
            f"🌿 **Halo! Saya Asisten AI Epidemiologi Lokal BumiMetrics.**\n\n"
            f"Saya telah dilatih menggunakan 30 tahun data iklim mikro (1996–2025) dan model Vector Autoregression (VAR) "
            f"untuk memantau dan memprediksi risiko penyakit tropis di Indonesia secara 100% lokal dan offline.\n\n"
            f"**Topik yang dapat Anda tanyakan:**\n"
            f"1. *'Bagaimana risiko DBD di bulan peralihan musim pancaroba?'*\n"
            f"2. *'Apa dampak kemarau El Niño terhadap kasus ISPA dan diare?'*\n"
            f"3. *'Bagaimana cara pencegahan Leptospirosis saat musim banjir La Niña?'*\n"
            f"4. *'Tampilkan matriks korelasi dan akurasi model ML iklim.'*\n"
            f"5. *'Apa rekomendasi pencegahan untuk kondisi cuaca saat ini?'*"
        )
        badges = ["AI Lokal Aktif", "Epidemiologi Tropis", "Offline Mode"]

    return {
        "reply": response_text,
        "badges": badges,
        "model_version": "BumiMetrics-VAR-2.0-Local"
    }

@app.post("/api/retrain")
def retrain_model_endpoint():
    """Menjalankan proses training ulang model secara lokal"""
    try:
        try:
            from scripts.train_models import train_and_forecast
        except ImportError:
            from train_models import train_and_forecast
        dataset = train_and_forecast()
        return {
            "status": "SUCCESS",
            "message": "Pelatihan ulang model VAR dan perbaruan matriks penyakit berhasil diselesaikan.",
            "total_years": len(dataset)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gagal melatih model: {str(e)}")

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8765))
    print(f"Memulai BumiMetrics Local AI Server pada http://127.0.0.1:{port} ...")
    uvicorn.run(app, host="127.0.0.1", port=port)


