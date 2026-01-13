import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import API from '../api/api';
import '../styles/pages.css';

export default function Tasks() {
  const { skillId } = useParams();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchTasks();
  }, [skillId]);

  const fetchTasks = async () => {
    try {
      const response = await getTasks(skillId);
      setTasks(response.data);
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading tasks...</div>;

  return (
    <>
      <Header />
      <div className="tasks-container">
        <button onClick={() => navigate('/skills')} className="back-btn">
          ← Back to Skills
        </button>

        <div className="tasks-header">
          <h1>📋 Skill Tasks</h1>
          <p>Complete these tasks to master the skill</p>
        </div>

        {tasks.length === 0 ? (
          <div className="empty-state">
            <p>No tasks available for this skill yet.</p>
          </div>
        ) : (
          <div className="tasks-list">
            {tasks.map((task) => (
              <div key={task._id} className="task-card">
                <div className="task-header">
                  <h3>{task.title}</h3>
                  <span className={`task-status ${task.status}`}>
                    {task.status}
                  </span>
                </div>
                <p className="task-description">{task.description}</p>
                {task.status === 'pending' ? (
                  <button
                    onClick={() => navigate(`/tasks/${skillId}/${task._id}`)}
                    className="task-btn"
                  >
                    Submit Task →
                  </button>
                ) : (
                  <p className="task-submitted">✅ Task {task.status}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
