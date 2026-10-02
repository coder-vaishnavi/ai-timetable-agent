import api from './axios';
export const getTimetables = ()         => api.get('/timetables/');
export const getTimetable  = id         => api.get(`/timetables/${id}`);
export const updateStatus  = (id, status) => api.put(`/timetables/${id}/status`, { status });
export const deleteTimetable = id       => api.delete(`/timetables/${id}`);
export const getStats      = ()         => api.get('/timetables/stats');
export const exportPdf     = id         => api.get(`/timetables/${id}/export/pdf`, { responseType: 'blob' });
export const exportExcel   = id         => api.get(`/timetables/${id}/export/excel`, { responseType: 'blob' });
