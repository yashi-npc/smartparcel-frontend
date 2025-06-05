import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import axios from "axios";

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
    <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
      <form onSubmit={handleSubmit} className="bg-gray-800 p-6 rounded-xl shadow-md">
        <h2 className="text-2xl mb-4 font-bold">Verify Delivery OTP</h2>
        <p className="mb-2 text-sm text-gray-400">Tracking ID: {trackingId}</p>
        <input
          type="text"
          value={otp}
          onChange={(e) => {
            setOtp(e.target.value);
            setError("");
          }}
          placeholder="Enter OTP"
          className="w-full p-2 mb-3 rounded bg-gray-700 text-white"
        />
        {error && <p className="text-red-500 mb-3">{error}</p>}
        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 py-2 rounded font-semibold"
        >
          Verify
        </button>
      </form>
    </div>
  );
}

export default EnterOtp;
