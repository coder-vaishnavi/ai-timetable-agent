import api from './axios';
export const getTeachers = ()         => api.get('/teachers/');
export const getTeacher  = id         => api.get(`/teachers/${id}`);
export const createTeacher = data     => api.post('/teachers/', data);
export const updateTeacher = (id, d)  => api.put(`/teachers/${id}`, d);
export const deleteTeacher = id       => api.delete(`/teachers/${id}`);
export const getTeacherAvail = id     => api.get(`/teachers/${id}/availability`);
export const setTeacherAvail = (id,d) => api.put(`/teachers/${id}/availability`, d);
