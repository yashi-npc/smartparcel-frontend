import React, { useState,useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import QRScannerModal from './QRScannerModal';
import ParcelCard from './ParcelCard';
import axiosInstance from '../api/axiosInstance';
import {logout} from '../api/auth'; 

import './HandlerDashboard.css'; 
function HandlerDashboard() {
  const [qrCodeImage, setQrCodeImage] = useState('');
  const [showQRModal, setShowQRModal] = useState(false);
  const [selectedTrackingId, setSelectedTrackingId] = useState(null);

  const handleShowQRModal = (trackingId) => {
  setSelectedTrackingId(trackingId);
  setShowQRModal(true);
  };



  const [showEditForm, setShowEditForm] = useState(false);
  const [selectedParcel, setSelectedParcel] = useState(null);
  const [newStatus, setNewStatus] = useState('');

  const handleEditClick = (parcel) => {
    setSelectedParcel(parcel);
    setNewStatus(parcel.status);
    setShowEditForm(true);
  };
  const handleUpdateStatus = async () => {
  if (!newStatus.trim()) return;

  try {
    await axiosInstance.put(`/api/parcel/update/${selectedParcel.trackingId}`, {
      trackingId: selectedParcel.trackingId,
      status: newStatus
    });

    setMessage(`Parcel ${selectedParcel.trackingId} updated successfully.`);
    setShowEditForm(false);
    setSelectedParcel(null);
    setNewStatus('');
    fetchParcels(); // Refresh list
  } catch (error) {
    console.error('Error updating parcel:', error);
    setMessage('Failed to update parcel.');
  }
};


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
const [parcels, setParcels] = useState([]);
  const fetchParcels = async () => {
  try {
    const response = await axiosInstance.get('/dashboard/handler', {

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

  const [message, setMessage] = useState('');



  return (
    <div className="container mt-5">
      <div className="card shadow p-4">
        <h2 className="mb-4">Handler Dashboard</h2>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          
          <button onClick={logout} style={{ padding: "8px 16px", cursor: "pointer", backgroundColor: "#e74c3c", color: "white", border: "none", borderRadius: "4px" }}>
            Logout
          </button>
          <button className="btn btn-outline-primary" onClick={() => setShowQRModal(true)}>
            Scan QR to Fetch Parcel
          </button>
        </div>
        
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
                <th>Last Update at</th>
                <th>Update</th>
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
                  <td>{parcel.updatedAt ? new Date(parcel.updatedAt).toLocaleString() : 'N/A'}</td>

                  <td className="d-flex gap-2">
                    <button className="btn btn-sm btn-warning" onClick={() => handleEditClick(parcel)}>Update</button>
                    
                  </td>


                </tr>
              ))}
            </tbody>
          </table>
          {showEditForm && selectedParcel && (
            <div className="modal-overlay">
              <div className="modal-card">
                <div className="card-header bg-primary text-white">
                  <h5 className="mb-0">Update Parcel <code>{selectedParcel.trackingId}</code></h5>
                </div>
                <div className="card-body">
                  <ul className="list-group mb-3">
                    <li className="list-group-item"><strong>Recipient:</strong> {selectedParcel.recipientName}</li>
                    <li className="list-group-item"><strong>Address:</strong> {selectedParcel.recipientAddress}</li>
                    <li className="list-group-item"><strong>Weight:</strong> {selectedParcel.weight} kg</li>
                    <li className="list-group-item"><strong>Type:</strong> {selectedParcel.type}</li>
                    <li className="list-group-item"><strong>Metadata:</strong> {selectedParcel.metadata || 'N/A'}</li>
                    <li className="list-group-item"><strong>Created At:</strong> {new Date(selectedParcel.createdAt).toLocaleString()}</li>
                    {selectedParcel.updatedAt && (
                      <li className="list-group-item"><strong>Last Updated:</strong> {new Date(selectedParcel.updatedAt).toLocaleString()}</li>
                    )}
                    <li className="list-group-item">
                      <strong>Current Status:</strong> <span className="badge bg-info text-dark">{selectedParcel.status}</span>
                    </li>
                  </ul>

                  <div className="mb-3">
                    <label className="form-label"><strong>Update Status</strong></label>
                    <select
                      className="form-select"
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value)}
                    >
                      <option value="">-- Select Status --</option>
                      <option value="Pending">Pending</option>
                      <option value="In Transit">In Transit</option>
                      <option value="Delivered">Delivered</option>
                      <option value="Returned">Returned</option>
                    </select>
                  </div>

                  <div className="d-flex justify-content-end">
                    <button className="btn btn-success me-2" 
                    onClick={()=>{handleUpdateStatus();
                      setShowEditForm(false);
                    }}>Update</button>
                    <button className="btn btn-secondary" onClick={() => setShowEditForm(false)}>Cancel</button>
                  </div>
                </div>
              </div>
            </div>
          )}


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
            <button type="submit" className="btn btn-primary">Track</button>
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
      {showQRModal && selectedTrackingId && (
        <QRScannerModal
          expectedTrackingId={selectedTrackingId}
          onSuccess={() => {
            setShowQRModal(false);
            setMessage(`Parcel ${selectedTrackingId} scanned successfully.`);
          }}
          onClose={() => setShowQRModal(false)}
        />
      )}

    </div>
  );
};

export default HandlerDashboard;
