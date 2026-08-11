/**
 * ===================================================================
 * BumiMetrics - Community Alerts & Health Hub Logic
 * Real-time Citizen Reports, Puskesmas Alerts & Interactive Submissions
 * ===================================================================
 */

const BumiCommunity = {
  reports: [
    {
      id: 1,
      author: 'Puskesmas Sei Panas',
      role: 'Fasilitas Kesehatan Terverifikasi',
      location: 'Kecamatan Batam Kota',
      time: '10 menit yang lalu',
      category: 'Pancaroba_DBD',
      categoryLabel: 'Waspada DBD',
      title: 'Peningkatan Temuan Jentik Aedes di Area Perumahan',
      content: 'Berdasarkan pemeriksaan kader Jumantik, ditemukan lonjakan jentik nyamuk pada penampungan air terbuka pasca hujan berselang terik 3 hari terakhir. Warga diimbau segera melakukan 3M Plus.',
      verified: true,
      upvotes: 48
    },
    {
      id: 2,
      author: 'Pak Hendra (Ketua RT 04)',
      role: 'Warga Terdaftar',
      location: 'Bengkong Indah',
      time: '1 jam yang lalu',
      category: 'Hujan_Leptospirosis',
      categoryLabel: 'Genangan Banjir',
      title: 'Genangan Air Parit Meluap Pasca Hujan Lebat',
      content: 'Saluran drainase utama tersumbat material sampah. Genangan air kotor setinggi mata kaki berpotensi menyebarkan penyakit leptospirosis dan diare bagi anak-anak yang bermain air.',
      verified: false,
      upvotes: 23
    },
    {
      id: 3,
      author: 'Dinas Kesehatan Kota',
      role: 'Otoritas Kesehatan',
      location: 'Seluruh Wilayah Batam',
      time: '3 jam yang lalu',
      category: 'Kelembapan_TBC',
      categoryLabel: 'Edukasi Udara',
      title: 'Imbauan Menjaga Ventilasi Udara Ruangan di Atas 80% RH',
      content: 'Tingginya kelembapan relatif udara harian (rata-rata 84%) memperpanjang daya tahan droplet bakteri TBC dan memicu spora jamur kulit. Buka jendela di pagi hari untuk sirkulasi cahaya matahari.',
      verified: true,
      upvotes: 112
    },
    {
      id: 4,
      author: 'Bu Rina',
      role: 'Warga Terdaftar',
      location: 'Batu Aji',
      time: 'Kemarin',
      category: 'Kemarau_ISPA',
      categoryLabel: 'Kualitas Udara',
      title: 'Asap Pembakaran Sampah Liar Memperburuk Sesak Napas',
      content: 'Kondisi cuaca kering membuat asap pembakaran sampah mengendap lama di pemukiman. Beberapa lansia mengeluhkan batuk dan gejala ISPA ringan.',
      verified: false,
      upvotes: 35
    }
  ],

  /**
   * Inisialisasi Feed Komunitas
   */
  init() {
    this.renderFeed();
    this.setupEventListeners();
  },

  /**
   * Render daftar laporan ke DOM
   */
  renderFeed(filteredCategory = 'ALL') {
    const container = document.getElementById('communityFeedContainer');
    if (!container) return;

    let items = this.reports;
    if (filteredCategory !== 'ALL') {
      items = items.filter(r => r.category === filteredCategory);
    }

    if (items.length === 0) {
      container.innerHTML = `
        <div class="dashboard-tile text-center py-12">
          <span class="material-symbols-outlined text-4xl text-outline mb-2">forum</span>
          <p class="font-label-bold text-on-surface-variant">Belum ada laporan untuk kategori ini.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = items.map(item => `
      <div class="feed-card">
        <div class="feed-header">
          <div class="feed-author">
            <div class="author-avatar">${item.author.slice(0, 2).toUpperCase()}</div>
            <div>
              <div class="flex items-center gap-2">
                <span class="author-name">${item.author}</span>
                ${item.verified ? '<span class="material-symbols-outlined fill-icon text-sm text-primary" title="Terverifikasi">verified</span>' : ''}
              </div>
              <span class="feed-time">${item.role} • ${item.location} • ${item.time}</span>
            </div>
          </div>
          <span class="feed-tag">
            <span class="material-symbols-outlined text-xs text-secondary">label</span>
            ${item.categoryLabel}
          </span>
        </div>
        <h4 class="font-headline-md text-sm font-bold text-on-surface mb-1">${item.title}</h4>
        <p class="feed-body">${item.content}</p>
        <div class="flex items-center justify-between pt-2 border-t border-surface-border-subtle">
          <button class="btn btn-outline btn-sm" onclick="BumiCommunity.upvoteReport(${item.id})">
            <span class="material-symbols-outlined text-sm text-primary">thumb_up</span>
            <span>${item.upvotes} Terbantu</span>
          </button>
          <span class="text-xs text-text-subtle">ID: #BM-${item.id + 100}</span>
        </div>
      </div>
    `).join('');
  },

  /**
   * Tambah Laporan Baru dari Form Pengguna
   */
  addNewReport(formData) {
    const newReport = {
      id: Date.now(),
      author: formData.name || 'Warga Batam',
      role: 'Warga Terdaftar',
      location: formData.location || 'Wilayah Batam',
      time: 'Baru saja',
      category: formData.category,
      categoryLabel: formData.categoryLabel,
      title: formData.title,
      content: formData.content,
      verified: false,
      upvotes: 1
    };

    this.reports.unshift(newReport);
    this.renderFeed();
    this.showToast('Laporan berhasil dikirim ke feed komunitas!');
  },

  /**
   * Tambah Upvote Laporan
   */
  upvoteReport(id) {
    const report = this.reports.find(r => r.id === id);
    if (report) {
      report.upvotes += 1;
      this.renderFeed();
    }
  },

  /**
   * Toast Notifikasi Ringan
   */
  showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'climate-status-badge safe';
    toast.style.position = 'fixed';
    toast.style.bottom = '24px';
    toast.style.right = '24px';
    toast.style.zIndex = '999';
    toast.style.boxShadow = '0 10px 15px -3px rgba(0,0,0,0.1)';
    toast.innerHTML = `<span class="material-symbols-outlined">check_circle</span> ${message}`;
    
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.remove();
    }, 3500);
  },

  /**
   * Event Listeners Form & Modal
   */
  setupEventListeners() {
    const form = document.getElementById('reportIssueForm');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const categorySelect = document.getElementById('reportCategory');
        const selectedOption = categorySelect.options[categorySelect.selectedIndex];

        const formData = {
          name: document.getElementById('reportName').value,
          location: document.getElementById('reportLocation').value,
          category: categorySelect.value,
          categoryLabel: selectedOption.text,
          title: document.getElementById('reportTitle').value,
          content: document.getElementById('reportContent').value
        };

        this.addNewReport(formData);
        form.reset();
        
        // Tutup Modal
        const modal = document.getElementById('reportModal');
        if (modal) modal.classList.remove('active');
      });
    }

    // Filter Kategori Feed
    const filterBtns = document.querySelectorAll('.community-filter-btn');
    filterBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const cat = btn.getAttribute('data-category');
        this.renderFeed(cat);
      });
    });
  }
};

window.BumiCommunity = BumiCommunity;
