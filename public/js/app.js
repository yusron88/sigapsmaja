// ============================================================
// GLOBAL STATE
// ============================================================
let currentUser = null;
let currentRole = 'siswa';
let chartInstance = null;

// Konfigurasi URL Web App Google Apps Script
const API_URL = 'https://script.google.com/macros/s/AKfycbyM8eEAj-NpyY2h9MSq4EG8tScaT3qywRE4V_9iP0_jgYug3B87PvvfOUTrMV4QLEtM/exec';

// ============================================================
// UTILITY: Fungsi untuk memanggil API
// ============================================================
async function callApi(action, params = []) {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      mode: 'no-cors', // Penting untuk Google Apps Script
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: action,
        params: params
      })
    });
    
    // Karena mode no-cors, response tidak bisa dibaca langsung
    // Kita perlu menggunakan pendekatan alternatif dengan mengirim data melalui URL
    return await handleApiResponse(action, params);
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

// ============================================================
// ALTERNATIF: Menggunakan JSONP atau Redirect
// ============================================================
function callApiAlternative(action, params = []) {
  return new Promise((resolve, reject) => {
    // Buat form untuk submit ke Google Apps Script
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = API_URL;
    form.target = 'hiddenFrame';
    form.style.display = 'none';
    
    // Tambahkan parameter
    const data = {
      action: action,
      params: params
    };
    
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = 'data';
    input.value = JSON.stringify(data);
    form.appendChild(input);
    
    // Buat iframe untuk menerima response
    const iframe = document.createElement('iframe');
    iframe.name = 'hiddenFrame';
    iframe.style.display = 'none';
    iframe.onload = function() {
      try {
        const content = iframe.contentWindow.document.body.textContent;
        const result = JSON.parse(content);
        resolve(result);
      } catch (e) {
        reject(e);
      }
      document.body.removeChild(iframe);
      document.body.removeChild(form);
    };
    
    document.body.appendChild(iframe);
    document.body.appendChild(form);
    form.submit();
  });
}

// ============================================================
// LOGIN
// ============================================================
function handleLogin(e) {
  e.preventDefault();
  const username = document.getElementById('loginUsername').value.trim();
  const password = document.getElementById('loginPassword').value.trim();
  const errorEl = document.getElementById('loginError');
  errorEl.textContent = '';
  errorEl.innerHTML = '<div class="loading">Memproses login...</div>';
  
  // Gunakan fetch dengan mode no-cors
  fetch(API_URL, {
    method: 'POST',
    mode: 'no-cors',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      action: 'doLogin',
      params: [username, password]
    })
  })
  .then(response => {
    // Karena no-cors, response tidak bisa dibaca
    // Kita perlu menggunakan pendekatan alternatif
    return handleLoginWithRedirect(username, password);
  })
  .then(result => {
    if (result && result.success) {
      currentUser = result;
      currentRole = result.role;
      document.getElementById('loginPage').style.display = 'none';
      document.getElementById('app').style.display = 'block';
      document.getElementById('userNameDisplay').textContent = result.nama || result.username;
      document.getElementById('userRoleDisplay').textContent = result.role;
      initApp();
    } else {
      errorEl.textContent = result?.message || 'Login gagal';
    }
  })
  .catch(err => {
    errorEl.textContent = 'Terjadi kesalahan: ' + err.message;
  });
  
  return false;
}

// Fungsi alternatif untuk login menggunakan iframe
function handleLoginWithRedirect(username, password) {
  return new Promise((resolve, reject) => {
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.name = 'loginFrame';
    
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = API_URL;
    form.target = 'loginFrame';
    form.style.display = 'none';
    
    const data = {
      action: 'doLogin',
      params: [username, password]
    };
    
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = 'data';
    input.value = JSON.stringify(data);
    form.appendChild(input);
    
    let resolved = false;
    
    iframe.onload = function() {
      try {
        const content = iframe.contentWindow.document.body.textContent;
        const result = JSON.parse(content);
        resolved = true;
        resolve(result);
      } catch (e) {
        if (!resolved) {
          reject(e);
        }
      }
      document.body.removeChild(iframe);
      document.body.removeChild(form);
    };
    
    document.body.appendChild(iframe);
    document.body.appendChild(form);
    form.submit();
    
    // Timeout jika terlalu lama
    setTimeout(() => {
      if (!resolved) {
        reject(new Error('Login timeout'));
        document.body.removeChild(iframe);
        document.body.removeChild(form);
      }
    }, 10000);
  });
}

function doLogout() {
  currentUser = null;
  currentRole = 'siswa';
  document.getElementById('app').style.display = 'none';
  document.getElementById('loginPage').style.display = 'flex';
  document.getElementById('loginPassword').value = '';
  document.getElementById('loginError').textContent = '';
}

// ============================================================
// INIT APP
// ============================================================
function initApp() {
  // Setup tabs
  document.querySelectorAll('.nav-tabs button').forEach(btn => {
    btn.addEventListener('click', function() {
      const tab = this.dataset.tab;
      switchTab(tab);
    });
  });
  
  // Show/hide admin tabs
  if (currentRole === 'admin') {
    document.getElementById('tabMaster').classList.remove('hidden');
  } else {
    document.getElementById('tabMaster').classList.add('hidden');
  }
  
  // Set default tab
  switchTab('dashboard');
  loadAllData();
}

function switchTab(tabId) {
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-tabs button').forEach(b => b.classList.remove('active'));
  
  const panel = document.getElementById('panel' + tabId.charAt(0).toUpperCase() + tabId.slice(1));
  if (panel) panel.classList.add('active');
  
  const btn = document.querySelector(`.nav-tabs button[data-tab="${tabId}"]`);
  if (btn) btn.classList.add('active');
  
  // Refresh data based on tab
  if (tabId === 'dashboard') loadDashboard();
  else if (tabId === 'input') loadInputForm();
  else if (tabId === 'laporan') loadLaporan();
  else if (tabId === 'siswaView') loadSiswaView();
}

// ============================================================
// LOAD ALL DATA (initial)
// ============================================================
function loadAllData() {
  // Inisialisasi system jika perlu
  callApi('initSystem')
    .then(res => {
      console.log('System init:', res);
    })
    .catch(err => console.error('Init error:', err));
  
  loadDashboard();
  loadInputForm();
  loadLaporan();
}

// ============================================================
// TOAST NOTIFICATION
// ============================================================
function showToast(message, type = 'info') {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();
  
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 400); }, 4000);
}

// ============================================================
// FUNGSI CALL API DENGAN IFRAME (Solusi untuk no-cors)
// ============================================================
function callApiWithIframe(action, params = []) {
  return new Promise((resolve, reject) => {
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.name = 'apiFrame_' + Date.now();
    
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = API_URL;
    form.target = iframe.name;
    form.style.display = 'none';
    
    const data = {
      action: action,
      params: params
    };
    
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = 'data';
    input.value = JSON.stringify(data);
    form.appendChild(input);
    
    let resolved = false;
    
    iframe.onload = function() {
      try {
        const content = iframe.contentWindow.document.body.textContent;
        if (content) {
          const result = JSON.parse(content);
          resolved = true;
          resolve(result);
        }
      } catch (e) {
        if (!resolved) {
          // Coba cek lagi setelah delay
          setTimeout(() => {
            try {
              const content = iframe.contentWindow.document.body.textContent;
              if (content) {
                const result = JSON.parse(content);
                resolved = true;
                resolve(result);
              }
            } catch (e2) {
              if (!resolved) {
                reject(new Error('Gagal membaca response'));
              }
            }
          }, 500);
        }
      }
      
      // Hapus iframe dan form setelah selesai
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
        if (document.body.contains(form)) {
          document.body.removeChild(form);
        }
      }, 1000);
    };
    
    document.body.appendChild(iframe);
    document.body.appendChild(form);
    form.submit();
    
    // Timeout jika terlalu lama
    setTimeout(() => {
      if (!resolved) {
        reject(new Error('Request timeout'));
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
        if (document.body.contains(form)) {
          document.body.removeChild(form);
        }
      }
    }, 15000);
  });
}

// ============================================================
// DASHBOARD
// ============================================================
function loadDashboard() {
  const statsEl = document.getElementById('dashboardStats');
  statsEl.innerHTML = '<div class="loading">Memuat data dashboard...</div>';
  
  callApiWithIframe('getDashboardStats')
    .then(data => {
      if (!data) {
        throw new Error('Data tidak valid');
      }
      
      // Stats
      document.getElementById('statSiswa').textContent = data.siswa?.length || 0;
      document.getElementById('statViolations').textContent = data.totalViolations || 0;
      document.getElementById('statAchievements').textContent = data.totalAchievements || 0;
      document.getElementById('statKelas').textContent = Object.keys(data.perKelas || {}).length;
      
      // Top 5
      const tbody = document.getElementById('top5Table');
      tbody.innerHTML = '';
      (data.siswaTerbanyak || []).forEach((d, i) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${i+1}</td>
          <td>${d.nama || '-'}</td>
          <td>${d.kelas || '-'}</td>
          <td>${d.totalPelanggaran || 0}</td>
          <td>${d.totalPrestasi || 0}</td>
          <td style="font-weight:700;color:${d.total > 50 ? '#dc2626' : '#16a34a'}">${d.total || 0}</td>
        `;
        tbody.appendChild(tr);
      });
      
      // Kelas stats
      const ktBody = document.getElementById('kelasStatsTable');
      ktBody.innerHTML = '';
      Object.keys(data.perKelas || {}).forEach(k => {
        const d = data.perKelas[k];
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${k}</td>
          <td>${d.count || 0}</td>
          <td>${d.count > 0 ? (d.total / d.count).toFixed(1) : 0}</td>
          <td>${d.max || 0}</td>
        `;
        ktBody.appendChild(tr);
      });
      
      // Chart
      updateChart(data);
    })
    .catch(err => {
      showToast('Gagal load dashboard: ' + err.message, 'error');
      statsEl.innerHTML = `
        <div class="stat-card"><div class="number" id="statSiswa">0</div><div class="label">Total Siswa</div></div>
        <div class="stat-card danger"><div class="number" id="statViolations">0</div><div class="label">Pelanggaran</div></div>
        <div class="stat-card success"><div class="number" id="statAchievements">0</div><div class="label">Prestasi</div></div>
        <div class="stat-card"><div class="number" id="statKelas">0</div><div class="label">Kelas</div></div>
      `;
    });
}

function updateChart(data) {
  const ctx = document.getElementById('trenChart').getContext('2d');
  if (chartInstance) chartInstance.destroy();
  
  // Buat data tren per bulan (simulasi)
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];
  const violasiPerBulan = Array(12).fill(0);
  const prestasiPerBulan = Array(12).fill(0);
  
  // Simulasi dari data yang ada
  const totalViolasi = data.totalViolations || 0;
  const totalPrestasi = data.totalAchievements || 0;
  for (let i = 0; i < 12; i++) {
    violasiPerBulan[i] = Math.round((totalViolasi / 12) * (0.5 + Math.random()));
    prestasiPerBulan[i] = Math.round((totalPrestasi / 12) * (0.5 + Math.random()));
  }
  
  chartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: months,
      datasets: [
        {
          label: 'Pelanggaran',
          data: violasiPerBulan,
          backgroundColor: 'rgba(220, 38, 38, 0.7)',
          borderColor: '#dc2626',
          borderWidth: 1
        },
        {
          label: 'Prestasi',
          data: prestasiPerBulan,
          backgroundColor: 'rgba(22, 163, 74, 0.7)',
          borderColor: '#16a34a',
          borderWidth: 1
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'top' }
      },
      scales: {
        y: { beginAtZero: true }
      }
    }
  });
}

// ============================================================
// INPUT FORM
// ============================================================
function loadInputForm() {
  // Set tanggal default = hari ini
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('poinTanggal').value = today;
  
  // Load kelas
  callApiWithIframe('getClasses')
    .then(classes => {
      const sel = document.getElementById('poinKelas');
      sel.innerHTML = '<option value="">-- Pilih Kelas --</option>';
      (classes || []).forEach(c => {
        const opt = document.createElement('option');
        opt.value = c;
        opt.textContent = c;
        sel.appendChild(opt);
      });
    })
    .catch(err => console.error('Gagal load kelas:', err));
  
  // Load kategori
  loadKategori();
  loadRiwayat();
}

function loadKategori() {
  const jenis = document.getElementById('poinJenis').value;
  callApiWithIframe('getCategories', [jenis])
    .then(categories => {
      const sel = document.getElementById('poinKategori');
      sel.innerHTML = '<option value="">-- Pilih Kategori --</option>';
      (categories || []).forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.nama;
        opt.dataset.poin = c.poin;
        opt.textContent = c.nama + ' (' + c.poin + ' poin)';
        sel.appendChild(opt);
      });
    })
    .catch(err => console.error('Gagal load kategori:', err));
}

function updatePoinOtomatis() {
  const sel = document.getElementById('poinKategori');
  const selected = sel.options[sel.selectedIndex];
  const poin = selected ? selected.dataset.poin : 0;
  document.getElementById('poinNilai').value = poin || 0;
}

function loadSiswaByKelas() {
  const kelas = document.getElementById('poinKelas').value;
  const sel = document.getElementById('poinSiswa');
  sel.innerHTML = '<option value="">-- Pilih Siswa --</option>';
  if (!kelas) return;
  
  callApiWithIframe('getStudentsByClass', [kelas])
    .then(students => {
      (students || []).forEach(s => {
        const opt = document.createElement('option');
        opt.value = s.NIS;
        opt.textContent = s.Nama + ' (' + s.NIS + ')';
        opt.dataset.nama = s.Nama;
        opt.dataset.kelas = s.Kelas;
        sel.appendChild(opt);
      });
    })
    .catch(err => console.error('Gagal load siswa:', err));
}

function submitPoin(e) {
  e.preventDefault();
  const form = document.getElementById('poinForm');
  const msg = document.getElementById('poinFormMessage');
  msg.innerHTML = '';
  
  const nis = document.getElementById('poinSiswa').value;
  const siswaOpt = document.getElementById('poinSiswa').options[document.getElementById('poinSiswa').selectedIndex];
  
  if (!nis) {
    msg.innerHTML = '<div class="alert alert-danger">Pilih siswa terlebih dahulu!</div>';
    return false;
  }
  
  const data = {
    tanggal: document.getElementById('poinTanggal').value,
    nis: nis,
    namaSiswa: siswaOpt ? siswaOpt.dataset.nama : '',
    kelas: document.getElementById('poinKelas').value,
    jenis: document.getElementById('poinJenis').value,
    kategori: document.getElementById('poinKategori').value,
    poin: parseInt(document.getElementById('poinNilai').value) || 0,
    keterangan: document.getElementById('poinKeterangan').value,
    petugas: document.getElementById('poinPetugas').value || currentUser?.nama || '',
    type: document.getElementById('poinJenis').value
  };
  
  // Handle foto upload
  const fileInput = document.getElementById('poinFoto');
  if (fileInput.files && fileInput.files.length > 0) {
    const reader = new FileReader();
    reader.onload = function(e) {
      const base64 = e.target.result;
      callApiWithIframe('uploadFile', [base64, fileInput.files[0].name])
        .then(uploadResult => {
          if (uploadResult && uploadResult.success) {
            data.fotoUrl = uploadResult.url;
            savePoinData(data);
          } else {
            msg.innerHTML = '<div class="alert alert-danger">Gagal upload foto: ' + (uploadResult?.error || '') + '</div>';
          }
        })
        .catch(err => {
          msg.innerHTML = '<div class="alert alert-danger">Gagal upload foto: ' + err.message + '</div>';
        });
    };
    reader.readAsDataURL(fileInput.files[0]);
  } else {
    savePoinData(data);
  }
  
  return false;
}

// ============================================================
// SAVE POIN DATA
// ============================================================
function savePoinData(data) {
  const msg = document.getElementById('poinFormMessage');
  msg.innerHTML = '<div class="loading">Menyimpan data...</div>';
  
  callApiWithIframe('savePoin', [data])
    .then(result => {
      if (result && result.success) {
        msg.innerHTML = '<div class="alert alert-success">✅ Poin berhasil tersimpan!</div>';
        showToast('Poin berhasil tersimpan!', 'success');
        
        // Reset all fields
        document.getElementById('poinTanggal').value = new Date().toISOString().split('T')[0];
        document.getElementById('poinKelas').value = '';
        document.getElementById('poinSiswa').innerHTML = '<option value="">-- Pilih Siswa --</option>';
        document.getElementById('poinJenis').value = 'pelanggaran';
        document.getElementById('poinKategori').innerHTML = '<option value="">-- Pilih Kategori --</option>';
        document.getElementById('poinNilai').value = '';
        document.getElementById('poinKeterangan').value = '';
        document.getElementById('poinPetugas').value = '';
        document.getElementById('poinFoto').value = '';
        
        loadKategori();
        loadRiwayat();
        loadDashboard();
      } else {
        msg.innerHTML = '<div class="alert alert-danger">Gagal menyimpan: ' + (result?.message || '') + '</div>';
      }
    })
    .catch(err => {
      msg.innerHTML = '<div class="alert alert-danger">Error: ' + err.message + '</div>';
    });
}

function loadRiwayat() {
  callApiWithIframe('getAllPoin')
    .then(data => {
      const all = [...(data?.violations || []), ...(data?.achievements || [])];
      all.sort((a, b) => new Date(b.Tanggal) - new Date(a.Tanggal));
      const tbody = document.getElementById('riwayatTable');
      tbody.innerHTML = '';
      const limit = all.slice(0, 20);
      limit.forEach(item => {
        const tr = document.createElement('tr');
        const jenis = item.type === 'pelanggaran' ? '❌ Pelanggaran' : '🏆 Prestasi';
        tr.innerHTML = `
          <td>${item.Tanggal || '-'}</td>
          <td>${item.NamaSiswa || item.NIS || '-'}</td>
          <td>${item.Kelas || '-'}</td>
          <td>${jenis}</td>
          <td>${item.Kategori || '-'}</td>
          <td style="font-weight:700;color:${item.type === 'pelanggaran' ? '#dc2626' : '#16a34a'}">${item.Poin || 0}</td>
        `;
        tbody.appendChild(tr);
      });
    })
    .catch(err => {
      showToast('Gagal load riwayat: ' + err.message, 'error');
    });
}

// ============================================================
// MASTER DATA (Admin only)
// ============================================================
let masterCurrentTab = 'siswa';

function showMasterTab(tab) {
  masterCurrentTab = tab;
  const container = document.getElementById('masterContent');
  
  if (tab === 'siswa') {
    container.innerHTML = `
      <h3>📋 Data Siswa</h3>
      <form onsubmit="return saveMasterSiswa(event)" style="margin-bottom:16px;">
        <div class="form-row">
          <div class="form-group"><label>NIS</label><input type="text" id="mNIS" required placeholder="NIS"></div>
          <div class="form-group"><label>Nama</label><input type="text" id="mNama" required placeholder="Nama siswa"></div>
        </div>
        <div class="form-row">
          <div class="form-group"><label>Kelas</label><input type="text" id="mKelas" placeholder="Kelas"></div>
          <div class="form-group"><label>JK</label>
            <select id="mJK"><option value="L">L</option><option value="P">P</option></select>
          </div>
        </div>
        <button type="submit" class="btn btn-primary btn-sm">Tambah/Update Siswa</button>
      </form>
      <div class="table-wrap">
        <table><thead><tr><th>NIS</th><th>Nama</th><th>Kelas</th><th>JK</th><th>Aksi</th></tr></thead>
        <tbody id="masterSiswaTable"></tbody></table>
      </div>
    `;
    loadMasterSiswa();
  } else if (tab === 'kelas') {
    container.innerHTML = `
      <h3>📋 Data Kelas</h3>
      <form onsubmit="return saveMasterKelas(event)" style="margin-bottom:16px;">
        <div class="form-row">
          <div class="form-group"><label>Nama Kelas</label><input type="text" id="mKelasName" required placeholder="Contoh: X-A"></div>
        </div>
        <button type="submit" class="btn btn-primary btn-sm">Tambah Kelas</button>
      </form>
      <div class="table-wrap">
        <table><thead><tr><th>Kelas</th><th>Aksi</th></tr></thead>
        <tbody id="masterKelasTable"></tbody></table>
      </div>
    `;
    loadMasterKelas();
  } else if (tab === 'kategori') {
    container.innerHTML = `
      <h3>📋 Kategori Poin</h3>
      <form onsubmit="return saveMasterKategori(event)" style="margin-bottom:16px;">
        <div class="form-row">
          <div class="form-group"><label>Jenis</label>
            <select id="mKatJenis"><option value="pelanggaran">Pelanggaran</option><option value="prestasi">Prestasi</option></select>
          </div>
          <div class="form-group"><label>Nama Kategori</label><input type="text" id="mKatNama" required placeholder="Nama kategori"></div>
        </div>
        <div class="form-group"><label>Poin</label><input type="number" id="mKatPoin" required placeholder="Nilai poin"></div>
        <button type="submit" class="btn btn-primary btn-sm">Tambah Kategori</button>
      </form>
      <div class="table-wrap">
        <table><thead><tr><th>Jenis</th><th>Nama</th><th>Poin</th><th>Aksi</th></tr></thead>
        <tbody id="masterKategoriTable"></tbody></table>
      </div>
    `;
    loadMasterKategori();
  } else if (tab === 'user') {
    container.innerHTML = `
      <h3>👤 Data User</h3>
      <form onsubmit="return saveMasterUser(event)" style="margin-bottom:16px;">
        <div class="form-row">
          <div class="form-group"><label>Username</label><input type="text" id="mUserUsername" required placeholder="Username"></div>
          <div class="form-group"><label>Password</label><input type="text" id="mUserPassword" required placeholder="Password"></div>
        </div>
        <div class="form-row">
          <div class="form-group"><label>Role</label>
            <select id="mUserRole"><option value="siswa">Siswa</option><option value="admin">Admin</option></select>
          </div>
          <div class="form-group"><label>Nama Lengkap</label><input type="text" id="mUserNama" placeholder="Nama"></div>
        </div>
        <button type="submit" class="btn btn-primary btn-sm">Tambah/Update User</button>
      </form>
      <div class="table-wrap">
        <table><thead><tr><th>Username</th><th>Nama</th><th>Role</th><th>Aksi</th></tr></thead>
        <tbody id="masterUserTable"></tbody></table>
      </div>
    `;
    loadMasterUser();
  }
}

// ---- MASTER: SISWA ----
function loadMasterSiswa() {
  callApiWithIframe('getStudents')
    .then(data => {
      const tbody = document.getElementById('masterSiswaTable');
      tbody.innerHTML = '';
      (data || []).forEach(d => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${d.NIS || ''}</td>
          <td>${d.Nama || ''}</td>
          <td>${d.Kelas || ''}</td>
          <td>${d.JK || ''}</td>
          <td><button class="btn btn-danger btn-sm" onclick="deleteMasterSiswa('${d.NIS}')">Hapus</button></td>
        `;
        tbody.appendChild(tr);
      });
    })
    .catch(err => showToast('Gagal load siswa: ' + err.message, 'error'));
}

function saveMasterSiswa(e) {
  e.preventDefault();
  const data = {
    NIS: document.getElementById('mNIS').value.trim(),
    Nama: document.getElementById('mNama').value.trim(),
    Kelas: document.getElementById('mKelas').value.trim(),
    JK: document.getElementById('mJK').value
  };
  callApiWithIframe('saveStudent', [data])
    .then(() => {
      showToast('Siswa berhasil disimpan!', 'success');
      loadMasterSiswa();
      document.getElementById('mNIS').value = '';
      document.getElementById('mNama').value = '';
      document.getElementById('mKelas').value = '';
    })
    .catch(err => showToast('Gagal simpan: ' + err.message, 'error'));
  return false;
}

function deleteMasterSiswa(nis) {
  if (!confirm('Hapus siswa ini?')) return;
  callApiWithIframe('deleteStudent', [nis])
    .then(() => {
      showToast('Siswa dihapus!', 'success');
      loadMasterSiswa();
    })
    .catch(err => showToast('Gagal hapus: ' + err.message, 'error'));
}

// ---- MASTER: KELAS ----
function loadMasterKelas() {
  callApiWithIframe('getClasses')
    .then(data => {
      const tbody = document.getElementById('masterKelasTable');
      tbody.innerHTML = '';
      (data || []).forEach(d => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${d}</td>
          <td><button class="btn btn-danger btn-sm" onclick="deleteMasterKelas('${d}')">Hapus</button></td>
        `;
        tbody.appendChild(tr);
      });
    })
    .catch(err => showToast('Gagal load kelas: ' + err.message, 'error'));
}

function saveMasterKelas(e) {
  e.preventDefault();
  const name = document.getElementById('mKelasName').value.trim();
  if (!name) return false;
  callApiWithIframe('saveClass', [name])
    .then(() => {
      showToast('Kelas berhasil ditambahkan!', 'success');
      loadMasterKelas();
      document.getElementById('mKelasName').value = '';
    })
    .catch(err => showToast('Gagal simpan: ' + err.message, 'error'));
  return false;
}

function deleteMasterKelas(name) {
  if (!confirm('Hapus kelas ini?')) return;
  callApiWithIframe('deleteClass', [name])
    .then(() => {
      showToast('Kelas dihapus!', 'success');
      loadMasterKelas();
    })
    .catch(err => showToast('Gagal hapus: ' + err.message, 'error'));
}

// ---- MASTER: KATEGORI ----
function loadMasterKategori() {
  Promise.all([
    callApiWithIframe('getCategories', ['pelanggaran']),
    callApiWithIframe('getCategories', ['prestasi'])
  ])
    .then(([pelanggaran, prestasi]) => {
      const tbody = document.getElementById('masterKategoriTable');
      tbody.innerHTML = '';
      const all = [...(pelanggaran || []), ...(prestasi || [])];
      all.forEach(d => {
        const tr = document.createElement('tr');
        const jenis = d.type === 'pelanggaran' ? '❌ Pelanggaran' : '🏆 Prestasi';
        tr.innerHTML = `
          <td>${jenis}</td>
          <td>${d.nama || ''}</td>
          <td>${d.poin || 0}</td>
          <td><button class="btn btn-danger btn-sm" onclick="deleteMasterKategori('${d.type}','${d.nama}')">Hapus</button></td>
        `;
        tbody.appendChild(tr);
      });
    })
    .catch(err => showToast('Gagal load kategori: ' + err.message, 'error'));
}

function saveMasterKategori(e) {
  e.preventDefault();
  const type = document.getElementById('mKatJenis').value;
  const nama = document.getElementById('mKatNama').value.trim();
  const poin = parseInt(document.getElementById('mKatPoin').value) || 0;
  if (!nama) return false;
  callApiWithIframe('saveCategory', [type, nama, poin])
    .then(() => {
      showToast('Kategori berhasil ditambahkan!', 'success');
      loadMasterKategori();
      document.getElementById('mKatNama').value = '';
      document.getElementById('mKatPoin').value = '';
    })
    .catch(err => showToast('Gagal simpan: ' + err.message, 'error'));
  return false;
}

function deleteMasterKategori(type, nama) {
  if (!confirm('Hapus kategori ini?')) return;
  callApiWithIframe('deleteCategory', [type, nama])
    .then(() => {
      showToast('Kategori dihapus!', 'success');
      loadMasterKategori();
    })
    .catch(err => showToast('Gagal hapus: ' + err.message, 'error'));
}

// ---- MASTER: USER ----
function loadMasterUser() {
  callApiWithIframe('getUsers')
    .then(data => {
      const tbody = document.getElementById('masterUserTable');
      tbody.innerHTML = '';
      (data || []).forEach(d => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${d.username || ''}</td>
          <td>${d.nama || ''}</td>
          <td><span class="role-badge">${d.role || ''}</span></td>
          <td><button class="btn btn-danger btn-sm" onclick="deleteMasterUser('${d.username}')">Hapus</button></td>
        `;
        tbody.appendChild(tr);
      });
    })
    .catch(err => showToast('Gagal load user: ' + err.message, 'error'));
}

function saveMasterUser(e) {
  e.preventDefault();
  const data = {
    username: document.getElementById('mUserUsername').value.trim(),
    password: document.getElementById('mUserPassword').value.trim(),
    role: document.getElementById('mUserRole').value,
    nama: document.getElementById('mUserNama').value.trim() || document.getElementById('mUserUsername').value.trim()
  };
  if (!data.username || !data.password) {
    showToast('Username dan password wajib diisi!', 'error');
    return false;
  }
  callApiWithIframe('saveUser', [data])
    .then(() => {
      showToast('User berhasil disimpan!', 'success');
      loadMasterUser();
      document.getElementById('mUserUsername').value = '';
      document.getElementById('mUserPassword').value = '';
      document.getElementById('mUserNama').value = '';
    })
    .catch(err => showToast('Gagal simpan: ' + err.message, 'error'));
  return false;
}

function deleteMasterUser(username) {
  if (!confirm('Hapus user ini?')) return;
  callApiWithIframe('deleteUser', [username])
    .then(() => {
      showToast('User dihapus!', 'success');
      loadMasterUser();
    })
    .catch(err => showToast('Gagal hapus: ' + err.message, 'error'));
}

// ============================================================
// LAPORAN
// ============================================================
function loadLaporan() {
  // Load kelas untuk filter
  callApiWithIframe('getClasses')
    .then(classes => {
      const sel = document.getElementById('laporanKelas');
      sel.innerHTML = '<option value="Semua">Semua Kelas</option>';
      (classes || []).forEach(c => {
        const opt = document.createElement('option');
        opt.value = c;
        opt.textContent = c;
        sel.appendChild(opt);
      });
    })
    .catch(err => console.error('Gagal load kelas filter:', err));
  
  refreshLaporan();
}

function refreshLaporan() {
  const filter = document.getElementById('laporanKelas').value;
  callApiWithIframe('getDashboardStats')
    .then(data => {
      let filtered = data?.siswa || [];
      if (filter && filter !== 'Semua') {
        filtered = filtered.filter(d => d.kelas === filter);
      }
      const tbody = document.getElementById('laporanTable');
      tbody.innerHTML = '';
      filtered.sort((a, b) => (b.total || 0) - (a.total || 0));
      filtered.forEach((d, i) => {
        const tr = document.createElement('tr');
        let status = 'Normal';
        let statusClass = '';
        const total = d.total || 0;
        if (total >= 100) { status = '⚠️ Segera ke BK'; statusClass = 'danger'; }
        else if (total > 50) { status = '⚠️ Lapor Wali Kelas'; statusClass = 'warning'; }
        tr.innerHTML = `
          <td>${i+1}</td>
          <td>${d.nama || '-'}</td>
          <td>${d.kelas || '-'}</td>
          <td>${d.totalPelanggaran || 0}</td>
          <td>${d.totalPrestasi || 0}</td>
          <td style="font-weight:700;color:${total > 50 ? '#dc2626' : '#16a34a'}">${total}</td>
          <td class="${statusClass}">${status}</td>
        `;
        tbody.appendChild(tr);
      });
    })
    .catch(err => showToast('Gagal refresh laporan: ' + err.message, 'error'));
}

function cetakLaporan() {
  const filter = document.getElementById('laporanKelas').value;
  const msg = document.getElementById('laporanMessage');
  msg.innerHTML = '<div class="loading">Membuat PDF...</div>';
  
  callApiWithIframe('generateReport', [filter])
    .then(result => {
      if (result && result.success) {
        msg.innerHTML = `
          <div class="alert alert-success">
            ✅ PDF berhasil dibuat! <a href="${result.url}" target="_blank">Buka PDF</a>
          </div>
        `;
        showToast('PDF siap!', 'success');
      } else {
        msg.innerHTML = '<div class="alert alert-danger">Gagal membuat PDF: ' + (result?.message || '') + '</div>';
      }
    })
    .catch(err => {
      msg.innerHTML = '<div class="alert alert-danger">Error: ' + err.message + '</div>';
    });
}

// Event listener untuk filter laporan
document.addEventListener('change', function(e) {
  if (e.target.id === 'laporanKelas') {
    refreshLaporan();
  }
});

// ============================================================
// SISWA VIEW
// ============================================================
function loadSiswaView() {
  if (!currentUser) return;
  
  const nis = currentUser.username;
  
  callApiWithIframe('getStudentByNis', [nis])
    .then(student => {
      if (!student) {
        document.getElementById('siswaInfo').innerHTML = '<div class="alert alert-warning">Data siswa tidak ditemukan. Hubungi admin.</div>';
        return;
      }
      
      document.getElementById('siswaInfo').innerHTML = `
        <p><strong>Nama:</strong> ${student.Nama || '-'}</p>
        <p><strong>NIS:</strong> ${student.NIS || '-'}</p>
        <p><strong>Kelas:</strong> ${student.Kelas || '-'}</p>
      `;
      
      return callApiWithIframe('getPoinByNis', [nis]);
    })
    .then(poinData => {
      if (!poinData) return;
      
      let totalPelanggaran = 0;
      let totalPrestasi = 0;
      const riwayat = [];
      
      (poinData || []).forEach(p => {
        const poinVal = parseInt(p.Poin) || 0;
        if (p.type === 'pelanggaran') {
          totalPelanggaran += poinVal;
        } else {
          totalPrestasi += poinVal;
        }
        riwayat.push({
          tanggal: p.Tanggal || '-',
          jenis: p.type === 'pelanggaran' ? '❌ Pelanggaran' : '🏆 Prestasi',
          kategori: p.Kategori || '-',
          poin: poinVal,
          keterangan: p.Keterangan || '-'
        });
      });
      
      const totalAkhir = totalPelanggaran - totalPrestasi;
      document.getElementById('siswaTotalPelanggaran').textContent = totalPelanggaran;
      document.getElementById('siswaTotalPrestasi').textContent = totalPrestasi;
      document.getElementById('siswaTotalAkhir').textContent = totalAkhir;
      
      const warningEl = document.getElementById('siswaPeringatan');
      warningEl.innerHTML = '';
      if (totalAkhir >= 100) {
        warningEl.innerHTML = '<div class="alert alert-danger">⚠️ PERINGATAN KERAS! Poin Anda mencapai batas maksimal (100). Segera temui Guru BK atau Wali Kelas!</div>';
      } else if (totalAkhir > 50) {
        warningEl.innerHTML = '<div class="alert alert-warning">⚠️ Perhatian! Poin Anda melebihi 50. Silakan melapor kepada Wali Kelas.</div>';
      } else {
        warningEl.innerHTML = '<div class="alert alert-success">✅ Poin Anda dalam batas normal. Tetap jaga disiplin!</div>';
      }
      
      const tbody = document.getElementById('siswaRiwayatTable');
      tbody.innerHTML = '';
      riwayat.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));
      riwayat.forEach(r => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${r.tanggal}</td>
          <td>${r.jenis}</td>
          <td>${r.kategori}</td>
          <td style="font-weight:700;color:${r.jenis.includes('Pelanggaran') ? '#dc2626' : '#16a34a'}">${r.poin}</td>
          <td>${r.keterangan}</td>
        `;
        tbody.appendChild(tr);
      });
    })
    .catch(err => {
      showToast('Gagal load data siswa: ' + err.message, 'error');
    });
}

// ============================================================
// KEYBOARD SHORTCUT: Enter untuk login
// ============================================================
document.addEventListener('keydown', function(e) {
  if (e.key === 'Enter' && document.getElementById('loginPage').style.display !== 'none') {
    document.getElementById('loginForm').dispatchEvent(new Event('submit'));
  }
});

console.log('🚀 SIGAP - SMA Negeri Jatirogo siap digunakan!');
