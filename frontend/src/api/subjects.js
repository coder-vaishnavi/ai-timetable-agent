import api from './axios';
export const getSubjects  = ()        => api.get('/subjects/');
export const getSubject   = id        => api.get(`/subjects/${id}`);
export const createSubject = data     => api.post('/subjects/', data);
export const updateSubject = (id, d)  => api.put(`/subjects/${id}`, d);
export const deleteSubject = id       => api.delete(`/subjects/${id}`);
