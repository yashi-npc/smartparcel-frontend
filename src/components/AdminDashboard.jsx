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
import { Pie, Bar } from 'react-chartjs-2';
import { Chart, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';

import AdminTamperLogs from '../pages/AdminTamperLogs';
import { generateInvoice } from '../utils/generateInvoice';

// Fix for default marker icon issue
delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

Chart.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

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

  // Calculate summary stats dynamically
  const today = new Date();
  
   const isSameDay = (dateA, dateB) => {
    if (!dateA || !dateB) return false;
    const a = new Date(dateA);
    const b = new Date(dateB);
    return a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate();
  };
  const isSameMonth = (dateA, dateB) => {
    if (!dateA || !dateB) return false;
    const a = new Date(dateA);
    const b = new Date(dateB);
    return a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth();
  };
  const todaysOrders = parcels.filter(p => p.createdAt && isSameDay(p.createdAt, today)).length;
  const thisMonthsOrders = parcels.filter(p => p.createdAt && isSameMonth(p.createdAt, today)).length;
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

  const filteredParcels = parcels.filter(parcel => {
    // Tab filter
    let tabMatch = true;
    if (activeTab !== 'all') tabMatch = (parcel.status || '').toLowerCase() === activeTab.toLowerCase();
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

  const geocodeAddress = async (address) => {
    if (!address || typeof address !== 'string' || !address.trim()) {
      throw new Error('No address');
    }

    const apiKey = ''; 
    let query = address.trim();

    const fetchCoords = async (query) => {
      const url = `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(query)}&key=${apiKey}`;
      const resp = await fetch(url);
      const data = await resp.json();
      if (data && data.results && data.results.length > 0) {
        const { lat, lng } = data.results[0].geometry;
        return { lat, lng };
      }
      return null;
    };

    // Try first with the given address
    let coords = await fetchCoords(query);
    if (coords) return coords;

    // Retry with ", India" if not already present
    if (!/india/i.test(query)) {
      query = query + ', India';
      coords = await fetchCoords(query);
      if (coords) return coords;
    }

    console.warn('Geocoding failed for address:', address);
    throw new Error('Location not found');
};


  // Add useEffect to geocode addresses for visible parcels
  useEffect(() => {
    filteredParcels.forEach(parcel => {
      if (!mapLocations[parcel.trackingId] && !mapLoading[parcel.trackingId] && !mapError[parcel.trackingId]) {
        setMapLoading(prev => ({ ...prev, [parcel.trackingId]: true }));
        geocodeAddress(parcel.currentLocation)
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

  // Delivery Data chart helpers
  // Normalize statuses and use a display mapping to avoid duplicate labels
  const statusDisplayMap = {
    'pending': 'Pending',
    'ready for shipment': 'Ready for Shipment',
    'shipped': 'Shipped',
    'in transit': 'In Transit',
    'out for delivery': 'Out for Delivery',
    'on hold': 'On Hold',
    'at local facility': 'At Local Facility',
    'delivered': 'Delivered',
    'canceled': 'Cancelled',
    'cancelled': 'Cancelled', // British spelling
    'returned': 'Returned',
    'unknown': 'Unknown',
  };
  const statusCounts = parcels.reduce((acc, p) => {
    let status = (p.status || 'Unknown').toLowerCase().trim();
    // Normalize spelling for canceled/cancelled
    if (status === 'cancelled') status = 'canceled';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});
  const statusLabels = Object.keys(statusCounts).map(s => statusDisplayMap[s] || (s.charAt(0).toUpperCase() + s.slice(1)));
  const statusData = Object.values(statusCounts);

  // Bar chart: Deliveries per day (last 7 days)
  const days = [...Array(7)].map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d;
  });

  // Debug: log createdAt values
  console.log('Parcel createdAt values:', parcels.map(p => p.createdAt));

  // Helper to check if two dates are the same day (local time)
  function isSameDayLocal(dateA, dateB) {
    if (!dateA || !dateB) return false;
    const a = new Date(dateA);
    return a.getFullYear() === dateB.getFullYear() &&
      a.getMonth() === dateB.getMonth() &&
      a.getDate() === dateB.getDate();
  }

  const deliveriesPerDay = days.map(day =>
    parcels.filter(p => p.createdAt && isSameDayLocal(p.createdAt, day)).length
  );

  const pieData = {
    labels: statusLabels,
    datasets: [
      {
        data: statusData,
        backgroundColor: [
          '#2d5be3', '#4bc0c0', '#ff6384', '#ffcd56', '#36a2eb', '#9966ff', '#ff9f40', '#c9cbcf', '#e57373', '#81c784', '#ffd54f', '#90caf9'
        ],
        borderWidth: 1,
      },
    ],
  };
  const barData = {
    labels: days.map(d => `${d.getMonth() + 1}-${d.getDate()}`),
    datasets: [
      {
        label: 'Parcels Created',
        data: deliveriesPerDay,
        backgroundColor: '#2d5be3',
        borderRadius: 6,
      },
    ],
  };
  const pieOptions = {
    plugins: {
      legend: { position: 'bottom', labels: { font: { size: 14 } } },
    },
    responsive: true,
    maintainAspectRatio: false,
  };
  const barOptions = {
    plugins: {
      legend: { display: false },
    },
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: { beginAtZero: true, ticks: { stepSize: 1 } },
    },
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
            <li className={activePage === 'dashboard' ? 'active' : ''} onClick={() => handleSidebarNav('dashboard')}>Delivery Dashboard</li>
            <li className={activePage === 'track' ? 'active' : ''} onClick={() => handleSidebarNav('track')}>Track Parcel</li>
            <li className={activePage === 'tamperlogs' ? 'active' : ''} onClick={() => handleSidebarNav('tamperlogs')}>Tamper data </li>
            <li className={activePage === 'deliverydata' ? 'active' : ''} onClick={() => handleSidebarNav('deliverydata')}>Delivery Data</li>
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
                onChange={e => setDashboardSearch(e.target.value)}
              />
              {/* Only show summary cards if search bar is empty */}
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
              <div className="admin-breadcrumb mb-2">Home &gt; Delivery Orders &gt; Current Delivery</div>
              <h2 className="mb-4">Delivery Orders</h2>
              {/* Delivery Report Tabs */}
              <div style={{ overflowX: 'auto', whiteSpace: 'nowrap', marginBottom: '1rem' }}>
                <ul className="nav nav-tabs mb-3 flex-nowrap" style={{ minWidth: '700px', width: 'max-content', display: 'inline-flex' }}>
                  <li className="nav-item">
                    <button className={`nav-link${activeTab === 'all' ? ' active' : ''}`} onClick={() => setActiveTab('all')}>All</button>
                  </li>
                  <li className="nav-item">
                    <button className={`nav-link${activeTab === 'Pending' ? ' active' : ''}`} onClick={() => setActiveTab('Pending')}>Processing</button>
                  </li>
                  <li className="nav-item">
                    <button className={`nav-link${activeTab === 'Ready for shipment' ? ' active' : ''}`} onClick={() => setActiveTab('Ready for shipment')}>Ready for shipment</button>
                  </li>
                  <li className="nav-item">
                    <button className={`nav-link${activeTab === 'Shipped' ? ' active' : ''}`} onClick={() => setActiveTab('Shipped')}>Shipped</button>
                  </li>
                  <li className="nav-item">
                    <button className={`nav-link${activeTab === 'In transit' ? ' active' : ''}`} onClick={() => setActiveTab('In transit')}>In transit</button>
                  </li>
                  <li className="nav-item">
                    <button className={`nav-link${activeTab === 'Out for delivery' ? ' active' : ''}`} onClick={() => setActiveTab('Out for delivery')}>Out for delivery</button>
                  </li>
                  <li className="nav-item">
                    <button className={`nav-link${activeTab === 'On hold' ? ' active' : ''}`} onClick={() => setActiveTab('On hold')}>On hold</button>
                  </li>
                  <li className="nav-item">
                    <button className={`nav-link${activeTab === 'At local facility' ? ' active' : ''}`} onClick={() => setActiveTab('At local facility')}>At local facility</button>
                  </li>
                  <li className="nav-item">
                    <button className={`nav-link${activeTab === 'Delivered' ? ' active' : ''}`} onClick={() => setActiveTab('Delivered')}>Delivered</button>
                  </li>
                  <li className="nav-item">
                    <button className={`nav-link${activeTab === 'Canceled' ? ' active' : ''}`} onClick={() => setActiveTab('Canceled')}>Canceled</button>
                  </li>
                  <li className="nav-item">
                    <button className={`nav-link${activeTab === 'Returned' ? ' active' : ''}`} onClick={() => setActiveTab('Returned')}>Returned</button>
                  </li>
                </ul>
              </div>
              {/* Delivery Report Cards */}
              <div className="delivery-report-list">
                {filteredParcels.length > 0 ? (
                  filteredParcels.map((parcel) => (
                    <div className={`delivery-report-card mb-4${(parcel.status || '').toLowerCase() === 'delivered' ? ' delivered-card' : ''}`} key={parcel.trackingId}>
                      <div className="delivery-report-header">
                        <span className="delivery-type">{parcel.type === 'Express' ? 'Express Delivery' : 'Regular Delivery'}</span>
                        <span className="delivery-id">#{parcel.trackingId}</span>
                      </div>
                      <div className="row">                          <div className="col-md-4">
                          <div className="mb-2"><strong>Courier Information</strong></div>
                          <div className="d-flex align-items-center mb-2">
                            <div>
                              <div>{parcel.recipientName}</div>
                              <div className="text-muted small">{parcel.recipientEmail}</div>
                              <div className="text-muted small">{parcel.recipientPhone}</div>
                              <div className="text-muted small mt-2">
                                <strong>Sender:</strong> {parcel.senderEmail}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="col-md-4">
                          <div className="mb-2"><strong>Item Information</strong></div>
                          <div>Item Name: <b>{parcel.itemName || 'N/A'}</b></div>
                          <div>Item Price: <b>{parcel.price ? `₹${parcel.price}` : 'N/A'}</b></div>
                          <div>Pickup Location: <b>{parcel.pickupLocation || 'N/A'}</b></div>
                          <div>Delivery Code: <b>{parcel.trackingId}</b></div>
                          <div>Metadata: <b>{parcel.metadata}</b></div>
                        </div>
                        <div className="col-md-4">
                          <div className="mb-2"><strong>Delivery Information</strong></div>
                          <div>Location: <b>{parcel.recipientAddress}</b></div>
                          <div>Status: <span className="text-primary">{parcel.status}</span></div>
                          <div>Delivery Start: <b>{new Date(parcel.createdAt).toLocaleDateString()}</b></div>
                          <div>Expected Delivery: <b>{parcel.expectedDeliveryAt ? new Date(parcel.expectedDeliveryAt).toLocaleDateString() : 'N/A'}</b></div>
                          <div>Delivered At: <b>{parcel.deliveryAt ? new Date(parcel.deliveryAt).toLocaleDateString() : 'Not delivered yet'}</b></div>
                        </div>
                      </div>
                      <div className="delivery-report-map mt-3">
                        {mapLocations[parcel.trackingId] ? (
                          <MapContainer
                            key={parcel.trackingId + '-' + mapLocations[parcel.trackingId].lat + '-' + mapLocations[parcel.trackingId].lng}
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
                              <Popup>{parcel.currentLocation}</Popup>
                            </Marker>
                          </MapContainer>
                        ) : mapLoading[parcel.trackingId] ? (
                          <div className="map-placeholder">Loading map...</div>
                        ) : mapError[parcel.trackingId] ? (
                          <div className="map-placeholder text-danger">Map unavailable</div>
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
              </div>               {/* Details Modal */}              
               {showEditForm && selectedParcel && (
                  <div 
                    className="modal-overlay" 
                    style={{ 
                      display: 'flex', 
                      justifyContent: 'center', 
                      gap: '20px',
                      position: 'fixed',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      backgroundColor: 'rgba(0, 0, 0, 0.5)',
                      zIndex: 1000,
                      alignItems: 'center'
                    }}
                    onClick={(e) => {
                      if (e.target.className === 'modal-overlay') {
                        setShowEditForm(false);
                      }
                    }}
                  >
                    {/* Details Modal */}
                    <div className="modal-card" style={{ 
                      maxHeight: '80vh', 
                      overflowY: 'auto', 
                      width: '500px', 
                      borderRadius: '16px', 
                      boxShadow: '0 8px 32px rgba(45,91,227,0.10)', 
                      background: '#fff', 
                      padding: 0, 
                      fontFamily: 'Segoe UI, Arial, sans-serif', 
                      marginRight: '20px',
                      scrollbarWidth: 'thin',
                      scrollbarColor: '#2d5be3 transparent',
                      '&::-webkit-scrollbar': {
                        width: '6px',
                      },
                      '&::-webkit-scrollbar-track': {
                        background: 'transparent',
                      },
                      '&::-webkit-scrollbar-thumb': {
                        background: '#2d5be3',
                        borderRadius: '3px',
                      }
                    }}>
                      <div className="card-header" style={{ background: '#2d5be3', color: '#fff', borderRadius: '16px 16px 0 0', padding: '1.25rem 1.5rem', fontWeight: 700, fontSize: '1.2rem', letterSpacing: '0.5px', fontFamily: 'inherit' }}>
                        Update Parcel <code style={{ background: 'rgba(255,255,255,0.15)', borderRadius: '4px', padding: '2px 6px', fontWeight: 600, fontSize: '1rem', color: '#fff' }}>{selectedParcel.trackingId}</code>
                      </div>
                      <div className="card-body" style={{ padding: '1.5rem', fontFamily: 'inherit', color: '#222' }}>
                        <ul className="list-group mb-3" style={{ border: 'none', fontSize: '1.05rem' }}>                        <li className="list-group-item" style={{ border: 'none', padding: '0.5rem 0' }}><span style={{ fontWeight: 600, color: '#2d5be3' }}>Item Name:</span> {selectedParcel.itemName}</li>
                          <li className="list-group-item" style={{ border: 'none', padding: '0.5rem 0' }}><span style={{ fontWeight: 600, color: '#2d5be3' }}>Sender:</span> {selectedParcel.senderEmail}</li>
                          <li className="list-group-item" style={{ border: 'none', padding: '0.5rem 0' }}><span style={{ fontWeight: 600, color: '#2d5be3' }}>Recipient:</span> {selectedParcel.recipientName}</li>
                          <li className="list-group-item" style={{ border: 'none', padding: '0.5rem 0' }}><span style={{ fontWeight: 600, color: '#2d5be3' }}>Recipient Email:</span> {selectedParcel.recipientEmail}</li>
                          <li className="list-group-item" style={{ border: 'none', padding: '0.5rem 0' }}><span style={{ fontWeight: 600, color: '#2d5be3' }}>Recipient Phone:</span> {selectedParcel.recipientPhone}</li>
                          <li className="list-group-item" style={{ border: 'none', padding: '0.5rem 0' }}><span style={{ fontWeight: 600, color: '#2d5be3' }}>Pickup Location:</span> {selectedParcel.pickupLocation}</li>
                          <li className="list-group-item" style={{ border: 'none', padding: '0.5rem 0' }}><span style={{ fontWeight: 600, color: '#2d5be3' }}>Current Location:</span> {selectedParcel.currentLocation}</li>
                          <li className="list-group-item" style={{ border: 'none', padding: '0.5rem 0' }}><span style={{ fontWeight: 600, color: '#2d5be3' }}>Delivery address:</span> {selectedParcel.recipientAddress}</li>
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
                          <li className="list-group-item" style={{ border: 'none', padding: '0.5rem 0' }}><span style={{ fontWeight: 600, color: '#2d5be3' }}>Price:</span> {selectedParcel.price ? `₹${selectedParcel.price}` : 'N/A'}</li>
                          <li className="list-group-item" style={{ border: 'none', padding: '0.5rem 0' }}><span style={{ fontWeight: 600, color: '#2d5be3' }}>Expected Delivery:</span> {selectedParcel.expectedDeliveryAt ? new Date(selectedParcel.expectedDeliveryAt).toLocaleString() : 'N/A'}</li>
                          <li className="list-group-item" style={{ border: 'none', padding: '0.5rem 0' }}><span style={{ fontWeight: 600, color: '#2d5be3' }}>Delivered At:</span> {selectedParcel.deliveryAt ? new Date(selectedParcel.deliveryAt).toLocaleString() : 'Not delivered yet'}</li>
                          <li className="list-group-item" style={{ border: 'none', padding: '0.5rem 0' }}><span style={{ fontWeight: 600, color: '#2d5be3' }}>Pickup Location:</span> {selectedParcel.pickupLocation || 'N/A'}</li>
                        </ul>     
                        <button className="btn btn-secondary" style={{ borderRadius: '6px', fontWeight: 500, fontFamily: 'inherit', background: '#f0f4ff', color: '#2d5be3', border: 'none' }} onClick={() => setShowEditForm(false)}>Close</button>                 
                
                      </div>
                    </div>
  
                    {/* QR Code Modal */}
                    <div className="modal-card" style={{ height: 'fit-content', width: '400px', borderRadius: '16px', boxShadow: '0 8px 32px rgba(45,91,227,0.10)', background: '#fff', padding: 0, fontFamily: 'Segoe UI, Arial, sans-serif' }}>
                      <div className="card-header" style={{ background: '#2d5be3', color: '#fff', borderRadius: '16px 16px 0 0', padding: '1.25rem 1.5rem', fontWeight: 700, fontSize: '1.2rem', letterSpacing: '0.5px', fontFamily: 'inherit' }}>
                        QR Code
                      </div>
                      <div className="card-body" style={{ padding: '1.5rem', fontFamily: 'inherit', color: '#222', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        
                        <QRCodeCanvas value={`http://localhost:3000/parcel/${selectedParcel.trackingId}`} size={200} />
                        <div style={{ marginTop: '15px', color: '#666' }}>
                          <small>Tracking ID: <code style={{ color: '#2d5be3', fontWeight: 600 }}>{selectedParcel.trackingId}</code></small>
                        </div>
                      </div>
                    </div>
                  </div>
              )}
            </>
          )}
          {activePage === 'track' && <TrackParcelPage />}
          {activePage === 'tamperlogs' && <AdminTamperLogs />}
          {activePage === 'deliverydata' && (
            <div className="delivery-data-tab">
              <h2 className="mb-4">Delivery Data</h2>
              <div className="row">
                <div className="col-md-6 mb-4">
                  <div className="card" style={{ height: '340px', padding: '1.5rem', borderRadius: '16px', boxShadow: '0 4px 16px rgba(45,91,227,0.07)' }}>
                    <h5 className="mb-3">Parcel Status Distribution</h5>
                    <div style={{ height: '250px' }}>
                      <Pie data={pieData} options={pieOptions} />
                    </div>
                  </div>
                </div>
                <div className="col-md-6 mb-4">
                  <div className="card" style={{ height: '340px', padding: '1.5rem', borderRadius: '16px', boxShadow: '0 4px 16px rgba(45,91,227,0.07)' }}>
                    <h5 className="mb-3">Parcels Created (Last 7 Days)</h5>
                    <div style={{ height: '250px' }}>
                      <Bar data={barData} options={barOptions} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
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
                              <button
                                className="btn btn-sm btn-primary"
                                onClick={() => generateInvoice(parcel)}
                              >
                                Download Invoice
                              </button>

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

export default AdminDashboard;
