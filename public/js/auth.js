// ============================================================
// GLOBAL STATE
// ============================================================
let currentUser = null;
let currentRole = 'siswa';

// ============================================================
// LOGIN
// ============================================================
async function handleLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value.trim();
    const errorEl = document.getElementById('loginError');
    
    errorEl.textContent = '';
    errorEl.innerHTML = '<div class="loading">Memproses login...</div>';

    try {
        const result = await callApi('doLogin', [username, password]);
        
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
    } catch (err) {
        errorEl.textContent = 'Terjadi kesalahan: ' + err.message;
    }
}

// ============================================================
// LOGOUT
// ============================================================
function doLogout() {
    currentUser = null;
    currentRole = 'siswa';
    
    document.getElementById('app').style.display = 'none';
    document.getElementById('loginPage').style.display = 'flex';
    document.getElementById('loginPassword').value = '';
    document.getElementById('loginError').textContent = '';
}
