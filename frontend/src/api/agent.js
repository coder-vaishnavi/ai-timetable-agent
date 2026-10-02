import api from './axios';
export const analyzeNL = data  => api.post('/agent/analyze', data);
export const generate  = data  => api.post('/agent/generate', data);
