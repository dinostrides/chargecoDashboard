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
        } else {
          setIsValid(false);
        }
      } catch (error) {
        console.log(error.message)
        setIsValid(false);
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
