import React, { useState, useEffect } from 'react';
import { trackParcelById } from '../api/handlerApi';
import axiosInstance from '../api/axiosInstance';

function TrackParcelPage() {
  const [searchTrackingId, setSearchTrackingId] = useState('');
  const [searchedParcel, setSearchedParcel] = useState(null);
  const [searchError, setSearchError] = useState('');
  const [userRole, setUserRole] = useState(null);
  const [userEmail, setUserEmail] = useState(null);
  useEffect(() => {
    // Get user role from token
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const tokenParts = token.split('.');
        const payload = JSON.parse(atob(tokenParts[1]));
        console.log('Token payload:', payload); // Debug log
        setUserRole(payload.role?.toLowerCase());
        // Check both possible email fields
        setUserEmail(payload.email || payload.sub);
      } catch (error) {
        console.error('Error parsing token:', error);
      }
    }
  }, []);  const handleTrackParcel = async (e) => {
    e.preventDefault();
    setSearchError('');
    setSearchedParcel(null);
    
    if (!searchTrackingId.trim()) {
      setSearchError('Please enter a tracking ID.');
      return;
    }

    try {
      const data = await trackParcelById(searchTrackingId.trim());
      
      console.log('Parcel data:', data); // Debug log
      console.log('User role:', userRole); // Debug log
      console.log('User email:', userEmail); // Debug log
      console.log('Sender email:', data.senderEmail); // Debug log
      
      // If user is a sender, check if the parcel belongs to them
      if (userRole === 'sender') {
        const senderEmailMatches = data.senderEmail && 
          (data.senderEmail.toLowerCase() === userEmail?.toLowerCase());
        
        if (!senderEmailMatches) {
          setSearchError('You do not have permission to track this parcel.');
          return;
        }
      }
      
      setSearchedParcel(data);
    } catch (err) {
      console.error('Track parcel error:', err); // Debug log
      const msg = err.response?.data?.message || 'Parcel not found.';
      setSearchError(msg);
    }
  };

  return (    
  <div className="container mt-5">
    <div className="admin-breadcrumb mb-2">Home &gt; {userRole} &gt; Track Parcel</div>
      <div className="card shadow p-4">
        <h2 className="mb-4">Track Parcel</h2>
        {userRole === 'sender' && (
          <div className="alert alert-info mb-3">
            Note: As a sender, you can only track parcels that you have sent.
          </div>
        )}
        <form onSubmit={handleTrackParcel} className="mb-4">
          <div className="input-group">
            <input
              type="text"
              className="form-control"
              placeholder="Enter Tracking ID"
              value={searchTrackingId}
              onChange={(e) => setSearchTrackingId(e.target.value)}
            />
            <button type="submit" className="btn btn-primary">Track</button>
          </div>
        </form>

        {searchError && <div className="alert alert-danger">{searchError}</div>}

        {searchedParcel && (
          <div className="row">
            {/* Left: Parcel Info */}
            <div className="col-md-6">
              <div className="alert alert-success">
                <h5>Parcel Found:</h5>
                <ul className="list-group mb-3">
                  <li className="list-group-item"><strong>Item Name:</strong> {searchedParcel.itemName}</li>
                  <li className="list-group-item"><strong>Current Location:</strong> {searchedParcel.currentLocation}</li>
                  <li className="list-group-item"><strong>Pickup Location:</strong> {searchedParcel.pickupLocation}</li>
                  <li className="list-group-item"><strong>Delivery Location:</strong> {searchedParcel.recipientAddress}</li>
                  <li className="list-group-item"><strong>Recipient:</strong> {searchedParcel.recipientName}</li>
                  <li className="list-group-item"><strong>Email:</strong> {searchedParcel.recipientEmail}</li>
                  <li className="list-group-item"><strong>Phone:</strong> {searchedParcel.recipientPhone}</li>
                  <li className="list-group-item"><strong>Weight:</strong> {searchedParcel.weight} kg</li>
                  <li className="list-group-item"><strong>Revenue:</strong> {searchedParcel.price} Rs</li>
                  <li className="list-group-item"><strong>Type:</strong> {searchedParcel.type}</li>
                  <li className="list-group-item"><strong>Metadata:</strong> {searchedParcel.metadata || 'N/A'}</li>
                  <li className="list-group-item"><strong>Status:</strong> {searchedParcel.status}</li>
                  <li className="list-group-item"><strong>Created At:</strong> {new Date(searchedParcel.createdAt).toLocaleString()}</li>
                  <li className="list-group-item"><strong>Expected Delivery At:</strong> {searchedParcel.expectedDeliveryAt ? new Date(searchedParcel.expectedDeliveryAt).toLocaleString() : 'N/A'}</li>
                  <li className="list-group-item"><strong>Delivered At:</strong> {searchedParcel.deliveryAt ? new Date(searchedParcel.deliveryAt).toLocaleString() : 'Not delivered yet'}</li>
                </ul>
              </div>
            </div>
            
            <div className="col-md-6">
              <div className="p-3">
                <h5 className="mb-3">Parcel Tracking History</h5>
                {searchedParcel.history && searchedParcel.history.length > 0 ? (
                  <div className="timeline position-relative">
                    {[
                      ...(searchedParcel.status === "delivered"
                        ? [
                            {
                              status: "Delivered",
                              location: searchedParcel.recipientAddress,
                              timestamp: searchedParcel.updatedAt,
                              isDeliveredNode: true,
                            },
                          ]
                        : []),
                      ...[...searchedParcel.history].reverse(),
                    ].map((entry, idx) => (
                      <div key={idx} className="timeline-step mb-4 position-relative ps-4 border-start border-2">
                        <div
                          className={`circle ${entry.isDeliveredNode ? "bg-success" : "bg-primary"} position-absolute top-0 start-0 translate-middle rounded-circle`}
                          style={{ width: '15px', height: '15px', left: '-8px' }}
                        ></div>
                        <h6 className="fw-bold mb-1">{entry.status}</h6>
                        <div className="text-muted">{entry.location}</div>
                        <div className="small">{new Date(entry.timestamp).toLocaleString()}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-muted">No history found.</div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default TrackParcelPage;
