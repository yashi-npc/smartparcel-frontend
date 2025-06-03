import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { logout } from '../api/auth';
import axiosInstance from '../api/axiosInstance';
import './AdminDashboard.css';
import TrackParcelPage from '../pages/TrackParcelPage';

function SenderDashboard() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    itemName: '',
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

  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const monthStr = today.toISOString().slice(0, 7);
  const todaysOrders = parcels.filter(p => p.createdAt && p.createdAt.slice(0, 10) === todayStr).length;
  const thisMonthsOrders = parcels.filter(p => p.createdAt && p.createdAt.slice(0, 7) === monthStr).length;
  const successfulOrders = parcels.filter(p => (p.status || '').toLowerCase() === 'delivered').length;
  const failedOrders = parcels.filter(p => {
    const s = (p.status || '').toLowerCase();
    return s === 'canceled' || s === 'returned';
  }).length;
  const underwayOrders = parcels.filter(p => {
    const s = (p.status || '').toLowerCase();
    return s === 'shipped' || s === 'in transit' || s === 'out for delivery' || s === 'at local facility';
  }).length;
  const onHoldOrders = parcels.filter(p => (p.status || '').toLowerCase() === 'on hold').length;

   const handleSidebarNav = (page) => {
    setActivePage(page);
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
      itemName: formData.itemName.trim(),
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
        itemName: '',
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
            <li className={activePage === 'invoices' ? 'active' : ''} onClick={() => handleSidebarNav('invoices')}>Delivery Invoices</li>
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
              <input
                className="admin-search"
                placeholder="Search by Tracking ID"
                value={dashboardSearch}
                onChange={(e) => setDashboardSearch(e.target.value)}
              />
              <div className="admin-breadcrumb mb-2">Home &gt; Sender &gt; Parcels</div>
              <h2 className="mb-4">Sender Parcels</h2>
              {/* Summary Cards */}
              {dashboardSearch.trim() === '' && (
                <div className="summary-cards-row">
                  <div className="summary-card">
                    <div className="summary-card-title">Today's Orders</div>
                    <div className="summary-card-value">{todaysOrders}</div>
                    <div className="summary-card-label-success">Total parcels created today</div>
                  </div>
                  <div className="summary-card">
                    <div className="summary-card-title">This Month's Orders</div>
                    <div className="summary-card-value">{thisMonthsOrders}</div>
                    <div className="summary-card-label-success">Total parcels created this month</div>
                  </div>
                  <div className="summary-card">
                    <div className="summary-card-title">Successful Orders</div>
                    <div className="summary-card-value">{successfulOrders}</div>
                    <div className="summary-card-label-success">Delivered</div>
                  </div>
                  <div className="summary-card">
                    <div className="summary-card-title">Failed Orders</div>
                    <div className="summary-card-value">{failedOrders}</div>
                    <div className="summary-card-label-fail">Canceled + Returned</div>
                  </div>
                  <div className="summary-card">
                    <div className="summary-card-title">Underway Orders</div>
                    <div className="summary-card-value">{underwayOrders}</div>
                    <div className="summary-card-label-underway">Shipped, In transit, Out for delivery, At local facility</div>
                  </div>
                  <div className="summary-card">
                    <div className="summary-card-title">On Hold</div>
                    <div className="summary-card-value">{onHoldOrders}</div>
                    <div className="summary-card-label-fail">On hold parcels</div>
                  </div>
                </div>
              )}
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
                          <div>Item Name: <b>{parcel.itemName || 'N/A'}</b></div>
                          <div>Item Category: <b>{parcel.type}</b></div>
                          <div>Delivery Code: <b>{parcel.trackingId}</b></div>
                          <div>Metadata: <b>{parcel.metadata}</b></div>
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
            <div className="delivery-report-card mb-4 create-parcel-card">
              <h4 className="create-parcel-title">Create Parcel</h4>
              <form onSubmit={handleCreateParcel} className="mb-3">
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Item Name:</label>
                    <input
                      type="text"
                      className="form-control"
                      name="itemName"
                      value={formData.itemName}
                      onChange={handleChange}
                      required
                    />
                  </div>
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
                    <label className="form-label">Type:</label>
                    <select
                      className="form-control"
                      name="type"
                      value={formData.type}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Select Type</option>
                      <option value="Express">Express</option>
                      <option value="Regular">Regular</option>
                    </select>
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
                <div className="d-flex justify-content-end">
                  <button type="submit" className="btn btn-primary create-parcel-btn">Create Parcel</button>
                </div>
              </form>
              {message && <div className="alert alert-info mt-3">{message}</div>}
              {trackingId && (
                <div className="mt-4 text-center">
                  <h5>Tracking ID: <code>{trackingId}</code></h5>
                  <img
                    src={qrCodeImage}
                    alt="QR Code"
                    className="img-fluid mt-3"
                    style={{ maxWidth: '200px', borderRadius: '10px', boxShadow: '0 2px 12px rgba(45,91,227,0.10)' }}
                  />
                </div>
              )}
            </div>
          )}
          {activePage === 'track' && <TrackParcelPage />}
          {activePage === 'invoices' && (
            <div className="delivery-invoices-tab">
              <h2 className="mb-4">Delivery Invoices</h2>
              <div className="card" style={{ padding: '1.5rem', borderRadius: '16px', boxShadow: '0 4px 16px rgba(45,91,227,0.07)' }}>
                <div style={{ overflowX: 'auto' }}>
                  <table className="table table-striped" style={{ minWidth: 900 }}>
                    <thead>
                      <tr>
                        <th>Tracking ID</th>
                        <th>Item Name</th>
                        <th>Recipient</th>
                        <th>Address</th>
                        <th>Status</th>
                        <th>Created</th>
                        <th>Amount</th>
                        <th>Invoice</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parcels.length === 0 ? (
                        <tr><td colSpan="8" className="text-center">No parcels found.</td></tr>
                      ) : (
                        parcels.map(parcel => (
                          <tr key={parcel.trackingId}>
                            <td>{parcel.trackingId}</td>
                            <td>{parcel.itemName || 'N/A'}</td>
                            <td>{parcel.recipientName}</td>
                            <td>{parcel.recipientAddress}</td>
                            <td>{parcel.status}</td>
                            <td>{parcel.createdAt ? new Date(parcel.createdAt).toLocaleDateString() : 'N/A'}</td>
                            <td>{parcel.amount ? `₹${parcel.amount}` : 'N/A'}</td>
                            <td>
                              <button className="btn btn-sm btn-primary" disabled>Download Invoice</button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default SenderDashboard;
