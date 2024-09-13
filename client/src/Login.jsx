import React, { useState, useEffect } from "react";
import { Box, Typography, TextField, Stack, Button } from "@mui/material";
import Digitalization from "./assets/digitalization.jpg";
import chargeco from "./assets/chargeco.png";
import { useNavigate } from 'react-router-dom'
import axios from 'axios';

function Login() {

  const navigate = useNavigate();
  const [username, setUsername] = useState();
  const [password, setPassword] = useState();
  const [showErrorMessage, setShowErrorMessage] = useState(false)


  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleLogin(e);  // Trigger login on Enter key press
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const loginResponse = await axios.post("http://localhost:8000/login/", {
        username: username,
        password: password
      });

      const success = loginResponse.data.success;
      const accessToken = loginResponse.data.access;
      const refreshToken = loginResponse.data.refresh;

      if (success === "True") {
        // Save tokens to localStorage
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);

        // Navigate after setting tokens
        navigate("/overview");
      } else {
        setShowErrorMessage(true)
      }
    } catch (error) {
      console.log(error.message);
      setShowErrorMessage(true)
    }
  };

  return (
    <Box
      sx={{
        height: "100vh",
        width: "100vw",
        backgroundColor: "#e1e1e3",
        overflow: "hidden",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Box
        sx={{
          width: "70%",
          height: "80%",
          minWidth: "600px",
          minHeight: "600px",
          display: "flex",
        }}
      >
        <Box
          sx={{
            width: "40%",
            backgroundColor: "white",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Box
            sx={{
              height: "30%",
            }}
          >
            <img
              src={chargeco}
              style={{
                height: "15%",
                width: "25%",
                marginTop: "35px",
                marginLeft: "35px",
              }}
            />
          </Box>
          <Box
            sx={{
              height: "70%",
            }}
          >
            <Typography
              sx={{
                marginLeft: "18%",
                fontSize: {
                  xl: '40px',
                  lg: '40px',
                  md: '35px',
                  sm: '30px',
                  xs: '25px'
                },
                fontFamily: "Arsenal SC"
              }}
            >
              Welcome To ChargEco
            </Typography>
            <Typography
              sx={{
                marginLeft: "18%",
                fontSize: {
                  xl: '35px',
                  lg: '35px',
                  md: '20px',
                  sm: '15px',
                  xs: '10px'
                },
                fontFamily: "Roboto Condensed",
                marginTop: '20px'
              }}
            >
              Sign in to your account
            </Typography>
            <Stack spacing={3} marginLeft={'18%'} marginTop={'5%'}>
              <TextField id="outlined-basic" label="Username" variant="outlined" value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyDown={handleKeyPress}
                sx={{
                  width: '70%',
                }} />
              <TextField id="outlined-basic" label="Password" variant="outlined" type="password" value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={handleKeyPress}
                sx={{
                  width: '70%'
                }} />
              {showErrorMessage && (
                <Typography color={'red'}>Incorrect username or password</Typography>
              )}
              <Button variant="contained" sx={{
                width: '25%',
                borderRadius: '20px',
                minWidth: '100px'
              }} onClick={handleLogin}>Log In</Button>
            </Stack>
          </Box>
        </Box>
        <Box
          sx={{
            width: "60%",
          }}
        >
          <img
            src={Digitalization}
            style={{
              height: "100%",
              width: "100%",
              objectFit: "cover",
              objectPosition: "center",
            }}
          />
        </Box>
      </Box>
    </Box>
  );
}

export default Login;
