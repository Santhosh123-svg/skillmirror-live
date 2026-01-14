import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { getTaskById, submitTask } from '../utils/api';
import '../styles/pages.css';

export default function SubmitTask() {
  const { taskId } = useParams();
  const navigate = useNavigate();
  
  const [taskData, setTaskData] = useState(null);
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [loading, setLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [validationResult, setValidationResult] = useState(null);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    const fetchTask = async () => {
      try {
        const response = await getTaskById(taskId);
        setTaskData(response);

        if (response.status === 'completed') {
          setCompleted(true);
        }

        const detectedLanguage = detectLanguage(response.title);
        setLanguage(detectedLanguage);
        console.log(`📝 Task: ${response.title}`);
        console.log(`🔤 Auto-detected language: ${detectedLanguage}`);
      } catch (error) {
        console.error('Error fetching task:', error);
      }
    };

    fetchTask();
  }, [taskId]);

  const detectLanguage = (taskTitle) => {
    if (taskTitle.includes('HTML') || taskTitle.includes('html') || 
        taskTitle.includes('responsive') || taskTitle.includes('landing page') ||
        taskTitle.includes('navbar') || taskTitle.includes('card') ||
        taskTitle.includes('footer')) {
      return 'html';
    } else if (taskTitle.includes('CSS') || taskTitle.includes('css') ||
               taskTitle.includes('styling')) {
      return 'css';
    } else if (taskTitle.includes('JavaScript') || taskTitle.includes('javascript') ||
               taskTitle.includes('todo') || taskTitle.includes('calculator') ||
               taskTitle.includes('filter') || taskTitle.includes('stopwatch') ||
               taskTitle.includes('quote')) {
      return 'javascript';
    } else if (taskTitle.includes('React') || taskTitle.includes('react') ||
               taskTitle.includes('component')) {
      return 'javascript';
    } else if (taskTitle.includes('Node') || taskTitle.includes('node') ||
               taskTitle.includes('Express') || taskTitle.includes('API')) {
      return 'javascript';
    } else if (taskTitle.includes('MongoDB') || taskTitle.includes('mongodb') ||
               taskTitle.includes('database')) {
      return 'javascript';
    }
    return 'javascript';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!code.trim()) {
      alert('Please write some code!');
      return;
    }

    setLoading(true);
    setShowResults(false);

    try {
      console.log('📤 Submitting task:', { taskId, code, language });

      const response = await submitTask(taskId, code, language);

      console.log('✅ Task submitted:', response);

      const { validationResult: result } = response;
      setValidationResult(result);
      setAttempts(attempts + 1);

      if (result.isCorrect) {
        console.log('🎉 Task Completed! All tests passed!');
        alert(`🎉 Perfect! All tests passed!\nScore: ${result.score}%\n\nTask completed! Redirecting...`);

        setCompleted(true);

        setTimeout(() => {
          navigate(-1);
        }, 2000);

      } else {
        console.log(`⚠️ Partial Success: ${result.passedTests}/${result.totalTests} tests passed`);
        setShowResults(true);
        alert(`⚠️ Attempt ${attempts + 1}\nTests: ${result.passedTests}/${result.totalTests} passed\nScore: ${result.score}%\n\nTry again!`);
      }

    } catch (error) {
      console.error('❌ Submit failed:', error);
      alert('❌ Failed to submit task. Try again!');
      setShowResults(false);
    } finally {
      setLoading(false);
    }
  };

  if (completed) {
    return (
      <>
        <Header />
        <div className="submit-task-container">
          <div className="success-message" style={{ textAlign: 'center', padding: '40px' }}>
            <h1>🎉 Task Completed!</h1>
            <p>All tests passed! Great job!</p>
            <p style={{ fontSize: '0.9rem', color: '#666' }}>Redirecting to task list...</p>
            <button onClick={() => navigate(-1)} className="btn btn--primary">
              Back to Tasks
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="submit-task-container">
        <button onClick={() => navigate(-1)} className="back-btn">
          ← Back
        </button>

        <div className="submit-task-header">
          <h1>💻 Submit Task</h1>
          <p>Write your code and submit for validation</p>
          {taskData && (
            <>
              <p style={{ color: '#666', fontSize: '0.95rem', marginTop: '10px' }}>
                📌 Task: {taskData.title}
              </p>
              <p style={{ color: '#999', fontSize: '0.9rem' }}>
                📊 Attempts: {attempts}
              </p>
            </>
          )}
        </div>

        <div className="submit-task-form">
          
          <div className="form-group">
            <label className="form-label">
              📝 Language (Auto-detected):
            </label>
            <div className="language-badge">
              <span className="badge-text">{language.toUpperCase()}</span>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="code" className="form-label">
              📄 Your Code:
            </label>
            <textarea
              id="code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="code-textarea"
              placeholder={`Write your ${language.toUpperCase()} code here...`}
              rows="15"
              disabled={loading}
            />
            <p className="char-count">
              Characters: {code.length}
            </p>
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="btn btn--primary btn--lg"
          >
            {loading ? '⏳ Validating...' : `📤 Submit Code (Attempt ${attempts + 1})`}
          </button>

          {validationResult && showResults && (
            <div className={`validation-result ${validationResult.isCorrect ? 'success' : 'partial'}`}>
              <h3>📊 Validation Results</h3>
              <div className="result-stats">
                <div className="stat">
                  <span className="stat-label">Tests Passed:</span>
                  <span className="stat-value">{validationResult.passedTests}/{validationResult.totalTests}</span>
                </div>
                <div className="stat">
                  <span className="stat-label">Score:</span>
                  <span className="stat-value">{validationResult.score}%</span>
                </div>
              </div>
              
              {validationResult.testResults && validationResult.testResults.length > 0 && (
                <div className="test-details">
                  <h4>Test Details:</h4>
                  {validationResult.testResults.map((test, idx) => (
                    <div key={idx} className={`test-item ${test.passed ? 'passed' : 'failed'}`}>
                      <span className="test-icon">{test.passed ? '✅' : '❌'}</span>
                      <span className="test-name">{test.testName}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
