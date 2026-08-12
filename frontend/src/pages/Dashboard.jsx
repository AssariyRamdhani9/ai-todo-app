import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Pie, Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

const API_URL = 'http://localhost:5000/api/dashboard';

function Dashboard({ onNavigate }) {
  const { token } = useAuth();
  const [stats, setStats] = useState(null);
  const [weekly, setWeekly] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, weeklyRes] = await Promise.all([
        axios.get(`${API_URL}/stats`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_URL}/weekly`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      setStats(statsRes.data.data);
      setWeekly(weeklyRes.data.data);
      setError('');
    } catch (err) {
      setError('Gagal mengambil data dashboard');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-lg">
        ⚠️ {error}
      </div>
    );
  }

  // Category Pie Chart
  const categoryLabels = stats?.categoryDistribution?.map(c => c.category) || [];
  const categoryData = stats?.categoryDistribution?.map(c => c.count) || [];
  
  const pieData = {
    labels: categoryLabels.map(label => {
      const icons = { work: '💼', personal: '👤', study: '📚', health: '🏃', other: '📌' };
      return `${icons[label] || '📌'} ${label.charAt(0).toUpperCase() + label.slice(1)}`;
    }),
    datasets: [
      {
        data: categoryData,
        backgroundColor: ['#4F46E5', '#7C3AED', '#EC4899', '#10B981', '#F59E0B'],
        borderWidth: 2,
        borderColor: '#fff',
      },
    ],
  };

  // Priority Doughnut Chart
  const priorityLabels = stats?.priorityDistribution?.map(p => p.priority) || [];
  const priorityData = stats?.priorityDistribution?.map(p => p.count) || [];
  
  const doughnutData = {
    labels: priorityLabels.map(label => {
      const icons = { high: '🔴', medium: '🟡', low: '🟢' };
      return `${icons[label] || ''} ${label.charAt(0).toUpperCase() + label.slice(1)}`;
    }),
    datasets: [
      {
        data: priorityData,
        backgroundColor: ['#EF4444', '#F59E0B', '#10B981'],
        borderWidth: 2,
        borderColor: '#fff',
      },
    ],
  };

  // Weekly Progress Bar Chart
  const barData = {
    labels: weekly.map(w => w.date),
    datasets: [
      {
        label: 'Total Tugas',
        data: weekly.map(w => w.total),
        backgroundColor: 'rgba(79, 70, 229, 0.5)',
        borderColor: '#4F46E5',
        borderWidth: 1,
      },
      {
        label: 'Selesai',
        data: weekly.map(w => w.done),
        backgroundColor: 'rgba(16, 185, 129, 0.5)',
        borderColor: '#10B981',
        borderWidth: 1,
      },
    ],
  };

  const barOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Weekly Progress (Last 7 Days)',
      },
    },
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">📊 Dashboard</h2>
        <button
          onClick={() => onNavigate('todos')}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
        >
          ← Back to Todos
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
          <p className="text-sm text-gray-600">Total Tugas</p>
          <p className="text-2xl font-bold text-blue-600">{stats?.total || 0}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-xl border border-green-100">
          <p className="text-sm text-gray-600">Selesai</p>
          <p className="text-2xl font-bold text-green-600">{stats?.completed || 0}</p>
        </div>
        <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-100">
          <p className="text-sm text-gray-600">Pending</p>
          <p className="text-2xl font-bold text-yellow-600">{stats?.pending || 0}</p>
        </div>
        <div className="bg-red-50 p-4 rounded-xl border border-red-100">
          <p className="text-sm text-gray-600">Overdue</p>
          <p className="text-2xl font-bold text-red-600">{stats?.overdue || 0}</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white p-6 rounded-xl border border-gray-200">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-semibold text-gray-700">Progress</h3>
          <span className="text-sm font-medium text-indigo-600">
            {stats?.completionRate?.value?.toFixed(1) || 0}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className="bg-indigo-600 h-3 rounded-full transition-all duration-500"
            style={{ width: `${stats?.completionRate?.value || 0}%` }}
          ></div>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          {stats?.completed || 0} dari {stats?.total || 0} tugas selesai
        </p>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Category Pie Chart */}
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <h3 className="font-semibold text-gray-700 mb-4">📂 Category Distribution</h3>
          {categoryData.length > 0 ? (
            <div className="h-64">
              <Pie data={pieData} options={{ responsive: true, maintainAspectRatio: false }} />
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">Belum ada data kategori</p>
          )}
        </div>

        {/* Priority Doughnut Chart */}
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <h3 className="font-semibold text-gray-700 mb-4">⚡ Priority Distribution</h3>
          {priorityData.length > 0 ? (
            <div className="h-64">
              <Doughnut data={doughnutData} options={{ responsive: true, maintainAspectRatio: false }} />
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">Belum ada data prioritas</p>
          )}
        </div>
      </div>

      {/* Weekly Progress Bar Chart */}
      <div className="bg-white p-6 rounded-xl border border-gray-200">
        <h3 className="font-semibold text-gray-700 mb-4">📈 Weekly Activity</h3>
        {weekly.some(w => w.total > 0) ? (
          <div className="h-64">
            <Bar data={barData} options={barOptions} />
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">Belum ada aktivitas minggu ini</p>
        )}
      </div>

      {/* Recent Activity */}
      <div className="bg-white p-6 rounded-xl border border-gray-200">
        <h3 className="font-semibold text-gray-700 mb-4">🔄 Recent Activity</h3>
        {stats?.recentActivity?.length > 0 ? (
          <div className="space-y-2">
            {stats.recentActivity.slice(0, 5).map((todo) => (
              <div key={todo.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg">
                <span>{todo.completed ? '✅' : '⬜'}</span>
                <span className={`flex-1 ${todo.completed ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                  {todo.title}
                </span>
                <span className="text-xs text-gray-400">
                  {new Date(todo.createdAt).toLocaleDateString('id-ID', { 
                    day: 'numeric', 
                    month: 'short', 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">Belum ada aktivitas</p>
        )}
      </div>
    </div>
  );
}

export default Dashboard;