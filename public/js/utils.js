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
    
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => {
            if (toast.parentNode) toast.remove();
        }, 400);
    }, 4000);
}

// ============================================================
// LOADING INDICATOR
// ============================================================
function showLoading(elementId, message = 'Memuat data...') {
    const el = document.getElementById(elementId);
    if (el) {
        el.innerHTML = `<div class="loading">${message}</div>`;
    }
}

function hideLoading(elementId) {
    const el = document.getElementById(elementId);
    if (el) {
        el.innerHTML = '';
    }
}

// ============================================================
// FORMAT DATE
// ============================================================
function formatDate(dateString) {
    if (!dateString) return '-';
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    } catch {
        return dateString;
    }
}

// ============================================================
// GET TODAY DATE (YYYY-MM-DD)
// ============================================================
function getTodayDate() {
    return new Date().toISOString().split('T')[0];
}
