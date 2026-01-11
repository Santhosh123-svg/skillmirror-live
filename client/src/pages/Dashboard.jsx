import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import '../styles/pages.css';

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      navigate('/login');
      return;
    }
    setUser(JSON.parse(storedUser));
  }, [navigate]);

  if (!user) return <div>Loading...</div>;

  return (
    <>
      <Header />
      <div className="dashboard-container">
        <div className="dashboard-header">
          <h1>Welcome, {user.name}! 👋</h1>
          <p>Track your learning journey and master new skills</p>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">📚</div>
            <h3>Skills Learning</h3>
            <p className="stat-value">0</p>
          </div>
          <div className="stat-card">
            <div className="stat-icon">✅</div>
            <h3>Tasks Completed</h3>
            <p className="stat-value">0</p>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🏆</div>
            <h3>Achievement</h3>
            <p className="stat-value">Beginner</p>
          </div>
        </div>

        <div className="action-buttons">
          <button
            onClick={() => navigate('/skills')}
            className="action-btn primary"
          >
            🚀 Start Learning
          </button>
          <button
            onClick={() => navigate('/skills')}
            className="action-btn secondary"
          >
            📋 View Tasks
          </button>
        </div>
      </div>
    </>
  );
}
