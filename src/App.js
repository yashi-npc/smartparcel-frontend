import logo from './logo.svg';
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import SenderDashboard from './components/SenderDashboard';
import HandlerDashboard from './components/HandlerDashboard';
import ParcelDetailsPage from './pages/ParcelDetailsPage';
import AdminDashboard from './components/AdminDashboard';
console.log("RegisterPage is:", RegisterPage);
function App() {
  return (
    <Router>
      <Routes>
        <Route path ="/" element={<LoginPage />}/>
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/sender" element={<SenderDashboard />} />
        <Route path="/handler/dashboard" element={<HandlerDashboard />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/parcel/:trackingId" element={<ParcelDetailsPage/>} />
      </Routes>
    </Router>
  );  
}

export default App;
