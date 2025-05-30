import React, { useEffect, useRef } from 'react';
import { Html5Qrcode } from "html5-qrcode";

const QRScannerModal = ({ expectedTrackingId, onSuccess, onClose }) => {
  const scannerRef = useRef(null);
  const isRunningRef = useRef(false);

  useEffect(() => {
    const scanner = new Html5Qrcode("reader");
    scannerRef.current = scanner;

    scanner.start(
      { facingMode: "environment" },
      {
        fps: 10,
        qrbox: 250,
        aspectRatio: 1.0, // Add this
        videoConstraints: {
            width: { ideal: 640 },
            height: { ideal: 480 }
        }
      },
      (decodedText) => {
        if (decodedText === expectedTrackingId) {
          if (isRunningRef.current) {
            scanner.stop().then(() => {
              isRunningRef.current = false;
              onSuccess();
            }).catch(console.error);
          }
        } else {
          alert("Invalid QR Code!");
        }
      },
      (err) => {
        // ignore scan errors
      }
    ).then(() => {
      isRunningRef.current = true;
    }).catch((err) => {
      console.error("Failed to start QR scanner", err);
    });

    return () => {
      if (isRunningRef.current && scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
        isRunningRef.current = false;
      }
    };
  }, [expectedTrackingId, onSuccess]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-md bg-black/30">
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h2 className="text-lg font-bold mb-4">Scan Parcel QR Code</h2>
        <div id="reader" style={{ width: "300px", height: "300px" }}></div>
        <button onClick={onClose} className="mt-4 bg-red-500 text-white px-4 py-2 rounded">
          Cancel
        </button>
      </div>
    </div>
  );
};

export default QRScannerModal;
