import React, { useState } from 'react';
import axios from '../api/axiosInstance';
import { setToken } from '../utils/tokens';
import { useNavigate, Link } from 'react-router-dom';
import './LoginPage.css';
import './HomePage.css'; // Reuse homepage styles

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await axios.post('/api/login', { email, password });
      const { token } = response.data;
      setToken(token);

      const payload = JSON.parse(atob(token.split('.')[1]));
      const role = payload.role;

      switch (role) {
        case 'sender':
          navigate('/sender');
          break;
        case 'handler':
          navigate('/handler/dashboard');
          break;
        case 'admin':
          navigate('/admin/dashboard');
          break;
        default:
          setError('Unknown role.');
      }
    } catch (err) {
      setError('Login failed. Check your credentials.');
    }
  };

  return (
    <div className="homepage-bg-nice">
      <div className="homepage-overlay">
        <div className="homepage-card">
          <img src="/smartparcelicon-light.png" alt="SmartParcel Logo" className="homepage-logo" />
          <h1 className="homepage-title">Login to ShipWise</h1>
          {error && <div className="alert alert-danger text-center">{error}</div>}
          <form onSubmit={handleLogin}>
            <div className="mb-3">
              <label className="form-label text-secondary">Email Address</label>
              <input
                type="email"
                className="form-control bg-dark text-white border-secondary"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>
            <div className="mb-4">
              <label className="form-label text-secondary">Password</label>
              <input
                type="password"
                className="form-control bg-dark text-white border-secondary"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="********"
              />
            </div>
            <button
              type="submit"
              className="btn w-100 py-2 fw-bold"
              style={{
                backgroundColor: '#2d5be3',
                border: 'none',
                color: 'white',
              }}
            >
              Sign In
            </button>
          </form>
          <div className="text-center mt-4">
            <p className="text-secondary small">
              Don't have an account?{' '}
              <Link
                to="/register"
                className="fw-semibold text-decoration-none"
                style={{ color: '#2d5be3' }}
              >
                Register here
              </Link>
            </p>
            <p className="mb-0">
              {' '}
              <Link
                to="/"
                style={{ color: '#2d5be3', textDecoration: 'none', fontWeight: '600' }}
              >
                Back to homepage
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
