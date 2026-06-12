import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth';
import { inputClass } from '../components/ToolShell';

// One page, two modes: /login and /signup
const AuthPage = ({ mode }) => {
  const isSignup = mode === 'signup';
  const { login, signup } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const from = location.state?.from || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isSignup) await signup(name, email, password);
      else await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grain min-h-screen bg-paper flex flex-col">
      <div className="px-6 lg:px-10 h-16 flex items-center border-b border-line">
        <Link to="/" className="flex items-center gap-2.5 group">
          <span className="w-7 h-7 rounded-lg bg-rust text-paper font-display italic text-lg leading-none flex items-center justify-center pb-0.5 transition-transform group-hover:-rotate-6">
            D
          </span>
          <span className="font-display text-xl tracking-tight">
            Docu<em className="text-rust font-display italic">Reviewer</em>
          </span>
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <header className="rise rise-1 mb-8 text-center">
            <p className="font-mono text-xs uppercase tracking-[0.22em] text-rust mb-3">
              {isSignup ? 'Create your studio' : 'Welcome back'}
            </p>
            <h1 className="font-display text-4xl font-light tracking-tight">
              {isSignup ? (
                <>Start <em className="text-rust font-normal">writing.</em></>
              ) : (
                <>Pick up the <em className="text-rust font-normal">pen.</em></>
              )}
            </h1>
          </header>

          <form
            onSubmit={handleSubmit}
            className="rise rise-2 bg-card border border-line rounded-2xl p-6 space-y-4 shadow-lift"
          >
            {isSignup && (
              <div>
                <label htmlFor="name" className="block text-sm text-ink-soft mb-1.5">Name</label>
                <input
                  id="name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  className={inputClass}
                  autoComplete="name"
                />
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm text-ink-soft mb-1.5">Email</label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className={inputClass}
                autoComplete="email"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm text-ink-soft mb-1.5">
                Password {isSignup && <span className="text-ink-faint">(min 8 characters)</span>}
              </label>
              <input
                id="password"
                type="password"
                required
                minLength={isSignup ? 8 : undefined}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className={inputClass}
                autoComplete={isSignup ? 'new-password' : 'current-password'}
              />
            </div>

            {error && <p className="text-sm text-rust-deep">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 bg-ink text-paper font-medium px-7 py-2.5 rounded-xl transition-all hover:bg-rust hover:shadow-lift active:scale-[0.98] disabled:opacity-50"
            >
              {loading && (
                <span className="w-3.5 h-3.5 border-2 border-paper/40 border-t-paper rounded-full animate-spin" />
              )}
              {loading ? 'One moment…' : isSignup ? 'Create account' : 'Log in'}
            </button>
          </form>

          <p className="rise rise-3 mt-5 text-center text-sm text-ink-soft">
            {isSignup ? (
              <>Already have an account?{' '}
                <Link to="/login" state={{ from }} className="text-rust hover:text-rust-deep underline underline-offset-4">
                  Log in
                </Link>
              </>
            ) : (
              <>New here?{' '}
                <Link to="/signup" state={{ from }} className="text-rust hover:text-rust-deep underline underline-offset-4">
                  Create an account
                </Link>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
