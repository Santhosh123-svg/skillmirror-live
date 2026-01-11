import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import API from '../api/api';
import '../styles/pages.css';

export default function Submit() {
  const { taskId } = useParams();
  const [submission, setSubmission] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      await API.post(`/tasks/${taskId}/submit`, { content: submission });
      setMessage('✅ Task submitted successfully!');
      setTimeout(() => navigate('/skills'), 2000);
    } catch (error) {
      setMessage('❌ Failed to submit task: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header />
      <div className="submit-container">
        <button onClick={() => navigate('/skills')} className="back-btn">
          ← Back
        </button>

        <div className="submit-form">
          <h1>📝 Submit Your Work</h1>

          {message && (
            <div className={message.includes('✅') ? 'success-message' : 'error-message'}>
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="submission">Your Submission</label>
              <textarea
                id="submission"
                value={submission}
                onChange={(e) => setSubmission(e.target.value)}
                placeholder="Describe your work or paste your code..."
                required
              />
            </div>

            <button
              type="submit"
              className="submit-btn"
              disabled={loading}
            >
              {loading ? 'Submitting...' : '🚀 Submit Task'}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
