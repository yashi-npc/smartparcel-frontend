import React, { useEffect, useState } from 'react';
import axios from 'axios';

const AdminTamperLogs = () => {
  const [manualLogs, setManualLogs] = useState([]);
  const [autoLogs, setAutoLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // Handle row click
  const handleLogClick = (log) => {
    setSelectedLog(log);
    setShowModal(true);
  };

  // Close modal
  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedLog(null);
  };

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await axios.get('http://localhost:8080/parceltrack/api/admin/tampers', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        // Separate manual and auto logs
        const manual = res.data.filter(log => log.type === 'manual');
        const auto = res.data.filter(log => log.type !== 'manual');
        setManualLogs(manual);
        setAutoLogs(auto);
      } catch (err) {
        console.error('Failed to fetch tamper logs:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, []);

  return (
    <div className="admin-content" style={{ background: '#f6f8fa', minHeight: '100vh', padding: '2.5rem 2.5rem 2rem 2.5rem' }}>
      <div className="admin-breadcrumb">Home &gt; Admin &gt; Tamper Logs</div>
      <h2 className="mb-4" style={{ fontSize: '1.8rem', fontWeight: 700, color: '#1a357a', marginBottom: '1.5rem' }}>
        Tamper Logs
      </h2>

      {loading ? (
        <div className="card" style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          minHeight: '200px',
          background: '#fff',
          borderRadius: '16px',
          boxShadow: '0 4px 16px rgba(45,91,227,0.07)',
          color: '#2d5be3',
          fontSize: '1.1rem',
          fontWeight: 500
        }}>
          Loading tamper logs...
        </div>
      ) : manualLogs.length === 0 && autoLogs.length === 0 ? (
        <div className="card" style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          minHeight: '200px',
          background: '#fff',
          borderRadius: '16px',
          boxShadow: '0 4px 16px rgba(45,91,227,0.07)',
          color: '#2d5be3',
          fontSize: '1.1rem',
          fontWeight: 500
        }}>
          No tamper incidents logged.
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Manual Tamper Reports */}
            <div className="card" style={{
              padding: 0,
              borderRadius: '16px',
              boxShadow: '0 4px 16px rgba(45,91,227,0.07)',
              border: '1.5px solid #e3e8f0',
              overflow: 'hidden'
            }}>
              <div style={{ 
                background: 'linear-gradient(120deg, #ffe6e6 0%, #ffcccc 100%)',
                padding: '1.5rem 2rem',
                borderBottom: '1px solid #ffd6d6'
              }}>
                <h3 style={{ 
                  color: '#e32d2d',
                  fontSize: '1.4rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem'
                }}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zM7 8V4h2v4H7zm0 4v-2h2v2H7z" fill="currentColor"/>
                  </svg>
                  Manual Tamper Reports
                </h3>
              </div>
              <div style={{ padding: '1rem' }}>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ 
                    width: '100%',
                    borderCollapse: 'collapse',
                    minWidth: '900px'
                  }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #e3e8f0' }}>
                        <th style={{ 
                          padding: '1rem',
                          textAlign: 'left',
                          color: '#1a357a',
                          fontWeight: 600,
                          fontSize: '1.05rem'
                        }}>Tracking ID</th>
                        <th style={{ 
                          padding: '1rem',
                          textAlign: 'left',
                          color: '#1a357a',
                          fontWeight: 600,
                          fontSize: '1.05rem'
                        }}>Handler Email</th>
                        <th style={{ 
                          padding: '1rem',
                          textAlign: 'left',
                          color: '#1a357a',
                          fontWeight: 600,
                          fontSize: '1.05rem'
                        }}>Issue Type</th>
                        <th style={{ 
                          padding: '1rem',
                          textAlign: 'left',
                          color: '#1a357a',
                          fontWeight: 600,
                          fontSize: '1.05rem'
                        }}>Comments</th>
                        <th style={{ 
                          padding: '1rem',
                          textAlign: 'left',
                          color: '#1a357a',
                          fontWeight: 600,
                          fontSize: '1.05rem'
                        }}>Timestamp</th>
                      </tr>
                    </thead>
                    <tbody>
                      {manualLogs.length === 0 ? (
                        <tr>
                          <td colSpan="5" style={{ 
                            textAlign: 'center',
                            padding: '2rem',
                            color: '#7a8bb7'
                          }}>No manual tamper reports found</td>
                        </tr>
                      ) : (
                        manualLogs.map((log, idx) => (
                          <tr key={log.id} 
                            onClick={() => handleLogClick(log)}
                            style={{ 
                              background: idx % 2 === 0 ? '#fff' : '#f8f9fa',
                              transition: 'all 0.2s',
                              cursor: 'pointer',
                              ':hover': {
                                background: '#f0f4ff'
                              }
                            }}>
                            <td style={{ padding: '1rem', color: '#1a357a' }}>
                              <span style={{
                                display: 'inline-block',
                                fontFamily: 'monospace',
                                background: '#f0f4ff',
                                padding: '0.25rem 0.5rem',
                                borderRadius: '4px',
                                color: '#2d5be3',
                                fontWeight: 600
                              }}>{log.trackingId}</span>
                            </td>
                            <td style={{ padding: '1rem', color: '#1a357a' }}>{log.handlerEmail}</td>
                            <td style={{ padding: '1rem' }}>
                              <span style={{
                                background: '#ffe6e6',
                                color: '#e32d2d',
                                padding: '0.25rem 0.75rem',
                                borderRadius: '16px',
                                fontSize: '0.9rem',
                                fontWeight: 600
                              }}>{log.issueType}</span>
                            </td>
                            <td style={{ padding: '1rem', color: '#1a357a' }}>{log.comments}</td>
                            <td style={{ padding: '1rem', color: '#7a8bb7', fontSize: '0.95rem' }}>
                              {new Date(log.timestamp).toLocaleString()}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Automated Tamper Detections */}
            <div className="card" style={{
              padding: 0,
              borderRadius: '16px',
              boxShadow: '0 4px 16px rgba(45,91,227,0.07)',
              border: '1.5px solid #e3e8f0',
              overflow: 'hidden'
            }}>
              <div style={{ 
                background: 'linear-gradient(120deg, #e6f0ff 0%, #b3d1fa 100%)',
                padding: '1.5rem 2rem',
                borderBottom: '1px solid #d6e6ff'
              }}>
                <h3 style={{ 
                  color: '#2d5be3',
                  fontSize: '1.4rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem'
                }}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M16 8A8 0 1 1 0 8a8 8 0 0 1 16 0zm-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z" fill="currentColor"/>
                  </svg>
                  Automated Tamper Detections
                </h3>
              </div>
              <div style={{ padding: '1rem' }}>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ 
                    width: '100%',
                    borderCollapse: 'collapse',
                    minWidth: '900px'
                  }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #e3e8f0' }}>
                        <th style={{ 
                          padding: '1rem',
                          textAlign: 'left',
                          color: '#1a357a',
                          fontWeight: 600,
                          fontSize: '1.05rem'
                        }}>Tracking ID</th>
                        <th style={{ 
                          padding: '1rem',
                          textAlign: 'left',
                          color: '#1a357a',
                          fontWeight: 600,
                          fontSize: '1.05rem'
                        }}>Handler Email</th>
                        <th style={{ 
                          padding: '1rem',
                          textAlign: 'left',
                          color: '#1a357a',
                          fontWeight: 600,
                          fontSize: '1.05rem'
                        }}>Reason</th>
                        <th style={{ 
                          padding: '1rem',
                          textAlign: 'left',
                          color: '#1a357a',
                          fontWeight: 600,
                          fontSize: '1.05rem'
                        }}>Timestamp</th>
                      </tr>
                    </thead>
                    <tbody>
                      {autoLogs.length === 0 ? (
                        <tr>
                          <td colSpan="4" style={{ 
                            textAlign: 'center',
                            padding: '2rem',
                            color: '#7a8bb7'
                          }}>No automated tamper detections found</td>
                        </tr>
                      ) : (
                        autoLogs.map((log, idx) => (
                          <tr key={log.id} 
                            onClick={() => handleLogClick(log)}
                            style={{ 
                              background: idx % 2 === 0 ? '#fff' : '#f8f9fa',
                              transition: 'all 0.2s',
                              cursor: 'pointer',
                              ':hover': {
                                background: '#f0f4ff'
                              }
                            }}>
                            <td style={{ padding: '1rem', color: '#1a357a' }}>
                              <span style={{
                                display: 'inline-block',
                                fontFamily: 'monospace',
                                background: '#f0f4ff',
                                padding: '0.25rem 0.5rem',
                                borderRadius: '4px',
                                color: '#2d5be3',
                                fontWeight: 600
                              }}>{log.trackingId}</span>
                            </td>
                            <td style={{ padding: '1rem', color: '#1a357a' }}>{log.handlerEmail}</td>
                            <td style={{ padding: '1rem' }}>
                              <span style={{
                                background: '#e6f0ff',
                                color: '#2d5be3',
                                padding: '0.25rem 0.75rem',
                                borderRadius: '16px',
                                fontSize: '0.9rem',
                                fontWeight: 600
                              }}>{log.reason}</span>
                            </td>
                            <td style={{ padding: '1rem', color: '#7a8bb7', fontSize: '0.95rem' }}>
                              {new Date(log.timestamp).toLocaleString()}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          {/* Tamper Log Details Modal */}
          {showModal && selectedLog && (
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
            }} onClick={handleCloseModal}>
              <div style={{
                background: '#fff',
                borderRadius: '16px',
                width: '600px',
                maxWidth: '95vw',
                maxHeight: '90vh',
                overflow: 'auto',
                padding: 0,
                boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
              }} onClick={e => e.stopPropagation()}>
                {/* Modal Header */}
                <div style={{ 
                  background: selectedLog.type === 'manual' 
                    ? 'linear-gradient(120deg, #ffe6e6 0%, #ffcccc 100%)'
                    : 'linear-gradient(120deg, #e6f0ff 0%, #b3d1fa 100%)',
                  padding: '1.5rem 2rem',
                  borderBottom: `1px solid ${selectedLog.type === 'manual' ? '#ffd6d6' : '#d6e6ff'}`
                }}>
                  <h3 style={{ 
                    color: selectedLog.type === 'manual' ? '#e32d2d' : '#2d5be3',
                    fontSize: '1.4rem',
                    fontWeight: 700,
                    marginBottom: '0.5rem'
                  }}>
                    Tamper Log Details
                  </h3>
                  <div style={{
                    fontFamily: 'monospace',
                    fontSize: '1.1rem',
                    color: selectedLog.type === 'manual' ? '#e32d2d' : '#2d5be3',
                    fontWeight: 600
                  }}>
                    #{selectedLog.trackingId}
                  </div>
                </div>

                {/* Modal Body */}
                <div style={{ padding: '2rem' }}>
                  <div style={{ marginBottom: '2rem' }}>
                    <div style={{ 
                      display: 'inline-block',
                      padding: '0.5rem 1rem',
                      borderRadius: '20px',
                      fontSize: '0.9rem',
                      fontWeight: 600,
                      marginBottom: '1.5rem',
                      background: selectedLog.type === 'manual' ? '#ffe6e6' : '#e6f0ff',
                      color: selectedLog.type === 'manual' ? '#e32d2d' : '#2d5be3'
                    }}>
                      {selectedLog.type === 'manual' ? 'Manual Report' : 'Automated Detection'}
                    </div>
                  </div>

                  <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ 
                      display: 'block',
                      color: '#7a8bb7',
                      fontSize: '0.95rem',
                      marginBottom: '0.25rem'
                    }}>
                      Handler Email
                    </label>
                    <div style={{ 
                      color: '#1a357a',
                      fontSize: '1.1rem',
                      fontWeight: 500
                    }}>
                      {selectedLog.handlerEmail}
                    </div>
                  </div>

                  <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ 
                      display: 'block',
                      color: '#7a8bb7',
                      fontSize: '0.95rem',
                      marginBottom: '0.25rem'
                    }}>
                      Timestamp
                    </label>
                    <div style={{ 
                      color: '#1a357a',
                      fontSize: '1.1rem',
                      fontFamily: 'monospace'
                    }}>
                      {new Date(selectedLog.timestamp).toLocaleString()}
                    </div>
                  </div>

                  {selectedLog.type === 'manual' ? (
                    <>
                      <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ 
                          display: 'block',
                          color: '#7a8bb7',
                          fontSize: '0.95rem',
                          marginBottom: '0.25rem'
                        }}>
                          Issue Type
                        </label>
                        <div style={{
                          display: 'inline-block',
                          background: '#ffe6e6',
                          color: '#e32d2d',
                          padding: '0.25rem 0.75rem',
                          borderRadius: '16px',
                          fontSize: '0.95rem',
                          fontWeight: 600
                        }}>
                          {selectedLog.issueType}
                        </div>
                      </div>

                      <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ 
                          display: 'block',
                          color: '#7a8bb7',
                          fontSize: '0.95rem',
                          marginBottom: '0.25rem'
                        }}>
                          Comments
                        </label>
                        <div style={{
                          color: '#1a357a',
                          fontSize: '1.1rem',
                          lineHeight: '1.5',
                          padding: '1rem',
                          background: '#f8f9fa',
                          borderRadius: '8px',
                          border: '1px solid #e3e8f0'
                        }}>
                          {selectedLog.comments}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div style={{ marginBottom: '1.5rem' }}>
                      <label style={{ 
                        display: 'block',
                        color: '#7a8bb7',
                        fontSize: '0.95rem',
                        marginBottom: '0.25rem'
                      }}>
                        Detection Reason
                      </label>
                      <div style={{
                        display: 'inline-block',
                        background: '#e6f0ff',
                        color: '#2d5be3',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '16px',
                        fontSize: '0.95rem',
                        fontWeight: 600
                      }}>
                        {selectedLog.reason}
                      </div>
                    </div>
                  )}

                  {selectedLog.gpsInfo && (
                    <div style={{ marginBottom: '1.5rem' }}>
                      <label style={{ 
                        display: 'block',
                        color: '#7a8bb7',
                        fontSize: '0.95rem',
                        marginBottom: '0.25rem'
                      }}>
                        GPS Location
                      </label>
                      <div style={{
                        color: '#1a357a',
                        fontSize: '1.1rem',
                        fontFamily: 'monospace',
                        padding: '1rem',
                        background: '#f8f9fa',
                        borderRadius: '8px',
                        border: '1px solid #e3e8f0'
                      }}>
                        Lat: {selectedLog.gpsInfo.latitude}<br/>
                        Long: {selectedLog.gpsInfo.longitude}
                      </div>
                    </div>
                  )}

                  <div style={{ 
                    marginTop: '2rem',
                    display: 'flex',
                    justifyContent: 'flex-end'
                  }}>
                    <button
                      onClick={handleCloseModal}
                      style={{
                        background: '#f0f4ff',
                        color: '#2d5be3',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '0.75rem 1.5rem',
                        fontSize: '1rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AdminTamperLogs;
