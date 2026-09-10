import api from './authApi';

const getAnalytics = async () => {
    const response = await api.get('/api/analytics');
    return response.data;
};

export const analyticsApi = {
    getAnalytics,
};
