import api from './axios';
export const getClassrooms   = ()        => api.get('/classrooms/');
export const getClassroom    = id        => api.get(`/classrooms/${id}`);
export const createClassroom = data      => api.post('/classrooms/', data);
export const updateClassroom = (id, d)   => api.put(`/classrooms/${id}`, d);
export const deleteClassroom = id        => api.delete(`/classrooms/${id}`);
export const getClassroomAvail = id      => api.get(`/classrooms/${id}/availability`);
export const setClassroomAvail = (id, d) => api.put(`/classrooms/${id}/availability`, d);
