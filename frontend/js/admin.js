// This script handles logic for the admin panel pages

document.addEventListener('DOMContentLoaded', () => {
    const API_BASE_URL = 'http://dreamhome-proyek.gt.tc/backend/public/api';

    // =================================================================
    // LOGIKA UNTUK MENERAPKAN IZIN BERDASARKAN PERAN
    // =================================================================

    const displayRoleInfo = (role) => {
        const welcomeContainer = document.getElementById('welcome-message-container');
        if (!welcomeContainer) return;

        let roleDescription = '';
        let permissionsList = '';

        // PERBAIKAN: Deskripsi disesuaikan dengan aturan backend
        switch (role) {
            case 'Director':
                roleDescription = 'Anda memiliki akses tertinggi, termasuk manajemen cabang.';
                permissionsList = `<li>Akses penuh ke semua modul.</li>`;
                break;
            case 'Manager':
                roleDescription = 'Anda memiliki akses penuh ke modul Properti, Staf, dan Klien.';
                permissionsList = `<li>Menambah, melihat, mengedit, dan menghapus data Properti & Staf.</li>`;
                break;
            case 'Supervisor':
                roleDescription = 'Anda dapat melihat data dan membuat entitas baru seperti Klien.';
                permissionsList = `<li><strong>Tidak dapat</strong> mengedit atau menghapus data utama.</li>`;
                break;
            case 'Assistant':
                roleDescription = 'Anda memiliki akses terbatas untuk membantu operasional.';
                permissionsList = `<li>Hanya dapat melihat data dan membuat Klien/Kunjungan baru.</li>`;
                break;
            default:
                roleDescription = 'Peran tidak dikenali. Akses terbatas.';
        }

        welcomeContainer.innerHTML = `
            <h2>Peran Anda: ${role}</h2>
            <p>${roleDescription}</p>
            <h4>Hak Akses Utama:</h4>
            <ul>${permissionsList}</ul>
        `;
    };

    /**
     * PERBAIKAN: Fungsi ini sekarang MENAMPILKAN elemen, bukan menyembunyikan.
     * CSS akan menyembunyikan semuanya secara default.
     * @param {string} role - Peran pengguna.
     */
    const applyRolePermissions = (role) => {
        if (!role) return;
        
        // PERBAIKAN: Logika disederhanakan dan disesuaikan
        if (role === 'Manager') {
            document.querySelectorAll('.manager-only').forEach(el => el.style.display = 'inline-block');
        }
        if (role === 'Director') {
            // Director mendapatkan akses Manager + akses Director
            document.querySelectorAll('.manager-only, .director-only').forEach(el => el.style.display = 'inline-block');
        }
        // Tidak ada kelas untuk Supervisor atau Assistant karena mereka tidak memiliki hak edit/hapus utama
    };

    const initializeDashboard = async () => {
        const adminNameEl = document.getElementById('admin-name');
        const username = sessionStorage.getItem('username');
        if (adminNameEl && username) {
            adminNameEl.textContent = username;
        }

        const totalPropsEl = document.getElementById('total-properties');
        const totalStaffEl = document.getElementById('total-staff');
        const totalClientsEl = document.getElementById('total-clients');
        const totalBranchesEl = document.getElementById('total-branches');

        if (!totalPropsEl) return;

        try {
            // PERBAIKAN: Menambahkan fetch untuk /branches
            const [propsRes, staffRes, clientsRes, branchesRes] = await Promise.all([
                fetch(`${API_BASE_URL}/properties`, { credentials: 'include' }),
                fetch(`${API_BASE_URL}/staff`, { credentials: 'include' }),
                fetch(`${API_BASE_URL}/clients`, { credentials: 'include' }),
                fetch(`${API_BASE_URL}/branches`, { credentials: 'include' }) // <-- Baris baru
            ]);

            const properties = await propsRes.json();
            const staff = await staffRes.json();
            const clients = await clientsRes.json();
            const branches = await branchesRes.json(); // <-- Baris baru

            totalPropsEl.textContent = properties.length;
            totalStaffEl.textContent = staff.length;
            totalClientsEl.textContent = clients.length;
            totalBranchesEl.textContent = branches.length; // <-- Baris baru

        } catch (error) {
            console.error('Gagal memuat data ringkasan:', error);
            totalPropsEl.textContent = 'Error';
            totalStaffEl.textContent = 'Error';
            totalClientsEl.textContent = 'Error';
            totalBranchesEl.textContent = 'Error'; // <-- Baris baru
        }
    };

    /**
     * Memuat dan menampilkan semua properti dalam tabel.
     */
    const loadPropertiesTable = async () => {
        const tableBody = document.querySelector('#properties-table tbody');
        if (!tableBody) return;
        try {
            const response = await fetch(`${API_BASE_URL}/properties`, { credentials: 'include' });
            const properties = await response.json();
            tableBody.innerHTML = '';
            properties.forEach(prop => {
                const staffName = (prop.staffNo && prop.staffFName && prop.staffLName) ? `[${prop.staffNo}] ${prop.staffFName} ${prop.staffLName}` : 'N/A';
                // PERBAIKAN: Tombol Edit sekarang .manager-only agar sesuai dengan backend
                const row = `
                    <tr>
                        <td>${prop.propertyNo}</td>
                        <td>${prop.street}</td>
                        <td>${prop.city}</td>
                        <td>${prop.type}</td>
                        <td>$${prop.rent}</td>
                        <td>${staffName}</td>
                        <td class="actions">
                            <a href="form-property.html?id=${prop.propertyNo}" class="btn btn-secondary btn-sm manager-only">Edit</a>
                            <button class="btn btn-danger btn-sm btn-delete-property manager-only" data-id="${prop.propertyNo}">Hapus</button>
                        </td>
                    </tr>
                `;
                tableBody.innerHTML += row;
            });
            applyRolePermissions(sessionStorage.getItem('userRole'));
        } catch (error) {
            console.error('Gagal memuat data properti:', error);
            tableBody.innerHTML = '<tr><td colspan="7">Gagal memuat data.</td></tr>';
        }
    };

    /**
     * Menangani logika untuk formulir tambah/edit properti.
     */
    const initializePropertyForm = async () => {
        const form = document.getElementById('property-form');
        if (!form) return;

        const urlParams = new URLSearchParams(window.location.search);
        const propertyId = urlParams.get('id');
        const formTitle = document.getElementById('form-title');

        const propertyNoInput = document.getElementById('propertyNo');

        if (propertyId) {
            // Mode Edit
            formTitle.textContent = `Edit Properti #${propertyId}`;
            propertyNoInput.readOnly = true;

            const res = await fetch(`${API_BASE_URL}/properties/${propertyId}`, { credentials: 'include' });
            const prop = await res.json();

            document.getElementById('propertyNo').value = prop.propertyNo;
            document.getElementById('street').value = prop.street;
            document.getElementById('city').value = prop.city;
            document.getElementById('postcode').value = prop.postcode;
            document.getElementById('type').value = prop.type;
            document.getElementById('rooms').value = prop.rooms;
            document.getElementById('rent').value = prop.rent;
            document.getElementById('ownerNo').value = prop.ownerNo;
            document.getElementById('staffNo').value = prop.staffNo;
            document.getElementById('branchNo').value = prop.branchNo;
        } else {
            // Mode Tambah
            formTitle.textContent = 'Tambah Properti Baru';
        }

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            // Kumpulkan data dari form
            const formData = {
                propertyNo: document.getElementById('propertyNo').value,
                street: document.getElementById('street').value,
                city: document.getElementById('city').value,
                postcode: document.getElementById('postcode').value,
                type: document.getElementById('type').value,
                rooms: document.getElementById('rooms').value,
                rent: document.getElementById('rent').value,
                ownerNo: document.getElementById('ownerNo').value,
                staffNo: document.getElementById('staffNo').value,
                branchNo: document.getElementById('branchNo').value,
            };

            const method = propertyId ? 'PUT' : 'POST';
            const url = propertyId ? `${API_BASE_URL}/properties/${propertyId}` : `${API_BASE_URL}/properties`;

            try {
                const response = await fetch(url, {
                    method: method,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData),
                    credentials: 'include' // <-- Pastikan ini ada
                });
                if (response.ok) {
                    alert('Data properti berhasil disimpan!');
                    window.location.href = 'properties.html';
                } else {
                    const error = await response.json();
                    alert(`Gagal menyimpan: ${error.message}`);
                }
            } catch (error) {
                console.error('Error:', error);
                alert('Terjadi kesalahan saat menyimpan data.');
            }
        });
    };

    /**
     * Memuat dan menampilkan semua staf dalam tabel.
     */
    const loadStaffTable = async () => {
        const tableBody = document.querySelector('#staff-table tbody');
        if (!tableBody) return;
        try {
            const response = await fetch(`${API_BASE_URL}/staff`, { credentials: 'include' });
            const staffList = await response.json();
            tableBody.innerHTML = '';
            staffList.forEach(staff => {
                // PERBAIKAN: Tombol Edit & Hapus sudah benar .manager-only
                const row = `
                    <tr>
                        <td>${staff.staffNo}</td>
                        <td>${staff.fName} ${staff.lName}</td>
                        <td>${staff.position}</td>
                        <td>${staff.branchNo}</td>
                        <td class="actions">
                            <a href="form-staff.html?id=${staff.staffNo}" class="btn btn-secondary btn-sm manager-only">Edit</a>
                            <button class="btn btn-danger btn-sm btn-delete-staff manager-only" data-id="${staff.staffNo}">Hapus</button>
                        </td>
                    </tr>
                `;
                tableBody.innerHTML += row;
            });
            applyRolePermissions(sessionStorage.getItem('userRole'));
        } catch (error) {
            console.error('Gagal memuat data staf:', error);
            tableBody.innerHTML = '<tr><td colspan="5">Gagal memuat data.</td></tr>';
        }
    };

    /**
     * Menangani logika untuk formulir tambah/edit staf.
     */
    const initializeStaffForm = async () => {
        const form = document.getElementById('staff-form');
        if (!form) return;

        const urlParams = new URLSearchParams(window.location.search);
        const staffId = urlParams.get('id');
        const formTitle = document.getElementById('form-title-staff');

        const staffNoInput = document.getElementById('staffNo');

        if (staffId) {
            // Mode Edit
            formTitle.textContent = `Edit Staf #${staffId}`;
            staffNoInput.readOnly = true;

            const res = await fetch(`${API_BASE_URL}/staff/${staffId}`, { credentials: 'include' });
            const staff = await res.json();

            staffNoInput.value = staff.staffNo;
            document.getElementById('fName').value = staff.fName;
            document.getElementById('lName').value = staff.lName;
            document.getElementById('position').value = staff.position;
            document.getElementById('salary').value = staff.salary;
            document.getElementById('branchNo').value = staff.branchNo;
        } else {
            // Mode Tambah
            formTitle.textContent = 'Tambah Staf Baru';
        }

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = {
                staffNo: document.getElementById('staffNo').value,
                fName: document.getElementById('fName').value,
                lName: document.getElementById('lName').value,
                position: document.getElementById('position').value,
                salary: document.getElementById('salary').value,
                branchNo: document.getElementById('branchNo').value,
            };

            const method = staffId ? 'PUT' : 'POST';
            const url = staffId ? `${API_BASE_URL}/staff/${staffId}` : `${API_BASE_URL}/staff`;

            try {
                const response = await fetch(url, {
                    method: method,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData),
                    credentials: 'include'
                });

                if (response.ok) {
                    alert('Data staf berhasil disimpan!');
                    window.location.href = 'staff.html';
                } else {
                    const error = await response.json();
                    alert(`Gagal menyimpan: ${error.message}`);
                }
            } catch (error) {
                alert('Terjadi kesalahan saat menyimpan data.');
            }
        });
    };

    /**
     * Memuat dan menampilkan semua cabang dalam tabel.
     */
    const loadBranchTable = async () => {
        const tableBody = document.querySelector('#branch-table tbody');
        if (!tableBody) return;
        try {
            const response = await fetch(`${API_BASE_URL}/branches`, { credentials: 'include' });
            const branches = await response.json();
            tableBody.innerHTML = '';
            branches.forEach(branch => {
                // PERBAIKAN: Kelas diubah menjadi .director-only agar sesuai dengan backend
                const row = `
                    <tr>
                        <td>${branch.branchNo}</td>
                        <td>${branch.street}</td>
                        <td>${branch.city}</td>
                        <td>${branch.postcode}</td>
                        <td class="actions">
                            <a href="form-branch.html?id=${branch.branchNo}" class="btn btn-secondary btn-sm director-only">Edit</a>
                            <button class="btn btn-danger btn-sm btn-delete-branch director-only" data-id="${branch.branchNo}">Hapus</button>
                        </td>
                    </tr>
                `;
                tableBody.innerHTML += row;
            });
            applyRolePermissions(sessionStorage.getItem('userRole'));
        } catch (error) {
            console.error('Gagal memuat data cabang:', error);
            tableBody.innerHTML = '<tr><td colspan="5">Gagal memuat data.</td></tr>';
        }
    };

    /**
     * Menangani logika untuk formulir tambah/edit cabang.
     */
    const initializeBranchForm = async () => {
        const form = document.getElementById('branch-form');
        if (!form) return;

        const urlParams = new URLSearchParams(window.location.search);
        const branchId = urlParams.get('id');
        const formTitle = document.getElementById('form-title-branch');

        const branchNoInput = document.getElementById('branchNo');

        if (branchId) {
            // Mode Edit
            formTitle.textContent = `Edit Cabang #${branchId}`;
            branchNoInput.readOnly = true;

            const res = await fetch(`${API_BASE_URL}/branches/${branchId}`, { credentials: 'include' });
            const branch = await res.json();

            branchNoInput.value = branch.branchNo;
            document.getElementById('street').value = branch.street;
            document.getElementById('city').value = branch.city;
            document.getElementById('postcode').value = branch.postcode;
        } else {
            // Mode Tambah
            formTitle.textContent = 'Tambah Cabang Baru';
        }

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = {
                branchNo: document.getElementById('branchNo').value,
                street: document.getElementById('street').value,
                city: document.getElementById('city').value,
                postcode: document.getElementById('postcode').value,
            };

            const method = branchId ? 'PUT' : 'POST';
            const url = branchId ? `${API_BASE_URL}/branches/${branchId}` : `${API_BASE_URL}/branches`;

            try {
                const response = await fetch(url, {
                    method: method,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData),
                    credentials: 'include'
                });

                if (response.ok) {
                    alert('Data cabang berhasil disimpan!');
                    window.location.href = 'branch.html';
                } else {
                    const error = await response.json();
                    alert(`Gagal menyimpan: ${error.message}`);
                }
            } catch (error) {
                alert('Terjadi kesalahan saat menyimpan data.');
            }
        });
    };

    // --- EVENT LISTENERS & EKSEKUSI ---

    // Event listener untuk tombol hapus (menggunakan event delegation)
    document.body.addEventListener('click', async (e) => {
        if (e.target.matches('.btn-delete-property[data-id]')) {
            const id = e.target.dataset.id;
            if (confirm(`Apakah Anda yakin ingin menghapus properti #${id}?`)) {
                try {
                    const response = await fetch(`${API_BASE_URL}/properties/${id}`, {
                        method: 'DELETE',
                        credentials: 'include' // <-- Pastikan ini ada
                    });
                    if (response.ok) {
                        alert('Properti berhasil dihapus.');
                        loadPropertiesTable(); // Muat ulang tabel
                    } else {
                        const error = await response.json();
                        alert(`Gagal menghapus: ${error.message}`);
                    }
                } catch (error) {
                    alert('Terjadi kesalahan saat menghapus data.');
                }
            }
        }
        // Logika untuk hapus staf
        if (e.target.matches('.btn-delete-staff[data-id]')) {
            const id = e.target.dataset.id;
            if (confirm(`Apakah Anda yakin ingin menghapus staf #${id}?`)) {
                try {
                    const response = await fetch(`${API_BASE_URL}/staff/${id}`, {
                        method: 'DELETE',
                        credentials: 'include'
                    });
                    if (response.ok) {
                        alert('Staf berhasil dihapus.');
                        loadStaffTable(); // Muat ulang tabel staf
                    } else {
                        const error = await response.json();
                        alert(`Gagal menghapus: ${error.message}`);
                    }
                } catch (error) {
                    alert('Terjadi kesalahan saat menghapus data.');
                }
            }
        }

        // Logika untuk hapus cabang
        if (e.target.matches('.btn-delete-branch[data-id]')) {
            const id = e.target.dataset.id;
            if (confirm(`Apakah Anda yakin ingin menghapus cabang #${id}?`)) {
                try {
                    const response = await fetch(`${API_BASE_URL}/branches/${id}`, {
                        method: 'DELETE',
                        credentials: 'include'
                    });
                    if (response.ok) {
                        alert('Cabang berhasil dihapus.');
                        loadBranchTable(); // Muat ulang tabel cabang
                    } else {
                        const error = await response.json();
                        alert(`Gagal menghapus: ${error.message}`);
                    }
                } catch (error) {
                    alert('Terjadi kesalahan saat menghapus data.');
                }
            }
        }
    });

    // =================================================================
    // INISIALISASI HALAMAN
    // =================================================================

    // 1. Ambil peran pengguna dari sessionStorage
    const userRole = sessionStorage.getItem('userRole');
    const userName = sessionStorage.getItem('userName'); // PERBAIKAN: Gunakan 'userName'

    // 2. Terapkan izin dan tampilkan info peran
    const adminNameEl = document.getElementById('admin-name');
    if (adminNameEl && userName) {
        adminNameEl.textContent = userName;
    }
    // Terapkan izin untuk elemen di luar tabel (seperti tombol "Tambah Baru")
    applyRolePermissions(userRole);
    // Tampilkan info peran di dasbor
    displayRoleInfo(userRole);

    // 3. Jalankan fungsi yang sesuai untuk halaman yang sedang dibuka
    const path = window.location.pathname;

    if (path.includes('dashboard.html')) {
        initializeDashboard();
    } else if (path.includes('properties.html')) {
        loadPropertiesTable();
    } else if (path.includes('form-property.html')) {
        initializePropertyForm();
    } else if (path.includes('staff.html')) {
        loadStaffTable();
    } else if (path.includes('form-staff.html')) {
        initializeStaffForm();
    } else if (path.includes('branch.html')) {
        loadBranchTable();
    } else if (path.includes('form-branch.html')) {
        initializeBranchForm();
    }
});
