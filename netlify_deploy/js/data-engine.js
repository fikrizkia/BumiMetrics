/**
 * ===================================================================
 * BumiMetrics - Climate & Health Data Engine (1996 - 2026)
 * Real Extracted Data Ingestion, VAR Time-Series, & Local AI Adapter
 * ===================================================================
 */

const ClimateDataEngine = {
  // Configuration for Live ML Backend & Local JSON Storage
  config: {
    useLiveApi: true,
    apiBaseUrl: 'http://127.0.0.1:8765/api',
    localJsonPath: './data/trained_var_climate_1996_2026.json',
    matrixJsonPath: './data/disease_matrix.json'
  },

  // Cache in-memory dataset 1996-2026
  _dataCache: null,
  _matrixCache: null,

  /**
   * Mengambil data untuk tahun dan bulan tertentu (1996-2026)
   */
  async getDataset() {
    if (this._dataCache) {
      return this._dataCache;
    }

    // 1. Coba ambil dari Local AI Server (FastAPI) jika di lingkungan localhost
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.protocol === 'file:';
    if (this.config.useLiveApi && isLocalhost) {
      try {
        const response = await fetch(`${this.config.apiBaseUrl}/dataset`, {
          signal: AbortSignal.timeout(1500)
        });
        if (response.ok) {
          const liveData = await response.json();
          this._dataCache = liveData;
          console.log('Dataset berhasil dimuat dari Local AI FastAPI Server (1996 - 2026)');
          return liveData;
        }
      } catch (err) {
        // Fallthrough ke local file
      }
    }

    // 2. Coba ambil dari file JSON hasil training riil
    try {
      const jsonResponse = await fetch(this.config.localJsonPath);
      if (jsonResponse.ok) {
        const trainedData = await jsonResponse.json();
        this._dataCache = trainedData;
        console.log('✅ Dataset berhasil dimuat dari file data/trained_var_climate_1996_2026.json');
        return trainedData;
      }
    } catch (err) {
      console.warn('Gagal memuat trained JSON, beralih ke generator internal:', err);
    }

    // 3. Fallback ke generator sintetis internal
    this._dataCache = this._generateHistoricalData();
    return this._dataCache;
  },

  /**
   * Mengambil data untuk satu tahun spesifik
   */
  async getYearData(year) {
    const dataset = await this.getDataset();
    return dataset[year] || dataset[2024] || null;
  },

  /**
   * Mengambil ringkasan time-series seluruh tahun (1996 - 2026)
   */
  async getTimeSeriesSummary() {
    const dataset = await this.getDataset();
    const years = Object.keys(dataset).map(Number).sort((a, b) => a - b);
    
    const summary = {
      years: [],
      temperatures: [],
      humidities: [],
      rainfalls: [],
      riskScores: []
    };

    years.forEach(yr => {
      const yrData = dataset[yr];
      summary.years.push(yr);
      summary.temperatures.push(yrData.annual_summary.avg_temperature);
      summary.humidities.push(yrData.annual_summary.avg_humidity);
      summary.rainfalls.push(yrData.annual_summary.avg_rainfall);
      summary.riskScores.push(yrData.annual_summary.avg_var_risk_score);
    });

    return summary;
  },

  /**
   * Mengambil matriks korelasi & kausalitas penyakit
   */
  async getDiseaseMatrix() {
    if (this._matrixCache) return this._matrixCache;

    if (this.config.useLiveApi) {
      try {
        const response = await fetch(`${this.config.apiBaseUrl}/matrix`, {
          signal: AbortSignal.timeout(2000)
        });
        if (response.ok) {
          this._matrixCache = await response.json();
          return this._matrixCache;
        }
      } catch (e) {}
    }

    try {
      const jsonRes = await fetch(this.config.matrixJsonPath);
      if (jsonRes.ok) {
        this._matrixCache = await jsonRes.json();
        return this._matrixCache;
      }
    } catch (e) {}

    return null;
  },

  /**
   * Generator Dataset Iklim Indonesia (1996 - 2026) - Fallback
   */
  _generateHistoricalData() {
    const dataset = {};
    const monthNames = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];

    const climateEvents = {
      1997: { type: 'El Nino Kuat', tempOffset: 1.5, rainFactor: 0.35, isHazeYear: true },
      1998: { type: 'El Nino Super & Transisi', tempOffset: 1.3, rainFactor: 0.5, isHazeYear: true },
      1999: { type: 'La Nina Moderat', tempOffset: -0.3, rainFactor: 1.3 },
      2006: { type: 'El Nino Moderat', tempOffset: 0.8, rainFactor: 0.6, isHazeYear: true },
      2010: { type: 'La Nina Kuat', tempOffset: -0.4, rainFactor: 1.55 },
      2015: { type: 'El Nino Ekstrem', tempOffset: 1.6, rainFactor: 0.3, isHazeYear: true },
      2016: { type: 'Transisi Panas', tempOffset: 0.9, rainFactor: 0.85 },
      2019: { type: 'El Nino Lemah & IOD Positif', tempOffset: 0.7, rainFactor: 0.55, isHazeYear: true },
      2020: { type: 'La Nina Triple-Dip', tempOffset: -0.2, rainFactor: 1.4 },
      2021: { type: 'La Nina Berlanjut', tempOffset: -0.2, rainFactor: 1.35 },
      2022: { type: 'La Nina Basah', tempOffset: -0.1, rainFactor: 1.3 },
      2023: { type: 'El Nino Kuat', tempOffset: 1.4, rainFactor: 0.4, isHazeYear: true },
      2024: { type: 'El Nino Moderat ke Normal', tempOffset: 0.9, rainFactor: 0.75 },
      2025: { type: 'Pancaroba Intens & Normal', tempOffset: 0.4, rainFactor: 1.05 },
      2026: { type: 'Proyeksi Iklim Hangat & Hujan Fluktuatif', tempOffset: 0.6, rainFactor: 1.1 }
    };

    for (let year = 1996; year <= 2026; year++) {
      const event = climateEvents[year] || { type: 'Normal Tropis', tempOffset: 0, rainFactor: 1.0 };
      const climateWarmingTrend = ((year - 1996) / 30) * 0.65;
      
      const monthly = [];
      let totalTemp = 0, totalHum = 0, totalRain = 0, totalRisk = 0;

      for (let m = 0; m < 12; m++) {
        const monthNum = m + 1;
        const monthName = monthNames[m];

        let baseRainfall = 180;
        let seasonType = 'Pancaroba';

        if (m === 11 || m === 0 || m === 1) {
          baseRainfall = 280 + Math.sin(m) * 30;
          seasonType = 'Musim Hujan';
        } else if (m >= 5 && m <= 7) {
          baseRainfall = 65 + Math.cos(m) * 20;
          seasonType = 'Musim Kemarau';
        } else if (m >= 2 && m <= 4) {
          baseRainfall = 195 + Math.sin(m) * 25;
          seasonType = 'Pancaroba (Hujan ke Kemarau)';
        } else {
          baseRainfall = 210 + Math.cos(m) * 20;
          seasonType = 'Pancaroba (Kemarau ke Hujan)';
        }

        let rainfall = Math.round(baseRainfall * event.rainFactor + (Math.sin(year + m) * 15));
        if (rainfall < 10) rainfall = 10;

        let baseTemp = 27.2 + (m >= 4 && m <= 8 ? 0.9 : 0.2);
        let temperature = Number((baseTemp + climateWarmingTrend + event.tempOffset + (Math.sin(m * 2) * 0.3)).toFixed(1));

        let baseHum = 84 - (rainfall < 80 ? 10 : 0) + (rainfall > 250 ? 4 : 0);
        let humidity = Math.min(92, Math.max(68, Math.round(baseHum - (event.tempOffset * 3) + (Math.cos(m) * 2))));

        let dbdRisk = 30;
        if (seasonType.includes('Pancaroba') || (rainfall >= 120 && rainfall <= 240 && temperature >= 27.5)) {
          dbdRisk = Math.min(95, Math.round(65 + (temperature - 27.0) * 12 + (rainfall / 10)));
        } else if (rainfall > 260) {
          dbdRisk = 55;
        } else {
          dbdRisk = 35;
        }

        let ispaRisk = 25;
        if (rainfall < 70 && temperature >= 28.5) {
          ispaRisk = Math.min(98, Math.round(70 + (29.0 - (rainfall / 10)) * 6 + (event.isHazeYear ? 20 : 0)));
        } else if (rainfall < 100) {
          ispaRisk = 52;
        } else {
          ispaRisk = 30;
        }

        let leptoRisk = 20;
        if (rainfall > 270) {
          leptoRisk = Math.min(96, Math.round(65 + ((rainfall - 250) / 4) + (humidity > 85 ? 10 : 0)));
        } else if (rainfall > 190) {
          leptoRisk = 50;
        } else {
          leptoRisk = 25;
        }

        let tbcRisk = Math.min(92, Math.round(40 + (humidity - 70) * 2.2));

        let varRiskScore = Math.min(98, Math.max(15, Math.round(
          (dbdRisk * 0.32) + (ispaRisk * 0.28) + (leptoRisk * 0.22) + (tbcRisk * 0.18)
        )));

        let riskLevel = 'Aman';
        if (varRiskScore >= 72) riskLevel = 'Bahaya';
        else if (varRiskScore >= 45) riskLevel = 'Waspada';

        let dominantThreat = 'Stabil';
        const maxScore = Math.max(dbdRisk, ispaRisk, leptoRisk, tbcRisk);
        if (maxScore === dbdRisk) dominantThreat = 'Pancaroba & Vektor Nyamuk (DBD/Chikungunya)';
        else if (maxScore === ispaRisk) dominantThreat = 'Kemarau Ekstrem & ISPA/Krisis Air';
        else if (maxScore === leptoRisk) dominantThreat = 'Hujan Ekstrem, Banjir & Leptospirosis';
        else dominantThreat = 'Kelembapan Tinggi, TBC & Jamur Kulit';

        const monthObj = {
          month: monthNum,
          month_name: monthName,
          temperature: temperature,
          humidity: humidity,
          rainfall: rainfall,
          season_type: seasonType,
          var_risk_score: varRiskScore,
          risk_level: riskLevel,
          dominant_threat: dominantThreat,
          disease_breakdown: {
            pancaroba_dbd: dbdRisk,
            elnino_ispa: ispaRisk,
            lanina_lepto: leptoRisk,
            humidity_tbc: tbcRisk
          }
        };

        monthly.push(monthObj);

        totalTemp += temperature;
        totalHum += humidity;
        totalRain += rainfall;
        totalRisk += varRiskScore;
      }

      const sortedByRisk = [...monthly].sort((a, b) => b.var_risk_score - a.var_risk_score);
      const peakMonth = sortedByRisk[0];

      dataset[year] = {
        year: year,
        climate_anomaly: event.type,
        annual_summary: {
          avg_temperature: Number((totalTemp / 12).toFixed(1)),
          avg_humidity: Math.round(totalHum / 12),
          avg_rainfall: Math.round(totalRain / 12),
          total_rainfall: totalRain,
          avg_var_risk_score: Math.round(totalRisk / 12),
          peak_risk_month: peakMonth.month_name,
          peak_risk_score: peakMonth.var_risk_score,
          primary_health_threat: peakMonth.dominant_threat
        },
        monthly: monthly
      };
    }

    return dataset;
  }
};

window.ClimateDataEngine = ClimateDataEngine;
