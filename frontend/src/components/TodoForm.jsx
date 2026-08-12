import React, { useState } from 'react';

function TodoForm({ onAddTodo, loading }) {
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState('medium');
  const [category, setCategory] = useState('personal');
  const [deadline, setDeadline] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;
    
    if (trimmedTitle.length < 3) {
      alert('Judul tugas minimal 3 karakter');
      return;
    }

    setIsSubmitting(true);
    try {
      await onAddTodo(trimmedTitle, priority, category, deadline || null);
      setTitle('');
      setPriority('medium');
      setCategory('personal');
      setDeadline('');
    } catch (error) {
      // Error sudah ditangani di parent
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 mb-6">
      <div className="flex gap-3">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="📝 Tulis tugasmu..."
          disabled={loading || isSubmitting}
          className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed transition"
        />
        <button
          type="submit"
          disabled={loading || isSubmitting || !title.trim()}
          className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-transform hover:scale-105 active:scale-95"
        >
          {isSubmitting ? '⏳ Memproses...' : '➕ Tambah'}
        </button>
      </div>
      
      <div className="flex flex-wrap gap-3">
        {/* Priority */}
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="high">🔴 High</option>
          <option value="medium">🟡 Medium</option>
          <option value="low">🟢 Low</option>
        </select>
        
        {/* Category */}
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="work">💼 Work</option>
          <option value="personal">👤 Personal</option>
          <option value="study">📚 Study</option>
          <option value="health">🏃 Health</option>
          <option value="other">📌 Other</option>
        </select>
        
        {/* Deadline */}
        <input
          type="datetime-local"
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
          className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>
    </form>
  );
}

export default TodoForm;