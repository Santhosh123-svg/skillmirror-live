import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://skillmirror-10.onrender.com',
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const loginUser = (email, password) =>
  API.post('/api/login', { email, password });

export const registerUser = (name, email, password) =>
  API.post('/api/register', { name, email, password });

export const getAllSkills = () => API.get('/api/skills');

export const getSkillById = (id) => API.get(`/api/skills/${id}`);

export const getTasksBySkill = (skillId) =>
  API.get(`/api/tasks/skill/${skillId}`);

export const getUserTasks = () => API.get('/api/tasks/user/my-tasks');

export const submitTask = (taskId, submissionContent, language) =>
  API.post(`/api/tasks/${taskId}/submit`, { submissionContent, language });

export const createTask = (skillId, title, description) =>
  API.post('/api/tasks', { skillId, title, description });

export default API;
