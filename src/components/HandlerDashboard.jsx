import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { QRCodeCanvas } from 'qrcode.react';
import { fetchParcels, updateParcelStatus, trackParcelById } from '../api/handlerApi';
import { logout } from '../api/auth';
import './HandlerDashboard.css';
import TrackParcelPage from '../pages/TrackParcelPage';
import L from 'leaflet';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: markerIcon2x,
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
});

function HandlerDashboard() {
 
  const [showEditForm, setShowEditForm] = useState(false);
  const [selectedParcel, setSelectedParcel] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [metadata, setMetadata] = useState('');
  const [currentLocation, setCurrentLocation] = useState('');
  const [parcels, setParcels] = useState([]);
  const [dashboardSearch, setDashboardSearch] = useState("");
  const [mapLocations, setMapLocations] = useState({});
  const [mapLoading, setMapLoading] = useState({});
  const [mapError, setMapError] = useState({});
  const navigate = useNavigate();
  const [activePage, setActivePage] = useState('dashboard');
  const [activeTab, setActiveTab] = useState('all');
  const [searchUpdateId, setSearchUpdateId] = useState('');
  const [searchedUpdateParcel, setSearchedUpdateParcel] = useState(null);
  const [searchUpdateError, setSearchUpdateError] = useState('');
  const [otpModalOpen, setOtpModalOpen] = useState(false);
  const [pendingParcel, setPendingParcel] = useState(null);
  const [pendingStatus, setPendingStatus] = useState('');
  const [pendingMetadata, setPendingMetadata] = useState('');

  
  const sendOtp = async (trackingId) => {
  try {
    const response = await fetch("http://localhost:8080/parceltrack/send-otp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ trackingId }),
    });
    const contentType = response.headers.get("content-type");
    let data;
    if (contentType && contentType.includes("application/json")) {
      data = await response.json();
    } else {
      // Try to get text (HTML error page or other)
      const text = await response.text();
      throw new Error(
        `Unexpected response from server. Please try again.\n${text.substring(0, 200)}`
      );
    }
    if (!response.ok) {
      throw new Error(data.error || "Failed to send OTP");
    }
    return data;
  } catch (err) {
    // Show a user-friendly error
    alert(
      err.message.includes("Unexpected token")
        ? "Server error or CORS issue. Please check your backend and network."
        : err.message
    );
    return null;
  }
};
 

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
    if (activeTab !== 'all') {
      tabMatch = (parcel.status || '').toLowerCase() === activeTab.toLowerCase();
    }
    // Search filter (tracking ID, case-insensitive, partial)
    let searchMatch = true;
    if (dashboardSearch.trim() !== "") {
      searchMatch = parcel.trackingId.toLowerCase().includes(dashboardSearch.trim().toLowerCase());
    }
    return tabMatch && searchMatch;
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) navigate('/');
  }, [navigate]);

  useEffect(() => {
    window.history.pushState(null, null, window.location.href);
    window.onpopstate = () => { window.history.go(1); };
  }, []);

  const loadParcels = async (highlightedId = null) => {
    try {
      const data = await fetchParcels();
      if (highlightedId) {
        // Move the updated parcel to the top
        const idx = data.findIndex(p => p.trackingId === highlightedId);
        if (idx !== -1) {
          const [updated] = data.splice(idx, 1);
          setParcels([updated, ...data]);
          return;
        }
      }
      setParcels(data);
    } catch (err) {
      console.error('Error fetching parcels:', err);
    }
  };

  useEffect(() => { loadParcels(); }, []);

  // Geocode helper (same as admin)
    const geocodeAddress = async (address) => {
    if (!address || typeof address !== 'string' || !address.trim()) {
      throw new Error('No address');
    }

    const apiKey = ''; // 
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

  useEffect(() => {
    filteredParcels.forEach(parcel => {
      if (!mapLocations[parcel.trackingId] && !mapLoading[parcel.trackingId] && !mapError[parcel.trackingId]) {
        setMapLoading(prev => ({ ...prev, [parcel.trackingId]: true }));
        const addressToGeocode = parcel.currentLocation || parcel.recipientAddress;
        geocodeAddress(addressToGeocode)
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

  const handleEditClick = (parcel) => {
    setSelectedParcel(parcel);
    setNewStatus(parcel.status);
    setCurrentLocation(parcel.currentLocation);
    setMetadata(parcel.metadata || '');
    setShowEditForm(true);
  };

  const handleUpdateStatus = async () => {
    if (!newStatus.trim()) return;
    if (newStatus.toLowerCase() === 'delivered') {
      setPendingParcel(selectedParcel);
      setPendingStatus(newStatus);
      setPendingMetadata(metadata || selectedParcel.metadata);
      setCurrentLocation(selectedParcel.recipientAddress);
      setOtpModalOpen(true);
      return;
    }
    try {
      const finalLocation= newStatus.toLowerCase() === 'delivered' ? selectedParcel.recipientAddress : currentLocation;
      await updateParcelStatus(selectedParcel.trackingId, newStatus, finalLocation, metadata || selectedParcel.metadata);
      setShowEditForm(false);
      setSelectedParcel(null);
      setNewStatus('');
      await loadParcels(selectedParcel.trackingId); // Pass updated ID
    } catch (error) {
      alert('Failed to update parcel.');
    }
  };

  const handleSidebarNav = (page) => {
    setActivePage(page);
  };

  const handleUpdateSearch = async (e) => {
    e.preventDefault();
    setSearchUpdateError('');
    setSearchedUpdateParcel(null);
    if (!searchUpdateId.trim()) {
      setSearchUpdateError('Please enter a tracking ID.');
      return;
    }    try {
      const data = await trackParcelById(searchUpdateId.trim());
      setSearchedUpdateParcel(data);
      setNewStatus(data.status);
      setMetadata(data.metadata || '');
      setCurrentLocation(data.currentLocation || '');
    } catch (err) {
      const msg = err.response?.data?.message || 'Parcel not found.';
      setSearchUpdateError(msg);
    }
  };

  const handleUpdateInPage = async () => {
    if (!newStatus.trim() || !searchedUpdateParcel) return;
    if (newStatus.toLowerCase() === 'delivered') {
      setPendingParcel(searchedUpdateParcel);
      setPendingStatus(newStatus);
      setCurrentLocation(searchedUpdateParcel.recipientAddress);
      setPendingMetadata(metadata || searchedUpdateParcel.metadata);
      setOtpModalOpen(true);
      return;
    }
    try {
      const finalLocation = newStatus.toLowerCase() === 'delivered'
      ? searchedUpdateParcel.recipientAddress
      : currentLocation;
      await updateParcelStatus(
        searchedUpdateParcel.trackingId,
        newStatus,
        finalLocation,
        metadata || searchedUpdateParcel.metadata
      );
      const updatedData = await trackParcelById(searchedUpdateParcel.trackingId);
      setSearchedUpdateParcel(updatedData);
      await loadParcels(searchedUpdateParcel.trackingId); // Pass updated ID
      // Invalidate map location for this parcel so it is re-geocoded
      setMapLocations(prev => {
        const newMap = { ...prev };
        delete newMap[searchedUpdateParcel.trackingId];
        return newMap;
      });
      setMapError(prev => {
        const newErr = { ...prev };
        delete newErr[searchedUpdateParcel.trackingId];
        return newErr;
      });
      setMapLoading(prev => ({ ...prev, [searchedUpdateParcel.trackingId]: false }));
      alert('Parcel updated successfully!');
    } catch (error) {
      alert('Failed to update parcel.');
    }
  };

  // SingleMap component for rendering a single map instance
const SingleMap = ({ coords, address }) => {
  const { lat, lng } = coords;
  return (
    <MapContainer
      center={[lat, lng]}
      zoom={13}
      style={{ height: '120px', width: '100%', borderRadius: '8px' }}
      scrollWheelZoom={false}
      dragging={false}
      doubleClickZoom={false}
      zoomControl={false}
      attributionControl={false}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <Marker position={[lat, lng]}>
        <Popup>{address}</Popup>
      </Marker>
    </MapContainer>
  );
};

   useEffect(() => {
  const triggerOtp = async () => {
    if (otpModalOpen && pendingParcel) {
      const res = await sendOtp(pendingParcel.trackingId);
      if (res) {
        navigate(`/enter-otp?trackingId=${pendingParcel.trackingId}&action=deliver`);
        setOtpModalOpen(false);
        setShowEditForm(false);
      }
    }
  };
  triggerOtp();
}, [otpModalOpen, pendingParcel, navigate]);

  return (
    <div className="admin-dashboard-layout">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="sidebar-header">
          <span className="sidebar-logo">ShipWise</span>
        </div>
        <nav className="sidebar-nav">
          <ul>
            <li className={activePage === 'dashboard' ? 'active' : ''} onClick={() => handleSidebarNav('dashboard')}>Handler Dashboard</li>
            <li className={activePage === 'updateparcel' ? 'active' : ''} onClick={() => handleSidebarNav('updateparcel')}>Update Parcel</li>
            <li className={activePage === 'track' ? 'active' : ''} onClick={() => handleSidebarNav('track')}>Track Parcel</li>
            
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
        <div className="admin-header" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          
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
                style={{ flex: 1, minWidth: 0 }}
              />
              <div className="admin-breadcrumb mb-2">Home &gt; Handler &gt; Parcels</div>
              <h2 className="mb-4">Handler Parcels</h2>
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
                      <div className="row">
                        <div className="col-md-4">
                          <div className="mb-2"><strong>Courier Information</strong></div>
                          <div className="d-flex align-items-center mb-2">
                            <div>
                              <div>{parcel.recipientName}</div>
                              <div className="text-muted small">{parcel.recipientEmail}</div>
                              <div className="text-muted small">{parcel.recipientPhone}</div>
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
                        {mapLocations[parcel.trackingId] && !mapError[parcel.trackingId] ? (
                          <SingleMap
                            key={parcel.trackingId}
                            coords={mapLocations[parcel.trackingId]}
                            address={parcel.currentLocation || 'Unknown Location'}
                          />
                        ) : mapLoading[parcel.trackingId] ? (
                          <div className="map-placeholder">Loading map...</div>
                        ) : (
                          <div className="map-placeholder text-danger">Map unavailable</div>
                        )}
                      </div>
                      <div className="d-flex justify-content-end mt-2">
                        <button className="btn btn-sm btn-warning" onClick={() => handleEditClick(parcel)}>Details</button>
                      </div>
                    </div>  
                  ))
                ) : (
                  <div className="alert alert-info">No parcels found for this filter.</div>
                )}
              </div>
              {/* Details Modal */}
              {showEditForm && selectedParcel && (
                <div className="modal-overlay">
                  <div className="modal-card" style={{ maxHeight: '80vh', overflowY: 'auto', width: '500px', margin: '0 auto', borderRadius: '16px', boxShadow: '0 8px 32px rgba(45,91,227,0.10)', background: '#fff', padding: 0, fontFamily: 'Segoe UI, Arial, sans-serif' }}>
                    <div className="card-header" style={{ background: '#2d5be3', color: '#fff', borderRadius: '16px 16px 0 0', padding: '1.25rem 1.5rem', fontWeight: 700, fontSize: '1.2rem', letterSpacing: '0.5px', fontFamily: 'inherit' }}>
                      Update Parcel <code style={{ background: 'rgba(255,255,255,0.15)', borderRadius: '4px', padding: '2px 6px', fontWeight: 600, fontSize: '1rem', color: '#fff' }}>{selectedParcel.trackingId}</code>
                    </div>
                    <div className="card-body" style={{ padding: '1.5rem', fontFamily: 'inherit', color: '#222' }}>
                      <ul className="list-group mb-3" style={{ border: 'none', fontSize: '1.05rem' }}>
                        <li className="list-group-item" style={{ border: 'none', padding: '0.5rem 0' }}><span style={{ fontWeight: 600, color: '#2d5be3' }}>Item Name:</span> {selectedParcel.itemName}</li>
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
                      <div className="mb-4 text-center">
                        <QRCodeCanvas value={`http://localhost:3000/parcel/${selectedParcel.trackingId}`} size={160} />
                        <div className="mt-2"><small style={{ color: '#888', fontFamily: 'inherit' }}>Tracking ID: <code style={{ color: '#2d5be3', fontWeight: 600 }}>{selectedParcel.trackingId}</code></small></div>
                      </div>
                      <div className="mb-3">
                        <label className="form-label"><strong>Update Status</strong></label>
                        <select
                          className="form-select"
                          value={newStatus}
                          onChange={(e) => setNewStatus(e.target.value)}
                      >
                          <option value="">-- Select Status --</option>
                          <option value="Pending">Processing</option>
                          <option value="Ready for shipment">Ready for shipment</option>
                          <option value="Shipped">Shipped</option>
                          <option value="In transit">In transit</option>
                          <option value="Out for delivery">Out for delivery</option>
                          <option value="On hold">On hold</option>
                          <option value="At local facility">At local facility</option>
                          <option value="Delivered">Delivered</option>
                          <option value="Canceled">Canceled</option>
                          <option value="Returned">Returned</option>
                        </select>
                      </div>
                      <label>Current Location:</label>
                      <input
                        type="text"
                        value={currentLocation}
                        onChange={(e) => setCurrentLocation(e.target.value)}
                        className="form-control w-50 mb-3"
                        placeholder="Enter current location"
                        required
                      />
                      <label>Metadata (optional):</label>
                      <input
                        type="text"
                        value={metadata}
                        onChange={(e) => setMetadata(e.target.value)}
                        className="form-control w-50 mb-3"
                      />
                      <div className="d-flex justify-content-end">
                        <button className="btn btn-success me-2" onClick={handleUpdateStatus}>Update</button>
                        <button className="btn btn-secondary" style={{ borderRadius: '6px', fontWeight: 500, fontFamily: 'inherit', background: '#f0f4ff', color: '#2d5be3', border: 'none' }} onClick={() => setShowEditForm(false)}>Cancel</button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {activePage === 'updateparcel' && (
            <div className="container mt-4">
              <div className="admin-breadcrumb mb-2">Home &gt; Handler &gt; Update Parcel</div>
              <h2 className="mb-4">Update Parcel Status</h2>
              <div className="card shadow p-4">
                <form onSubmit={handleUpdateSearch} className="mb-4">
                  <div className="mb-3">
                    <label className="form-label">Enter Tracking ID:</label>
                    <div className="input-group">
                      <input
                        type="text"
                        className="form-control"
                        value={searchUpdateId}
                        onChange={(e) => setSearchUpdateId(e.target.value)}
                        placeholder="Enter tracking ID to update"
                      />
                      <button type="submit" className="btn btn-primary">Search</button>
                    </div>
                  </div>
                </form>

                {searchUpdateError && <div className="alert alert-danger">{searchUpdateError}</div>}

                {searchedUpdateParcel && (
                  <div className="mt-4">
                    <div className="card">
                      <div className="card-body">
                        <h5 className="card-title mb-4">Parcel Details</h5>
                        <div className="row mb-4">
                          <div className="col-md-6">
                            <p><strong>Tracking ID:</strong> {searchedUpdateParcel.trackingId}</p>
                            <p><strong>Item Name:</strong> {searchedUpdateParcel.itemName}</p>
                            <p><strong>Recipient:</strong> {searchedUpdateParcel.recipientName}</p>
                            <p><strong>Recipient Email:</strong> {searchedUpdateParcel.recipientEmail}</p>
                            <p><strong>Recipient Phone:</strong> {searchedUpdateParcel.recipientPhone}</p>                            <p><strong>Pickup Location:</strong> {searchedUpdateParcel.pickupLocation}</p>
                            <p><strong>Address:</strong> {searchedUpdateParcel.recipientAddress}</p>
                            <p><strong>Current Location:</strong> {searchedUpdateParcel.currentLocation}</p>
                            <p><strong>Type:</strong> {searchedUpdateParcel.type}</p>
                            <p><strong>Price:</strong> {searchedUpdateParcel.price ? `₹${searchedUpdateParcel.price}` : 'N/A'}</p>
                            <p><strong>Expected Delivery:</strong> {searchedUpdateParcel.expectedDeliveryAt ? new Date(searchedUpdateParcel.expectedDeliveryAt).toLocaleString() : 'N/A'}</p>
                            <p><strong>Delivered At:</strong> {searchedUpdateParcel.deliveryAt ? new Date(searchedUpdateParcel.deliveryAt).toLocaleString() : 'Not delivered yet'}</p>
                          </div>                          <div className="col-md-6">                            <p><strong>Weight:</strong> {searchedUpdateParcel.weight} kg</p>
                            <p><strong>Created:</strong> {new Date(searchedUpdateParcel.createdAt).toLocaleString()}</p>
                            <p><strong>Current Status:</strong> <span className="badge bg-info text-dark">{searchedUpdateParcel.status}</span></p>
                            <p><strong>Pickup Location:</strong> {searchedUpdateParcel.pickupLocation || 'N/A'}</p>
                              {/* QR Code display */}
                            <div className="text-center" style={{ marginLeft: -405, marginTop: 110 }}>
                              <QRCodeCanvas value={`http://localhost:3000/parcel/${searchedUpdateParcel.trackingId}`} size={170} />
                              <div style={{ color: '#2d5be3', fontWeight: 600, marginTop: 8 }}>Tracking ID: <code>{searchedUpdateParcel.trackingId}</code></div>
                            </div>
                          </div>
                        </div>

                        <div className="update-form mt-4">
                          <h6 className="mb-3">Update Status</h6>
                          <div className="mb-3">
                            <label className="form-label">New Status:</label>
                            <select
                              className="form-select"
                              value={newStatus}
                              onChange={(e) => setNewStatus(e.target.value)}
                            >
                              <option value="">-- Select Status --</option>
                              <option value="Pending">Processing</option>
                              <option value="Ready for shipment">Ready for shipment</option>
                              <option value="Shipped">Shipped</option>
                              <option value="In transit">In transit</option>
                              <option value="Out for delivery">Out for delivery</option>
                              <option value="On hold">On hold</option>
                              <option value="At local facility">At local facility</option>
                              <option value="Delivered">Delivered</option>
                              <option value="Canceled">Canceled</option>
                              <option value="Returned">Returned</option>
                            </select>
                          </div>                          <div className="mb-3">
                            <label className="form-label">Current Location</label>
                            <input
                              type="text"
                              className="form-control"
                              value={currentLocation}
                              onChange={(e) => setCurrentLocation(e.target.value)}
                              placeholder="Current location of the parcel"
                              required
                            />
                          </div>
                          
                          <div className="mb-3">
                            <label className="form-label">Metadata (optional):</label>
                            <input
                              type="text"
                              className="form-control"
                              value={metadata}
                              onChange={(e) => setMetadata(e.target.value)}
                              placeholder="Additional information"
                            />
                          </div>
                          <button className="btn btn-success" onClick={handleUpdateInPage}>Update Parcel</button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {activePage === 'track' && <TrackParcelPage />}
        </div> 
      </main>
    </div>
  );
}

export default HandlerDashboard;
