import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';

const ParcelDetailsPage = () => {
  const { trackingId } = useParams();
  const [parcel, setParcel] = useState(null);
  const [status, setStatus] = useState('');
  const [metadata, setMetadata] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    axiosInstance.get(`/api/parcel/update/${trackingId}`)
      .then(res => {
        setParcel(res.data);
        setStatus(res.data.status);
        setMetadata(res.data.metadata || '');
        setLoading(false);
        setError('');
      })
      .catch(err => {
        console.error('Parcel fetch failed', err);
        setError(err?.response?.data?.message || err.message || 'Unknown error');
        setLoading(false);
      });
  }, [trackingId]);

  const handleStatusUpdate = () => {
    axiosInstance.put(`/api/parcel/update/${trackingId}`, { status, metadata })
      .then(() => alert('Status updated!'))
      .catch(err => alert('Update failed'));
  };

  if (loading) return <p>Loading parcel...</p>;
  if (error) return <div className="alert alert-danger">Error: {error}</div>;
  if (!parcel) return <p>Parcel not found.</p>;

  return (
    <div className="container mt-5">
      <h2>Parcel Details</h2>
      <p><strong>Tracking ID:</strong> {parcel.trackingId}</p>
      <p><strong>Item Name:</strong> {parcel.itemName}</p>
      <p><strong>Sender:</strong> {parcel.senderEmail}</p>
      <p><strong>Recipient:</strong> {parcel.recipientName}</p>
      <p><strong>Address:</strong> {parcel.recipientAddress}</p>
      <p><strong>Type:</strong> {parcel.type}</p>
      <p><strong>Weight:</strong> {parcel.weight}</p>
      <p><strong>Price:</strong> {parcel.price}</p>
      <li className="list-group-item"><strong>Expected Delivery At:</strong> {new Date(parcel.expectedDeliveryAt).toLocaleString()}</li>
      <p><strong>Status:</strong></p>
              
      <select value={status} onChange={e => setStatus(e.target.value)} className="form-select w-50">
        <option value="Created">Created</option>
        <option value="In Transit">In Transit</option>
        <option value="Delivered">Delivered</option>
        <option value="Cancelled">Cancelled</option>
      </select>
      <div className="mb-3 mt-2">
        <label>Metadata (optional):</label>
        <input
          type="text"
          value={metadata}
          onChange={e => setMetadata(e.target.value)}
          className="form-control w-50"
        />
      </div>
      <button className="btn btn-primary mt-3" onClick={handleStatusUpdate}>Update Status</button>
      <div className="mb-3 text-center">
        
        <div className="mt-2"><small>Tracking ID: <code>{parcel.trackingId}</code></small></div>
      </div>
    </div>
  );
};

export default ParcelDetailsPage;
