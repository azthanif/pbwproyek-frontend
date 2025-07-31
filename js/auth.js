// File: frontend/js/auth.js
// Bertanggung jawab untuk semua logika autentikasi: login, logout, dan pemeriksaan sesi.

document.addEventListener('DOMContentLoaded', () => {
    const API_BASE_URL = 'http://dreamhome-proyek.gt.tc/backend/public/api'; // Sesuaikan dengan URL API Anda

    const loginForm = document.getElementById('login-form');
    const logoutBtn = document.getElementById('logout-btn');
    const currentPath = window.location.pathname;

    // ======================================================
    // BAGIAN 1: Logika untuk Halaman Login (login.html)
    // ======================================================
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('username').value; // Sesuaikan ID jika berbeda
            const password = document.getElementById('password').value;
            const errorMessageDiv = document.getElementById('error-message'); // Sesuaikan ID jika berbeda

            errorMessageDiv.style.display = 'none';

            try {
                const response = await fetch(`${API_BASE_URL}/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password }),
                    credentials: 'include'
                });

                const data = await response.json();

                if (response.ok) {
                    // Jika login berhasil, simpan informasi penting ke sessionStorage
                    sessionStorage.setItem('userRole', data.role);
                    sessionStorage.setItem('userName', data.name); // Mengambil 'name' dari respons API
                    sessionStorage.setItem('staffNo', data.staffNo);
                    
                    // Arahkan ke dasbor admin
                    window.location.href = 'admin/dashboard.html';
                } else {
                    errorMessageDiv.textContent = data.message || 'Login gagal!';
                    errorMessageDiv.style.display = 'block';
                }
            } catch (error) {
                console.error('Error saat login:', error);
                errorMessageDiv.textContent = 'Tidak dapat terhubung ke server.';
                errorMessageDiv.style.display = 'block';
            }
        });
    }

    // ======================================================
    // BAGIAN 2: Logika untuk Halaman di dalam Panel Admin
    // ======================================================
    if (currentPath.includes('/admin/')) {
        
        // --- Pemeriksaan Sesi ---
        // Ini adalah "penjaga gerbang". Jika tidak ada sesi, kode di bawah tidak akan berjalan.
        if (!sessionStorage.getItem('userRole')) {
            alert('Akses ditolak. Silakan login terlebih dahulu.');
            // Arahkan kembali ke halaman login. `../` diperlukan karena kita berada di dalam folder /admin.
            window.location.href = '../login.html';
            return; // Hentikan eksekusi skrip lebih lanjut
        }

        // --- Logika Logout ---
        if (logoutBtn) {
            logoutBtn.addEventListener('click', async () => {
                // Hapus data sesi dari browser
                sessionStorage.clear();

                // (Opsional tapi direkomendasikan) Panggil endpoint logout di backend untuk menghancurkan sesi di server
                try {
                    await fetch(`${API_BASE_URL}/logout`, { method: 'POST', credentials: 'include' });
                } catch (error) {
                    console.error('Gagal menghubungi endpoint logout:', error);
                }

                // Arahkan kembali ke halaman login
                window.location.href = '../login.html';
            });
        }
    }
});
