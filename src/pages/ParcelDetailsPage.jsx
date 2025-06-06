import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';

const ParcelDetailsPage = () => {
  const { trackingId } = useParams();
  const navigate = useNavigate();
  const [parcel, setParcel] = useState(null);
  const [status, setStatus] = useState('');
  const [metadata, setMetadata] = useState('');
  const [currentLocation, setCurrentLocation] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userRole, setUserRole] = useState(null);

  const styles = {
    timelineCard: {
      backgroundColor: '#f8f9fa',
      borderRadius: '8px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
      height: '100%',
      maxHeight: '80vh',
      overflowY: 'auto'
    },
    timelineStep: {
      marginBottom: '1.5rem',
      paddingLeft: '1.5rem',
      borderLeft: '2px solid #dee2e6',
      position: 'relative'
    },
    timelineCircle: {
      width: '12px',
      height: '12px',
      borderRadius: '50%',
      position: 'absolute',
      left: '-7px',
      top: '4px'
    }
  };
  useEffect(() => {
    if (!localStorage.getItem('token')) {
      navigate('/login');
      return;
    }

    axiosInstance.get(`/api/parcel/update/${trackingId}`)
      .then(res => {
        setParcel(res.data);
        setStatus(res.data.status);
        setMetadata(res.data.metadata || '');
        setCurrentLocation(res.data.currentLocation || '');
        setLoading(false);
        setError('');
      })
      .catch(err => {
        console.error('Parcel fetch failed', err);
        if (err.response?.status === 401) {
          navigate('/login');
        } else {
          setError(err?.response?.data?.message || err.message || 'Unknown error');
        }
        setLoading(false);
      });
  }, [trackingId]);

  useEffect(() => {
    // Get user role from token
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const tokenParts = token.split('.');
        const payload = JSON.parse(atob(tokenParts[1]));
        setUserRole(payload.role?.toLowerCase());
      } catch (error) {
        console.error('Error parsing token:', error);
      }
    }
  }, []);

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
      alert(
        err.message.includes("Unexpected token")
          ? "Server error or CORS issue. Please check your backend and network."
          : err.message
      );
      return null;
    }
  };
  const handleStatusUpdate = async () => {
    if (userRole !== 'handler') {
      alert('Only handlers can update parcel status.');
      return;
    }

    if (status === 'Delivered') {
      const res = await sendOtp(trackingId);
      if (res) {
        navigate(`/enter-otp?trackingId=${trackingId}&action=deliver`);
      }
      return;
    }

    axiosInstance.put(`/api/parcel/update/${trackingId}`, { status, metadata, currentLocation })
      .then(() => alert('Status updated!'))
      .catch(err => {
        console.error('Update failed:', err);
        alert(err.response?.data?.message || 'Update failed');
      });
  };

  if (loading) return <p>Loading parcel...</p>;
  if (error) return <div className="alert alert-danger">Error: {error}</div>;
  if (!parcel) return <p>Parcel not found.</p>;

  return (
    <div className="container mt-5" style={{ background: '#fff', color: '#222', borderRadius: '12px', padding: '2rem' }}>
      <h2>Parcel Details</h2>
      <div className="row">
        <div className="col-md-7">
          <p><strong>Tracking ID:</strong> {parcel.trackingId}</p>
          <p><strong>Item Name:</strong> {parcel.itemName}</p>
          <p><strong>Sender:</strong> {parcel.senderEmail}</p>
          <p><strong>Recipient:</strong> {parcel.recipientName}</p>
          <p><strong>Recipient Email:</strong> {parcel.recipientEmail}</p>
          <p><strong>Recipient Phone:</strong> {parcel.recipientPhone}</p>
          <p><strong>Address:</strong> {parcel.recipientAddress}</p>
          <p><strong>Type:</strong> {parcel.type}</p>
          <p><strong>Weight:</strong> {parcel.weight}</p>
          <p><strong>Price:</strong> {parcel.price ? `₹${parcel.price}` : 'N/A'}</p>
          <p><strong>Expected Delivery At:</strong> {parcel.expectedDeliveryAt ? new Date(parcel.expectedDeliveryAt).toLocaleString() : 'N/A'}</p>
          <p><strong>Delivered At:</strong> {parcel.deliveryAt ? new Date(parcel.deliveryAt).toLocaleString() : 'Not delivered yet'}</p>          <p><strong>Status:</strong> <span className="badge bg-info text-dark">{parcel.status}</span></p>
          <p><strong>Current Location:</strong> {parcel.currentLocation || 'N/A'}</p>
          
          {userRole === 'handler' ? (
            <>
              <select value={status} onChange={e => setStatus(e.target.value)} className="form-select w-75">
                <option value="Created">Created</option>
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
              <div className="mb-3 mt-2">
                <label>Metadata (optional):</label>
                <input
                  type="text"
                  value={metadata}
                  onChange={e => setMetadata(e.target.value)}
                  className="form-control w-75"
                />
              </div>
              <div className="mb-3 mt-2">
                <label>Current Location:</label>
                <input
                  type="text"
                  value={currentLocation}
                  onChange={e => setCurrentLocation(e.target.value)}
                  className="form-control w-75"
                />
              </div>
              <button className="btn btn-primary mt-3" onClick={handleStatusUpdate}>Update Status</button>
            </>
          ) : (
            <div className="alert alert-info mt-3">
              Only handlers can update the status of parcels.
            </div>
          )}
          <div className="mb-3 text-center">
            <div className="mt-2"><small>Tracking ID: <code>{parcel.trackingId}</code></small></div>
          </div>
        </div>
        <div className="col-md-5">
          <div className="p-3" style={styles.timelineCard}>
            <h5 className="mb-3">Parcel Tracking History</h5>
            {parcel.history && parcel.history.length > 0 ? (              <div className="timeline">
                {[
                  ...(parcel.status === "delivered"
                    ? [
                        {
                          status: "Delivered",
                          location: parcel.recipientAddress,
                          timestamp: parcel.updatedAt,
                          isDeliveredNode: true,
                        },
                      ]
                    : []),
                  ...[...parcel.history].reverse(),
                ].map((entry, idx) => (
                  <div key={idx} style={styles.timelineStep}>
                    <div
                      style={{
                        ...styles.timelineCircle,
                        backgroundColor: entry.isDeliveredNode ? '#28a745' : '#007bff'
                      }}
                    ></div>
                    <h6 className="fw-bold mb-1">{entry.status}</h6>
                    <div className="text-muted">{entry.location}</div>
                    <div className="small text-secondary">{new Date(entry.timestamp).toLocaleString()}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-muted">No history found.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ParcelDetailsPage;
