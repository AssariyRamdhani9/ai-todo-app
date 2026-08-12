import React from 'react';
import TodoItem from './TodoItem';

function TodoList({ todos, onDelete, onToggle, onEdit, loading }) {
  if (loading && todos.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
        <p className="mt-4 text-gray-500">Memuat todos...</p>
      </div>
    );
  }

  if (todos.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
        <div className="text-6xl mb-4">📋</div>
        <p className="text-gray-500 font-medium">Belum ada tugas</p>
        <p className="text-gray-400 text-sm">Tambahkan tugas pertama di atas</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
      {todos.map((todo) => (
        <TodoItem
          key={todo.id}
          todo={todo}
          onDelete={onDelete}
          onToggle={onToggle}
          onEdit={onEdit}
        />
      ))}
    </div>
  );
}

export default TodoList;