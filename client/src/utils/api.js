const API_BASE_URL = import.meta.env.DEV ? 'http://localhost:5000' : '';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

export const loginUser = async (email, password) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message);
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    return data;
  } catch (error) {
    throw error.message || 'Login failed';
  }
};

export const registerUser = async (name, email, password) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, email, password }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message);
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    return data;
  } catch (error) {
    throw error.message || 'Registration failed';
  }
};

export const getSkills = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/skills`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message);
    return data;
  } catch (error) {
    throw error.message || 'Failed to fetch skills';
  }
};

export const getTasks = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/tasks`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message);
    return data;
  } catch (error) {
    throw error.message || 'Failed to fetch tasks';
  }
};

export const getTasksBySkill = async (skillId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/tasks/skill/${skillId}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message);
    return data;
  } catch (error) {
    throw error.message || 'Failed to fetch tasks by skill';
  }
};

export const getTaskById = async (taskId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/tasks/${taskId}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message);
    return data;
  } catch (error) {
    throw error.message || 'Failed to fetch task';
  }
};

export const submitTask = async (taskId, submissionContent, language) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/tasks/${taskId}/submit`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ submissionContent, language }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message);
    return data;
  } catch (error) {
    throw error.message || 'Failed to submit task';
  }
};
