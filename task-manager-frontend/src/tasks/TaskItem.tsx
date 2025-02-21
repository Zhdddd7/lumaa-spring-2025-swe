// src/tasks/TaskItem.tsx

import React from 'react';

interface TaskItemProps {
  id: number;
  title: string;
  isComplete: boolean;
  onToggle: (id: number) => void;
  onDelete: (id: number) => void;
}

const TaskItem: React.FC<TaskItemProps> = ({ id, title, isComplete, onToggle, onDelete }) => {
  return (
    <li>
      <span style={{ textDecoration: isComplete ? 'line-through' : 'none' }}>
        {title}
      </span>
      <button onClick={() => onToggle(id)}>{isComplete ? 'Undo' : 'Complete'}</button>
      <button onClick={() => onDelete(id)}>Delete</button>
    </li>
  );
};

export default TaskItem;

// This ensures the file is treated as a module:
export {};
