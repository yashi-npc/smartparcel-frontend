import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import './RegisterPage.css';

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
    <div className="min-vh-100 d-flex align-items-center" style={{ backgroundColor: '#f8f9fa' }}>
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-6 col-lg-5">
            <div className="card shadow-lg border-0">
              <div className="card-body p-5">
                <div className="text-center mb-4">
                  <h1 className="h3 mb-3 fw-bold" style={{ color: '#2d5be3' }}>ShipWise</h1>
                  <p className="text-muted">Create your account</p>
                </div>
                <form onSubmit={handleSubmit}>
                  <div className="mb-4">
                    <label className="form-label text-muted fw-semibold">Full Name</label>
                    <input
                      type="text"
                      className="form-control form-control-lg bg-light border-0"
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      required
                      placeholder="Enter your name"
                      style={{ padding: '0.75rem 1rem' }}
                    />
                  </div>

                  <div className="mb-4">
                    <label className="form-label text-muted fw-semibold">Email Address</label>
                    <input
                      type="email"
                      className="form-control form-control-lg bg-light border-0"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      required
                      placeholder="Enter your email"
                      style={{ padding: '0.75rem 1rem' }}
                    />
                  </div>

                  <div className="mb-4">
                    <label className="form-label text-muted fw-semibold">Password</label>
                    <input
                      type="password"
                      className="form-control form-control-lg bg-light border-0"
                      name="password"
                      value={form.password}
                      onChange={handleChange}
                      required
                      placeholder="Create a password"
                      style={{ padding: '0.75rem 1rem' }}
                    />
                  </div>

                  <div className="mb-4">
                    <label className="form-label text-muted fw-semibold">Confirm Password</label>
                    <input
                      type="password"
                      className="form-control form-control-lg bg-light border-0"
                      name="confirmPassword"
                      value={form.confirmPassword}
                      onChange={handleChange}
                      required
                      placeholder="Confirm your password"
                      style={{ padding: '0.75rem 1rem' }}
                    />
                  </div>

                  <div className="mb-4">
                    <label className="form-label text-muted fw-semibold">Account Type</label>
                    <select
                      className="form-select form-select-lg bg-light border-0"
                      name="role"
                      value={form.role}
                      onChange={handleChange}
                      required
                      style={{ padding: '0.75rem 1rem' }}
          >
            <option value="">Select Role</option>                      <option value="sender">Sender</option>
                      <option value="handler">Handler</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>

                  <button 
                    type="submit" 
                    className="btn btn-primary w-100 py-3 fw-semibold"
                    style={{ 
                      backgroundColor: '#2d5be3',
                      borderColor: '#2d5be3',
                      fontSize: '1rem'
                    }}
                  >
                    Create Account
                  </button>
                </form>
                <div className="text-center mt-4">
                  <p className="mb-0">
                    Already have an account? {' '}
                    <Link to="/login" style={{ color: '#2d5be3', textDecoration: 'none', fontWeight: '600' }}>
                      Sign in here
                    </Link>
                  </p>
                  <p className="mb-0">
                    {' '}
                    <Link to="/" style={{ color: '#2d5be3', textDecoration: 'none', fontWeight: '600' }}>
                      Back to homepage
                    </Link>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
