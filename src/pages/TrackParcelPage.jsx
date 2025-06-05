import React, { useState } from 'react';
import { trackParcelById } from '../api/handlerApi';

function TrackParcelPage() {
  const [searchTrackingId, setSearchTrackingId] = useState('');
  const [searchedParcel, setSearchedParcel] = useState(null);
  const [searchError, setSearchError] = useState('');

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

  return (
    <div className="container mt-5">
      <div className="card shadow p-4">
        <h2 className="mb-4">Track Parcel</h2>
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

            {/* Right: Tracking Timeline */}
            <div className="col-md-6">
              <div className="p-3">
                <h5 className="mb-3">Parcel Tracking History</h5>
                {searchedParcel.history && searchedParcel.history.length > 0 ? (
                  <div className="timeline position-relative">
                    {searchedParcel.history.map((entry, idx) => (
                      <div key={idx} className="timeline-step mb-4 position-relative ps-4 border-start border-2">
                        <div className="circle bg-primary position-absolute top-0 start-0 translate-middle rounded-circle" style={{ width: '15px', height: '15px', left: '-8px' }}></div>
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
