import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import './RegisterPage.css';
import './HomePage.css';

const RegisterPage = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'sender', // default role
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (form.password !== form.confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    try {
      await axios.post('http://localhost:8080/parceltrack/api/register', {
        name: form.name,
        email: form.email,
        password: form.password,
        role: form.role,
      });
      alert('Registration successful! You can now login.');
      navigate('/');
    } catch (error) {
      alert('Registration failed: ' + (error.response?.data?.error || 'Unknown error'));
    }
  };
  return (
    <div className="homepage-bg-nice">
      <div className="homepage-overlay">
        <div className="homepage-card" style={{ padding: '2rem 2rem' }}>
          <img 
            src="/smartparcelicon-light.png" 
            alt="SmartParcel Logo" 
            className="homepage-logo" 
            style={{ width: '60px', marginBottom: '1rem' }}
          />
          <h1 className="homepage-title" style={{ fontSize: '1.75rem', marginBottom: '1.5rem' }}>Register for ShipWise</h1>
          
          <form onSubmit={handleSubmit} className="w-100">
            <div className="mb-2">
              <label className="form-label text-secondary small mb-1">Full Name</label>
              <input
                type="text"
                className="form-control form-control-sm bg-dark text-white border-secondary"
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                placeholder="Enter your name"
              />
            </div>

            <div className="mb-2">
              <label className="form-label text-secondary small mb-1">Email Address</label>
              <input
                type="email"
                className="form-control form-control-sm bg-dark text-white border-secondary"
                name="email"
                value={form.email}
                onChange={handleChange}
                required
                placeholder="you@example.com"
              />
            </div>

            <div className="mb-2">
              <label className="form-label text-secondary small mb-1">Password</label>
              <input
                type="password"
                className="form-control form-control-sm bg-dark text-white border-secondary"
                name="password"
                value={form.password}
                onChange={handleChange}
                required
                placeholder="********"
              />
            </div>

            <div className="mb-2">
              <label className="form-label text-secondary small mb-1">Confirm Password</label>
              <input
                type="password"
                className="form-control form-control-sm bg-dark text-white border-secondary"
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={handleChange}
                required
                placeholder="********"
              />
            </div>

            <div className="mb-3">
              <label className="form-label text-secondary small mb-1">Account Type</label>
              <select
                className="form-control form-control-sm bg-dark  border-secondary"
                name="role"
                value={form.role}
                onChange={handleChange}
                required
              >
                <option value="">Select Role</option>
                <option value="sender">Sender</option>
                <option value="handler">Handler</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <button 
              type="submit" 
              className="btn btn-sm w-100 py-2 fw-bold"
              style={{
                backgroundColor: '#2d5be3',
                border: 'none',
                color: 'white',
              }}
            >
              Create Account
            </button>

            <div className="text-center mt-3">
              <p className="text-secondary small mb-1" style={{ fontSize: '0.85rem' }}>
                Already have an account?{' '}
                <Link
                  to="/login"
                  className="fw-semibold text-decoration-none"
                  style={{ color: '#2d5be3' }}
                >
                  Sign in here
                </Link>
              </p>
              <Link
                to="/"
                className="text-decoration-none fw-semibold small"
                style={{ color: '#2d5be3', fontSize: '0.85rem' }}
              >
                Back to homepage
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
