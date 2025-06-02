import React, { useState } from 'react';
import axios from '../api/axiosInstance';
import { setToken } from '../utils/tokens';
import { useNavigate, Link } from 'react-router-dom';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();S
    setError('');

    try {
      const response = await axios.post('/api/login', { email, password });
      const { token } = response.data;
      setToken(token);

      // Decode JWT token payload
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
    <div className="container mt-5">
      <h2>Login</h2>
      {error && <div className="alert alert-danger">{error}</div>}
      <form onSubmit={handleLogin}>
        <div className="mb-3">
          <label>Email</label>
          <input
            type="email"
            className="form-control"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="mb-3">
          <label>Password</label>
          <input
            type="password"
            className="form-control"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <button type="submit" className="btn btn-primary">Login</button>
      </form>
      <p>Don't have an account? <Link to="/register">Register here</Link></p>
    </div>
  );
};

export default LoginPage;
