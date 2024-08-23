import React from "react";
import { Box, Typography, TextField, Stack, Button } from "@mui/material";
import Digitalization from "./assets/digitalization.jpg";
import chargeco from "./assets/chargeco.png";
import { useNavigate } from 'react-router-dom'

function Login() {

  const navigate = useNavigate();

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
              <TextField id="outlined-basic" label="Username" variant="outlined" sx={{
                width: '70%',
              }} />
              <TextField id="outlined-basic" label="Password" variant="outlined" type="password" sx={{
                width: '70%'
              }} />
              <Button variant="contained" sx={{
                width: '25%',
                borderRadius: '20px',
                minWidth: '100px'
              }} onClick={() => { navigate('/overview') }}>Log In</Button>
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
