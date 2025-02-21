// src/tasks/TasksPage.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTasks, createTask, updateTask, deleteTask } from '../api';

interface Task {
  id: number;
  title: string;
  description?: string;
  isComplete: boolean;
}

const TasksPage: React.FC = () => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  // Check if user is authenticated
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
    } else {
      fetchTasks();
    }
  }, [navigate]);

  const fetchTasks = async () => {
    try {
      const data = await getTasks();
      setTasks(data);
    } catch (err) {
      setError('Failed to load tasks.');
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newTask = await createTask(title, description);
      setTasks([...tasks, newTask]);
      setTitle('');
      setDescription('');
    } catch (err) {
      setError('Failed to create task.');
    }
  };

  const toggleComplete = async (task: Task) => {
    try {
      const updated = await updateTask(task.id, { isComplete: !task.isComplete });
      setTasks(tasks.map(t => (t.id === task.id ? updated : t)));
    } catch (err) {
      setError('Failed to update task.');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteTask(id);
      setTasks(tasks.filter(task => task.id !== id));
    } catch (err) {
      setError('Failed to delete task.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <div>
      <h2>Your Tasks</h2>
      <button onClick={handleLogout}>Logout</button>
      {error && <p style={{color:'red'}}>{error}</p>}

      <ul>
        {tasks.map(task => (
          <li key={task.id}>
            <span style={{ textDecoration: task.isComplete ? 'line-through' : 'none' }}>
              {task.title}
            </span>
            <button onClick={() => toggleComplete(task)}>
              {task.isComplete ? 'Undo' : 'Complete'}
            </button>
            <button onClick={() => handleDelete(task.id)}>Delete</button>
          </li>
        ))}
      </ul>

      <h3>Create New Task</h3>
      <form onSubmit={handleCreateTask}>
        <input 
          type="text" 
          placeholder="Task Title" 
          value={title} 
          onChange={(e) => setTitle(e.target.value)}
          required 
        />
        <input 
          type="text" 
          placeholder="Description (optional)" 
          value={description} 
          onChange={(e) => setDescription(e.target.value)}
        />
        <button type="submit">Add Task</button>
      </form>
    </div>
  );
};

export default TasksPage;
