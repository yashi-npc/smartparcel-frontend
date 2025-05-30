import React, { useState,useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import axiosInstance from '../api/axiosInstance';
import {logout} from '../api/auth'; 



function SenderDashboard() {
  
  const navigate = useNavigate();

  useEffect(() => {// Check if user is logged in
    // If token is not present, redirect to login page
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/');
    }
  }, []);
  
  useEffect(() => {//prevent the browser from caching pages, avoid back button issues
    window.history.pushState(null, null, window.location.href);
    window.onpopstate = () => {
      window.history.go(1);
    };
    }, []);

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
      const response = await axiosInstance.get(`/api/parcel/track?trackingId=${searchTrackingId.trim()}`);
      setSearchedParcel(response.data);
    } catch (err) {
      const msg = err.response?.data?.message || 'Parcel not found.';
      setSearchError(msg);
    }
  };

  const [formData, setFormData] = useState({
    recipientName: '',
    recipientAddress: '',
    weight: '',
    type: '',
    metadata: '',
  });

  const [parcels, setParcels] = useState([]);

  const fetchParcels = async () => {
  try {
    const response = await axiosInstance.get('/dashboard/sender', {

    });
    console.log('Fetched parcels:', response.data);
    setParcels(response.data);
  } catch (err) {
    console.error('Error fetching parcels:', err);
  }
};

useEffect(() => {
  fetchParcels();
}, []);

  const [trackingId, setTrackingId] = useState('');
  const [qrCodeImage, setQrCodeImage] = useState('');
  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCreateParcel = async (e) => {
    e.preventDefault();
    setMessage('');
    setTrackingId('');
    setQrCodeImage('');


    const payload = {
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
    } catch (err) {
      console.error(err);
      const errorMsg = err.response?.data?.message || 'Error creating parcel.';
      setMessage(errorMsg);
    }

    fetchParcels(); // Refresh the parcel list after creation
    setFormData({
      recipientName: '',
      recipientAddress: '',
      weight: '',
      type: '',
      metadata: '',
    });
  };

  return (
    <div className="container mt-5">
      <div className="card shadow p-4">
        <h2 className="mb-4">Sender Dashboard  Create Parcel</h2>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2>Sender Dashboard</h2>
          <button onClick={logout} style={{ padding: "8px 16px", cursor: "pointer", backgroundColor: "#e74c3c", color: "white", border: "none", borderRadius: "4px" }}>
            Logout
          </button>
        </div>

        <form onSubmit={handleCreateParcel}>

          <div className="mb-3">
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

          <div className="mb-3">
            <label className="form-label">Recipient Address:</label>
            <textarea
              className="form-control"
              name="recipientAddress"
              value={formData.recipientAddress}
              onChange={handleChange}
              required
              rows={2}
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Parcel Type:</label>
            <input
              type="text"
              className="form-control"
              name="type"
              value={formData.type}
              onChange={handleChange}
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Weight (kg):</label>
            <input
              type="number"
              className="form-control"
              name="weight"
              value={formData.weight}
              onChange={handleChange}
              required
              min="0.1"
              step="0.1"
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Metadata (optional):</label>
            <input
              type="text"
              className="form-control"
              name="metadata"
              value={formData.metadata}
              onChange={handleChange}
              placeholder="Additional info (optional)"
            />
          </div>

          <button type="submit" className="btn btn-primary">
            Create Parcel
          </button>
        </form>

        {message && <div className="alert alert-info mt-3">{message}</div>}

        {trackingId && (
          <div className="mt-4 text-center">
            <h5>Tracking ID: <code>{trackingId}</code></h5>
            <img
              src={qrCodeImage}
              alt="QR Code"
              className="img-fluid mt-3"
              style={{ maxWidth: '200px' }}
            />
          </div>
        )}
        
        {parcels.length > 0 && (
        <div className="mt-5">
          <h4>Your Parcels</h4>
          <table className="table table-bordered table-hover">
            <thead className="table-light">
              <tr>
                <th>Tracking ID</th>
                <th>Recipient</th>
                <th>Address</th>
                <th>Weight</th>
                <th>Metadata</th>
                <th>Type</th>
                <th>Status</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {parcels.map((parcel) => (
                <tr key={parcel.trackingId}>
                  <td><code>{parcel.trackingId}</code></td>
                  <td>{parcel.recipientName}</td>
                  <td>{parcel.recipientAddress}</td>
                  <td>{parcel.weight} kg</td>
                  <td>{parcel.metadata}</td>
                  <td>{parcel.type}</td>
                  <td>{parcel.status}</td>
                  <td>{new Date(parcel.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <hr className="my-4" />
        <h4>Track Parcel</h4>
        <form onSubmit={handleTrackParcel} className="mb-3">
          <div className="input-group">
            <input
              type="text"
              className="form-control"
              placeholder="Enter Tracking ID"
              value={searchTrackingId}
              onChange={(e) => setSearchTrackingId(e.target.value)}
            />
            <button type="submit" className="btn btn-secondary">Track</button>
          </div>
        </form>

        {searchError && <div className="alert alert-danger">{searchError}</div>}

        {searchedParcel && (
          <div className="alert alert-success">
            <h5>Parcel Found:</h5>
            <ul className="list-group">
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
};

export default SenderDashboard;
