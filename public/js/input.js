// ============================================================
// INPUT FORM
// ============================================================
async function loadInputForm() {
    // Set tanggal default
    document.getElementById('poinTanggal').value = getTodayDate();
    
    // Load kelas
    try {
        const classes = await callApi('getClasses');
        const sel = document.getElementById('poinKelas');
        sel.innerHTML = '<option value="">-- Pilih Kelas --</option>';
        (classes || []).forEach(c => {
            const opt = document.createElement('option');
            opt.value = c;
            opt.textContent = c;
            sel.appendChild(opt);
        });
    } catch (err) {
        console.error('Gagal load kelas:', err);
        showToast('Gagal load kelas', 'error');
    }
    
    // Load kategori
    await loadKategori();
    await loadRiwayat();
}

// ============================================================
// LOAD KATEGORI
// ============================================================
async function loadKategori() {
    const jenis = document.getElementById('poinJenis').value;
    
    try {
        const categories = await callApi('getCategories', [jenis]);
        const sel = document.getElementById('poinKategori');
        sel.innerHTML = '<option value="">-- Pilih Kategori --</option>';
        (categories || []).forEach(c => {
            const opt = document.createElement('option');
            opt.value = c.nama;
            opt.dataset.poin = c.poin;
            opt.textContent = c.nama + ' (' + c.poin + ' poin)';
            sel.appendChild(opt);
        });
    } catch (err) {
        console.error('Gagal load kategori:', err);
        showToast('Gagal load kategori', 'error');
    }
}

// ============================================================
// UPDATE POIN OTOMATIS
// ============================================================
function updatePoinOtomatis() {
    const sel = document.getElementById('poinKategori');
    const selected = sel.options[sel.selectedIndex];
    const poin = selected ? selected.dataset.poin : 0;
    document.getElementById('poinNilai').value = poin || 0;
}

// ============================================================
// LOAD SISWA BY KELAS
// ============================================================
async function loadSiswaByKelas() {
    const kelas = document.getElementById('poinKelas').value;
    const sel = document.getElementById('poinSiswa');
    sel.innerHTML = '<option value="">-- Pilih Siswa --</option>';
    
    if (!kelas) return;
    
    try {
        const students = await callApi('getStudentsByClass', [kelas]);
        (students || []).forEach(s => {
            const opt = document.createElement('option');
            opt.value = s.NIS;
            opt.textContent = s.Nama + ' (' + s.NIS + ')';
            opt.dataset.nama = s.Nama;
            opt.dataset.kelas = s.Kelas;
            sel.appendChild(opt);
        });
    } catch (err) {
        console.error('Gagal load siswa:', err);
        showToast('Gagal load siswa', 'error');
    }
}

// ============================================================
// SUBMIT POIN
// ============================================================
async function submitPoin(e) {
    e.preventDefault();
    
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
        try {
            const base64 = await readFileAsBase64(fileInput.files[0]);
            const uploadResult = await uploadFile(base64, fileInput.files[0].name);
            if (uploadResult && uploadResult.success) {
                data.fotoUrl = uploadResult.url;
            } else {
                msg.innerHTML = '<div class="alert alert-danger">Gagal upload foto: ' + (uploadResult?.error || '') + '</div>';
                return false;
            }
        } catch (err) {
            msg.innerHTML = '<div class="alert alert-danger">Gagal upload foto: ' + err.message + '</div>';
            return false;
        }
    }
    
    // Simpan data
    msg.innerHTML = '<div class="loading">Menyimpan data...</div>';
    
    try {
        const result = await callApi('savePoin', [data]);
        
        if (result && result.success) {
            msg.innerHTML = '<div class="alert alert-success">✅ Poin berhasil tersimpan!</div>';
            showToast('Poin berhasil tersimpan!', 'success');
            
            // Reset form
            resetPoinForm();
            
            // Refresh data
            await loadKategori();
            await loadRiwayat();
            await loadDashboard();
        } else {
            msg.innerHTML = '<div class="alert alert-danger">Gagal menyimpan: ' + (result?.message || '') + '</div>';
        }
    } catch (err) {
        msg.innerHTML = '<div class="alert alert-danger">Error: ' + err.message + '</div>';
    }
    
    return false;
}

// ============================================================
// RESET POIN FORM
// ============================================================
function resetPoinForm() {
    document.getElementById('poinTanggal').value = getTodayDate();
    document.getElementById('poinKelas').value = '';
    document.getElementById('poinSiswa').innerHTML = '<option value="">-- Pilih Siswa --</option>';
    document.getElementById('poinJenis').value = 'pelanggaran';
    document.getElementById('poinKategori').innerHTML = '<option value="">-- Pilih Kategori --</option>';
    document.getElementById('poinNilai').value = '';
    document.getElementById('poinKeterangan').value = '';
    document.getElementById('poinPetugas').value = '';
    document.getElementById('poinFoto').value = '';
}

// ============================================================
// READ FILE AS BASE64
// ============================================================
function readFileAsBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (err) => reject(err);
        reader.readAsDataURL(file);
    });
}

// ============================================================
// LOAD RIWAYAT
// ============================================================
async function loadRiwayat() {
    try {
        const data = await callApi('getAllPoin');
        const all = [...(data?.violations || []), ...(data?.achievements || [])];
        all.sort((a, b) => new Date(b.Tanggal) - new Date(a.Tanggal));
        
        const tbody = document.getElementById('riwayatTable');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        const limit = all.slice(0, 20);
        
        limit.forEach(item => {
            const tr = document.createElement('tr');
            const jenis = item.type === 'pelanggaran' ? '❌ Pelanggaran' : '🏆 Prestasi';
            tr.innerHTML = `
                <td>${formatDate(item.Tanggal)}</td>
                <td>${item.NamaSiswa || item.NIS || '-'}</td>
                <td>${item.Kelas || '-'}</td>
                <td>${jenis}</td>
                <td>${item.Kategori || '-'}</td>
                <td style="font-weight:700;color:${item.type === 'pelanggaran' ? '#dc2626' : '#16a34a'}">${item.Poin || 0}</td>
            `;
            tbody.appendChild(tr);
        });
    } catch (err) {
        console.error('Gagal load riwayat:', err);
        showToast('Gagal load riwayat: ' + err.message, 'error');
    }
}
