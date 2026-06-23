const API = {

    simulateNetworkDelay: (ms) => new Promise(resolve => setTimeout(resolve, ms)),

    async fetchDoctors() {
        const cached = Storage.get(Storage.KEYS.DOCTORS, null);
        if (cached && cached.length > 0) return cached;

        try {
            const res = await fetch('https://randomuser.me/api/?results=8&inc=name,picture,email&seed=healthcare');
            if (!res.ok) throw new Error('Network response was not ok');
            
            const data = await res.json();
            
            const specialties = ['Cardiologist', 'Neurologist', 'Pediatrician', 'General Practice', 'Dermatologist'];
            
            const doctors = data.results.map((user, index) => ({
                id: `DOC-${index + 1}`,
                name: `Dr. ${user.name.first} ${user.name.last}`,
                email: user.email,
                specialty: specialties[index % specialties.length],
                picture: user.picture.large,
                rating: (Math.random() * (5 - 4.2) + 4.2).toFixed(1)
            }));

            Storage.set(Storage.KEYS.DOCTORS, doctors);
            return doctors;

        } catch (error) {
            console.error('Failed to fetch doctors:', error);
            throw new Error('Failed to load medical directory. Please check your connection.');
        }
    }
};