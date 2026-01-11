import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import API from '../api/api';
import '../styles/pages.css';

export default function Skills() {
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchSkills();
  }, []);

  const fetchSkills = async () => {
    try {
      const response = await API.get('/skills');
      setSkills(response.data);
    } catch (error) {
      console.error('Failed to fetch skills:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading skills...</div>;

  return (
    <>
      <Header />
      <div className="skills-container">
        <h1 className="page-title">📚 Available Skills</h1>

        {skills.length === 0 ? (
          <div className="empty-state">
            <p>No skills available yet. Check back soon!</p>
          </div>
        ) : (
          <div className="skills-grid">
            {skills.map((skill) => (
              <div key={skill._id} className="skill-card">
                <div className="skill-icon">{skill.icon || '⭐'}</div>
                <h3>{skill.name}</h3>
                <span className="skill-level">{skill.level}</span>
                <p className="skill-description">
                  {skill.description || 'No description'}
                </p>
                <button
                  onClick={() => navigate(`/tasks/${skill._id}`)}
                  className="skill-btn"
                >
                  View Tasks →
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
