import axiosInstance from './axiosInstance';

export const fetchParcels = async () => {
  const response = await axiosInstance.get('/dashboard/handler');
  return response.data;
};

export const fetchAdminParcels = async () => {
  const response = await axiosInstance.get('/dashboard/admin');
  return response.data;
};

export const updateParcelStatus = async (trackingId, status, metadata) => {
  return axiosInstance.put(`/api/parcel/update/${trackingId}`, {
    trackingId,
    status,
    metadata,
  });
};

export const trackParcelById = async (trackingId) => {
  const response = await axiosInstance.get(`/api/parcel/track?trackingId=${trackingId}`);
  return response.data;
};
