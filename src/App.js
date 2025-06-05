import logo from './logo.svg';
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import RegisterPage from './pages/RegisterPage';
import SenderDashboard from './components/SenderDashboard';
import HandlerDashboard from './components/HandlerDashboard';
import AdminDashboard from './components/AdminDashboard';
import ParcelDetailsPage from './pages/ParcelDetailsPage';
import LoginPage from './pages/LoginPage';
import EnterOtp from './pages/EnterOTP';
import AdminTamperLogs from './pages/AdminTamperLogs';
console.log("RegisterPage is:", RegisterPage);
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/sender" element={<SenderDashboard />} />
        <Route path="/handler/dashboard" element={<HandlerDashboard />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/parcel/:trackingId" element={<ParcelDetailsPage />} />
        <Route path="/enter-otp" element={<EnterOtp />} />
        <Route path="/admin/tampers" element ={<AdminTamperLogs />} />
      </Routes>
    </Router>
  );  
}

export default App;
