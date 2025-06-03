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
        <form onSubmit={handleTrackParcel} className="mb-3">
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
          <div className="alert alert-success">
            <h5>Parcel Found:</h5>
            <ul className="list-group">
              <li className="list-group-item"><strong>Item Name:</strong> {searchedParcel.itemName}</li>
              <li className="list-group-item"><strong>Recipient:</strong> {searchedParcel.recipientName}</li>
              <li className="list-group-item"><strong>Address:</strong> {searchedParcel.recipientAddress}</li>
              <li className="list-group-item"><strong>Weight:</strong> {searchedParcel.weight} kg</li>
              <li className="list-group-item"><strong>Type:</strong> {searchedParcel.type}</li>
              <li className="list-group-item"><strong>Metadata:</strong> {searchedParcel.metadata || 'N/A'}</li>
              <li className="list-group-item"><strong>Status:</strong> {searchedParcel.status}</li>
              <li className="list-group-item"><strong>Created At:</strong> {new Date(searchedParcel.createdAt).toLocaleString()}</li>
              {searchedParcel.updatedAt && (
                <li className="list-group-item"><strong>Updated At:</strong> {new Date(searchedParcel.updatedAt).toLocaleString()}</li>
              )}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

export default TrackParcelPage;
