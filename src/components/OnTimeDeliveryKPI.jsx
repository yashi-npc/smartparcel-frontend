import React, { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer
} from 'recharts';

import axiosInstance from './../api/axiosInstance';

const OnTimeDeliveryKPI = () => {
  const [data, setData] = useState([]);

  useEffect(() => {//hello hahahhaha
    fetchKpiData();
  }, []);

  const fetchKpiData = async () => {
    try {
      const response = await axiosInstance.get('/api/admin/kpi/on-time-delivery?days=7');
      setData(response.data);
    } catch (error) {
      console.error('Failed to fetch KPI data', error);
    }
  };

  const handleClick = (e) => {
    if (e && e.activeLabel && e.activePayload) {
      const { activeLabel, activePayload } = e;
      alert(`Clicked ${activeLabel}: ${activePayload[0].value.toFixed(2)}% on-time`);
      // TODO: Add filter or modal for detailed view if needed
    }
  };

  return (
    <div className="bg-white shadow-md rounded-2xl p-4 mb-6">
      <h3 className="text-lg font-semibold mb-4 text-gray-800">On-Time Delivery % (Last 7 Days)</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} onClick={handleClick}>
          <CartesianGrid stroke="#e0e0e0" strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis domain={[0, 100]} tickFormatter={(val) => `${val}%`} />
          <Tooltip formatter={(value) => `${value.toFixed(2)}%`} />
          <Line type="monotone" dataKey="percentage" stroke="#4f46e5" strokeWidth={3} dot={{ r: 5 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default OnTimeDeliveryKPI;
