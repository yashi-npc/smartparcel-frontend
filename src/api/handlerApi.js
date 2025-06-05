import axiosInstance from './axiosInstance';

export const fetchParcels = async () => {
  const response = await axiosInstance.get('/dashboard/handler');
  return response.data;
};

export const fetchAdminParcels = async () => {
  const response = await axiosInstance.get('/dashboard/admin');
  return response.data;
};

export const updateParcelStatus = async (trackingId, status, currentLocation, metadata) => {
  // If status is delivered, set deliveryAt to now (updatedAt will be set by backend)
  const payload = {
    trackingId,
    status,
    currentLocation,
    metadata,
  };
  if (status && status.toLowerCase() === 'delivered') {
    payload.deliveryAt = new Date().toISOString();
  }
  return axiosInstance.put(`/api/parcel/update/${trackingId}`, payload);
};

export const trackParcelById = async (trackingId) => {
  const response = await axiosInstance.get(`/api/parcel/track?trackingId=${trackingId}`);
  return response.data;
};
