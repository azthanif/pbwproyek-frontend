// This script handles logic for the public-facing pages

document.addEventListener('DOMContentLoaded', () => {
    // URL dasar untuk backend API kita
    const API_BASE_URL = 'http://dreamhome-proyek.gt.tc/backend/public/api';

    /**
     * Fungsi generik untuk merender properti ke dalam grid.
     * @param {Array} properties - Array objek properti.
     * @param {HTMLElement} gridElement - Elemen grid untuk diisi.
     */
    const renderProperties = (properties, gridElement) => {
        if (!gridElement) return;

        if (properties.length === 0) {
            gridElement.innerHTML = '<p>Tidak ada properti yang ditemukan.</p>';
            return;
        }

        let content = '';
        properties.forEach(prop => {
            content += `
                <div class="property-card" data-id="${prop.propertyNo}">
                    <img src="images/properties/gambar-properti.jpeg" alt="Gambar Properti ${prop.street}">
                    <div class="property-card-content">
                        <h3>${prop.street}, ${prop.city}</h3>
                        <p>Tipe: ${prop.type} | Kamar: ${prop.rooms}</p>
                        <p><strong>Sewa: $${prop.rent}/bulan</strong></p>
                    </div>
                </div>
            `;
        });
        gridElement.innerHTML = content;
    };

    /**
     * Fungsi untuk mengambil dan menampilkan properti unggulan di halaman utama.
     */
    const loadFeaturedProperties = async () => {
        const featuredGrid = document.getElementById('featured-properties-grid');
        if (!featuredGrid) return;

        try {
            const response = await fetch(`${API_BASE_URL}/featured_properties`);
            if (!response.ok) throw new Error('Gagal mengambil data');
            const properties = await response.json();
            renderProperties(properties, featuredGrid);
        } catch (error) {
            console.error("Gagal memuat properti unggulan:", error);
            featuredGrid.innerHTML = '<p>Gagal memuat properti. Silakan coba lagi nanti.</p>';
        }
    };

    /**
     * Fungsi untuk mengambil dan menampilkan SEMUA properti, dengan dukungan filter.
     */
    const loadAllProperties = async (filters = {}) => {
        const propertiesGrid = document.getElementById('properties-grid');
        if (!propertiesGrid) return;

        // Membangun query string dari objek filter
        const queryParams = new URLSearchParams(filters).toString();
        
        try {
            propertiesGrid.innerHTML = '<p>Memuat properti...</p>';
            const response = await fetch(`${API_BASE_URL}/properties?${queryParams}`);
            if (!response.ok) throw new Error('Gagal mengambil data');
            const properties = await response.json();
            renderProperties(properties, propertiesGrid);
            
            // Jika ini adalah pemuatan awal, isi filter kota
            if (Object.keys(filters).length === 0) {
                populateCityFilter(properties);
            }

        } catch (error) {
            console.error("Gagal memuat semua properti:", error);
            propertiesGrid.innerHTML = '<p>Gagal memuat properti. Silakan coba lagi nanti.</p>';
        }
    };

    /**
     * Mengisi dropdown filter kota berdasarkan data properti yang ada.
     */
    const populateCityFilter = (properties) => {
        const cityFilter = document.getElementById('filter-city');
        if (!cityFilter) return;

        // Mengambil semua kota unik dari data properti
        const cities = [...new Set(properties.map(prop => prop.city))];
        cities.sort();

        cities.forEach(city => {
            const option = document.createElement('option');
            option.value = city;
            option.textContent = city;
            cityFilter.appendChild(option);
        });
    };

    /**
     * Fungsi untuk mengambil dan menampilkan detail satu properti.
     */
    const loadPropertyDetails = async () => {
        const container = document.getElementById('property-detail-container');
        if (!container) return;

        // Ambil ID properti dari parameter URL (?id=...)
        const urlParams = new URLSearchParams(window.location.search);
        const propertyId = urlParams.get('id');

        if (!propertyId) {
            container.innerHTML = '<h1>Properti tidak ditemukan.</h1><p>ID properti tidak diberikan.</p>';
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/properties/${propertyId}`);
            if (!response.ok) {
                throw new Error(`Properti tidak ditemukan (Status: ${response.status})`);
            }
            const prop = await response.json();

            // Buat HTML untuk halaman detail
            container.innerHTML = `
                <div class="property-detail-layout">
                    <div class="property-main-content">
                        <div class="property-gallery">
                            <img src="images/properties/gambar-properti.jpeg" alt="Gambar utama properti ${prop.street}">
                        </div>
                        <div class="property-info">
                            <h1>${prop.street}, ${prop.city}</h1>
                            <p class="property-postcode">${prop.postcode}</p>
                            
                            <div class="property-specs">
                                <div class="spec-item">
                                    <span class="label">Tipe</span>
                                    <span class="value">${prop.type}</span>
                                </div>
                                <div class="spec-item">
                                    <span class="label">Kamar</span>
                                    <span class="value">${prop.rooms}</span>
                                </div>
                            </div>

                            <p class="property-rent">$${prop.rent} / bulan</p>
                        </div>
                    </div>
                    <aside class="property-sidebar">
                        <div class="agent-info">
                            <h3>Informasi Kontak</h3>
                            <p><strong>Staf yang Bertanggung Jawab:</strong><br>${prop.staffFName || 'N/A'} ${prop.staffLName || ''}</p>
                            <p><strong>Kantor Cabang:</strong><br>${prop.branchStreet || 'N/A'}, ${prop.branchCity || ''}</p>
                        </div>
                    </aside>
                </div>
            `;

        } catch (error) {
            console.error("Gagal memuat detail properti:", error);
            container.innerHTML = `<h1>Gagal Memuat Properti</h1><p>${error.message}</p>`;
        }
    };

    // --- LOGIKA EKSEKUSI ---

    // Jika kita berada di halaman utama, muat properti unggulan.
    if (document.getElementById('featured-properties-grid')) {
        loadFeaturedProperties();
    }

    // Jika kita berada di halaman daftar properti, muat semua properti dan atur filter.
    if (document.getElementById('properties-list')) {
        loadAllProperties(); // Pemuatan awal

        const filterForm = document.getElementById('filter-form');
        filterForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            // Kumpulkan semua nilai dari form filter
            const filters = {
                street: document.getElementById('search-street').value,
                city: document.getElementById('filter-city').value,
                type: document.getElementById('filter-type').value,
                minRooms: document.getElementById('filter-rooms').value,
                minRent: document.getElementById('min-rent').value,
                maxRent: document.getElementById('max-rent').value
            };

            // Hapus filter yang kosong agar URL lebih bersih
            Object.keys(filters).forEach(key => {
                if (!filters[key]) {
                    delete filters[key];
                }
            });

            // Panggil fungsi untuk memuat properti dengan filter yang diterapkan
            loadAllProperties(filters);
        });

        // Logika untuk tombol reset
        filterForm.addEventListener('reset', () => {
            // Muat ulang semua properti tanpa filter setelah form di-reset
            setTimeout(() => loadAllProperties(), 0);
        });
    }

    // Jika kita berada di halaman detail properti, muat detailnya.
    if (document.getElementById('property-detail-container')) {
        loadPropertyDetails();
    }

    // Tambahkan event listener untuk semua kartu properti agar bisa diklik
    document.body.addEventListener('click', function(event) {
        const card = event.target.closest('.property-card');
        if (card) {
            const propertyId = card.dataset.id;
            window.location.href = `property-detail.html?id=${propertyId}`;
        }
    });
});
