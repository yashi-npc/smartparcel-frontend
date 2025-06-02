import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { logout } from '../api/auth';
import axiosInstance from '../api/axiosInstance';
import './AdminDashboard.css';
import TrackParcelPage from '../pages/TrackParcelPage';

function SenderDashboard() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    recipientName: '',
    recipientAddress: '',
    weight: '',
    type: '',
    metadata: '',
  });
  const [parcels, setParcels] = useState([]);
  const [trackingId, setTrackingId] = useState('');
  const [qrCodeImage, setQrCodeImage] = useState('');
  const [message, setMessage] = useState('');
  const [dashboardSearch, setDashboardSearch] = useState('');
  const [activePage, setActivePage] = useState('dashboard');

   const handleSidebarNav = (page) => {
    setActivePage(page);
  };
    
  const summary = {
    today: 12,
    monthly: 210,
    issues: 1,
    total: 800,
  };

  const filteredParcels = parcels.filter((parcel) => {
    let searchMatch = true;
    if (dashboardSearch.trim() !== '') {
      searchMatch = parcel.trackingId.toLowerCase().includes(dashboardSearch.trim().toLowerCase());
    }
    return searchMatch;
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) navigate('/');
  }, [navigate]);

  useEffect(() => {
    window.history.pushState(null, null, window.location.href);
    window.onpopstate = () => { window.history.go(1); };
  }, []);

  const fetchParcels = async () => {
    try {
      const response = await axiosInstance.get('/dashboard/sender');
      setParcels(response.data);
    } catch (err) {
      console.error('Error fetching parcels:', err);
    }
  };

  useEffect(() => { fetchParcels(); }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCreateParcel = async (e) => {
    e.preventDefault();
    setMessage('');
    setTrackingId('');
    setQrCodeImage('');
    const payload = {
      recipientName: formData.recipientName.trim(),
      recipientAddress: formData.recipientAddress.trim(),
      type: formData.type.trim(),
      weight: parseFloat(formData.weight),
      metadata: formData.metadata.trim() || '',
    };
    if (isNaN(payload.weight) || payload.weight <= 0) {
      setMessage('Please enter a valid positive weight.');
      return;
    }
    try {
      const response = await axiosInstance.post('/api/parcel/create', payload);
      const { trackingId, qrCode } = response.data;
      setTrackingId(trackingId);
      setQrCodeImage(`data:image/png;base64,${qrCode}`);
      setMessage('Parcel created successfully!');
      fetchParcels();
      setFormData({
        recipientName: '',
        recipientAddress: '',
        weight: '',
        type: '',
        metadata: '',
      });
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Error creating parcel.';
      setMessage(errorMsg);
    }
  };

  return (
    <div className="admin-dashboard-layout">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="sidebar-header">
          <span className="sidebar-logo">ShipWise</span>
        </div>
        <nav className="sidebar-nav">
          <ul>
            <li className={activePage === 'dashboard' ? 'active' : ''} onClick={() => handleSidebarNav('dashboard')}>Sender Dashboard</li>
            <li className={activePage === 'createparcel' ? 'active' : ''} onClick={() => handleSidebarNav('createparcel')}>Create Parcel</li>
            <li className={activePage === 'track' ? 'active' : ''} onClick={() => handleSidebarNav('track')}>Track Parcel</li>
            <li>Delivery Data</li>
            <li>Delivery Invoices</li>
            <li>App Integration</li>
          </ul>
        </nav>
        <div className="sidebar-footer">
          <div className="sidebar-links">
            <div>Help Center</div>
            <div>Settings</div>
          </div>
        </div>
      </aside>
      {/* Main Content */}
      <main className="admin-main">
        {/* Header */}
        <div className="admin-header">
          <input
            className="admin-search"
            placeholder="Search by Tracking ID"
            value={dashboardSearch}
            onChange={(e) => setDashboardSearch(e.target.value)}
          />
          <div className="admin-header-actions">
            <button className="admin-header-btn">Delivery Logs</button>
            <button className="admin-header-btn">Download Delivery Report</button>
            <button className="admin-header-btn">Customize Widget</button>
            <button onClick={logout} className="admin-logout-btn">Logout</button>
          </div>
        </div>
        <div className="admin-content">
          {activePage === 'dashboard' && (
            <>
              <div className="admin-breadcrumb mb-2">Home &gt; Sender &gt; Parcels</div>
              <h2 className="mb-4">Sender Parcels</h2>
              {/* Summary Cards */}
              <div className="row mb-4">
                <div className="col-md-3">
                  <div className="card text-center p-3">
                    <div>Today's Delivery</div>
                    <h4>{summary.today} Orders</h4>
                    <div className="text-success small">+150% vs past month</div>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="card text-center p-3">
                    <div>Monthly Delivery</div>
                    <h4>{summary.monthly} Orders</h4>
                    <div className="text-success small">+150% vs past month</div>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="card text-center p-3">
                    <div>Delivery Issue</div>
                    <h4>{summary.issues} Report</h4>
                    <div className="text-success small">+150% vs past month</div>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="card text-center p-3">
                    <div>Total Delivery</div>
                    <h4>{summary.total} Orders</h4>
                    <div className="text-success small">+150% vs past month</div>
                  </div>
                </div>
              </div>
              {/* Parcel List */}
              <div className="delivery-report-list">
                {filteredParcels.length > 0 ? (
                  filteredParcels.map((parcel) => (
                    <div className="delivery-report-card mb-4" key={parcel.trackingId}>
                      <div className="delivery-report-header">
                        <span className="delivery-type">{parcel.type === 'Express' ? 'Express Delivery' : 'Regular Delivery'}</span>
                        <span className="delivery-id">#{parcel.trackingId}</span>
                      </div>
                      <div className="row">
                        <div className="col-md-4">
                          <div className="mb-2"><strong>Courier Information</strong></div>
                          <div className="d-flex align-items-center mb-2">
                            <div>
                              <div>{parcel.recipientName}</div>
                              <div className="text-muted small">EMP-3321</div>
                            </div>
                          </div>
                        </div>
                        <div className="col-md-4">
                          <div className="mb-2"><strong>Item Information</strong></div>
                          <div>Item Name: <b>{parcel.metadata || 'N/A'}</b></div>
                          <div>Item Category: <b>{parcel.type}</b></div>
                          <div>Delivery Code: <b>{parcel.trackingId}</b></div>
                        </div>
                        <div className="col-md-4">
                          <div className="mb-2"><strong>Delivery Information</strong></div>
                          <div>Location: <b>{parcel.recipientAddress}</b></div>
                          <div>Condition: <span className="text-primary">Good Condition</span></div>
                          <div>Delivery Start: <b>{new Date(parcel.createdAt).toLocaleDateString()}</b></div>
                          <div>Expected Ends: <b>{parcel.updatedAt ? new Date(parcel.updatedAt).toLocaleDateString() : 'N/A'}</b></div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="alert alert-info">No parcels found for this filter.</div>
                )}
              </div>
            </>
          )}
          {activePage === 'createparcel' && (
            <div className="delivery-report-card mb-4">
              <h4>Create Parcel</h4>
              <form onSubmit={handleCreateParcel} className="mb-3">
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Recipient Name:</label>
                    <input
                      type="text"
                      className="form-control"
                      name="recipientName"
                      value={formData.recipientName}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Recipient Address:</label>
                    <input
                      type="text"
                      className="form-control"
                      name="recipientAddress"
                      value={formData.recipientAddress}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="col-md-4 mb-3">
                    <label className="form-label">Parcel Type:</label>
                    <input
                      type="text"
                      className="form-control"
                      name="type"
                      value={formData.type}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="col-md-4 mb-3">
                    <label className="form-label">Weight (kg):</label>
                    <input
                      type="number"
                      className="form-control"
                      name="weight"
                      value={formData.weight}
                      onChange={handleChange}
                      min="0.1"
                      step="0.1"
                      required
                    />
                  </div>
                  <div className="col-md-4 mb-3">
                    <label className="form-label">Metadata (optional):</label>
                    <input
                      type="text"
                      className="form-control"
                      name="metadata"
                      value={formData.metadata}
                      onChange={handleChange}
                      placeholder="Additional info"
                    />
                  </div>
                </div>
                <button type="submit" className="btn btn-primary">Create Parcel</button>
              </form>
              {message && <div className="alert alert-info mt-3">{message}</div>}
              {trackingId && (
                <div className="mt-4 text-center">
                  <h5>Tracking ID: <code>{trackingId}</code></h5>
                  <img
                    src={qrCodeImage}
                    alt="QR Code"
                    className="img-fluid mt-3"
                    style={{ maxWidth: '200px' }}
                  />
                </div>
              )}
            </div>
          )}
          {activePage === 'track' && <TrackParcelPage />}
        </div>
      </main>
    </div>
  );
}

export default SenderDashboard;
