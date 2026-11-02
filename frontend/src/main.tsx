import React, { Suspense, lazy, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  NavLink,
  useLocation,
  Navigate,
} from 'react-router-dom';
import { House, ArrowUpRight, Menu, X } from 'lucide-react';
import { AuthProvider, useAuth } from './auth';
import { errorMessage } from './api';
import { Loading, Seo } from './components';
import './style.css';
import { RuntimeProvider, useRuntime } from './runtime';
const Home = lazy(() => import('./pages/Home'));
const Browse = lazy(() => import('./pages/Browse'));
const Detail = lazy(() => import('./pages/Detail'));
const Account = lazy(() => import('./pages/Account'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Editor = lazy(() => import('./pages/Editor'));
const Viewing = lazy(() => import('./pages/Viewing'));
function Protected({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  return loading ? (
    <Loading />
  ) : user ? (
    children
  ) : (
    <Navigate to={'/login?next=' + encodeURIComponent(location.pathname)} replace />
  );
}
class Boundary extends React.Component<{ children: React.ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <main className="container section">
        <h1>Something interrupted this page.</h1>
        <p>Refresh to try again.</p>
        <button onClick={() => location.reload()}>Refresh page</button>
      </main>
    ) : (
      this.props.children
    );
  }
}
function Layout() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');
  const mode = useRuntime();
  const loc = useLocation();
  useEffect(() => {
    setOpen(false);
    setError('');
    window.scrollTo(0, 0);
  }, [loc.pathname]);
  return (
    <>
      <a className="skip" href="#main">
        Skip to content
      </a>
      {mode === 'demo' && (
        <div className="demo-bar">
          Local demo · Sample properties · Emails saved to the local outbox
        </div>
      )}
      {mode === 'showcase' && (
        <div className="demo-bar">
          Browsing preview · Illustrative homes · Accounts and viewings opening soon
        </div>
      )}
      <header>
        <div className="container nav">
          <Link to="/" className="brand" aria-label="EstateIQ home">
            <span className="brand-mark">
              <House size={23} />
            </span>
            Estate<span>IQ</span>
            <i />
          </Link>
          <button
            className="menu-toggle"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            onClick={() => setOpen(!open)}
          >
            {open ? <X /> : <Menu />}
          </button>
          <nav className={open ? 'open' : ''} aria-label="Main navigation">
            <NavLink to="/properties?purpose=Buy">Buy a home</NavLink>
            <NavLink to="/properties?purpose=Rent">Rent a home</NavLink>
            <Link to="/#how-it-works">How it works</Link>
            {user ? (
              <>
                <NavLink to="/dashboard">Dashboard</NavLink>
                <button
                  className="text-button"
                  onClick={() => logout().catch((e) => setError(errorMessage(e)))}
                >
                  Sign out
                </button>
              </>
            ) : (
              <Link to="/login">Sign in</Link>
            )}
            <Link className="button small dark" to="/properties/new">
              List a property <ArrowUpRight size={16} />
            </Link>
          </nav>
        </div>
      </header>
      {error && (
        <div className="container notice" role="alert">
          {error}
        </div>
      )}
      <main id="main">
        <Boundary>
          <Suspense fallback={<Loading />}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/properties" element={<Browse />} />
              <Route
                path="/properties/new"
                element={
                  <Protected>
                    <Editor />
                  </Protected>
                }
              />
              <Route
                path="/properties/:id/edit"
                element={
                  <Protected>
                    <Editor />
                  </Protected>
                }
              />
              <Route path="/properties/:id" element={<Detail />} />
              <Route
                path="/dashboard"
                element={
                  <Protected>
                    <Dashboard />
                  </Protected>
                }
              />
              {['login', 'register', 'forgot-password', 'reset-password'].map((p) => (
                <Route key={p} path={'/' + p} element={<Account />} />
              ))}
              <Route path="/viewing" element={<Viewing />} />
              <Route
                path="*"
                element={
                  <section className="container section">
                    <Seo title="Page not found" privatePage />
                    <p className="eyebrow">404 / A little off the map</p>
                    <h1>Let's find your way home.</h1>
                    <Link className="button dark" to="/">
                      Back to EstateIQ
                    </Link>
                  </section>
                }
              />
            </Routes>
          </Suspense>
        </Boundary>
      </main>
      <footer>
        <div className="container footer-top">
          <div>
            <Link to="/" className="brand">
              <House /> EstateIQ
            </Link>
            <p>A place for your next chapter.</p>
          </div>
          <div>
            <Link to="/properties">Explore properties</Link>
            <Link to="/properties/new">List your property</Link>
            <Link to="/dashboard">Your dashboard</Link>
          </div>
          <p>
            Built for the way
            <br />
            India finds home.
          </p>
        </div>
        <div className="container footer-bottom">
          <span>© {new Date().getFullYear()} EstateIQ</span>
          <span>Find a place. Make it yours.</span>
        </div>
      </footer>
    </>
  );
}
createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <RuntimeProvider>
        <AuthProvider>
          <Layout />
        </AuthProvider>
      </RuntimeProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
