// Di file TodoItem.jsx, tambahkan import
import React, { useState } from 'react';

function TodoItem({ todo, onDelete, onToggle, onEdit }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const handleDelete = async () => {
    if (window.confirm(`Hapus tugas "${todo.title}"?`)) {
      setIsDeleting(true);
      await onDelete(todo.id);
      setIsDeleting(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  // Priority badge
  const priorityConfig = {
    high: { color: 'bg-red-100 text-red-700', label: '🔴 High' },
    medium: { color: 'bg-yellow-100 text-yellow-700', label: '🟡 Medium' },
    low: { color: 'bg-green-100 text-green-700', label: '🟢 Low' },
  };

  const categoryConfig = {
    work: { label: '💼 Work', color: 'bg-blue-100 text-blue-700' },
    personal: { label: '👤 Personal', color: 'bg-purple-100 text-purple-700' },
    study: { label: '📚 Study', color: 'bg-orange-100 text-orange-700' },
    health: { label: '🏃 Health', color: 'bg-green-100 text-green-700' },
    other: { label: '📌 Other', color: 'bg-gray-100 text-gray-700' },
  };

  const priorityInfo = priorityConfig[todo.priority] || priorityConfig.medium;
  const categoryInfo = categoryConfig[todo.category] || categoryConfig.other;

  return (
    <div className={`bg-white border border-gray-200 rounded-xl p-4 transition-all hover:shadow-md ${
      todo.completed ? 'opacity-60' : ''
    }`}>
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={todo.completed}
          onChange={() => onToggle(todo.id, todo.completed)}
          className="mt-1 w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500 cursor-pointer"
        />
        
        <div className="flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <h3 className={`font-medium text-gray-800 ${
                todo.completed ? 'line-through text-gray-400' : ''
              }`}>
                {todo.title}
              </h3>
              
              <div className="flex flex-wrap gap-2 mt-2">
                <span className={`text-xs px-2 py-1 rounded-full ${priorityInfo.color}`}>
                  {priorityInfo.label}
                </span>
                <span className={`text-xs px-2 py-1 rounded-full ${categoryInfo.color}`}>
                  {categoryInfo.label}
                </span>
                {todo.deadline && (
                  <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-700">
                    ⏰ {new Date(todo.deadline).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </span>
                )}
              </div>
            </div>
            
            <div className="flex gap-2">
              <button
                  onClick={() => {
                    console.log('Edit clicked for todo:', todo.id);
                    onEdit(todo);
                  }}
                  className="text-gray-400 hover:text-indigo-600 transition-colors p-1"
                >
                  ✏️
                </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="text-gray-400 hover:text-red-500 disabled:opacity-50 transition-colors"
              >
                {isDeleting ? '⏳' : '🗑️'}
              </button>
            </div>
          </div>
          
          {todo.suggestion && !todo.completed && (
            <div className="mt-2 text-sm text-indigo-600 bg-indigo-50 p-2 rounded-lg flex items-start gap-2">
              <span className="text-indigo-400">💡</span>
              <span>{todo.suggestion}</span>
            </div>
          )}
          
          {todo.suggestion && todo.completed && (
            <div className="mt-2 text-sm text-green-600 bg-green-50 p-2 rounded-lg flex items-start gap-2">
              <span className="text-green-400">✅</span>
              <span>Selesai! Tips: {todo.suggestion}</span>
            </div>
          )}
          
          <p className="text-xs text-gray-400 mt-1">
            {new Date(todo.createdAt).toLocaleDateString('id-ID', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
        </div>
      </div>
    </div>
  );
}

export default TodoItem;