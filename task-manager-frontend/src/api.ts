// src/api.ts

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

export async function login(username: string, password: string) {
  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  return res.json();
}

export async function register(username: string, password: string) {
  const res = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  return res.json();
}

// Ensure authHeader returns an object without any undefined values
function authHeader(): Record<string, string> {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function getTasks() {
  const res = await fetch(`${API_BASE_URL}/tasks`, {
    headers: { ...authHeader(), 'Content-Type': 'application/json' },
  });
  return res.json();
}

export async function createTask(title: string, description?: string) {
  const res = await fetch(`${API_BASE_URL}/tasks`, {
    method: 'POST',
    headers: { ...authHeader(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, description }),
  });
  return res.json();
}

export async function updateTask(
  id: number,
  updates: Partial<{ title: string; description: string; isComplete: boolean }>
) {
  const res = await fetch(`${API_BASE_URL}/tasks/${id}`, {
    method: 'PUT',
    headers: { ...authHeader(), 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  return res.json();
}

export async function deleteTask(id: number) {
  const res = await fetch(`${API_BASE_URL}/tasks/${id}`, {
    method: 'DELETE',
    headers: authHeader(),
  });
  return res.json();
}
