
import React, { useState } from 'react';
import axios from '../api/axiosInstance';
import { setToken } from '../utils/tokens';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
const LoginPage=()=>{
    const[email,setEmail] =useState('');
    const[password,setPassword] =useState('');
    const[error,setError] =useState('');
    const navigate =useNavigate();

    const handleLogin= async(e) => {
        e.preventDefault();
        setError('');

        try{
            const response = await axios.post('/api/login',{
                email,password,
            });

            const {token} =response.data;
            setToken(token);

            //decode role from token 
            const payload = JSON.parse(atob(token.split('.')[1]));
            const role = payload.role;

            if(role==='sender'){
                navigate('/sender');
            } else if(role==='handler'){
                navigate('/handler/dashboard');
            }else if(role ==='admin'){
                navigate('/admin/dashboard');
            }else{
                setError('Unknown role.');
            }
        }catch(err){
            setError('Lohin failed. Check your credentials.')
        }
    };

    return(
        <div className="container mt-5">
      <h2>Login</h2>
      {error && <div className="alert alert-danger">{error}</div>}
      <form onSubmit={handleLogin}>
        <div className="mb-3">
          <label>Email</label>
          <input
            type="email"
            className="form-control"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="mb-3">
          <label>Password</label>
          <input
            type="password"
            className="form-control"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <button type="submit" className="btn btn-primary">Login</button>
      </form>
      <p>Don't have an account? <Link to="/register">Register here</Link></p>
    </div>
    );
};

export default LoginPage;