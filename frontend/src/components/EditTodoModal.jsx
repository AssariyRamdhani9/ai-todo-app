import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';

// Style modal
const customStyles = {
  content: {
    top: '50%',
    left: '50%',
    right: 'auto',
    bottom: 'auto',
    marginRight: '-50%',
    transform: 'translate(-50%, -50%)',
    maxWidth: '500px',
    width: '90%',
    padding: '30px',
    borderRadius: '16px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
    border: 'none',
  },
  overlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    backdropFilter: 'blur(4px)',
  },
};

// Set app element untuk accessibility
Modal.setAppElement('#root');

function EditTodoModal({ isOpen, onClose, todo, onSave }) {
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState('medium');
  const [category, setCategory] = useState('personal');
  const [deadline, setDeadline] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Isi form dengan data todo saat modal terbuka
// useEffect - SET DEADLINE
useEffect(() => {
    if (todo) {
        setTitle(todo.title || '');
        setPriority(todo.priority || 'medium');
        setCategory(todo.category || 'personal');
        
        // Format deadline dengan bener
        if (todo.deadline) {
            const date = new Date(todo.deadline);
            // Format ke YYYY-MM-DDTHH:MM
            const formatted = date.getFullYear() + '-' + 
                String(date.getMonth() + 1).padStart(2, '0') + '-' + 
                String(date.getDate()).padStart(2, '0') + 'T' + 
                String(date.getHours()).padStart(2, '0') + ':' + 
                String(date.getMinutes()).padStart(2, '0');
            setDeadline(formatted);
        } else {
            setDeadline('');
        }
        setError('');
    }
}, [todo]);

  // Saat kirim data ke backend
const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const trimmedTitle = title.trim();
    if (!trimmedTitle || trimmedTitle.length < 3) {
        setError('Judul tugas minimal 3 karakter');
        setLoading(false);
        return;
    }

    try {
        // KIRIM DEADLINE DALAM FORMAT YYYY-MM-DDTHH:MM
        await onSave({
            id: todo.id,
            title: trimmedTitle,
            priority,
            category,
            deadline: deadline || '',  // Kirim string kosong kalo gak ada
        });
        onClose();
    } catch (err) {
        setError(err.response?.data?.error || 'Gagal menyimpan perubahan');
    } finally {
        setLoading(false);
    }
};

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      style={customStyles}
      contentLabel="Edit Todo"
    >
      <div className="relative">
        <button
          onClick={onClose}
          className="absolute top-0 right-0 text-gray-400 hover:text-gray-600 text-2xl"
        >
          ✕
        </button>

        <h2 className="text-2xl font-bold text-gray-800 mb-6">✏️ Edit Tugas</h2>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Judul Tugas
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Masukkan judul tugas..."
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="high">🔴 High</option>
                <option value="medium">🟡 Medium</option>
                <option value="low">🟢 Low</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="work">💼 Work</option>
                <option value="personal">👤 Personal</option>
                <option value="study">📚 Study</option>
                <option value="health">🏃 Health</option>
                <option value="other">📌 Other</option>
              </select>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Deadline
            </label>
            <input
              type="datetime-local"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
              ⚠️ {error}
            </div>
          )}

          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 transition"
            >
              {loading ? '⏳ Menyimpan...' : '💾 Simpan'}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}

export default EditTodoModal;