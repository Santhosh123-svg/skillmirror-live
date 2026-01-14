import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { getTaskById, submitTask } from '../utils/api';
import '../styles/pages.css';

export default function TaskDetail() {
  const { taskId, skillId } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState(null);
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [validationResult, setValidationResult] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTask();
  }, [taskId]);

  const fetchTask = async () => {
    try {
      const data = await getTaskById(taskId);
      setTask(data);
      setCode(data.submissionContent || '');

      // Auto-detect language from task title (don't let user change)
      const detectedLanguage = detectLanguage(data.title);
      setLanguage(detectedLanguage);

      console.log('📖 Task loaded:', data.title, '| Status:', data.status);
    } catch (error) {
      console.error('Error fetching task:', error);
      alert('Failed to load task');
    }
  };

  // Auto-detect language from task title
  const detectLanguage = (taskTitle) => {
    const title = taskTitle.toLowerCase();
    
    if (title.includes('html') || title.includes('responsive') || 
        title.includes('navbar') || title.includes('card') || 
        title.includes('landing page') || title.includes('form with validation') ||
        title.includes('multi-section')) {
      return 'html';
    } else if (title.includes('python')) {
      return 'python';
    } else {
      return 'javascript';
    }
  };

  const handleSubmit = async () => {
    if (!code.trim()) {
      alert('Please write some code!');
      return;
    }

    setLoading(true);
    try {
      const data = await submitTask(taskId, code, language);

      setValidationResult(data.validationResult);
      setTask(data.task);

      if (data.validationResult.isCorrect) {
        alert('🎉 Perfect! All tests passed!');
        console.log('✅ Task completed! You can now move to next task.');
        // Refresh task to get updated status
        setTimeout(() => {
          fetchTask();
        }, 1500);
      } else {
        const failed = data.validationResult.totalTests - data.validationResult.passedTests;
        alert(`❌ ${failed} test(s) failed. Try again!`);
      }
    } catch (error) {
      console.error('Error submitting task:', error);
      alert('Submission failed. Try again!');
    } finally {
      setLoading(false);
    }
  };

  const handleBackClick = () => {
    navigate(`/tasks/${skillId}`);
  };

  if (!task) return (
    <>
      <Header />
      <div style={{ padding: '50px', textAlign: 'center' }}>Loading task...</div>
    </>
  );

  return (
    <>
      <Header />
      <div className="submit-task-container">
        <button 
          onClick={handleBackClick}
          className="back-btn"
          disabled={task.status === 'completed' ? false : false}
        >
          ← Back to Tasks
        </button>

        <div className="submit-task-header">
          <h1>💻 {task.title}</h1>
          <span className={`task-status ${task.status}`}>
            {task.status === 'completed' ? '✅ Completed' : 
             task.status === 'submitted' ? '⏳ Needs Work' : 
             '◯ Not Started'}
          </span>
          <p>{task.description}</p>
          
          {/* Language display - NO DROPDOWN, just text */}
          <p style={{ marginTop: '15px', fontSize: '0.9rem', color: '#666' }}>
            🔤 <strong>Language:</strong> {language.toUpperCase()} (auto-detected)
          </p>
        </div>

        <div className="submit-task-form">
          {/* Show code editor only if NOT completed */}
          {task.status !== 'completed' ? (
            <>
              <div className="form-group">
                <label htmlFor="code">Your Code:</label>
                <textarea
                  id="code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="code-textarea"
                  placeholder={`Write your ${language.toUpperCase()} code here...`}
                  rows="15"
                />
              </div>

              <button
                onClick={handleSubmit}
                disabled={loading}
                className="btn btn--primary btn--lg"
                style={{
                  opacity: loading ? 0.6 : 1,
                  cursor: loading ? 'not-allowed' : 'pointer'
                }}
              >
                {loading ? '⏳ Checking...' : '✓ Submit Code'}
              </button>

              {validationResult && (
                <div className={`validation-result ${validationResult.isCorrect ? 'success' : 'failed'}`}>
                  <h3>Test Results</h3>
                  <p><strong>Score: {validationResult.score}% ({validationResult.passedTests}/{validationResult.totalTests})</strong></p>
                  
                  <div className="test-details">
                    {validationResult.testResults.map((test, i) => (
                      <div key={i} className={`test-item ${test.passed ? 'passed' : 'failed'}`}>
                        <span>{test.passed ? '✅' : '❌'} {test.testName}</span>
                        {!test.passed && <p>{test.message}</p>}
                      </div>
                    ))}
                  </div>

                  {!validationResult.isCorrect && (
                    <div className="retry-hint">
                      💡 Fix the failing tests and try again!
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            // Completed state - Show success message
            <div className="completion-message" style={{
              textAlign: 'center',
              padding: '40px',
              backgroundColor: '#e8f5e9',
              borderRadius: '8px',
              border: '2px solid #4caf50'
            }}>
              <h2 style={{ color: '#2e7d32', marginBottom: '10px' }}>✅ Task Completed!</h2>
              <p style={{ color: '#1b5e20', marginBottom: '20px', fontSize: '1.1rem' }}>
                Great job! You have successfully completed this task.
              </p>
              <p style={{ color: '#558b2f', marginBottom: '20px' }}>
                Score: {validationResult?.score}% • All tests passed! 🎉
              </p>
              <button
                onClick={handleBackClick}
                className="btn btn--primary btn--lg"
              >
                Move to Next Task →
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
