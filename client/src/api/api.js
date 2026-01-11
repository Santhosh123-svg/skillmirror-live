import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5000/api',
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const loginUser = (email, password) =>
  API.post('/auth/login', { email, password });

export const registerUser = (name, email, password) =>
  API.post('/auth/register', { name, email, password });

export const getAllSkills = () => API.get('/skills');

export const getSkillById = (id) => API.get(`/skills/${id}`);

export const getTasksBySkill = (skillId) =>
  API.get(`/tasks/skill/${skillId}`);

export const getUserTasks = () => API.get('/tasks/user/my-tasks');

export const submitTask = (taskId, submissionContent, language) =>
  API.post(`/tasks/${taskId}/submit`, { submissionContent, language });

export const createTask = (skillId, title, description) =>
  API.post('/tasks', { skillId, title, description });

export default API;
