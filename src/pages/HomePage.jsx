import React from 'react';
import { useNavigate } from 'react-router-dom';
import './HomePage.css';

function HomePage() {
  const navigate = useNavigate();
  return (
    <div className="homepage-container">
      <div className="homepage-card">
        <img src="/smartparcelicon-light.png" alt="SmartParcel Logo" className="homepage-logo" />
        <h1 className="homepage-title">Welcome to ShipWise</h1>
        <p className="homepage-desc">A modern, secure, and smart way to manage your shipments.</p>
        <div className="homepage-btn-group">
          <button className="homepage-btn" onClick={() => navigate('/login')}>Login</button>
          <button className="homepage-btn secondary" onClick={() => navigate('/register')}>Register</button>
        </div>
      </div>
    </div>
  );
}

export default HomePage;
