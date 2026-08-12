import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from './context/AuthContext';
import TodoForm from './components/TodoForm';
import TodoList from './components/TodoList';
import EditTodoModal from './components/EditTodoModal';  // Import modal
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './pages/Dashboard';

const API_URL = 'http://localhost:5000/api/todos';

function App() {
  const { user, logout, token } = useAuth();
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [view, setView] = useState('todos');
  
  // State buat edit
  const [editingTodo, setEditingTodo] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  // FILTERS
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [priority, setPriority] = useState('all');
  const [category, setCategory] = useState('all');
  const [sort, setSort] = useState('created_at');
  
  const [stats, setStats] = useState({ total: 0, completed: 0, pending: 0 });

  const fetchTodos = async () => {
    if (!token) return;
    
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (status !== 'all') params.append('status', status);
      if (priority !== 'all') params.append('priority', priority);
      if (category !== 'all') params.append('category', category);
      if (sort) params.append('sort', sort);
      
      const response = await axios.get(`${API_URL}?${params.toString()}`);
      setTodos(response.data.data);
      setStats(response.data.meta || { total: 0, completed: 0, pending: 0 });
      setError('');
    } catch (err) {
      setError('Gagal mengambil data todos');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const addTodo = async (title, priority, category, deadline) => {
    try {
      setLoading(true);
      const response = await axios.post(API_URL, { 
        title, 
        priority, 
        category, 
        deadline 
      });
      setTodos([response.data.data, ...todos]);
      setError('');
      fetchTodos();
      return response.data.data;
    } catch (err) {
      setError(err.response?.data?.error || 'Gagal menambahkan todo');
      console.error(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // EDIT TODO FUNCTION
  const editTodo = async (updatedTodo) => {
    try {
      setLoading(true);
      const response = await axios.put(`${API_URL}/${updatedTodo.id}/full`, {
        title: updatedTodo.title,
        priority: updatedTodo.priority,
        category: updatedTodo.category,
        deadline: updatedTodo.deadline,
      });
      
      // Update todo di list
      setTodos(todos.map(todo => 
        todo.id === updatedTodo.id ? response.data.data : todo
      ));
      setError('');
      fetchTodos(); // Refresh stats
    } catch (err) {
      setError(err.response?.data?.error || 'Gagal mengupdate todo');
      console.error(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Buka modal edit
  const openEditModal = (todo) => {
    setEditingTodo(todo);
    setIsEditModalOpen(true);
  };

  // Tutup modal edit
  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditingTodo(null);
  };

  // Handler save dari modal
  const handleEditSave = async (updatedTodo) => {
    await editTodo(updatedTodo);
  };

  const deleteTodo = async (id) => {
    try {
      await axios.delete(`${API_URL}/${id}`);
      setTodos(todos.filter(todo => todo.id !== id));
      setError('');
      fetchTodos();
    } catch (err) {
      setError('Gagal menghapus todo');
      console.error(err);
    }
  };

  const toggleTodo = async (id, completed) => {
    try {
      const response = await axios.put(`${API_URL}/${id}`, { completed: !completed });
      setTodos(todos.map(todo => 
        todo.id === id ? response.data.data : todo
      ));
      setError('');
      fetchTodos();
    } catch (err) {
      setError('Gagal mengupdate todo');
      console.error(err);
    }
  };

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (user) fetchTodos();
    }, 300);
    return () => clearTimeout(timer);
  }, [search, status, priority, category, sort]);

  useEffect(() => {
    if (user) {
      fetchTodos();
    }
  }, [user, token]);

  // Auth Pages
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        {isLogin ? (
          <Login onSwitch={() => setIsLogin(false)} />
        ) : (
          <Register onSwitch={() => setIsLogin(true)} />
        )}
      </div>
    );
  }

  // Main App
  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 md:p-8">
          <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
            <h1 className="text-4xl font-bold text-gray-800">
              {view === 'todos' ? '✨ AI Todo List' : '📊 Dashboard'}
            </h1>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setView(view === 'todos' ? 'dashboard' : 'todos')}
                className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition"
              >
                {view === 'todos' ? '📊 View Dashboard' : '📝 View Todos'}
              </button>
              <span className="text-gray-600">👋 {user?.username}</span>
              <button
                onClick={logout}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
              >
                Logout
              </button>
            </div>
          </div>
          
          {view === 'todos' ? (
            <>
              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 p-3 rounded-xl text-center">
                  <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
                  <p className="text-sm text-gray-600">Total</p>
                </div>
                <div className="bg-green-50 p-3 rounded-xl text-center">
                  <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
                  <p className="text-sm text-gray-600">Selesai</p>
                </div>
                <div className="bg-yellow-50 p-3 rounded-xl text-center">
                  <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                  <p className="text-sm text-gray-600">Pending</p>
                </div>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap gap-3 mb-6">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="🔍 Cari tugas..."
                  className="flex-1 min-w-[150px] px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="all">📋 All</option>
                  <option value="active">🔄 Active</option>
                  <option value="completed">✅ Completed</option>
                </select>
                
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="all">🏷️ All Priorities</option>
                  <option value="high">🔴 High</option>
                  <option value="medium">🟡 Medium</option>
                  <option value="low">🟢 Low</option>
                </select>
                
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="all">📂 All Categories</option>
                  <option value="work">💼 Work</option>
                  <option value="personal">👤 Personal</option>
                  <option value="study">📚 Study</option>
                  <option value="health">🏃 Health</option>
                  <option value="other">📌 Other</option>
                </select>
                
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="created_at">📅 Latest</option>
                  <option value="priority">⚡ Priority</option>
                  <option value="title">🔤 Title</option>
                  <option value="deadline">⏰ Deadline</option>
                </select>
              </div>

              <TodoForm onAddTodo={addTodo} loading={loading} />

              {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
                  ⚠️ {error}
                </div>
              )}

              <TodoList 
                todos={todos} 
                onDelete={deleteTodo}
                onToggle={toggleTodo}
                onEdit={openEditModal}  // <-- Pass edit function
                loading={loading}
              />
            </>
          ) : (
            <Dashboard onNavigate={(v) => setView(v)} />
          )}
        </div>
      </div>

      {/* Edit Modal */}
      <EditTodoModal
        isOpen={isEditModalOpen}
        onClose={closeEditModal}
        todo={editingTodo}
        onSave={handleEditSave}
      />
    </div>
  );
}

export default App;