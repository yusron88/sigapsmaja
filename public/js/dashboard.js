// ============================================================
// DASHBOARD
// ============================================================
let chartInstance = null;

async function loadDashboard() {
    showLoading('dashboardStats');
    
    try {
        const data = await callApi('getDashboardStats');
        
        if (!data) {
            throw new Error('Data tidak valid');
        }
        
        // Update stats
        document.getElementById('statSiswa').textContent = data.siswa?.length || 0;
        document.getElementById('statViolations').textContent = data.totalViolations || 0;
        document.getElementById('statAchievements').textContent = data.totalAchievements || 0;
        document.getElementById('statKelas').textContent = Object.keys(data.perKelas || {}).length;
        
        // Update Top 5
        renderTop5(data.siswaTerbanyak || []);
        
        // Update Kelas Stats
        renderKelasStats(data.perKelas || {});
        
        // Update Chart
        updateChart(data);
        
    } catch (err) {
        showToast('Gagal load dashboard: ' + err.message, 'error');
    } finally {
        hideLoading('dashboardStats');
    }
}

// ============================================================
// RENDER TOP 5
// ============================================================
function renderTop5(data) {
    const tbody = document.getElementById('top5Table');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    data.forEach((d, i) => {
        const tr = document.createElement('tr');
        const total = d.total || 0;
        tr.innerHTML = `
            <td>${i + 1}</td>
            <td>${d.nama || '-'}</td>
            <td>${d.kelas || '-'}</td>
            <td>${d.totalPelanggaran || 0}</td>
            <td>${d.totalPrestasi || 0}</td>
            <td style="font-weight:700;color:${total > 50 ? '#dc2626' : '#16a34a'}">${total}</td>
        `;
        tbody.appendChild(tr);
    });
}

// ============================================================
// RENDER KELAS STATS
// ============================================================
function renderKelasStats(data) {
    const tbody = document.getElementById('kelasStatsTable');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    Object.keys(data).forEach(k => {
        const d = data[k];
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${k}</td>
            <td>${d.count || 0}</td>
            <td>${d.count > 0 ? (d.total / d.count).toFixed(1) : 0}</td>
            <td>${d.max || 0}</td>
        `;
        tbody.appendChild(tr);
    });
}

// ============================================================
// UPDATE CHART - Menggunakan data riil
// ============================================================
function updateChart(data) {
    const ctx = document.getElementById('trenChart');
    if (!ctx) return;
    
    if (chartInstance) {
        chartInstance.destroy();
        chartInstance = null;
    }
    
    // Gunakan data riil dari database
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];
    const violasiPerBulan = Array(12).fill(0);
    const prestasiPerBulan = Array(12).fill(0);
    
    // Jika ada data riil, gunakan data tersebut
    // Contoh: data.bulananViolasi dan data.bulananPrestasi dari backend
    if (data.bulananViolasi && data.bulananPrestasi) {
        data.bulananViolasi.forEach((val, idx) => {
            if (idx < 12) violasiPerBulan[idx] = val || 0;
        });
        data.bulananPrestasi.forEach((val, idx) => {
            if (idx < 12) prestasiPerBulan[idx] = val || 0;
        });
    } else {
        // Fallback: distribusi berdasarkan total (tidak random)
        const totalViolasi = data.totalViolations || 0;
        const totalPrestasi = data.totalAchievements || 0;
        for (let i = 0; i < 12; i++) {
            violasiPerBulan[i] = Math.round((totalViolasi / 12));
            prestasiPerBulan[i] = Math.round((totalPrestasi / 12));
        }
    }
    
    chartInstance = new Chart(ctx.getContext('2d'), {
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
