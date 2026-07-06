// ============================================================
// APP INITIALIZATION
// ============================================================
async function initApp() {
    // Setup tabs
    document.querySelectorAll('.nav-tabs button').forEach(btn => {
        btn.addEventListener('click', function() {
            const tab = this.dataset.tab;
            if (tab) switchTab(tab);
        });
    });
    
    // Show/hide admin tabs
    if (currentRole === 'admin') {
        const tabMaster = document.getElementById('tabMaster');
        if (tabMaster) tabMaster.classList.remove('hidden');
    } else {
        const tabMaster = document.getElementById('tabMaster');
        if (tabMaster) tabMaster.classList.add('hidden');
    }
    
    // Set default tab
    switchTab('dashboard');
    await loadAllData();
}

// ============================================================
// SWITCH TAB
// ============================================================
function switchTab(tabId) {
    // Hide all panels
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
    
    // Show selected panel
    const panelId = 'panel' + tabId.charAt(0).toUpperCase() + tabId.slice(1);
    const panel = document.getElementById(panelId);
    if (panel) panel.classList.add('active');
    
    // Update active tab button
    document.querySelectorAll('.nav-tabs button').forEach(b => b.classList.remove('active'));
    const btn = document.querySelector(`.nav-tabs button[data-tab="${tabId}"]`);
    if (btn) btn.classList.add('active');
    
    // Load data based on tab
    switch (tabId) {
        case 'dashboard':
            loadDashboard();
            break;
        case 'input':
            loadInputForm();
            break;
        case 'laporan':
            loadLaporan();
            break;
        case 'siswaView':
            loadSiswaView();
            break;
        case 'master':
            // Master data loaded on demand via showMasterTab
            break;
        default:
            break;
    }
}

// ============================================================
// LOAD ALL DATA
// ============================================================
async function loadAllData() {
    try {
        // Initialize system if needed
        await callApi('initSystem');
        console.log('System initialized');
    } catch (err) {
        console.error('Init error:', err);
    }
    
    // Load all tabs data
    await Promise.all([
        loadDashboard(),
        loadInputForm(),
        loadLaporan()
    ]);
}

// ============================================================
// KEYBOARD SHORTCUT: Enter untuk login
// ============================================================
document.addEventListener('keydown', function(e) {
    const loginPage = document.getElementById('loginPage');
    if (e.key === 'Enter' && loginPage && loginPage.style.display !== 'none') {
        const form = document.getElementById('loginForm');
        if (form) form.dispatchEvent(new Event('submit'));
    }
});

// ============================================================
// READY
// ============================================================
console.log('🚀 SIGAP - SMA Negeri Jatirogo siap digunakan!');
