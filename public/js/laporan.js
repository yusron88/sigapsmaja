// ============================================================
// LAPORAN
// ============================================================
async function loadLaporan() {
    // Load kelas untuk filter
    try {
        const classes = await callApi('getClasses');
        const sel = document.getElementById('laporanKelas');
        if (sel) {
            sel.innerHTML = '<option value="Semua">Semua Kelas</option>';
            (classes || []).forEach(c => {
                const opt = document.createElement('option');
                opt.value = c;
                opt.textContent = c;
                sel.appendChild(opt);
            });
        }
    } catch (err) {
        console.error('Gagal load kelas filter:', err);
    }
    
    await refreshLaporan();
}

// ============================================================
// REFRESH LAPORAN
// ============================================================
async function refreshLaporan() {
    const filter = document.getElementById('laporanKelas')?.value || 'Semua';
    
    try {
        const data = await callApi('getDashboardStats');
        let filtered = data?.siswa || [];
        
        if (filter && filter !== 'Semua') {
            filtered = filtered.filter(d => d.kelas === filter);
        }
        
        const tbody = document.getElementById('laporanTable');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        filtered.sort((a, b) => (b.total || 0) - (a.total || 0));
        
        filtered.forEach((d, i) => {
            const tr = document.createElement('tr');
            const total = d.total || 0;
            let status = 'Normal';
            let statusClass = '';
            
            if (total >= 100) {
                status = '⚠️ Segera ke BK';
                statusClass = 'danger';
            } else if (total > 50) {
                status = '⚠️ Lapor Wali Kelas';
                statusClass = 'warning';
            }
            
            tr.innerHTML = `
                <td>${i + 1}</td>
                <td>${d.nama || '-'}</td>
                <td>${d.kelas || '-'}</td>
                <td>${d.totalPelanggaran || 0}</td>
                <td>${d.totalPrestasi || 0}</td>
                <td style="font-weight:700;color:${total > 50 ? '#dc2626' : '#16a34a'}">${total}</td>
                <td class="${statusClass}">${status}</td>
            `;
            tbody.appendChild(tr);
        });
    } catch (err) {
        showToast('Gagal refresh laporan: ' + err.message, 'error');
    }
}

// ============================================================
// CETAK LAPORAN PDF
// ============================================================
async function cetakLaporan() {
    const filter = document.getElementById('laporanKelas')?.value || 'Semua';
    const msg = document.getElementById('laporanMessage');
    
    if (msg) {
        msg.innerHTML = '<div class="loading">Membuat PDF...</div>';
    }
    
    try {
        const result = await callApi('generateReport', [filter]);
        
        if (result && result.success) {
            if (msg) {
                msg.innerHTML = `
                    <div class="alert alert-success">
                        ✅ PDF berhasil dibuat! <a href="${result.url}" target="_blank">Buka PDF</a>
                    </div>
                `;
            }
            showToast('PDF siap!', 'success');
        } else {
            if (msg) {
                msg.innerHTML = '<div class="alert alert-danger">Gagal membuat PDF: ' + (result?.message || '') + '</div>';
            }
        }
    } catch (err) {
        if (msg) {
            msg.innerHTML = '<div class="alert alert-danger">Error: ' + err.message + '</div>';
        }
    }
}

// Event listener untuk filter laporan
document.addEventListener('change', function(e) {
    if (e.target && e.target.id === 'laporanKelas') {
        refreshLaporan();
    }
});
