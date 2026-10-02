import api from './axios';
export const getClasses    = ()        => api.get('/divisions/classes');
export const createClass   = data      => api.post('/divisions/classes', data);
export const updateClass   = (id, d)   => api.put(`/divisions/classes/${id}`, d);
export const deleteClass   = id        => api.delete(`/divisions/classes/${id}`);

export const getDivisions  = (classId) => api.get('/divisions/', { params: classId ? { class_id: classId } : {} });
export const getDivision   = id        => api.get(`/divisions/${id}`);
export const createDivision = data     => api.post('/divisions/', data);
export const deleteDivision = id       => api.delete(`/divisions/${id}`);

export const getRequirements  = divId      => api.get(`/divisions/${divId}/requirements`);
export const setRequirement   = (divId, d) => api.post(`/divisions/${divId}/requirements`, d);
export const deleteRequirement = (divId, subId) => api.delete(`/divisions/${divId}/requirements/${subId}`);
