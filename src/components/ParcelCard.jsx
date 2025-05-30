import { useEffect, useState } from 'react';

const ParcelCard = ({ trackingId }) => {
    const [qrImage, setQrImage] = useState('');

    useEffect(() => {
        fetch(`/api/parcel/qrcode?trackingId=${trackingId}`)
            .then(res => res.json())
            .then(data => {
                if (data.image) {
                    setQrImage(data.image);
                } else {
                    console.error('QR code image not found in response');
                }
            })
            .catch(err => {
                console.error('Error fetching QR code:', err);
            });
    }, [trackingId]); 
    
    return (
        <div className="border p-4 rounded shadow w-64">
            <h3 className="font-bold mb-2">Tracking ID: {trackingId}</h3>
            {qrImage ? (
                <img src={qrImage} alt="QR Code" className="w-48 h-48 mx-auto" />
            ) : (
                <p>Loading QR Code...</p>
            )}
        </div>
    );
};

export default ParcelCard;
