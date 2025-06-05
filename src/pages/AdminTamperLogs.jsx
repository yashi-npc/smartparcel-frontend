import React, { useEffect, useState } from 'react';
import axios from 'axios';

const AdminTamperLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await axios.get('http://localhost:8080/parceltrack/api/admin/tampers', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        setLogs(res.data);
      } catch (err) {
        console.error('Failed to fetch tamper logs:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, []);

  return (
    <div className="tamperlogs-bg min-h-screen flex flex-col items-center justify-start p-6" style={{background: 'linear-gradient(120deg, #e6f0ff 0%, #b3d1fa 100%)'}}>
      <div className="card w-full max-w-5xl mx-auto mt-8 mb-8 flex flex-col items-center">
        <h1 className="card-title text-3xl font-bold mb-6 text-center">Tamper Logs</h1>
        {loading ? (
          <div className="text-center text-lg text-blue-700 py-8">Loading tamper logs...</div>
        ) : logs.length === 0 ? (
          <div className="text-center text-lg text-blue-700 py-8">No tamper incidents logged.</div>
        ) : (
          <div className="w-full flex justify-center">
            <div className="overflow-x-auto w-full max-w-4xl">
              <table className="w-full table-auto border-collapse bg-white/95 rounded-xl shadow-lg mx-auto">
                <thead>
                  <tr className="bg-blue-100 text-blue-900">
                    <th className="p-4 font-semibold text-lg text-center">Tracking ID</th>
                    <th className="p-4 font-semibold text-lg text-center">Handler Email</th>
                    <th className="p-4 font-semibold text-lg text-center">Reason</th>
                    <th className="p-4 font-semibold text-lg text-center">Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log, idx) => (
                    <tr key={log.id} className={`border-t ${idx % 2 === 0 ? 'bg-blue-50/60' : 'bg-white/80'} hover:bg-blue-100 transition`}>
                      <td className="p-4 text-blue-900 font-mono font-semibold text-center">{log.trackingId}</td>
                      <td className="p-4 text-blue-800 text-center">{log.handlerEmail}</td>
                      <td className="p-4 text-blue-700 text-center">{log.reason}</td>
                      <td className="p-4 text-blue-700 text-center">{new Date(log.timestamp).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminTamperLogs;
