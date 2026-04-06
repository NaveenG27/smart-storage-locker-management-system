import axios from 'axios';

// Set this to true when testing on your computer
// Set this to false before you push to GitHub/Render
const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

const BASE_URL = isLocal 
    ? 'http://127.0.0.1:8000' 
    : 'https://smart-locker-api-rmg2.onrender.com';

const api = axios.create({
    baseURL: BASE_URL,
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Helper functions for your components
export const lockerAPI = {
    getLockers: () => api.get('/api/lockers/'),
    reserveLocker: (lockerId) => api.post('/api/reservations/', { locker: lockerId }),
    releaseLocker: (id) => api.put(`/api/reservations/${id}/release/`),
};

export default api;