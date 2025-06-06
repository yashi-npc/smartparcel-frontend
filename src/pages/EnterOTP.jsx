import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import axios from "axios";
import '../pages/HomePage.css';

function EnterOtp() {
  const [searchParams] = useSearchParams();
  const trackingId = searchParams.get("trackingId");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post("http://localhost:8080/parceltrack/verify-otp", {
        trackingId,
        otp,
      });
      alert("OTP Verified! Parcel marked as delivered.");
      navigate("/handler/dashboard");
    } catch (err) {
      const msg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        (typeof err.response?.data === "string" ? err.response.data : "Verification failed");
      setError(msg);
    }
  };
  return (
    <div className="homepage-bg-nice">
      <div className="homepage-overlay">
        <div className="homepage-card">
          <img src="/smartparcelicon-light.png" alt="SmartParcel Logo" className="homepage-logo mb-4" />
          <div className="admin-breadcrumb mb-2">Home &gt; Handler &gt; Verify OTP</div>
          <div className="card shadow p-4" style={{ borderRadius: '16px', boxShadow: '0 4px 16px rgba(45,91,227,0.07)' }}>
            <h2 className="text-center mb-4" style={{ color: '#2d5be3', fontWeight: '600' }}>Verify Delivery OTP</h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label text-secondary small mb-1">Tracking ID</label>
                <div className="form-control-plaintext text-center" style={{ color: '#2d5be3', fontWeight: '600' }}>
                  <code>{trackingId}</code>
                </div>
              </div>
              <div className="mb-3">
                <label className="form-label text-secondary small mb-1">OTP Code</label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => {
                    setOtp(e.target.value);
                    setError("");
                  }}
                  placeholder="Enter OTP code"
                  className="form-control form-control-lg bg-light text-dark border-secondary text-center"
                  style={{ letterSpacing: '0.25em' }}
                />
              </div>
              {error && <div className="alert alert-danger text-center mb-3">{error}</div>}
              <button
                type="submit"
                className="btn w-100 py-2 fw-bold"
                style={{
                  backgroundColor: '#2d5be3',
                  border: 'none',
                  color: 'white',
                }}
              >
                Verify OTP
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EnterOtp;
