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
    <div className="container mt-5" style={{ background: '#fff', color: '#222', borderRadius: '12px', padding: '2rem' }}>
      <h2>Parcel Details</h2>
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
      <p><strong>Delivered At:</strong> {parcel.deliveryAt ? new Date(parcel.deliveryAt).toLocaleString() : 'Not delivered yet'}</p>
      <p><strong>Status:</strong> <span className="badge bg-info text-dark">{parcel.status}</span></p>
              
      <select value={status} onChange={e => setStatus(e.target.value)} className="form-select w-50">
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
