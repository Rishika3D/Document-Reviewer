import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth';
import Home from './pages/Home';
import Rewrite from './pages/Rewrite';
import Summarise from './pages/Summarise';
import GetHelp from './pages/GetHelp';
import Edit from './pages/Edit';
import GrammarCheck from './pages/GrammarCheck';
import AuthPage from './pages/AuthPage';

// Gate for pages that call the AI APIs — redirects to /login,
// remembering where the user was headed.
function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center">
        <span className="w-6 h-6 border-2 border-line border-t-rust rounded-full animate-spin" />
      </div>
    );
  }
  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }
  return children;
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<AuthPage mode="login" />} />
          <Route path="/signup" element={<AuthPage mode="signup" />} />
          <Route path="/help" element={<GetHelp />} />
          <Route path="/edit" element={<RequireAuth><Edit /></RequireAuth>} />
          <Route path="/rewrite" element={<RequireAuth><Rewrite /></RequireAuth>} />
          <Route path="/summarise" element={<RequireAuth><Summarise /></RequireAuth>} />
          <Route path="/grammar" element={<RequireAuth><GrammarCheck /></RequireAuth>} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
