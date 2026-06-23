const App = {
    charts: {},
    
    async init() {
        this.bindNavigation();
        this.bindThemeToggle();
        this.bindDataManagement();
        this.bindForm();
        this.bindMobileMenu(); 
        
        this.applyTheme(Storage.get(Storage.KEYS.THEME, 'light'));
        
        try {
            await API.simulateNetworkDelay(1000); // Simulated boot delay
            await this.loadDoctorsData();
            this.renderDashboard();
        } catch (e) {
            this.showToast(e.message, 'error');
        } finally {
            document.getElementById('global-loader').style.opacity = '0';
            setTimeout(() => document.getElementById('global-loader').remove(), 500);
        }
    },

    bindMobileMenu() {
        const menuBtn = document.getElementById('mobile-menu-btn');
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebar-overlay');

        const toggleMenu = () => {
            sidebar.classList.toggle('open');
            overlay.classList.toggle('show');
        };

        const closeMenu = () => {
            sidebar.classList.remove('open');
            overlay.classList.remove('show');
        };

        menuBtn.addEventListener('click', toggleMenu);
        
        overlay.addEventListener('click', closeMenu);

        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                if(window.innerWidth < 992) closeMenu();
            });
        });
    },

    bindNavigation() {
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const view = e.currentTarget.dataset.view;
                if(view) this.navigate(view);
            });
        });
    },

    navigate(viewId) {
        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
        const activeLink = document.querySelector(`.nav-link[data-view="${viewId}"]`);
        if(activeLink) activeLink.classList.add('active');

        document.querySelectorAll('.view-section').forEach(sec => sec.classList.add('d-none'));
        document.getElementById(`view-${viewId}`).classList.remove('d-none');

        if (viewId === 'dashboard') this.renderDashboard();
        if (viewId === 'analytics') this.renderAnalytics();
    },

    async loadDoctorsData() {
        document.getElementById('doctor-loading').classList.remove('d-none');
        try {
            const doctors = await API.fetchDoctors();
            this.renderDoctorsGrid(doctors);
            this.populateDoctorSelect(doctors);
        } finally {
            document.getElementById('doctor-loading').classList.add('d-none');
        }
    },

    bindForm() {
        const form = document.getElementById('booking-form');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const selectedDate = new Date(document.getElementById('form-date').value);
            const today = new Date();
            today.setHours(0,0,0,0);
            
            if(selectedDate < today) {
                this.showToast('Appointments cannot be booked in the past.', 'error');
                return;
            }

            const btn = document.getElementById('submit-booking');
            const spinner = document.getElementById('booking-spinner');
            btn.disabled = true;
            spinner.classList.remove('d-none');

            try {
                const appointment = {
                    patientName: document.getElementById('form-name').value,
                    email: document.getElementById('form-email').value,
                    date: document.getElementById('form-date').value,
                    time: document.getElementById('form-time').value,
                    doctorId: document.getElementById('form-doctor').value,
                    doctorName: document.getElementById('form-doctor').options[document.getElementById('form-doctor').selectedIndex].text,
                    notes: document.getElementById('form-notes').value
                };

                await API.simulateNetworkDelay(1500); 
                Storage.saveAppointment(appointment);
                
                this.showToast('Appointment secured successfully!', 'success');
                form.reset();
                this.navigate('dashboard');

            } catch (err) {
                this.showToast('Failed to save appointment.', 'error');
            } finally {
                btn.disabled = false;
                spinner.classList.add('d-none');
            }
        });
    },

    renderDashboard() {
        const apps = Storage.getAppointments();
        const tbody = document.getElementById('appointments-table-body');
        const emptyState = document.getElementById('empty-state');
        
        document.getElementById('stat-total').innerText = apps.length;
        document.getElementById('stat-upcoming').innerText = apps.filter(a => a.status === 'Upcoming').length;
        document.getElementById('stat-completed').innerText = apps.filter(a => a.status === 'Completed').length;

        tbody.innerHTML = '';
        
        if (apps.length === 0) {
            tbody.parentElement.classList.add('d-none');
            emptyState.classList.remove('d-none');
        } else {
            tbody.parentElement.classList.remove('d-none');
            emptyState.classList.add('d-none');
            
            apps.sort((a,b) => new Date(a.date) - new Date(b.date)).forEach(app => {
                const tr = document.createElement('tr');
                const badgeClass = app.status === 'Upcoming' ? 'status-upcoming' : 'status-completed';
                tr.innerHTML = `
                    <td class="ps-4 fw-medium text-nowrap">${app.patientName}</td>
                    <td class="text-nowrap">${app.doctorName}</td>
                    <td class="text-nowrap">
                        <i class="bi bi-calendar3 text-muted me-1"></i> ${app.date} <br>
                        <small class="text-muted"><i class="bi bi-clock me-1"></i> ${app.time}</small>
                    </td>
                    <td><span class="${badgeClass}">${app.status}</span></td>
                    <td class="pe-4 text-end text-nowrap">
                        ${app.status === 'Upcoming' ? `<button class="btn btn-sm btn-light text-success me-1" onclick="app.markCompleted('${app.id}')" title="Mark Completed"><i class="bi bi-check2-all"></i></button>` : ''}
                        <button class="btn btn-sm btn-light text-danger" onclick="app.deleteAppt('${app.id}')" title="Cancel/Delete"><i class="bi bi-x-lg"></i></button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        }
    },

    renderDoctorsGrid(doctors) {
        const grid = document.getElementById('doctors-grid');
        grid.innerHTML = doctors.map(doc => `
            <div class="col-md-6 col-lg-3">
                <div class="card border-0 shadow-sm h-100 text-center p-4">
                    <img src="${doc.picture}" class="rounded-circle mx-auto mb-3" width="80" height="80" alt="${doc.name}">
                    <h5 class="fw-bold mb-1">${doc.name}</h5>
                    <p class="text-primary small fw-semibold mb-2">${doc.specialty}</p>
                    <div class="text-warning mb-3">
                        <i class="bi bi-star-fill"></i> ${doc.rating}
                    </div>
                    <button class="btn btn-outline-primary btn-sm w-100 mt-auto" onclick="app.prefillBooking('${doc.id}')">Book Consultation</button>
                </div>
            </div>
        `).join('');
    },

    populateDoctorSelect(doctors) {
        const select = document.getElementById('form-doctor');
        select.innerHTML = '<option value="">Select a professional...</option>' + 
            doctors.map(doc => `<option value="${doc.id}">${doc.name} - ${doc.specialty}</option>`).join('');
    },

    renderAnalytics() {
        const apps = Storage.getAppointments();
        
        const statusCounts = apps.reduce((acc, curr) => {
            acc[curr.status] = (acc[curr.status] || 0) + 1;
            return acc;
        }, { 'Upcoming': 0, 'Completed': 0 });

        const chartColors = document.documentElement.getAttribute('data-theme') === 'dark' ? '#F8FAFC' : '#0F172A';

        if(this.charts.status) this.charts.status.destroy();
        this.charts.status = new Chart(document.getElementById('statusChart'), {
            type: 'doughnut',
            data: {
                labels: ['Upcoming', 'Completed'],
                datasets: [{
                    data: [statusCounts.Upcoming, statusCounts.Completed],
                    backgroundColor: ['#0EA5E9', '#10B981'],
                    borderWidth: 0
                }]
            },
            options: { 
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { labels: { color: chartColors } } } 
            }
        });

        // 2. Prepare Data for Timeline Chart
        const dateCounts = apps.reduce((acc, curr) => {
            acc[curr.date] = (acc[curr.date] || 0) + 1;
            return acc;
        }, {});
        
        const sortedDates = Object.keys(dateCounts).sort();

        if(this.charts.timeline) this.charts.timeline.destroy();
        this.charts.timeline = new Chart(document.getElementById('appointmentsChart'), {
            type: 'bar',
            data: {
                labels: sortedDates.length ? sortedDates : ['No Data'],
                datasets: [{
                    label: 'Appointments',
                    data: sortedDates.length ? sortedDates.map(d => dateCounts[d]) : [0],
                    backgroundColor: '#0EA5E9',
                    borderRadius: 4
                }]
            },
            options: { 
                responsive: true,
                maintainAspectRatio: false,
                scales: { 
                    y: { beginAtZero: true, ticks: { color: chartColors, stepSize: 1 } },
                    x: { ticks: { color: chartColors } }
                },
                plugins: { legend: { labels: { color: chartColors } } }
            }
        });
    },

    prefillBooking(doctorId) {
        this.navigate('book');
        document.getElementById('form-doctor').value = doctorId;
    },

    markCompleted(id) {
        Storage.updateAppointmentStatus(id, 'Completed');
        this.renderDashboard();
        this.showToast('Appointment marked as completed.', 'success');
    },

    deleteAppt(id) {
        if(confirm('Are you sure you want to cancel this appointment?')) {
            Storage.deleteAppointment(id);
            this.renderDashboard();
            this.showToast('Appointment cancelled.', 'success');
        }
    },

    bindThemeToggle() {
        document.getElementById('theme-toggle').addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'light' ? 'dark' : 'light';
            this.applyTheme(newTheme);
            Storage.set(Storage.KEYS.THEME, newTheme);
            if(document.getElementById('view-analytics').classList.contains('active')) {
                this.renderAnalytics(); // Redraw charts with new colors
            }
        });
    },

    applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        const icon = document.querySelector('#theme-toggle i');
        icon.className = theme === 'light' ? 'bi bi-moon-stars' : 'bi bi-sun';
    },

    bindDataManagement() {
        document.getElementById('clear-data').addEventListener('click', () => {
            if(confirm('WARNING: This will wipe all offline local storage data. Proceed?')) {
                Storage.clearAll();
                location.reload();
            }
        });

        document.getElementById('export-btn').addEventListener('click', () => {
            const data = JSON.stringify(Storage.getAppointments(), null, 2);
            const blob = new Blob([data], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `caresync_export_${new Date().getTime()}.json`;
            a.click();
            URL.revokeObjectURL(url);
            this.showToast('Data exported successfully!', 'success');
        });
    },

    showToast(message, type = 'success') {
        const toastEl = document.getElementById('liveToast');
        document.getElementById('toast-message').innerText = message;
        toastEl.className = `toast align-items-center border-0 toast-${type}`;
        const toast = new bootstrap.Toast(toastEl);
        toast.show();
    }
};

window.app = App;

document.addEventListener('DOMContentLoaded', () => App.init());