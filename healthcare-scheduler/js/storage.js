const Storage = {
    KEYS: {
        APPOINTMENTS: 'caresync_appointments',
        DOCTORS: 'caresync_doctors_cache',
        THEME: 'caresync_theme'
    },

    get(key, defaultValue = []) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : defaultValue;
        } catch (e) {
            console.error(`Error parsing ${key} from localStorage`, e);
            return defaultValue;
        }
    },

    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (e) {
            console.error(`Error saving ${key} to localStorage`, e);
            throw new Error('Local storage quota exceeded or unavailable.');
        }
    },

    getAppointments() { return this.get(this.KEYS.APPOINTMENTS); },
    
    saveAppointment(appointment) {
        const apps = this.getAppointments();
        appointment.id = 'CS-' + Math.random().toString(36).substr(2, 9).toUpperCase();
        appointment.createdAt = new Date().toISOString();
        appointment.status = 'Upcoming';
        apps.push(appointment);
        this.set(this.KEYS.APPOINTMENTS, apps);
        return appointment;
    },

    updateAppointmentStatus(id, status) {
        const apps = this.getAppointments();
        const index = apps.findIndex(a => a.id === id);
        if (index !== -1) {
            apps[index].status = status;
            this.set(this.KEYS.APPOINTMENTS, apps);
        }
    },

    deleteAppointment(id) {
        const apps = this.getAppointments().filter(a => a.id !== id);
        this.set(this.KEYS.APPOINTMENTS, apps);
    },

    clearAll() {
        localStorage.removeItem(this.KEYS.APPOINTMENTS);
        localStorage.removeItem(this.KEYS.DOCTORS);
    }
};