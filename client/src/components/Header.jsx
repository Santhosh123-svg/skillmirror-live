import { useNavigate } from 'react-router-dom';
import '../styles/global.css';

function Header() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
    window.location.reload();
  };

  return (
    <header className="header">
      <div className="header-container">
        <div className="header-brand">
          <h1>✨ SkillMirror</h1>
        </div>

        <nav className="header-nav">
          <button onClick={() => navigate('/dashboard')} className="nav-link">
            Dashboard
          </button>
          <button onClick={() => navigate('/skills')} className="nav-link">
            Skills
          </button>
          <span className="user-greeting">Hi, {user?.name}!</span>
          <button onClick={handleLogout} className="logout-btn">
            Logout
          </button>
        </nav>
      </div>
    </header>
  );
}

export default Header;
