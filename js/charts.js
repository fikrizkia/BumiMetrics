/**
 * ===================================================================
 * BumiMetrics - Chart.js Visualization Engine
 * Font: Plus Jakarta Sans (Global Chart Defaults)
 * Interactive Multi-Variable Time-Series, Heatmaps & Risk Breakdowns
 * ===================================================================
 */

// Set Plus Jakarta Sans as global default font for all Chart.js instances
if (window.Chart) {
  Chart.defaults.font.family = "'Plus Jakarta Sans', sans-serif";
  Chart.defaults.color = '#334155';
}

const BumiCharts = {
  instances: {},

  /**
   * Inisialisasi Grafik Time Series Multi-Variabel
   */
  renderTimeSeriesChart(canvasId, timeSeriesData, activeVariables = { temp: true, hum: true, rain: true, risk: true }) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;

    if (this.instances[canvasId]) {
      this.instances[canvasId].destroy();
    }

    const datasets = [];

    // Dataset 1: Suhu (°C)
    if (activeVariables.temp) {
      datasets.push({
        label: 'Suhu Rata-rata (°C)',
        data: timeSeriesData.temperatures,
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239, 68, 68, 0.08)',
        borderWidth: 2.5,
        tension: 0.35,
        yAxisID: 'yTemp',
        pointRadius: 3,
        pointHoverRadius: 6
      });
    }

    // Dataset 2: Kelembapan (%)
    if (activeVariables.hum) {
      datasets.push({
        label: 'Kelembapan Udara (%)',
        data: timeSeriesData.humidities,
        borderColor: '#0284c7',
        backgroundColor: 'rgba(2, 132, 199, 0.06)',
        borderWidth: 2,
        borderDash: [4, 4],
        tension: 0.3,
        yAxisID: 'yPercent',
        pointRadius: 2.5,
        pointHoverRadius: 5
      });
    }

    // Dataset 3: Curah Hujan (mm)
    if (activeVariables.rain) {
      datasets.push({
        label: 'Curah Hujan (mm)',
        data: timeSeriesData.rainfalls,
        borderColor: '#06b6d4',
        backgroundColor: 'rgba(6, 182, 212, 0.15)',
        fill: true,
        borderWidth: 1.5,
        tension: 0.3,
        yAxisID: 'yRain',
        pointRadius: 2,
        pointHoverRadius: 5
      });
    }

    // Dataset 4: Indeks Risiko VAR (0 - 100)
    if (activeVariables.risk) {
      datasets.push({
        label: 'Indeks Risiko Kesehatan VAR',
        data: timeSeriesData.riskScores,
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.12)',
        borderWidth: 3,
        tension: 0.35,
        yAxisID: 'yPercent',
        pointRadius: 3.5,
        pointHoverRadius: 7,
        pointBackgroundColor: '#006c49'
      });
    }

    this.instances[canvasId] = new Chart(ctx, {
      type: 'line',
      data: {
        labels: timeSeriesData.years,
        datasets: datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false
        },
        plugins: {
          legend: {
            display: true,
            position: 'top',
            labels: {
              usePointStyle: true,
              font: { family: 'Plus Jakarta Sans', size: 12, weight: '600' },
              padding: 16
            }
          },
          tooltip: {
            backgroundColor: '#0f172a',
            titleFont: { family: 'Plus Jakarta Sans', size: 13, weight: '700' },
            bodyFont: { family: 'Plus Jakarta Sans', size: 12 },
            padding: 12,
            cornerRadius: 8,
            boxPadding: 6
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { font: { family: 'Plus Jakarta Sans', size: 11, weight: '500' }, maxTicksLimit: 15 }
          },
          yPercent: {
            type: 'linear',
            position: 'left',
            min: 0,
            max: 100,
            title: { display: true, text: 'Persentase / Skor (0-100)', font: { family: 'Plus Jakarta Sans', size: 11, weight: '700' } },
            ticks: { font: { family: 'Plus Jakarta Sans', size: 10 } },
            grid: { color: '#f1f5f9' }
          },
          yTemp: {
            type: 'linear',
            position: 'right',
            min: 24,
            max: 34,
            title: { display: true, text: 'Suhu (°C)', font: { family: 'Plus Jakarta Sans', size: 11, weight: '700' } },
            ticks: { font: { family: 'Plus Jakarta Sans', size: 10 } },
            grid: { display: false }
          },
          yRain: {
            display: false,
            min: 0,
            max: 500
          }
        }
      }
    });
  },

  /**
   * Inisialisasi Grafik Profil Bulanan (Jan - Des) untuk Tahun Terpilih
   */
  renderMonthlyBarChart(canvasId, monthlyData) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;

    if (this.instances[canvasId]) {
      this.instances[canvasId].destroy();
    }

    const labels = monthlyData.map(d => d.month_name.slice(0, 3));
    const riskScores = monthlyData.map(d => d.var_risk_score);
    
    const backgroundColors = monthlyData.map(d => {
      if (d.var_risk_score >= 70) return '#ba1a1a';
      if (d.var_risk_score >= 45) return '#e29100';
      return '#10b981';
    });

    this.instances[canvasId] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Skor Risiko Bulanan',
          data: riskScores,
          backgroundColor: backgroundColors,
          borderRadius: 6,
          maxBarThickness: 32
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            titleFont: { family: 'Plus Jakarta Sans', size: 13, weight: '700' },
            bodyFont: { family: 'Plus Jakarta Sans', size: 12 },
            callbacks: {
              afterLabel: function(context) {
                const item = monthlyData[context.dataIndex];
                return [
                  `Status: ${item.risk_level}`,
                  `Ancaman Utama: ${item.dominant_threat}`,
                  `Suhu: ${item.temperature}°C | Curah Hujan: ${item.rainfall}mm`
                ];
              }
            }
          }
        },
        scales: {
          x: { grid: { display: false }, ticks: { font: { family: 'Plus Jakarta Sans', size: 11, weight: '600' } } },
          y: { min: 0, max: 100, ticks: { font: { family: 'Plus Jakarta Sans', size: 10 }, stepSize: 20 }, grid: { color: '#f1f5f9' } }
        }
      }
    });
  },

  /**
   * Inisialisasi Grafik Radar 4 Skenario Penyakit
   */
  renderDiseaseRadarChart(canvasId, diseaseBreakdown) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;

    if (this.instances[canvasId]) {
      this.instances[canvasId].destroy();
    }

    this.instances[canvasId] = new Chart(ctx, {
      type: 'radar',
      data: {
        labels: [
          'Pancaroba (DBD/Zika)',
          'El Niño (ISPA/Karhutla)',
          'La Niña (Leptospirosis/Banjir)',
          'Kelembapan Tinggi (TBC/Jamur)'
        ],
        datasets: [{
          label: 'Probabilitas Risiko (%)',
          data: [
            diseaseBreakdown.pancaroba_dbd,
            diseaseBreakdown.elnino_ispa,
            diseaseBreakdown.lanina_lepto,
            diseaseBreakdown.humidity_tbc
          ],
          backgroundColor: 'rgba(2, 132, 199, 0.2)',
          borderColor: '#0284c7',
          pointBackgroundColor: '#006398',
          pointBorderColor: '#ffffff',
          pointHoverBackgroundColor: '#ffffff',
          pointHoverBorderColor: '#0284c7',
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          r: {
            angleLines: { color: '#e2e8f0' },
            grid: { color: '#f1f5f9' },
            suggestedMin: 0,
            suggestedMax: 100,
            pointLabels: {
              font: { family: 'Plus Jakarta Sans', size: 11, weight: '600' },
              color: '#334155'
            }
          }
        },
        plugins: {
          legend: { display: false }
        }
      }
    });
  }
};

window.BumiCharts = BumiCharts;
