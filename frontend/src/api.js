import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const trainModel = async () => {
    try {
        const response = await axios.post(`${API_URL}/train`);
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.detail || "Failed to train model");
    }
};

export const predictFailure = async (data) => {
    try {
        const response = await axios.post(`${API_URL}/predict`, data);
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.detail || "Prediction failed");
    }
};
