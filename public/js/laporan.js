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
