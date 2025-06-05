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
    <div className="min-h-screen bg-gray-900  p-6">
      <h1 className="text-3xl font-bold mb-6">Tamper Logs</h1>

      {loading ? (
        <p>Loading tamper logs...</p>
      ) : logs.length === 0 ? (
        <p>No tamper incidents logged.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full table-auto border-collapse bg-gray-800 rounded-lg shadow-md">
            <thead>
              <tr className="bg-gray-700 text-left">
                <th className="p-3">Tracking ID</th>
                <th className="p-3">Handler Email</th>
                <th className="p-3">Reason</th>
                <th className="p-3">Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-t border-gray-600 hover:bg-gray-700 transition">
                  <td className="p-3">{log.trackingId}</td>
                  <td className="p-3">{log.handlerEmail}</td>
                  <td className="p-3">{log.reason}</td>
                  <td className="p-3">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminTamperLogs;
