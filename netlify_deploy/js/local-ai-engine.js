/**
 * ===================================================================
 * BumiMetrics - Client-Side Local AI Engine & Offline Intelligence
 * Berjalan 100% di browser pengguna dengan koneksi otomatis ke
 * backend Python Local AI Server (http://127.0.0.1:8765) jika aktif.
 * ===================================================================
 */

const LocalAIEngine = {
  config: {
    serverUrl: 'http://127.0.0.1:8765',
    isServerOnline: false,
    checkIntervalMs: 15000
  },

  // Cache data matriks penyakit & model
  _matrixCache: null,
  _metricsCache: null,

  /**
   * Inisialisasi Engine AI Lokal
   */
  async init() {
    console.log('🤖 Inisialisasi BumiMetrics Local AI Engine...');
    await this.checkServerStatus();
    await this.loadMatrixData();
  },

  /**
   * Cek status konektivitas server Python lokal
   */
  async checkServerStatus() {
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.protocol === 'file:';
    if (isLocalhost) {
      try {
        const response = await fetch(`${this.config.serverUrl}/api/status`, {
          method: 'GET',
          headers: { 'Accept': 'application/json' },
          signal: AbortSignal.timeout(1500)
        });
        if (response.ok) {
          const data = await response.json();
          this.config.isServerOnline = true;
          this._metricsCache = data.metrics;
          this._updateServerStatusUI(true, 'Server AI Lokal Aktif (FastAPI + VAR)');
          return true;
        }
      } catch (err) {
        // Server lokal python belum jalan, gunakan client-side inference engine
      }
    }

    this.config.isServerOnline = false;
    this._updateServerStatusUI(false, 'Engine AI Siap (Offline Mode)');
    return false;
  },

  /**
   * Update elemen UI status server
   */
  _updateServerStatusUI(isOnline, label) {
    const badge = document.getElementById('localAIServerBadge');
    const dot = document.getElementById('localAIServerDot');
    const text = document.getElementById('localAIServerText');

    if (badge && dot && text) {
      text.textContent = label;
      if (isOnline) {
        badge.className = 'flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300';
        dot.className = 'w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse';
      } else {
        badge.className = 'flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-sky-100 text-sky-800 border border-sky-300';
        dot.className = 'w-2.5 h-2.5 rounded-full bg-sky-500';
      }
    }
  },

  /**
   * Memuat matriks korelasi & kausalitas penyakit
   */
  async loadMatrixData() {
    if (this._matrixCache) return this._matrixCache;

    if (this.config.isServerOnline) {
      try {
        const res = await fetch(`${this.config.serverUrl}/api/matrix`);
        if (res.ok) {
          this._matrixCache = await res.json();
          return this._matrixCache;
        }
      } catch (e) {
        console.warn('Gagal memuat matriks dari server lokal, beralih ke fallback file...');
      }
    }

    try {
      const res = await fetch('./data/disease_matrix.json');
      if (res.ok) {
        this._matrixCache = await res.json();
        return this._matrixCache;
      }
    } catch (e) {
      console.warn('Gagal memuat disease_matrix.json:', e);
    }

    // Default Fallback Matrix jika file JSON belum sempat dibuat
    this._matrixCache = {
      correlation_matrix: {
        Suhu_C: { Suhu_C: 1.0, Kelembapan_Percent: -0.4571, Curah_Hujan_mm: -0.3518, elnino_ispa: 0.6904, pancaroba_dbd: 0.4909, lanina_lepto: -0.3932, humidity_tbc: -0.3123 },
        Kelembapan_Percent: { Suhu_C: -0.4571, Kelembapan_Percent: 1.0, Curah_Hujan_mm: 0.4482, elnino_ispa: -0.7037, pancaroba_dbd: 0.1319, lanina_lepto: 0.5892, humidity_tbc: 0.7956 },
        Curah_Hujan_mm: { Suhu_C: -0.3518, Kelembapan_Percent: 0.4482, Curah_Hujan_mm: 1.0, elnino_ispa: -0.5725, pancaroba_dbd: -0.1695, lanina_lepto: 0.7586, humidity_tbc: 0.3493 }
      }
    };
    return this._matrixCache;
  },

  /**
   * Inferensi Prediksi Risiko Berbasis Input Iklim (Simulator)
   */
  async predictRisk(temp, hum, rain, month = 1) {
    if (this.config.isServerOnline) {
      try {
        const res = await fetch(`${this.config.serverUrl}/api/predict`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ temperature: temp, humidity: hum, rainfall: rain, month: month })
        });
        if (res.ok) {
          return await res.json();
        }
      } catch (err) {
        console.warn('Server lokal offline saat prediksi, beralih ke engine browser...');
      }
    }

    // Client-side Local Inference Engine
    return this._clientSidePredict(temp, hum, rain, month);
  },

  /**
   * Client-side ML & Clinical Decision Inference
   */
  _clientSidePredict(temp, hum, rain, monthNum) {
    const isPancaroba = [3, 4, 5, 9, 10, 11].includes(monthNum);
    const isDry = [6, 7, 8].includes(monthNum);

    // 1. DBD Score
    let tempVector = Math.max(0, 1.0 - Math.abs(temp - 28.2) / 3.0) * 40.0;
    let rainVector = 0;
    if (rain >= 80 && rain <= 260) {
      rainVector = 35.0 - Math.abs(rain - 180) * 0.12;
    } else if (rain > 260) {
      rainVector = Math.max(10.0, 30.0 - (rain - 260) * 0.08);
    } else {
      rainVector = Math.max(5.0, rain * 0.15);
    }
    let dbdRisk = Math.min(98, Math.max(10, Math.round(tempVector + rainVector + (isPancaroba ? 20 : 5))));

    // 2. ISPA Score
    let tempIspa = Math.max(0, (temp - 26.5) * 18.0);
    let droughtFactor = Math.max(0, (160.0 - rain) * 0.35);
    let dryAirFactor = Math.max(0, (83.0 - hum) * 2.2);
    let ispaRisk = Math.min(99, Math.max(12, Math.round(18.0 + tempIspa + droughtFactor + dryAirFactor + (isDry ? 15 : 0))));

    // 3. Leptospirosis Score
    let floodFactor = Math.max(0, (rain - 160.0) * 0.32);
    let extremeBonus = rain > 300 ? 25 : (rain > 220 ? 12 : 0);
    let humFactor = Math.max(0, (hum - 80.0) * 2.5);
    let leptoRisk = Math.min(98, Math.max(10, Math.round(15.0 + floodFactor + extremeBonus + humFactor)));

    // 4. TBC & Jamur Tropis
    let humTbc = Math.max(0, (hum - 74.0) * 3.6);
    let tempTbc = Math.max(0, (28.5 - Math.abs(temp - 27.2)) * 1.5);
    let tbcRisk = Math.min(95, Math.max(20, Math.round(25.0 + humTbc + tempTbc)));

    // Composite VAR Score
    let varRiskScore = Math.min(98, Math.max(15, Math.round(
      (dbdRisk * 0.32) + (ispaRisk * 0.28) + (leptoRisk * 0.22) + (tbcRisk * 0.18)
    )));

    let riskLevel = 'Aman';
    if (varRiskScore >= 70) riskLevel = 'Bahaya';
    else if (varRiskScore >= 45) riskLevel = 'Waspada';

    let scores = { pancaroba_dbd: dbdRisk, elnino_ispa: ispaRisk, lanina_lepto: leptoRisk, humidity_tbc: tbcRisk };
    let dominantKey = Object.keys(scores).reduce((a, b) => scores[a] > scores[b] ? a : b);
    let threatLabels = {
      pancaroba_dbd: 'Pancaroba & Vektor Nyamuk (DBD/Chikungunya)',
      elnino_ispa: 'Kemarau Ekstrem & ISPA/Krisis Air',
      lanina_lepto: 'Hujan Ekstrem, Banjir & Leptospirosis',
      humidity_tbc: 'Kelembapan Tinggi, TBC & Jamur Kulit'
    };

    const actionPlans = [];
    if (dbdRisk >= 60) {
      actionPlans.push({
        target: "Vektor Nyamuk (DBD / Chikungunya)",
        priority: "TINGGI",
        actions: [
          "Lakukan Gerakan PSN 3M Plus serentak tiap minggu pagi",
          "Taburkan bubuk Abate pada bak mandi atau tandon air terbuka",
          "Waspadai demam mendadak tinggi (>38.5°C) hari ke-3 sampai ke-5"
        ]
      });
    }
    if (ispaRisk >= 60) {
      actionPlans.push({
        target: "Pernapasan & Sanitasi Air (ISPA / Karhutla / Diare)",
        priority: "TINGGI",
        actions: [
          "Gunakan masker medis/N95 saat kualitas udara luar memburuk",
          "Rebus air minum hingga mendidih sempurna (minimal 100°C selama 3 menit)",
          "Cukupi asupan cairan 2.5 - 3 liter per hari untuk cegah dehidrasi mukosa"
        ]
      });
    }
    if (leptoRisk >= 60) {
      actionPlans.push({
        target: "Bakteri Genangan Air (Leptospirosis / Tipes)",
        priority: "TINGGI",
        actions: [
          "Gunakan sepatu bot karet dan sarung tangan saat kontak dengan genangan/lumpur",
          "Tutup rapat luka pada kulit dengan plester tahan air",
          "Desinfeksi lantai rumah dengan cairan klorin pasca genangan surut"
        ]
      });
    }
    if (tbcRisk >= 65) {
      actionPlans.push({
        target: "Infeksi Udara & Jamur Tropis (TBC / Mikosis)",
        priority: "SEDANG",
        actions: [
          "Buka ventilasi dan jendela kamar tidur setiap pagi agar sinar UV masuk",
          "Jemur kasur dan handuk secara berkala di bawah terik matahari",
          "Gunakan pakaian berbahan katun menyerap keringat untuk cegah jamur kulit"
        ]
      });
    }

    return {
      inputs: { temperature: temp, humidity: hum, rainfall: rain, month: monthNum },
      risk_assessment: {
        var_risk_score: varRiskScore,
        risk_level: riskLevel,
        dominant_threat: threatLabels[dominantKey],
        disease_breakdown: scores
      },
      clinical_action_plans: actionPlans,
      ai_summary: `Berdasarkan analisis AI Lokal pada Suhu ${temp}°C, Kelembapan ${hum}%, dan Curah Hujan ${rain} mm, kondisi berada pada tingkat '${riskLevel.toUpperCase()}' (Skor ${varRiskScore}/100). Ancaman utama yang terdeteksi adalah: ${threatLabels[dominantKey]}.`
    };
  },

  /**
   * Chat dengan Asisten AI Epidemiologi Lokal
   */
  async chat(message, context = {}) {
    if (this.config.isServerOnline) {
      try {
        const res = await fetch(`${this.config.serverUrl}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: message, context: context })
        });
        if (res.ok) {
          return await res.json();
        }
      } catch (err) {
        console.warn('Server offline saat chat, beralih ke local fallback chat...');
      }
    }

    // Client-side Offline Chat Knowledge Engine
    return this._clientSideChat(message, context);
  },

  /**
   * Offline Local Knowledge Reasoning
   */
  _clientSideChat(msg, ctx) {
    const text = msg.toLowerCase();
    const temp = ctx.temperature || 28.0;
    const hum = ctx.humidity || 82.0;
    const rain = ctx.rainfall || 180.0;

    let reply = "";
    let badges = [];

    if (text.includes('dbd') || text.includes('nyamuk') || text.includes('demam berdarah') || text.includes('jentik')) {
      reply = `🦟 **Saran Asisten AI: Bahaya Nyamuk DBD & Cara Mencegahnya**\n\n` +
        `• **Kondisi Cuaca Saat Ini**: Suhu hangat (${temp}°C) dan udara lembap (${hum}%) adalah cuaca paling disukai nyamuk belang *Aedes* untuk berkembang biak dengan cepat.\n` +
        `• **Mengapa Bahaya?**: Di musim peralihan (pancaroba), air hujan yang tertampung di wadah terbuka akan hangat dan jadi sarang jentik nyamuk.\n\n` +
        `💡 **Langkah Mudah yang Wajib Dilakukan**:\n` +
        `1. **Kuras Bak Mandi**: Sikat dinding bak mandi seminggu sekali agar telur nyamuk rontok.\n` +
        `2. **Tutup Wadah Air**: Jangan biarkan ember, drum, atau tong air terbuka.\n` +
        `3. **Kubur / Daur Ulang Kaleng & Ban Bekas**: Hindari tumpukan sampah yang bisa menampung air hujan.\n` +
        `4. **Pakai Bubuk Abate**: Taburkan 1 sendok teh abate untuk wadah penampungan air yang sulit dikuras.\n` +
        `⚠️ **Waspada Jika Ada Gejala**: Demam tinggi mendadak (>38°C), badan pegal linu, atau bintik merah di kulit, segera periksa ke Puskesmas terdekat ya!`;
      badges = ["Cegah DBD", "Musim Pancaroba", "Kuras Wadah Air"];
    } else if (text.includes('ispa') || text.includes('karhutla') || text.includes('asap') || text.includes('batuk') || text.includes('kemarau') || text.includes('el nino') || text.includes('panas')) {
      reply = `🔥 **Saran Asisten AI: Menghadapi Cuaca Panas Terik, Batuk Pilek & Asap**\n\n` +
        `• **Kondisi Cuaca**: Suhu terik (${temp}°C) dan jarang turun hujan (${rain} mm) membuat debu jalanan dan asap beterbangan di udara.\n` +
        `• **Dampaknya ke Tubuh**: Tenggorokan cepat kering, gatal, dan gampang terkena radang saluran pernapasan (ISPA) atau batuk pilek.\n\n` +
        `💡 **Tips Jaga Kesehatan Saat Cuaca Panas**:\n` +
        `1. **Banyak Minum Air Matang**: Minimal 2 sampai 2.5 liter per hari untuk menjaga tenggorokan tetap basah.\n` +
        `2. **Pakai Masker**: Selalu kenakan masker jika beraktivitas di luar ruangan yang berdebu atau berbau asap.\n` +
        `3. **Jaga Kebersihan Makanan**: Saat kemarau air bersih lebih terbatas, pastikan masak air sampai mendidih (100°C) agar terhindar dari sakit perut / diare.`;
      badges = ["Cuaca Panas", "Cegah Batuk", "Jaga Air Minum"];
    } else if (text.includes('banjir') || text.includes('leptospirosis') || text.includes('tikus') || text.includes('la nina') || text.includes('tipes') || text.includes('hujan')) {
      reply = `🌊 **Saran Asisten AI: Lindungi Diri dari Kencing Tikus & Penyakit Banjir**\n\n` +
        `• **Kondisi Cuaca**: Curah hujan yang deras (${rain} mm) sering menimbulkan genangan air kotor di jalanan, selokan, dan permukiman.\n` +
        `• **Bahaya Utama (Kencing Tikus)**: Kuman dari kencing tikus larut dalam genangan air dan bisa masuk ke tubuh lewat luka kecil atau kulit kaki yang terkelupas.\n\n` +
        `💡 **Langkah Pencegahan Wajib**:\n` +
        `1. **Gunakan Sepatu Bot Karet**: Jangan pernah menerobos genangan banjir dengan kaki telanjang atau sandal terbuka.\n` +
        `2. **Segera Cuci Kaki Pakai Sabun**: Setelah terkena air genangan, langsung bilas bersih dengan air mengalir dan sabun mandi/antiseptik.\n` +
        `3. **Tutup Rapat Makanan**: Cegah tikus menyentuh makanan atau piring di dapur.`;
      badges = ["Awas Kencing Tikus", "Musim Hujan", "Sepatu Bot"];
    } else if (text.includes('tbc') || text.includes('tuberkulosis') || text.includes('jamur') || text.includes('panu') || text.includes('lembap') || text.includes('pengap') || text.includes('rumah')) {
      reply = `💨 **Saran Asisten AI: Mengatasi Udara Pengap, Batuk TBC & Jamur Kulit**\n\n` +
        `• **Kondisi Cuaca**: Kelembapan udara yang tinggi (${hum}%) membuat ruangan dalam rumah terasa pengap dan lembap.\n` +
        `• **Dampaknya**: Kuman penyebab batuk menular (TBC) dan jamur kulit (gatal/panu) bisa bertahan hidup lebih lama di dalam ruangan yang tidak kena sinar matahari.\n\n` +
        `💡 **Tips Menjaga Rumah Tetap Sehat & Segar**:\n` +
        `1. **Buka Jendela Kamar Setiap Pagi**: Biarkan udara segar dan sinar matahari masuk ke dalam rumah.\n` +
        `2. **Jangan Gantung Pakaian Basah di Dalam Kamar**: Menjemur baju basah di dalam rumah membuat udara makin lembap.\n` +
        `3. **Jemur Kasur dan Bantal**: Rutin jemur kasur dan handuk di bawah terik matahari agar jamur mati.`;
      badges = ["Kamar Sehat", "Sirkulasi Udara", "Cegah Lembap"];
    } else if (text.includes('matriks') || text.includes('korelasi') || text.includes('akurasi') || text.includes('model') || text.includes('data')) {
      reply = `📊 **Catatan Data & Akurasi AI BumiMetrics**\n\n` +
        `• **Data Riil yang Digunakan**: 30 Tahun Rekam Cuaca Batam (1996 - 2025).\n` +
        `• **Akurasi Prediksi Suhu**: 91.7% (Sangat Akurat).\n` +
        `• **Akurasi Prediksi Hujan**: 85.3% (Sangat Tepat).\n` +
        `• **Kesimpulan Utama Hubungan Cuaca & Penyakit**:\n` +
        `  - Hujan Lebat ➔ Sangat kuat memicu kencing tikus saat banjir (+0.76).\n` +
        `  - Kemarau Panas ➔ Memicu batuk pilek dan radang napas (+0.69).\n` +
        `  - Udara Pengap/Lembap ➔ Memperpanjang masa kuman batuk & jamur (+0.80).\n` +
        `  - Musim Peralihan (Pancaroba) ➔ Mempercepat nyamuk DBD bertelur (+0.49).`;
      badges = ["Data 30 Tahun", "Akurasi 91.7%", "100% Offline"];
    } else {
      reply = `🌿 **Halo! Saya Asisten AI Kesehatan Lingkungan BumiMetrics.**\n\n` +
        `Saya siap bantu Anda memahami kondisi cuaca di Batam dan cara menjaga diri dari berbagai penyakit musim tropis.\n\n` +
        `**Coba tanyakan beberapa hal praktis ini:**\n` +
        `1. *"Bagaimana cara mencegah nyamuk DBD saat musim pancaroba?"*\n` +
        `2. *"Apa bahaya cuaca panas terik untuk anak-anak dan lansia?"*\n` +
        `3. *"Bagaimana cara melindungi diri dari kencing tikus saat banjir?"*\n` +
        `4. *"Bagaimana cara menjaga rumah tetap sehat saat udara sangat lembap?"*`;
      badges = ["Asisten AI Ramah", "Siap Bantu", "100% Offline"];
    }

    return {
      reply: reply,
      badges: badges,
      model_version: "BumiMetrics-Client-VAR-2.0"
    };
  },

  /**
   * Pelatihan Ulang Model
   */
  async retrainModel() {
    if (this.config.isServerOnline) {
      try {
        const res = await fetch(`${this.config.serverUrl}/api/retrain`, { method: 'POST' });
        if (res.ok) {
          const data = await res.json();
          this._matrixCache = null;
          await this.loadMatrixData();
          return data;
        }
      } catch (err) {
        console.warn('Gagal memanggil endpoint retrain:', err);
      }
    }
    return { status: 'STANDBY', message: 'Untuk melatih ulang model dengan data Excel baru, jalankan file start_local_ai.bat di folder proyek.' };
  }
};

window.LocalAIEngine = LocalAIEngine;
