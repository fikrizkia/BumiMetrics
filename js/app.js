/**
 * ===================================================================
 * BumiMetrics - Core Application Controller
 * State Management, Navigation, Timeline Playback & Reactive UI Binding
 * ===================================================================
 */

const BumiApp = {
  state: {
    currentYear: 2024,
    selectedMonthIndex: 0, // 0 = Jan, 11 = Des
    currentTab: 'overview',
    isPlayingTimeline: false,
    timelineInterval: null,
    activeChartVars: { temp: true, hum: true, rain: true, risk: true }
  },

  /**
   * Initial bootstrap
   */
  async init() {
    console.log('Initializing BumiMetrics Dashboard (1996 - 2026)...');
    
    // Inisialisasi Event Listener Navigasi & Kontrol
    this.setupSidebarToggle();
    this.setupNavigation();
    this.setupTimelineController();
    this.setupModalControls();
    this.setupChartVariableToggles();

    // Inisialisasi Modul Komunitas & Studio AI Lokal
    if (window.BumiCommunity) {
      BumiCommunity.init();
    }
    if (window.LocalAIEngine) {
      await LocalAIEngine.init();
      await this.setupStudioAIEvents();
    }

    // Muat data awal tahun
    await this.loadYearData(this.state.currentYear);
    await this.renderGlobalTimeSeriesChart();
  },

  /**
   * Kontrol Buka/Tutup Sidebar (Open & Close / Minimize & Expand)
   */
  setupSidebarToggle() {
    const sidebar = document.getElementById('mainSidebar');
    const toggleBtn = document.getElementById('sidebarToggleBtn');
    const mobileMenuBtn = document.getElementById('topNavMobileMenuBtn');
    const backdrop = document.getElementById('sidebarBackdrop');

    // 1. Muat preferensi status sidebar sebelumnya (localStorage)
    const isSavedCollapsed = localStorage.getItem('bumi_sidebar_collapsed') === 'true';
    if (isSavedCollapsed && sidebar && window.innerWidth >= 1024) {
      sidebar.classList.add('collapsed');
      if (toggleBtn) {
        const icon = toggleBtn.querySelector('.material-symbols-outlined');
        if (icon) icon.textContent = 'menu';
      }
    }

    // 2. Event Tombol Toggle Desktop
    if (toggleBtn && sidebar) {
      toggleBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const isCollapsed = sidebar.classList.toggle('collapsed');
        const icon = toggleBtn.querySelector('.material-symbols-outlined');
        if (icon) {
          icon.textContent = isCollapsed ? 'menu' : 'menu_open';
        }
        localStorage.setItem('bumi_sidebar_collapsed', isCollapsed);
      });
    }

    // 3. Event Tombol Menu Mobile / Tablet Drawer
    if (mobileMenuBtn && sidebar && backdrop) {
      mobileMenuBtn.addEventListener('click', (e) => {
        e.preventDefault();
        sidebar.classList.toggle('open');
        backdrop.classList.toggle('active');
      });

      backdrop.addEventListener('click', () => {
        sidebar.classList.remove('open');
        backdrop.classList.remove('active');
      });
    }
  },

  /**
   * Setup Navigasi Antar Tab (SPA View Switcher)
   */
  setupNavigation() {
    const navLinks = document.querySelectorAll('[data-tab]');
    const sidebar = document.getElementById('mainSidebar');
    const backdrop = document.getElementById('sidebarBackdrop');

    navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const tabTarget = link.getAttribute('data-tab');
        this.switchTab(tabTarget);

        // Tutup drawer di layar HP jika terbuka
        if (sidebar && backdrop && window.innerWidth < 1024) {
          sidebar.classList.remove('open');
          backdrop.classList.remove('active');
        }
      });
    });
  },

  switchTab(tabName) {
    this.state.currentTab = tabName;

    // Update active class on side & mobile navigation
    document.querySelectorAll('[data-tab]').forEach(el => {
      if (el.getAttribute('data-tab') === tabName) {
        el.classList.add('active');
      } else {
        el.classList.remove('active');
      }
    });

    // Update visibility of tab panes
    document.querySelectorAll('.tab-pane').forEach(pane => {
      pane.classList.remove('active');
    });

    const activePane = document.getElementById(`tab-${tabName}`);
    if (activePane) {
      activePane.classList.add('active');
    }

    // Scroll konten ke atas saat berpindah tab
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
      mainContent.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Render ulang grafik spesifik tab jika diperlukan
    if (tabName === 'overview' || tabName === 'climate-trends') {
      setTimeout(() => {
        this.renderGlobalTimeSeriesChart();
      }, 100);
    }
  },

  /**
   * Setup Slider & Playback Timeline (1996 - 2026)
   */
  setupTimelineController() {
    const slider = document.getElementById('yearTimelineSlider');
    const yearSelect = document.getElementById('yearSelectDropdown');
    const playBtn = document.getElementById('playTimelineBtn');

    if (slider) {
      slider.addEventListener('input', (e) => {
        const year = parseInt(e.target.value, 10);
        this.setYear(year);
      });
    }

    if (yearSelect) {
      yearSelect.addEventListener('change', (e) => {
        const year = parseInt(e.target.value, 10);
        this.setYear(year);
      });
    }

    if (playBtn) {
      playBtn.addEventListener('click', () => {
        this.toggleTimelinePlayback();
      });
    }
  },

  /**
   * Mengubah Tahun Aktif & Memperbarui Seluruh Komponen UI
   */
  async setYear(year) {
    this.state.currentYear = year;

    // Sync input controls
    const slider = document.getElementById('yearTimelineSlider');
    const yearSelect = document.getElementById('yearSelectDropdown');
    const currentYearBadge = document.getElementById('currentYearDisplay');

    if (slider) slider.value = year;
    if (yearSelect) yearSelect.value = year;
    if (currentYearBadge) currentYearBadge.textContent = year;

    await this.loadYearData(year);
  },

  /**
   * Play/Pause Otomatis Animasi Tahun 1996 s/d 2026
   */
  toggleTimelinePlayback() {
    const playBtn = document.getElementById('playTimelineBtn');
    const playIcon = playBtn ? playBtn.querySelector('.material-symbols-outlined') : null;
    const playText = playBtn ? playBtn.querySelector('span:last-child') : null;

    if (this.state.isPlayingTimeline) {
      // Stop Playback
      clearInterval(this.state.timelineInterval);
      this.state.isPlayingTimeline = false;
      if (playIcon) playIcon.textContent = 'play_arrow';
      if (playText) playText.textContent = 'Play Timeline (1996-2026)';
    } else {
      // Start Playback
      this.state.isPlayingTimeline = true;
      if (playIcon) playIcon.textContent = 'pause';
      if (playText) playText.textContent = 'Pause Playback';

      this.state.timelineInterval = setInterval(() => {
        let nextYear = this.state.currentYear + 1;
        if (nextYear > 2026) nextYear = 1996;
        this.setYear(nextYear);
      }, 1200);
    }
  },

  /**
   * Memuat Data Tahun dan Memperbarui Metrik, Kartu Skenario, & Heatmap
   */
  async loadYearData(year) {
    const yearData = await ClimateDataEngine.getYearData(year);
    if (!yearData) return;

    const summary = yearData.annual_summary;
    const monthly = yearData.monthly;
    const activeMonth = monthly[this.state.selectedMonthIndex] || monthly[0];

    // 1. Update Status Anomali Iklim
    const climateStatusBadge = document.getElementById('climateStatusBadge');
    const climateStatusText = document.getElementById('climateStatusText');
    const climatePulse = document.getElementById('climateStatusPulse');

    if (climateStatusText) {
      climateStatusText.textContent = `Iklim ${year}: ${yearData.climate_anomaly}`;
    }

    if (climateStatusBadge && climatePulse) {
      climateStatusBadge.className = 'climate-status-badge';
      climatePulse.className = 'pulse-dot';

      if (summary.avg_var_risk_score >= 70 || yearData.climate_anomaly.includes('Kuat') || yearData.climate_anomaly.includes('Ekstrem')) {
        climateStatusBadge.classList.add('danger');
        climatePulse.classList.add('danger');
      } else if (summary.avg_var_risk_score >= 45 || yearData.climate_anomaly.includes('Moderat')) {
        climateStatusBadge.classList.add('warning');
        climatePulse.classList.add('warning');
      } else {
        climateStatusBadge.classList.add('safe');
        climatePulse.classList.add('safe');
      }
    }

    // 2. Update Hero KPI Cards (Berdasarkan rata-rata tahunan atau bulan terpilih)
    const kpiTemp = document.getElementById('kpiTemperature');
    const kpiTempDiff = document.getElementById('kpiTempDiff');
    const kpiHumidity = document.getElementById('kpiHumidity');
    const kpiRainfall = document.getElementById('kpiRainfall');
    const kpiRainStatus = document.getElementById('kpiRainStatus');
    const kpiRiskScore = document.getElementById('kpiRiskScore');
    const kpiRiskLabel = document.getElementById('kpiRiskLabel');

    if (kpiTemp) kpiTemp.textContent = `${summary.avg_temperature}°C`;
    if (kpiTempDiff) {
      const diff = (summary.avg_temperature - 27.2).toFixed(1);
      kpiTempDiff.textContent = `${diff >= 0 ? '+' : ''}${diff}°C vs baseline 1996`;
    }

    if (kpiHumidity) kpiHumidity.textContent = `${summary.avg_humidity}%`;
    if (kpiRainfall) kpiRainfall.textContent = `${summary.avg_rainfall}mm`;
    if (kpiRainStatus) {
      if (summary.avg_rainfall > 220) kpiRainStatus.textContent = 'Intensitas Tinggi';
      else if (summary.avg_rainfall < 100) kpiRainStatus.textContent = 'Kering / Defisit';
      else kpiRainStatus.textContent = 'Normal Tropis';
    }

    if (kpiRiskScore) kpiRiskScore.textContent = summary.avg_var_risk_score;
    if (kpiRiskLabel) {
      if (summary.avg_var_risk_score >= 70) {
        kpiRiskLabel.textContent = 'BAHAYA';
        kpiRiskLabel.style.color = 'var(--risk-danger)';
      } else if (summary.avg_var_risk_score >= 45) {
        kpiRiskLabel.textContent = 'WASPADA';
        kpiRiskLabel.style.color = 'var(--risk-warn)';
      } else {
        kpiRiskLabel.textContent = 'AMAN';
        kpiRiskLabel.style.color = 'var(--risk-safe)';
      }
    }

    // Update Circular Gauge SVG
    this.updateGaugeProgress(summary.avg_var_risk_score);

    // 3. Update 4 Skenario Kesehatan Tropis
    this.updateScenarioCards(activeMonth.disease_breakdown);

    // 4. Update Kalender Heatmap Bulanan (Jan - Des)
    this.renderHeatmapGrid(monthly);

    // 5. Update Monthly Bar Chart
    if (window.BumiCharts) {
      BumiCharts.renderMonthlyBarChart('monthlyRiskBarChart', monthly);
      BumiCharts.renderDiseaseRadarChart('diseaseRadarChart', activeMonth.disease_breakdown);
    }

    // 6. Update Panel Analisis & Diagnosis AI Utama di Dashboard
    this.updateOverviewAIDiagnosis(year, yearData, activeMonth);
  },

  /**
   * Update Widget Analisis & Diagnosis AI Real-Time pada Dashboard Utama
   */
  updateOverviewAIDiagnosis(year, yearData, activeMonth) {
    const summary = yearData.annual_summary;
    const breakdown = activeMonth.disease_breakdown || {};
    const riskScore = summary.avg_var_risk_score;

    // 1. Update Header & Badges
    const yearText = document.getElementById('overviewAIYearText');
    const badge = document.getElementById('overviewAIBadge');
    const threatText = document.getElementById('overviewAIThreatText');
    const riskLevelText = document.getElementById('overviewAIRiskLevelText');
    const peakMonthText = document.getElementById('overviewAIPeakMonthText');
    const diagnosisText = document.getElementById('overviewAIDiagnosisText');
    const actionsList = document.getElementById('overviewAIActionsList');

    if (yearText) yearText.textContent = `${year} (Fokus: ${activeMonth.month_name})`;
    if (threatText) threatText.textContent = summary.primary_health_threat;
    if (peakMonthText) peakMonthText.textContent = `${summary.peak_risk_month} (Skor ${summary.peak_risk_score})`;

    if (riskLevelText) {
      if (riskScore >= 70) {
        riskLevelText.textContent = `Sangat Rawan (${riskScore}/100)`;
        riskLevelText.className = 'font-bold text-red-600 text-xs mt-0.5 block';
      } else if (riskScore >= 45) {
        riskLevelText.textContent = `Perlu Hati-hati (${riskScore}/100)`;
        riskLevelText.className = 'font-bold text-amber-600 text-xs mt-0.5 block';
      } else {
        riskLevelText.textContent = `Aman & Sehat (${riskScore}/100)`;
        riskLevelText.className = 'font-bold text-emerald-600 text-xs mt-0.5 block';
      }
    }

    // 2. Generate Diagnosis AI Berbasis Bahasa Santai & Mudah Dipahami
    let narrative = "";
    const anomaly = yearData.climate_anomaly;

    if (anomaly.includes('El Nino') || summary.avg_rainfall < 120 || breakdown.elnino_ispa >= 65) {
      narrative = `Hasil pantauan cuaca tahun <strong>${year}</strong> menunjukkan kondisi <strong>"${anomaly}"</strong> yang cukup panas terik (${summary.avg_temperature}°C) dan jarang turun hujan (${summary.avg_rainfall} mm). Udara kering dan debu asap ini bikin kita lebih gampang kena <strong>Batuk Pilek (ISPA) dan Radang Tenggorokan (peluang ${breakdown.elnino_ispa || 75}%)</strong>. Selain itu, sumber air bersih jadi berkurang sehingga kebersihan air minum harus ekstra dijaga.`;
    } else if (anomaly.includes('La Nina') || summary.avg_rainfall > 250 || breakdown.lanina_lepto >= 65) {
      narrative = `Saat ini sedang musim <strong>hujan lebat dan sering banjir ("${anomaly}")</strong> dengan curah air mencapai ${summary.avg_rainfall} mm dan kelembapan ${summary.avg_humidity}%. Genangan air kotor di jalan atau selokan bisa tercemar kencing tikus, sehingga ada peluang <strong>Kencing Tikus (Leptospirosis) &amp; Sakit Perut (Tipes) sebesar ${breakdown.lanina_lepto || 70}%</strong>.`;
    } else if (breakdown.pancaroba_dbd >= 60 || activeMonth.season_type.includes('Pancaroba')) {
      narrative = `Sekarang sedang masuk <strong>Musim Peralihan (Pancaroba)</strong> dengan suhu rata-rata ${summary.avg_temperature}°C dan kelembapan ${summary.avg_humidity}%. Cuaca yang sebentar hujan lalu panas terik menyisakan genangan air bersih di wadah-wadah terbuka. Ini jadi tempat favorit nyamuk belang berkembang biak, sehingga potensi <strong>Nyamuk DBD &amp; Cikungunya mencapai ${breakdown.pancaroba_dbd || 68}%</strong>.`;
    } else {
      narrative = `Secara umum, kondisi cuaca tahun <strong>${year}</strong> berada pada status <strong>${anomaly}</strong> dengan suhu rata-rata ${summary.avg_temperature}°C dan curah hujan ${summary.avg_rainfall} mm. Tingkat bahaya kesehatan tergolong <strong>${riskScore < 45 ? 'Aman & Terkendali' : 'Perlu Sedikit Waspada'} (${riskScore}/100)</strong>. Tetap jaga kebersihan rumah dan perbanyak minum air putih ya!`;
    }

    if (diagnosisText) diagnosisText.innerHTML = narrative;

    // 3. Render 3 Saran Tindakan Praktis Asisten AI
    if (actionsList) {
      const actions = [];
      if (breakdown.pancaroba_dbd >= 55) {
        actions.push({
          icon: 'pest_control',
          color: 'text-amber-700 bg-amber-50 border-amber-200',
          title: 'Kuras & Tutup Wadah Air (Cegah DBD)',
          desc: 'Kuras bak mandi seminggu sekali dan buang air yang tergenang di ember/kaleng bekas.'
        });
      }
      if (breakdown.elnino_ispa >= 55) {
        actions.push({
          icon: 'masks',
          color: 'text-red-700 bg-red-50 border-red-200',
          title: 'Lindungi Napas & Minum Air Matang',
          desc: 'Pakai masker saat keluar rumah jika berdebu/berasap dan minum air matang yang cukup.'
        });
      }
      if (breakdown.lanina_lepto >= 55) {
        actions.push({
          icon: 'flood',
          color: 'text-sky-700 bg-sky-50 border-sky-200',
          title: 'Jangan Injak Banjir Tanpa Alas Kaki',
          desc: 'Pakai sepatu bot karet saat melewati genangan dan langsung cuci kaki pakai sabun.'
        });
      }
      if (breakdown.humidity_tbc >= 55 || actions.length < 3) {
        actions.push({
          icon: 'air',
          color: 'text-emerald-700 bg-emerald-50 border-emerald-200',
          title: 'Buka Jendela Kamar Tiap Pagi',
          desc: 'Biarkan sinar matahari dan udara segar masuk agar kamar tidak lembap dan pengap.'
        });
      }

      actionsList.innerHTML = actions.slice(0, 3).map(act => `
        <div class="p-2 rounded-lg border flex items-start gap-2.5 ${act.color}">
          <span class="material-symbols-outlined text-base mt-0.5">${act.icon}</span>
          <div>
            <div class="font-bold text-xs">${act.title}</div>
            <div class="text-[11px] opacity-90">${act.desc}</div>
          </div>
        </div>
      `).join('');
    }
  },

  /**
   * Update Circular SVG Gauge Progress (0 - 100)
   */
  updateGaugeProgress(score) {
    const gaugeCircle = document.getElementById('gaugeProgressCircle');
    const gaugeScoreBig = document.getElementById('compositeGaugeScore');
    const gaugeStatusBig = document.getElementById('compositeGaugeStatus');

    if (gaugeCircle) {
      // Total keliling lingkaran radius 40 = 251.2
      const circumference = 251.2;
      const offset = circumference - (score / 100) * circumference;
      gaugeCircle.style.strokeDasharray = `${circumference}`;
      gaugeCircle.style.strokeDashoffset = `${offset}`;

      if (score >= 70) gaugeCircle.style.stroke = '#ba1a1a';
      else if (score >= 45) gaugeCircle.style.stroke = '#e29100';
      else gaugeCircle.style.stroke = '#10b981';
    }

    if (gaugeScoreBig) gaugeScoreBig.textContent = score;
    if (gaugeStatusBig) {
      if (score >= 70) {
        gaugeStatusBig.textContent = 'BAHAYA';
        gaugeStatusBig.style.color = '#ba1a1a';
      } else if (score >= 45) {
        gaugeStatusBig.textContent = 'WASPADA';
        gaugeStatusBig.style.color = '#e29100';
      } else {
        gaugeStatusBig.textContent = 'AMAN';
        gaugeStatusBig.style.color = '#006c49';
      }
    }
  },

  /**
   * Update Progress Bar & Tag pada 4 Skenario Penyakit Tropis
   */
  updateScenarioCards(breakdown) {
    // 1. Pancaroba (DBD, Chikungunya, Zika)
    this._setCardMetric('pancaroba', breakdown.pancaroba_dbd);

    // 2. Kemarau Ekstrem / El Niño (ISPA, Karhutla, Diare)
    this._setCardMetric('elnino', breakdown.elnino_ispa);

    // 3. Musim Hujan Ekstrem / La Niña (Leptospirosis, Tipes, Malaria)
    this._setCardMetric('lanina', breakdown.lanina_lepto);

    // 4. Kelembapan Tinggi Konsisten (TBC, Jamur Tropis)
    this._setCardMetric('humidity', breakdown.humidity_tbc);
  },

  _setCardMetric(prefix, val) {
    const fill = document.getElementById(`${prefix}ProgressFill`);
    const label = document.getElementById(`${prefix}RiskValue`);
    const badge = document.getElementById(`${prefix}RiskBadge`);

    if (fill) {
      fill.style.width = `${val}%`;
      if (val >= 70) fill.style.backgroundColor = 'var(--risk-danger)';
      else if (val >= 45) fill.style.backgroundColor = 'var(--risk-warn)';
      else fill.style.backgroundColor = 'var(--risk-safe)';
    }

    if (label) label.textContent = `${val}%`;

    if (badge) {
      if (val >= 70) {
        badge.textContent = 'Tinggi';
        badge.className = 'tile-badge text-error bg-error-container/30';
      } else if (val >= 45) {
        badge.textContent = 'Sedang';
        badge.className = 'tile-badge text-amber-700 bg-amber-100';
      } else {
        badge.textContent = 'Rendah';
        badge.className = 'tile-badge text-primary bg-primary-light';
      }
    }
  },

  /**
   * Render 12 Kotak Heatmap Kalender Risiko (Januari - Desember)
   */
  renderHeatmapGrid(monthly) {
    const container = document.getElementById('monthlyHeatmapGrid');
    if (!container) return;

    container.innerHTML = monthly.map((m, idx) => {
      let bgClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
      let statusShort = 'Aman';
      if (m.var_risk_score >= 70) {
        bgClass = 'bg-red-50 text-red-700 border-red-200';
        statusShort = 'Bahaya';
      } else if (m.var_risk_score >= 45) {
        bgClass = 'bg-amber-50 text-amber-700 border-amber-200';
        statusShort = 'Waspada';
      }

      const isActive = idx === this.state.selectedMonthIndex;

      return `
        <div class="heatmap-cell ${isActive ? 'active' : ''} ${bgClass}" onclick="BumiApp.selectMonth(${idx})">
          <div class="heatmap-month">${m.month_name.slice(0, 3)}</div>
          <div class="heatmap-val">${m.var_risk_score}</div>
          <div class="heatmap-badge">${statusShort}</div>
        </div>
      `;
    }).join('');
  },

  /**
   * User memilih bulan spesifik pada heatmap
   */
  selectMonth(monthIndex) {
    this.state.selectedMonthIndex = monthIndex;
    this.loadYearData(this.state.currentYear);
  },

  /**
   * Render Time-Series Chart Global (1996 - 2026)
   */
  async renderGlobalTimeSeriesChart() {
    const timeSeriesData = await ClimateDataEngine.getTimeSeriesSummary();
    if (window.BumiCharts) {
      BumiCharts.renderTimeSeriesChart('timeSeriesChartCanvas', timeSeriesData, this.state.activeChartVars);
      BumiCharts.renderTimeSeriesChart('climateTrendChartCanvas', timeSeriesData, this.state.activeChartVars);
    }
  },

  /**
   * Setup Toggle Variabel pada Grafik Time-Series
   */
  setupChartVariableToggles() {
    const toggles = document.querySelectorAll('[data-chart-var]');
    toggles.forEach(toggle => {
      toggle.addEventListener('change', (e) => {
        const varName = e.target.getAttribute('data-chart-var');
        this.state.activeChartVars[varName] = e.target.checked;
        this.renderGlobalTimeSeriesChart();
      });
    });
  },

  /**
   * Kontrol Buka/Tutup Modal Pelaporan Isu Warga
   */
  setupModalControls() {
    const openBtns = document.querySelectorAll('.open-report-modal-btn');
    const closeBtns = document.querySelectorAll('.close-report-modal-btn');
    const modal = document.getElementById('reportModal');

    openBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        if (modal) modal.classList.add('active');
      });
    });

    closeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        if (modal) modal.classList.remove('active');
      });
    });

    // Close on backdrop click
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.classList.remove('active');
        }
      });
    }
  },

  /**
   * ===================================================================
   * SETUP STUDIO AI LOKAL & MATRIX CONTROLLER
   * ===================================================================
   */
  async setupStudioAIEvents() {
    // 1. Render Matriks Korelasi & Kausalitas
    await this.renderCorrelationMatrixTable();

    // 2. Setup Event Listener Simulator Prediksi
    const tempSlider = document.getElementById('simTempSlider');
    const humSlider = document.getElementById('simHumSlider');
    const rainSlider = document.getElementById('simRainSlider');
    const monthSelect = document.getElementById('simMonthSelect');
    const resetBtn = document.getElementById('btnResetSim');

    const updateSim = async () => {
      const temp = parseFloat(tempSlider.value);
      const hum = parseFloat(humSlider.value);
      const rain = parseFloat(rainSlider.value);
      const month = parseInt(monthSelect.value, 10);

      // Update label displays
      document.getElementById('simTempValDisplay').textContent = `${temp.toFixed(1)}°C`;
      document.getElementById('simHumValDisplay').textContent = `${Math.round(hum)}%`;
      document.getElementById('simRainValDisplay').textContent = `${Math.round(rain)} mm`;

      // Run AI Local Inference
      const result = await LocalAIEngine.predictRisk(temp, hum, rain, month);
      this.updateSimulatorResultsUI(result);
    };

    if (tempSlider) tempSlider.addEventListener('input', updateSim);
    if (humSlider) humSlider.addEventListener('input', updateSim);
    if (rainSlider) rainSlider.addEventListener('input', updateSim);
    if (monthSelect) monthSelect.addEventListener('change', updateSim);

    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        if (tempSlider) tempSlider.value = 28.3;
        if (humSlider) humSlider.value = 82;
        if (rainSlider) rainSlider.value = 180;
        if (monthSelect) monthSelect.value = 4;
        updateSim();
      });
    }

    // Initial simulator run
    if (tempSlider) updateSim();

    // 3. Setup Event Listener Chatbot Asisten AI
    const chatForm = document.getElementById('aiChatForm');
    const chatInput = document.getElementById('aiChatInput');
    const clearBtn = document.getElementById('btnClearChat');
    const quickPrompts = document.querySelectorAll('.quick-chat-prompt');

    if (chatForm) {
      chatForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const msg = chatInput.value.trim();
        if (!msg) return;
        chatInput.value = '';
        await this.handleUserChatMessage(msg);
      });
    }

    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        const container = document.getElementById('aiChatMessages');
        if (container) {
          container.innerHTML = `
            <div class="ai-message bot">
              <div class="ai-avatar bot">
                <span class="material-symbols-outlined text-lg">smart_toy</span>
              </div>
              <div class="ai-bubble">
                <strong>🌿 Percakapan dibersihkan.</strong><br />
                Silakan tanyakan kembali analisis risiko iklim dan rekomendasi kesehatan tropis!
              </div>
            </div>
          `;
        }
      });
    }

    quickPrompts.forEach(btn => {
      btn.addEventListener('click', async () => {
        const promptText = btn.getAttribute('data-prompt');
        if (promptText) {
          await this.handleUserChatMessage(promptText);
        }
      });
    });

    // 4. Setup Galeri Kartu Pertanyaan Siap Klik (1-Click AI Questions)
    const presetCards = document.querySelectorAll('.preset-question-card');
    presetCards.forEach(card => {
      card.addEventListener('click', async () => {
        const promptText = card.getAttribute('data-prompt');
        if (promptText) {
          // Efek active feedback pada kartu yang diklik
          presetCards.forEach(c => c.classList.remove('ring-2', 'ring-emerald-600', 'bg-white'));
          card.classList.add('ring-2', 'ring-emerald-600', 'bg-white');

          // Kirim pertanyaan ke AI
          await this.handleUserChatMessage(promptText);

          // Scroll halus ke kotak chat
          const chatWindow = document.querySelector('.ai-chat-window');
          if (chatWindow) {
            chatWindow.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }
        }
      });
    });

    // 5. Setup Filter Kategori Kartu Pertanyaan
    const filterBtns = document.querySelectorAll('.filter-question-btn');
    filterBtns.forEach(fBtn => {
      fBtn.addEventListener('click', () => {
        const cat = fBtn.getAttribute('data-cat');
        filterBtns.forEach(b => {
          b.classList.remove('active', 'bg-emerald-700', 'text-white');
          b.classList.add('bg-slate-100', 'text-slate-600');
        });
        fBtn.classList.add('active', 'bg-emerald-700', 'text-white');
        fBtn.classList.remove('bg-slate-100', 'text-slate-600');

        presetCards.forEach(card => {
          if (cat === 'all' || card.classList.contains(cat)) {
            card.style.display = 'flex';
          } else {
            card.style.display = 'none';
          }
        });
      });
    });

    // 6. Setup Tombol Retrain Model
    const retrainBtn = document.getElementById('btnRetrainModel');
    if (retrainBtn) {
      retrainBtn.addEventListener('click', async () => {
        retrainBtn.disabled = true;
        retrainBtn.innerHTML = `
          <span class="material-symbols-outlined text-sm animate-spin text-emerald-600">sync</span>
          <span>Melatih Ulang...</span>
        `;
        const res = await LocalAIEngine.retrainModel();
        alert(res.message || 'Model VAR & Machine Learning berhasil diperbarui.');
        retrainBtn.disabled = false;
        retrainBtn.innerHTML = `
          <span class="material-symbols-outlined text-sm text-emerald-600">sync</span>
          <span>Latih Ulang Model (Retrain)</span>
        `;
        await this.renderCorrelationMatrixTable();
      });
    }
  },

  /**
   * Update UI Hasil Simulator Prediksi Risiko
   */
  updateSimulatorResultsUI(result) {
    if (!result || !result.risk_assessment) return;

    const risk = result.risk_assessment;
    const breakdown = risk.disease_breakdown || {};

    const scoreEl = document.getElementById('simRiskScoreText');
    const badgeEl = document.getElementById('simRiskBadge');
    const threatEl = document.getElementById('simThreatText');

    if (scoreEl) scoreEl.textContent = risk.var_risk_score;
    if (threatEl) threatEl.textContent = risk.dominant_threat;

    if (badgeEl) {
      badgeEl.textContent = risk.risk_level.toUpperCase();
      if (risk.risk_level === 'Bahaya') {
        badgeEl.className = 'tile-badge text-red-700 bg-red-100 font-bold';
      } else if (risk.risk_level === 'Waspada') {
        badgeEl.className = 'tile-badge text-amber-700 bg-amber-100 font-bold';
      } else {
        badgeEl.className = 'tile-badge text-emerald-700 bg-emerald-100 font-bold';
      }
    }

    // Update Progress Bars
    const updateBar = (valId, barId, score) => {
      const v = document.getElementById(valId);
      const b = document.getElementById(barId);
      if (v) v.textContent = `${Math.round(score)}%`;
      if (b) b.style.width = `${Math.round(score)}%`;
    };

    updateBar('simDbdScore', 'simDbdBar', breakdown.pancaroba_dbd || 0);
    updateBar('simIspaScore', 'simIspaBar', breakdown.elnino_ispa || 0);
    updateBar('simLeptoScore', 'simLeptoBar', breakdown.lanina_lepto || 0);
    updateBar('simTbcScore', 'simTbcBar', breakdown.humidity_tbc || 0);

    // Update Clinical Action Checklist
    const actionsContainer = document.getElementById('simActionsContainer');
    if (actionsContainer) {
      if (result.clinical_action_plans && result.clinical_action_plans.length > 0) {
        const allActions = [];
        result.clinical_action_plans.forEach(plan => {
          plan.actions.forEach(act => allActions.push(`• <strong>[${plan.target}]</strong>: ${act}`));
        });
        actionsContainer.innerHTML = allActions.map(a => `<div>${a}</div>`).join('');
      } else {
        actionsContainer.innerHTML = `
          <div>• Kondisi iklim dalam batas normal dan stabil.</div>
          <div>• Tetap jaga kebersihan lingkungan dan sanitasi rumah tangga secara rutin.</div>
        `;
      }
    }
  },

  /**
   * Handle Pengiriman Chat User ke Asisten AI Lokal
   */
  async handleUserChatMessage(userText) {
    const container = document.getElementById('aiChatMessages');
    if (!container) return;

    // 1. Render User Message Bubble
    const userMsgEl = document.createElement('div');
    userMsgEl.className = 'ai-message user';
    userMsgEl.innerHTML = `
      <div class="ai-avatar user">
        <span class="material-symbols-outlined text-base">person</span>
      </div>
      <div class="ai-bubble">${userText}</div>
    `;
    container.appendChild(userMsgEl);
    container.scrollTop = container.scrollHeight;

    // 2. Render Bot Typing Indicator
    const typingEl = document.createElement('div');
    typingEl.className = 'ai-message bot';
    typingEl.id = 'aiTypingIndicator';
    typingEl.innerHTML = `
      <div class="ai-avatar bot">
        <span class="material-symbols-outlined text-lg">smart_toy</span>
      </div>
      <div class="ai-bubble text-slate-400 italic flex items-center gap-1.5">
        <span class="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
        <span class="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-100"></span>
        <span class="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-200"></span>
        <span class="ml-1">Asisten AI Lokal sedang menganalisis data iklim...</span>
      </div>
    `;
    container.appendChild(typingEl);
    container.scrollTop = container.scrollHeight;

    // 3. Panggil LocalAIEngine Chat
    const yearData = await ClimateDataEngine.getYearData(this.state.currentYear);
    const summary = yearData ? yearData.annual_summary : {};

    const aiRes = await LocalAIEngine.chat(userText, {
      temperature: summary.avg_temperature || 28.3,
      humidity: summary.avg_humidity || 80,
      rainfall: summary.avg_rainfall || 180,
      year: this.state.currentYear
    });

    // Remove Typing Indicator
    if (typingEl.parentNode) typingEl.parentNode.removeChild(typingEl);

    // 4. Render Bot Reply
    const botMsgEl = document.createElement('div');
    botMsgEl.className = 'ai-message bot';
    
    // Parse markdown-like bold and bullet lines to HTML
    let formattedReply = aiRes.reply
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n\n/g, '<br /><br />')
      .replace(/\n/g, '<br />');

    let badgeHtml = '';
    if (aiRes.badges && aiRes.badges.length > 0) {
      badgeHtml = `
        <div class="flex flex-wrap gap-1.5 mt-2.5 pt-2 border-t border-slate-100">
          ${aiRes.badges.map(b => `<span class="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded text-[10px] font-semibold">${b}</span>`).join('')}
        </div>
      `;
    }

    botMsgEl.innerHTML = `
      <div class="ai-avatar bot">
        <span class="material-symbols-outlined text-lg">smart_toy</span>
      </div>
      <div class="ai-bubble">
        ${formattedReply}
        ${badgeHtml}
      </div>
    `;
    container.appendChild(botMsgEl);
    container.scrollTop = container.scrollHeight;
  },

  /**
   * Render Tabel Matriks Korelasi Riil 1996 - 2025
   */
  async renderCorrelationMatrixTable() {
    const tbody = document.getElementById('correlationMatrixTableBody');
    if (!tbody) return;

    const matrixData = await ClimateDataEngine.getDiseaseMatrix();
    if (!matrixData || !matrixData.correlation_matrix) return;

    const corr = matrixData.correlation_matrix;
    const rowKeys = [
      { key: 'Suhu_C', label: 'Suhu Rata-rata (°C)' },
      { key: 'Kelembapan_Percent', label: 'Kelembapan Udara (%)' },
      { key: 'Curah_Hujan_mm', label: 'Curah Hujan (mm)' },
      { key: 'pancaroba_dbd', label: '1. Pancaroba (DBD)' },
      { key: 'elnino_ispa', label: '2. Kemarau (ISPA)' },
      { key: 'lanina_lepto', label: '3. Hujan (Lepto)' },
      { key: 'humidity_tbc', label: '4. Lembap (TBC)' },
      { key: 'var_risk_score', label: 'Komposit Skor VAR' }
    ];

    const colKeys = [
      'Suhu_C', 'Kelembapan_Percent', 'Curah_Hujan_mm',
      'pancaroba_dbd', 'elnino_ispa', 'lanina_lepto', 'humidity_tbc', 'var_risk_score'
    ];

    let html = '';
    rowKeys.forEach(r => {
      html += `<tr>`;
      html += `<td class="text-left font-bold text-slate-800 bg-slate-50 pl-3">${r.label}</td>`;

      colKeys.forEach(cKey => {
        const val = corr[r.key] ? corr[r.key][cKey] : (corr[cKey] ? corr[cKey][r.key] : 0);
        const num = typeof val === 'number' ? val : 0;
        
        let cellClass = 'corr-neutral';
        if (num === 1.0) {
          cellClass = 'bg-slate-100 text-slate-400 font-normal';
        } else if (num >= 0.60) {
          cellClass = 'corr-high-pos font-bold';
        } else if (num >= 0.30) {
          cellClass = 'corr-med-pos';
        } else if (num <= -0.60) {
          cellClass = 'corr-high-neg font-bold';
        } else if (num <= -0.30) {
          cellClass = 'corr-med-neg';
        }

        const formatted = num === 1.0 ? '1.000' : (num >= 0 ? `+${num.toFixed(3)}` : num.toFixed(3));
        html += `<td class="${cellClass}">${formatted}</td>`;
      });

      html += `</tr>`;
    });

    tbody.innerHTML = html;
  }
};

// Bootstrap saat DOM siap
document.addEventListener('DOMContentLoaded', () => {
  BumiApp.init();
});

window.BumiApp = BumiApp;

