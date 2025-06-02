import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { QRCodeCanvas } from 'qrcode.react';
import { fetchAdminParcels, trackParcelById } from '../api/handlerApi';
import { logout } from '../api/auth';
import './AdminDashboard.css';
import TrackParcelPage from '../pages/TrackParcelPage';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

function AdminDashboard() {
  const [showEditForm, setShowEditForm] = useState(false);
  const [selectedParcel, setSelectedParcel] = useState(null);
  const [parcels, setParcels] = useState([]);
  const [searchTrackingId, setSearchTrackingId] = useState('');
  const [searchedParcel, setSearchedParcel] = useState(null);
  const [searchError, setSearchError] = useState('');
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [activePage, setActivePage] = useState('dashboard');
  const [dashboardSearch, setDashboardSearch] = useState("");
  const [mapLocations, setMapLocations] = useState({}); // { [trackingId]: { lat, lng } }
  const [mapLoading, setMapLoading] = useState({}); // { [trackingId]: true/false }
  const [mapError, setMapError] = useState({}); // { [trackingId]: errorMsg }
  const navigate = useNavigate();

  const handleEditClick = (parcel) => {
    setSelectedParcel(parcel);
    setShowEditForm(true);
  };

  const summary = {
    today: 127,
    monthly: 3289,
    issues: 10,
    total: 12853,
  };

  const filteredParcels = parcels.filter(parcel => {
    // Tab filter
    let tabMatch = true;
    if (activeTab === 'progress') tabMatch = parcel.status === 'In Transit';
    else if (activeTab === 'success') tabMatch = parcel.status === 'Delivered';
    else if (activeTab === 'hold') tabMatch = parcel.status === 'On Hold';
    else if (activeTab === 'canceled') tabMatch = parcel.status === 'Canceled';
    else if (activeTab === 'refund') tabMatch = parcel.status === 'Refunded' || parcel.status === 'Reported';
    // Search filter (tracking ID, case-insensitive, partial)
    let searchMatch = true;
    if (dashboardSearch.trim() !== "") {
      searchMatch = parcel.trackingId.toLowerCase().includes(dashboardSearch.trim().toLowerCase());
    }
    return tabMatch && searchMatch;
  });

  useEffect(() => {
    // Check if user is logged in
    // If token is not present, redirect to login page
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/');
    }
  }, [navigate]);

  useEffect(() => {
    //prevent the browser from caching pages, avoid back button issues
    window.history.pushState(null, null, window.location.href);
    window.onpopstate = () => {
      window.history.go(1);
    };
  }, []);

  const handleTrackParcel = async (e) => {
    e.preventDefault();
    setSearchError('');
    setSearchedParcel(null);
    if (!searchTrackingId.trim()) {
      setSearchError('Please enter a tracking ID.');
      return;
    }
    try {
      const data = await trackParcelById(searchTrackingId.trim());
      setSearchedParcel(data);
    } catch (err) {
      const msg = err.response?.data?.message || 'Parcel not found.';
      setSearchError(msg);
    }
  };

  const loadParcels = async () => {
    try {
      const data = await fetchAdminParcels();
      setParcels(data);
    } catch (err) {
      console.error('Error fetching parcels:', err);
    }
  };

  useEffect(() => {
    loadParcels();
  }, []);

  // Sidebar navigation click handler
  const handleSidebarNav = (page) => {
    setActivePage(page);
  };

  // Helper: Geocode address to lat/lng using Nominatim (OpenStreetMap)
  const geocodeAddress = async (address) => {
    if (!address || typeof address !== 'string' || !address.trim()) {
      throw new Error('No address');
    }
    let query = address.trim();
    let url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`;
    let resp = await fetch(url);
    let data = await resp.json();
    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon)
      };
    }
    // Try again with ', India' appended if not already present
    if (!/india/i.test(query)) {
      query = query + ', India';
      url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`;
      resp = await fetch(url);
      data = await resp.json();
      if (data && data.length > 0) {
        return {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon)
        };
      }
    }
    // Log for debugging
    console.warn('Geocoding failed for address:', address);
    throw new Error('Location not found');
  };

  // Add useEffect to geocode addresses for visible parcels
  useEffect(() => {
    filteredParcels.forEach(parcel => {
      if (!mapLocations[parcel.trackingId] && !mapLoading[parcel.trackingId] && !mapError[parcel.trackingId]) {
        setMapLoading(prev => ({ ...prev, [parcel.trackingId]: true }));
        geocodeAddress(parcel.recipientAddress)
          .then(coords => {
            setMapLocations(prev => ({ ...prev, [parcel.trackingId]: coords }));
            setMapLoading(prev => ({ ...prev, [parcel.trackingId]: false }));
          })
          .catch(() => {
            setMapError(prev => ({ ...prev, [parcel.trackingId]: 'Map unavailable' }));
            setMapLoading(prev => ({ ...prev, [parcel.trackingId]: false }));
          });
      }
    });
    // eslint-disable-next-line
  }, [filteredParcels]);

  return (
    <div className="admin-dashboard-layout">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="sidebar-header">
          <span className="sidebar-logo">ShipWise</span>
        </div>
        <nav className="sidebar-nav">
          <ul>
            <li className={activePage === 'dashboard' ? 'active' : ''} onClick={() => handleSidebarNav('dashboard')}>Delivery Dashboard</li>
            <li className={activePage === 'track' ? 'active' : ''} onClick={() => handleSidebarNav('track')}>Track Parcel</li>
            <li>Customer Report</li>
            <li>Courier Payroll</li>
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
            onChange={e => setDashboardSearch(e.target.value)}
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
              <div className="admin-breadcrumb mb-2">Home &gt; Delivery Orders &gt; Current Delivery</div>
              <h2 className="mb-4">Delivery Orders</h2>
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
              {/* Delivery Report Tabs */}
              <ul className="nav nav-tabs mb-3">
                <li className="nav-item">
                  <button className={`nav-link${activeTab === 'all' ? ' active' : ''}`} onClick={() => setActiveTab('all')}>All Delivery</button>
                </li>
                <li className="nav-item">
                  <button className={`nav-link${activeTab === 'progress' ? ' active' : ''}`} onClick={() => setActiveTab('progress')}>On Progress Delivery</button>
                </li>
                <li className="nav-item">
                  <button className={`nav-link${activeTab === 'success' ? ' active' : ''}`} onClick={() => setActiveTab('success')}>Successful</button>
                </li>
                <li className="nav-item">
                  <button className={`nav-link${activeTab === 'hold' ? ' active' : ''}`} onClick={() => setActiveTab('hold')}>On Hold Delivery</button>
                </li>
                <li className="nav-item">
                  <button className={`nav-link${activeTab === 'canceled' ? ' active' : ''}`} onClick={() => setActiveTab('canceled')}>Canceled Delivery</button>
                </li>
                <li className="nav-item">
                  <button className={`nav-link${activeTab === 'refund' ? ' active' : ''}`} onClick={() => setActiveTab('refund')}>Refund / Reported</button>
                </li>
              </ul>
              {/* Delivery Report Cards */}
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
                      <div className="delivery-report-map mt-3">
                        {mapLoading[parcel.trackingId] ? (
                          <div className="map-placeholder">Loading map...</div>
                        ) : mapError[parcel.trackingId] ? (
                          <div className="map-placeholder text-danger">Map unavailable</div>
                        ) : mapLocations[parcel.trackingId] ? (
                          <MapContainer
                            center={[mapLocations[parcel.trackingId].lat, mapLocations[parcel.trackingId].lng]}
                            zoom={13}
                            style={{ height: '120px', width: '100%', borderRadius: '8px' }}
                            scrollWheelZoom={false}
                            dragging={false}
                            doubleClickZoom={false}
                            zoomControl={false}
                            attributionControl={false}
                          >
                            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                            <Marker position={[mapLocations[parcel.trackingId].lat, mapLocations[parcel.trackingId].lng]}>
                              <Popup>{parcel.recipientAddress}</Popup>
                            </Marker>
                          </MapContainer>
                        ) : (
                          <div className="map-placeholder">Map view here</div>
                        )}
                      </div>
                      {/* Details Modal Trigger (keeps all info accessible) */}
                      <div className="d-flex justify-content-end mt-2">
                        <button className="btn btn-sm btn-warning" onClick={() => handleEditClick(parcel)}>Details</button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="alert alert-info">No parcels found for this filter.</div>
                )}
              </div>
              {/* Details Modal (unchanged) */}
              {showEditForm && selectedParcel && (
                <div className="modal-overlay">
                  <div className="modal-card" style={{ maxHeight: '80vh', overflowY: 'auto', width: '500px', margin: '0 auto', borderRadius: '16px', boxShadow: '0 8px 32px rgba(45,91,227,0.10)', background: '#fff', padding: 0, fontFamily: 'Segoe UI, Arial, sans-serif' }}>
                    <div className="card-header" style={{ background: '#2d5be3', color: '#fff', borderRadius: '16px 16px 0 0', padding: '1.25rem 1.5rem', fontWeight: 700, fontSize: '1.2rem', letterSpacing: '0.5px', fontFamily: 'inherit' }}>
                      Update Parcel <code style={{ background: 'rgba(255,255,255,0.15)', borderRadius: '4px', padding: '2px 6px', fontWeight: 600, fontSize: '1rem', color: '#fff' }}>{selectedParcel.trackingId}</code>
                    </div>
                    <div className="card-body" style={{ padding: '1.5rem', fontFamily: 'inherit', color: '#222' }}>
                      <ul className="list-group mb-3" style={{ border: 'none', fontSize: '1.05rem' }}>
                        <li className="list-group-item" style={{ border: 'none', padding: '0.5rem 0' }}><span style={{ fontWeight: 600, color: '#2d5be3' }}>Recipient:</span> {selectedParcel.recipientName}</li>
                        <li className="list-group-item" style={{ border: 'none', padding: '0.5rem 0' }}><span style={{ fontWeight: 600, color: '#2d5be3' }}>Address:</span> {selectedParcel.recipientAddress}</li>
                        <li className="list-group-item" style={{ border: 'none', padding: '0.5rem 0' }}><span style={{ fontWeight: 600, color: '#2d5be3' }}>Weight:</span> {selectedParcel.weight} kg</li>
                        <li className="list-group-item" style={{ border: 'none', padding: '0.5rem 0' }}><span style={{ fontWeight: 600, color: '#2d5be3' }}>Type:</span> {selectedParcel.type}</li>
                        <li className="list-group-item" style={{ border: 'none', padding: '0.5rem 0' }}><span style={{ fontWeight: 600, color: '#2d5be3' }}>Metadata:</span> {selectedParcel.metadata || 'N/A'}</li>
                        <li className="list-group-item" style={{ border: 'none', padding: '0.5rem 0' }}><span style={{ fontWeight: 600, color: '#2d5be3' }}>Created At:</span> {new Date(selectedParcel.createdAt).toLocaleString()}</li>
                        {selectedParcel.updatedAt && (
                          <li className="list-group-item" style={{ border: 'none', padding: '0.5rem 0' }}><span style={{ fontWeight: 600, color: '#2d5be3' }}>Last Updated:</span> {new Date(selectedParcel.updatedAt).toLocaleString()}</li>
                        )}
                        <li className="list-group-item" style={{ border: 'none', padding: '0.5rem 0' }}>
                          <span style={{ fontWeight: 600, color: '#2d5be3' }}>Current Status:</span> <span className="badge bg-info text-dark" style={{ fontSize: '1rem', padding: '0.4em 0.8em', borderRadius: '6px', fontWeight: 600 }}>{selectedParcel.status}</span>
                        </li>
                      </ul>
                      <div className="mb-4 text-center">
                        <QRCodeCanvas value={`http://localhost:3000/parcel/${selectedParcel.trackingId}`} size={160} />
                        <div className="mt-2"><small style={{ color: '#888', fontFamily: 'inherit' }}>Tracking ID: <code style={{ color: '#2d5be3', fontWeight: 600 }}>{selectedParcel.trackingId}</code></small></div>
                      </div>
                      <div className="d-flex justify-content-end">
                        <button className="btn btn-secondary" style={{ borderRadius: '6px', fontWeight: 500, fontFamily: 'inherit', background: '#f0f4ff', color: '#2d5be3', border: 'none' }} onClick={() => setShowEditForm(false)}>Close</button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
          {activePage === 'track' && <TrackParcelPage />}
        </div>
      </main>
    </div>
  );
}

export default AdminDashboard;
