// ============================================================
// MASTER DATA (Admin only)
// ============================================================
let masterCurrentTab = 'siswa';

function showMasterTab(tab) {
    masterCurrentTab = tab;
    const container = document.getElementById('masterContent');
    if (!container) return;
    
    switch (tab) {
        case 'siswa':
            container.innerHTML = getMasterSiswaHTML();
            loadMasterSiswa();
            break;
        case 'kelas':
            container.innerHTML = getMasterKelasHTML();
            loadMasterKelas();
            break;
        case 'kategori':
            container.innerHTML = getMasterKategoriHTML();
            loadMasterKategori();
            break;
        case 'user':
            container.innerHTML = getMasterUserHTML();
            loadMasterUser();
            break;
        default:
            container.innerHTML = '<p>Pilih tab di atas untuk mengelola data.</p>';
    }
}

// ============================================================
// MASTER SISWA
// ============================================================
function getMasterSiswaHTML() {
    return `
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
}

async function loadMasterSiswa() {
    try {
        const data = await callApi('getStudents');
        const tbody = document.getElementById('masterSiswaTable');
        if (!tbody) return;
        
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
    } catch (err) {
        showToast('Gagal load siswa: ' + err.message, 'error');
    }
}

async function saveMasterSiswa(e) {
    e.preventDefault();
    
    const data = {
        NIS: document.getElementById('mNIS').value.trim(),
        Nama: document.getElementById('mNama').value.trim(),
        Kelas: document.getElementById('mKelas').value.trim(),
        JK: document.getElementById('mJK').value
    };
    
    try {
        await callApi('saveStudent', [data]);
        showToast('Siswa berhasil disimpan!', 'success');
        await loadMasterSiswa();
        
        document.getElementById('mNIS').value = '';
        document.getElementById('mNama').value = '';
        document.getElementById('mKelas').value = '';
    } catch (err) {
        showToast('Gagal simpan: ' + err.message, 'error');
    }
    
    return false;
}

async function deleteMasterSiswa(nis) {
    if (!confirm('Hapus siswa ini?')) return;
    
    try {
        await callApi('deleteStudent', [nis]);
        showToast('Siswa dihapus!', 'success');
        await loadMasterSiswa();
    } catch (err) {
        showToast('Gagal hapus: ' + err.message, 'error');
    }
}

// ============================================================
// MASTER KELAS
// ============================================================
function getMasterKelasHTML() {
    return `
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
}

async function loadMasterKelas() {
    try {
        const data = await callApi('getClasses');
        const tbody = document.getElementById('masterKelasTable');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        (data || []).forEach(d => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${d}</td>
                <td><button class="btn btn-danger btn-sm" onclick="deleteMasterKelas('${d}')">Hapus</button></td>
            `;
            tbody.appendChild(tr);
        });
    } catch (err) {
        showToast('Gagal load kelas: ' + err.message, 'error');
    }
}

async function saveMasterKelas(e) {
    e.preventDefault();
    
    const name = document.getElementById('mKelasName').value.trim();
    if (!name) return false;
    
    try {
        await callApi('saveClass', [name]);
        showToast('Kelas berhasil ditambahkan!', 'success');
        await loadMasterKelas();
        document.getElementById('mKelasName').value = '';
    } catch (err) {
        showToast('Gagal simpan: ' + err.message, 'error');
    }
    
    return false;
}

async function deleteMasterKelas(name) {
    if (!confirm('Hapus kelas ini?')) return;
    
    try {
        await callApi('deleteClass', [name]);
        showToast('Kelas dihapus!', 'success');
        await loadMasterKelas();
    } catch (err) {
        showToast('Gagal hapus: ' + err.message, 'error');
    }
}

// ============================================================
// MASTER KATEGORI
// ============================================================
function getMasterKategoriHTML() {
    return `
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
}

async function loadMasterKategori() {
    try {
        const [pelanggaran, prestasi] = await Promise.all([
            callApi('getCategories', ['pelanggaran']),
            callApi('getCategories', ['prestasi'])
        ]);
        
        const tbody = document.getElementById('masterKategoriTable');
        if (!tbody) return;
        
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
    } catch (err) {
        showToast('Gagal load kategori: ' + err.message, 'error');
    }
}

async function saveMasterKategori(e) {
    e.preventDefault();
    
    const type = document.getElementById('mKatJenis').value;
    const nama = document.getElementById('mKatNama').value.trim();
    const poin = parseInt(document.getElementById('mKatPoin').value) || 0;
    
    if (!nama) return false;
    
    try {
        await callApi('saveCategory', [type, nama, poin]);
        showToast('Kategori berhasil ditambahkan!', 'success');
        await loadMasterKategori();
        document.getElementById('mKatNama').value = '';
        document.getElementById('mKatPoin').value = '';
    } catch (err) {
        showToast('Gagal simpan: ' + err.message, 'error');
    }
    
    return false;
}

async function deleteMasterKategori(type, nama) {
    if (!confirm('Hapus kategori ini?')) return;
    
    try {
        await callApi('deleteCategory', [type, nama]);
        showToast('Kategori dihapus!', 'success');
        await loadMasterKategori();
    } catch (err) {
        showToast('Gagal hapus: ' + err.message, 'error');
    }
}

// ============================================================
// MASTER USER
// ============================================================
function getMasterUserHTML() {
    return `
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
}

async function loadMasterUser() {
    try {
        const data = await callApi('getUsers');
        const tbody = document.getElementById('masterUserTable');
        if (!tbody) return;
        
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
    } catch (err) {
        showToast('Gagal load user: ' + err.message, 'error');
    }
}

async function saveMasterUser(e) {
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
    
    try {
        await callApi('saveUser', [data]);
        showToast('User berhasil disimpan!', 'success');
        await loadMasterUser();
        
        document.getElementById('mUserUsername').value = '';
        document.getElementById('mUserPassword').value = '';
        document.getElementById('mUserNama').value = '';
    } catch (err) {
        showToast('Gagal simpan: ' + err.message, 'error');
    }
    
    return false;
}

async function deleteMasterUser(username) {
    if (!confirm('Hapus user ini?')) return;
    
    try {
        await callApi('deleteUser', [username]);
        showToast('User dihapus!', 'success');
        await loadMasterUser();
    } catch (err) {
        showToast('Gagal hapus: ' + err.message, 'error');
    }
}
