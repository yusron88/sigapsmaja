<script>
// ============================================================
// GLOBAL STATE
// ============================================================
let currentUser = null;
let currentRole = 'siswa';
let chartInstance = null;

// ============================================================
// LOGIN
// ============================================================
function handleLogin(e) {
  e.preventDefault();
  const username = document.getElementById('loginUsername').value.trim();
  const password = document.getElementById('loginPassword').value.trim();
  const errorEl = document.getElementById('loginError');
  errorEl.textContent = '';
  
  google.script.run
    .withSuccessHandler(function(result) {
      if (result.success) {
        currentUser = result;
        currentRole = result.role;
        document.getElementById('loginPage').style.display = 'none';
        document.getElementById('app').style.display = 'block';
        document.getElementById('userNameDisplay').textContent = result.nama || result.username;
        document.getElementById('userRoleDisplay').textContent = result.role;
        initApp();
      } else {
        errorEl.textContent = result.message || 'Login gagal';
      }
    })
    .withFailureHandler(function(err) {
      errorEl.textContent = 'Terjadi kesalahan: ' + err.message;
    })
    .doLogin(username, password);
  return false;
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
  google.script.run
    .withSuccessHandler(function(res) {
      console.log('System init:', res);
    })
    .initSystem();
  
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
// DASHBOARD
// ============================================================
function loadDashboard() {
  google.script.run
    .withSuccessHandler(function(data) {
      // Stats
      document.getElementById('statSiswa').textContent = data.siswa.length;
      document.getElementById('statViolations').textContent = data.totalViolations;
      document.getElementById('statAchievements').textContent = data.totalAchievements;
      document.getElementById('statKelas').textContent = Object.keys(data.perKelas).length;
      
      // Top 5
      const tbody = document.getElementById('top5Table');
      tbody.innerHTML = '';
      data.siswaTerbanyak.forEach((d, i) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${i+1}</td>
          <td>${d.nama}</td>
          <td>${d.kelas}</td>
          <td>${d.totalPelanggaran}</td>
          <td>${d.totalPrestasi}</td>
          <td style="font-weight:700;color:${d.total > 50 ? '#dc2626' : '#16a34a'}">${d.total}</td>
        `;
        tbody.appendChild(tr);
      });
      
      // Kelas stats
      const ktBody = document.getElementById('kelasStatsTable');
      ktBody.innerHTML = '';
      Object.keys(data.perKelas).forEach(k => {
        const d = data.perKelas[k];
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${k}</td>
          <td>${d.count}</td>
          <td>${d.count > 0 ? (d.total / d.count).toFixed(1) : 0}</td>
          <td>${d.max}</td>
        `;
        ktBody.appendChild(tr);
      });
      
      // Chart - Tren tahunan (simulasi berdasarkan data)
      updateChart(data);
    })
    .withFailureHandler(function(err) {
      showToast('Gagal load dashboard: ' + err.message, 'error');
    })
    .getDashboardStats();
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
  google.script.run
    .withSuccessHandler(function(classes) {
      const sel = document.getElementById('poinKelas');
      sel.innerHTML = '<option value="">-- Pilih Kelas --</option>';
      classes.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c;
        opt.textContent = c;
        sel.appendChild(opt);
      });
    })
    .getClasses();
  
  // Load kategori
  loadKategori();
  loadRiwayat();
}

function loadKategori() {
  const jenis = document.getElementById('poinJenis').value;
  google.script.run
    .withSuccessHandler(function(categories) {
      const sel = document.getElementById('poinKategori');
      sel.innerHTML = '<option value="">-- Pilih Kategori --</option>';
      categories.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.nama;
        opt.dataset.poin = c.poin;
        opt.textContent = c.nama + ' (' + c.poin + ' poin)';
        sel.appendChild(opt);
      });
    })
    .getCategories(jenis);
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
  
  google.script.run
    .withSuccessHandler(function(students) {
      students.forEach(s => {
        const opt = document.createElement('option');
        opt.value = s.NIS;
        opt.textContent = s.Nama + ' (' + s.NIS + ')';
        opt.dataset.nama = s.Nama;
        opt.dataset.kelas = s.Kelas;
        sel.appendChild(opt);
      });
    })
    .getStudentsByClass(kelas);
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
      google.script.run
        .withSuccessHandler(function(uploadResult) {
          if (uploadResult.success) {
            data.fotoUrl = uploadResult.url;
            savePoinData(data);
          } else {
            msg.innerHTML = '<div class="alert alert-danger">Gagal upload foto: ' + uploadResult.error + '</div>';
          }
        })
        .withFailureHandler(function(err) {
          msg.innerHTML = '<div class="alert alert-danger">Gagal upload foto: ' + err.message + '</div>';
        })
        .uploadFile(base64, fileInput.files[0].name);
    };
    reader.readAsDataURL(fileInput.files[0]);
  } else {
    savePoinData(data);
  }
  
  return false;
}

// ============================================================
// SAVE POIN DATA - DIPERBAIKI: reset semua field setelah sukses
// ============================================================
function savePoinData(data) {
  const msg = document.getElementById('poinFormMessage');
  google.script.run
    .withSuccessHandler(function(result) {
      if (result.success) {
        // Tampilkan notifikasi sukses
        msg.innerHTML = '<div class="alert alert-success">✅ Poin berhasil tersimpan!</div>';
        showToast('Poin berhasil tersimpan!', 'success');
        
        // ============================================================
        // KOSONGKAN SEMUA FIELD INPUT (sesuai permintaan)
        // ============================================================
        // 1. Tanggal Kejadian → reset ke hari ini
        document.getElementById('poinTanggal').value = new Date().toISOString().split('T')[0];
        
        // 2. Kelas → reset ke placeholder
        document.getElementById('poinKelas').value = '';
        
        // 3. Siswa → reset ke placeholder saja
        document.getElementById('poinSiswa').innerHTML = '<option value="">-- Pilih Siswa --</option>';
        
        // 4. Jenis → reset ke default 'pelanggaran'
        document.getElementById('poinJenis').value = 'pelanggaran';
        
        // 5. Kategori → reset ke placeholder (akan diisi ulang oleh loadKategori)
        document.getElementById('poinKategori').innerHTML = '<option value="">-- Pilih Kategori --</option>';
        
        // 6. Poin (otomatis) → kosongkan
        document.getElementById('poinNilai').value = '';
        
        // 7. Keterangan Detail → kosongkan
        document.getElementById('poinKeterangan').value = '';
        
        // 8. Petugas Validasi → kosongkan
        document.getElementById('poinPetugas').value = '';
        
        // 9. Upload Foto → kosongkan
        document.getElementById('poinFoto').value = '';
        
        // Load ulang kategori untuk jenis 'pelanggaran' (default)
        loadKategori();
        
        // Refresh riwayat dan dashboard
        loadRiwayat();
        loadDashboard();
      } else {
        msg.innerHTML = '<div class="alert alert-danger">Gagal menyimpan: ' + (result.message || '') + '</div>';
      }
    })
    .withFailureHandler(function(err) {
      msg.innerHTML = '<div class="alert alert-danger">Error: ' + err.message + '</div>';
    })
    .savePoin(data);
}

function loadRiwayat() {
  google.script.run
    .withSuccessHandler(function(data) {
      const all = [...data.violations, ...data.achievements];
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
    .withFailureHandler(function(err) {
      showToast('Gagal load riwayat: ' + err.message, 'error');
    })
    .getAllPoin();
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
  google.script.run
    .withSuccessHandler(function(data) {
      const tbody = document.getElementById('masterSiswaTable');
      tbody.innerHTML = '';
      data.forEach(d => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${d.NIS}</td>
          <td>${d.Nama}</td>
          <td>${d.Kelas}</td>
          <td>${d.JK}</td>
          <td><button class="btn btn-danger btn-sm" onclick="deleteMasterSiswa('${d.NIS}')">Hapus</button></td>
        `;
        tbody.appendChild(tr);
      });
    })
    .getStudents();
}

function saveMasterSiswa(e) {
  e.preventDefault();
  const data = {
    NIS: document.getElementById('mNIS').value.trim(),
    Nama: document.getElementById('mNama').value.trim(),
    Kelas: document.getElementById('mKelas').value.trim(),
    JK: document.getElementById('mJK').value
  };
  google.script.run
    .withSuccessHandler(function() {
      showToast('Siswa berhasil disimpan!', 'success');
      loadMasterSiswa();
      document.getElementById('mNIS').value = '';
      document.getElementById('mNama').value = '';
      document.getElementById('mKelas').value = '';
    })
    .saveStudent(data);
  return false;
}

function deleteMasterSiswa(nis) {
  if (!confirm('Hapus siswa ini?')) return;
  google.script.run
    .withSuccessHandler(function() {
      showToast('Siswa dihapus!', 'success');
      loadMasterSiswa();
    })
    .deleteStudent(nis);
}

// ---- MASTER: KELAS ----
function loadMasterKelas() {
  google.script.run
    .withSuccessHandler(function(data) {
      const tbody = document.getElementById('masterKelasTable');
      tbody.innerHTML = '';
      data.forEach(d => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${d}</td>
          <td><button class="btn btn-danger btn-sm" onclick="deleteMasterKelas('${d}')">Hapus</button></td>
        `;
        tbody.appendChild(tr);
      });
    })
    .getClasses();
}

function saveMasterKelas(e) {
  e.preventDefault();
  const name = document.getElementById('mKelasName').value.trim();
  if (!name) return false;
  google.script.run
    .withSuccessHandler(function() {
      showToast('Kelas berhasil ditambahkan!', 'success');
      loadMasterKelas();
      document.getElementById('mKelasName').value = '';
    })
    .saveClass(name);
  return false;
}

function deleteMasterKelas(name) {
  if (!confirm('Hapus kelas ini?')) return;
  google.script.run
    .withSuccessHandler(function() {
      showToast('Kelas dihapus!', 'success');
      loadMasterKelas();
    })
    .deleteClass(name);
}

// ---- MASTER: KATEGORI ----
function loadMasterKategori() {
  const pelanggaran = [];
  const prestasi = [];
  google.script.run
    .withSuccessHandler(function(data) {
      const tbody = document.getElementById('masterKategoriTable');
      tbody.innerHTML = '';
      // Data sudah dari getCategories
      // Kita perlu gabungkan
      google.script.run
        .withSuccessHandler(function(pel) {
          google.script.run
            .withSuccessHandler(function(pre) {
              const all = [...pel, ...pre];
              all.forEach(d => {
                const tr = document.createElement('tr');
                const jenis = d.type === 'pelanggaran' ? '❌ Pelanggaran' : '🏆 Prestasi';
                tr.innerHTML = `
                  <td>${jenis}</td>
                  <td>${d.nama}</td>
                  <td>${d.poin}</td>
                  <td><button class="btn btn-danger btn-sm" onclick="deleteMasterKategori('${d.type}','${d.nama}')">Hapus</button></td>
                `;
                tbody.appendChild(tr);
              });
            })
            .getCategories('prestasi');
        })
        .getCategories('pelanggaran');
    })
    .getCategories('pelanggaran');
}

function saveMasterKategori(e) {
  e.preventDefault();
  const type = document.getElementById('mKatJenis').value;
  const nama = document.getElementById('mKatNama').value.trim();
  const poin = parseInt(document.getElementById('mKatPoin').value) || 0;
  if (!nama) return false;
  google.script.run
    .withSuccessHandler(function() {
      showToast('Kategori berhasil ditambahkan!', 'success');
      loadMasterKategori();
      document.getElementById('mKatNama').value = '';
      document.getElementById('mKatPoin').value = '';
    })
    .saveCategory(type, nama, poin);
  return false;
}

function deleteMasterKategori(type, nama) {
  if (!confirm('Hapus kategori ini?')) return;
  google.script.run
    .withSuccessHandler(function() {
      showToast('Kategori dihapus!', 'success');
      loadMasterKategori();
    })
    .deleteCategory(type, nama);
}

// ---- MASTER: USER ----
function loadMasterUser() {
  google.script.run
    .withSuccessHandler(function(data) {
      const tbody = document.getElementById('masterUserTable');
      tbody.innerHTML = '';
      data.forEach(d => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${d.username}</td>
          <td>${d.nama}</td>
          <td><span class="role-badge">${d.role}</span></td>
          <td><button class="btn btn-danger btn-sm" onclick="deleteMasterUser('${d.username}')">Hapus</button></td>
        `;
        tbody.appendChild(tr);
      });
    })
    .getUsers();
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
  google.script.run
    .withSuccessHandler(function() {
      showToast('User berhasil disimpan!', 'success');
      loadMasterUser();
      document.getElementById('mUserUsername').value = '';
      document.getElementById('mUserPassword').value = '';
      document.getElementById('mUserNama').value = '';
    })
    .saveUser(data);
  return false;
}

function deleteMasterUser(username) {
  if (!confirm('Hapus user ini?')) return;
  google.script.run
    .withSuccessHandler(function() {
      showToast('User dihapus!', 'success');
      loadMasterUser();
    })
    .deleteUser(username);
}

// ============================================================
// LAPORAN
// ============================================================
function loadLaporan() {
  // Load kelas untuk filter
  google.script.run
    .withSuccessHandler(function(classes) {
      const sel = document.getElementById('laporanKelas');
      sel.innerHTML = '<option value="Semua">Semua Kelas</option>';
      classes.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c;
        opt.textContent = c;
        sel.appendChild(opt);
      });
    })
    .getClasses();
  
  refreshLaporan();
}

function refreshLaporan() {
  const filter = document.getElementById('laporanKelas').value;
  google.script.run
    .withSuccessHandler(function(data) {
      let filtered = data.siswa;
      if (filter && filter !== 'Semua') {
        filtered = filtered.filter(d => d.kelas === filter);
      }
      const tbody = document.getElementById('laporanTable');
      tbody.innerHTML = '';
      filtered.sort((a, b) => b.total - a.total);
      filtered.forEach((d, i) => {
        const tr = document.createElement('tr');
        let status = 'Normal';
        let statusClass = '';
        if (d.total >= 100) { status = '⚠️ Segera ke BK'; statusClass = 'danger'; }
        else if (d.total > 50) { status = '⚠️ Lapor Wali Kelas'; statusClass = 'warning'; }
        tr.innerHTML = `
          <td>${i+1}</td>
          <td>${d.nama}</td>
          <td>${d.kelas}</td>
          <td>${d.totalPelanggaran}</td>
          <td>${d.totalPrestasi}</td>
          <td style="font-weight:700;color:${d.total > 50 ? '#dc2626' : '#16a34a'}">${d.total}</td>
          <td class="${statusClass}">${status}</td>
        `;
        tbody.appendChild(tr);
      });
    })
    .getDashboardStats();
}

function cetakLaporan() {
  const filter = document.getElementById('laporanKelas').value;
  const msg = document.getElementById('laporanMessage');
  msg.innerHTML = '<div class="loading">Membuat PDF...</div>';
  
  google.script.run
    .withSuccessHandler(function(result) {
      if (result.success) {
        msg.innerHTML = `
          <div class="alert alert-success">
            ✅ PDF berhasil dibuat! <a href="${result.url}" target="_blank">Buka PDF</a>
          </div>
        `;
        showToast('PDF siap!', 'success');
      } else {
        msg.innerHTML = '<div class="alert alert-danger">Gagal membuat PDF: ' + (result.message || '') + '</div>';
      }
    })
    .withFailureHandler(function(err) {
      msg.innerHTML = '<div class="alert alert-danger">Error: ' + err.message + '</div>';
    })
    .generateReport(filter);
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
  
  // Cari data siswa berdasarkan username (asumsi username = NIS atau nama)
  const nis = currentUser.username;
  google.script.run
    .withSuccessHandler(function(student) {
      if (!student) {
        document.getElementById('siswaInfo').innerHTML = '<div class="alert alert-warning">Data siswa tidak ditemukan. Hubungi admin.</div>';
        return;
      }
      
      document.getElementById('siswaInfo').innerHTML = `
        <p><strong>Nama:</strong> ${student.Nama}</p>
        <p><strong>NIS:</strong> ${student.NIS}</p>
        <p><strong>Kelas:</strong> ${student.Kelas}</p>
      `;
      
      // Load poin siswa
      google.script.run
        .withSuccessHandler(function(poinData) {
          let totalPelanggaran = 0;
          let totalPrestasi = 0;
          const riwayat = [];
          
          poinData.forEach(p => {
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
          
          // Peringatan
          const warningEl = document.getElementById('siswaPeringatan');
          warningEl.innerHTML = '';
          if (totalAkhir >= 100) {
            warningEl.innerHTML = '<div class="alert alert-danger">⚠️ PERINGATAN KERAS! Poin Anda mencapai batas maksimal (100). Segera temui Guru BK atau Wali Kelas!</div>';
          } else if (totalAkhir > 50) {
            warningEl.innerHTML = '<div class="alert alert-warning">⚠️ Perhatian! Poin Anda melebihi 50. Silakan melapor kepada Wali Kelas.</div>';
          } else {
            warningEl.innerHTML = '<div class="alert alert-success">✅ Poin Anda dalam batas normal. Tetap jaga disiplin!</div>';
          }
          
          // Riwayat
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
        .getPoinByNis(nis);
    })
    .getStudentByNis(nis);
}

// ============================================================
// AUTO-REFRESH for laporan filter
// ============================================================
document.addEventListener('DOMContentLoaded', function() {
  // Event listener untuk laporan filter sudah di atas
});

// ============================================================
// KEYBOARD SHORTCUT: Enter untuk login
// ============================================================
document.addEventListener('keydown', function(e) {
  if (e.key === 'Enter' && document.getElementById('loginPage').style.display !== 'none') {
    document.getElementById('loginForm').dispatchEvent(new Event('submit'));
  }
});

console.log('🚀 SIGAP - SMA Negeri Jatirogo siap digunakan!');
</script>
