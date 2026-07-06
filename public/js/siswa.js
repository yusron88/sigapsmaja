// ============================================================
// SISWA VIEW
// ============================================================
async function loadSiswaView() {
    if (!currentUser) return;
    
    const nis = currentUser.username;
    
    try {
        // Load data siswa
        const student = await callApi('getStudentByNis', [nis]);
        
        if (!student) {
            document.getElementById('siswaInfo').innerHTML = 
                '<div class="alert alert-warning">Data siswa tidak ditemukan. Hubungi admin.</div>';
            return;
        }
        
        document.getElementById('siswaInfo').innerHTML = `
            <p><strong>Nama:</strong> ${student.Nama || '-'}</p>
            <p><strong>NIS:</strong> ${student.NIS || '-'}</p>
            <p><strong>Kelas:</strong> ${student.Kelas || '-'}</p>
        `;
        
        // Load poin siswa
        await loadSiswaPoin(nis);
        
    } catch (err) {
        showToast('Gagal load data siswa: ' + err.message, 'error');
    }
}

// ============================================================
// LOAD SISWA POIN
// ============================================================
async function loadSiswaPoin(nis) {
    try {
        const poinData = await callApi('getPoinByNis', [nis]);
        
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
        
        // Update stats
        document.getElementById('siswaTotalPelanggaran').textContent = totalPelanggaran;
        document.getElementById('siswaTotalPrestasi').textContent = totalPrestasi;
        document.getElementById('siswaTotalAkhir').textContent = totalAkhir;
        
        // Update peringatan
        updateSiswaPeringatan(totalAkhir);
        
        // Update riwayat
        renderSiswaRiwayat(riwayat);
        
    } catch (err) {
        showToast('Gagal load poin siswa: ' + err.message, 'error');
    }
}

// ============================================================
// UPDATE SISWA PERINGATAN
// ============================================================
function updateSiswaPeringatan(totalAkhir) {
    const warningEl = document.getElementById('siswaPeringatan');
    if (!warningEl) return;
    
    warningEl.innerHTML = '';
    
    if (totalAkhir >= 100) {
        warningEl.innerHTML = 
            '<div class="alert alert-danger">⚠️ PERINGATAN KERAS! Poin Anda mencapai batas maksimal (100). Segera temui Guru BK atau Wali Kelas!</div>';
    } else if (totalAkhir > 50) {
        warningEl.innerHTML = 
            '<div class="alert alert-warning">⚠️ Perhatian! Poin Anda melebihi 50. Silakan melapor kepada Wali Kelas.</div>';
    } else {
        warningEl.innerHTML = 
            '<div class="alert alert-success">✅ Poin Anda dalam batas normal. Tetap jaga disiplin!</div>';
    }
}

// ============================================================
// RENDER SISWA RIWAYAT
// ============================================================
function renderSiswaRiwayat(riwayat) {
    const tbody = document.getElementById('siswaRiwayatTable');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    riwayat.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));
    
    riwayat.forEach(r => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${formatDate(r.tanggal)}</td>
            <td>${r.jenis}</td>
            <td>${r.kategori}</td>
            <td style="font-weight:700;color:${r.jenis.includes('Pelanggaran') ? '#dc2626' : '#16a34a'}">${r.poin}</td>
            <td>${r.keterangan}</td>
        `;
        tbody.appendChild(tr);
    });
}
