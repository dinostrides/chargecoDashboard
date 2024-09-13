import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import axios from 'axios';

export const PrivateRoute = ({ children }) => {
  const [isValid, setIsValid] = useState(null);
  const [jwtToken, setJwtToken] = useState(localStorage.getItem('accessToken'));

  useEffect(() => {
    const validateToken = async () => {
      if (!jwtToken) {
        setIsValid(false);
        return;
      }

      try {
        const response = await axios.post("http://localhost:8000/api/validate-token/", {}, {
          headers: {
            'Authorization': `Bearer ${jwtToken}`
          }
        });

        if (response.data.detail === "Token is valid") {
          setIsValid(true);
        }

      } catch (error) {
        console.log('boost', error.response.data.detail);
        
        if (error.response.data.detail === "Invalid or expired token") {
          try {
            // Try to renew token
            const refresh = localStorage.getItem('refreshToken');
            if (refresh) {
              const refreshResponse = await axios.post('http://localhost:8000/api/token/refresh/', {
                refresh: refresh
              });
              
              const newAccessToken = refreshResponse.data.access;
              localStorage.setItem('accessToken', newAccessToken);
              
              setIsValid(true);
              
              // Update the jwtToken in state only after setting token in storage
              setTimeout(() => {
                setJwtToken(newAccessToken);  // Delay token update to prevent immediate rerun
              }, 0);
            }
          } catch (error) {
            console.log(error);
            setIsValid(false); // Token refresh failed, log out or handle appropriately
          }
        } else {
          setIsValid(false);
        }
      }
    };

    validateToken();
  }, [jwtToken]);

  if (isValid === null) {
    return <div>Loading...</div>; // Or a loading spinner
  }

  return isValid ? children : <Navigate to="/" />;
};

export default PrivateRoute;



