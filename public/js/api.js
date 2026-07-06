// ============================================================
// API Configuration
// ============================================================
const API_URL = 'https://script.google.com/macros/s/AKfycbyM8eEAj-NpyY2h9MSq4EG8tScaT3qywRE4V_9iP0_jgYug3B87PvvfOUTrMV4QLEtM/exec';

// ============================================================
// Fungsi utama untuk memanggil API dengan fetch()
// ============================================================
async function callApi(action, params = []) {
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: action,
                params: params
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        return result;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// ============================================================
// Upload File (Base64)
// ============================================================
async function uploadFile(base64Data, fileName) {
    return await callApi('uploadFile', [base64Data, fileName]);
}
