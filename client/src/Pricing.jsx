import React from 'react'
import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar'
import { Box, Typography, Grid, Stack, FormControl, InputLabel, Select, MenuItem } from '@mui/material'
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import dayjs from "dayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { DemoContainer } from "@mui/x-date-pickers/internals/demo";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { PieChart, pieArcLabelClasses } from '@mui/x-charts/PieChart';
import { ScatterChart } from '@mui/x-charts/ScatterChart';
import PricingCard from './components/cards/PricingCard.jsx';
import axios from 'axios';
import LoadingOverlay from './components/LoadingOverlay.jsx';
import './lineGraph.css'; 

function Pricing() {

  const [accessToken, setAccessToken] = useState(localStorage.getItem('accessToken'))
  const [refreshToken, setRefreshToken] = useState(localStorage.getItem('refreshToken'))

  const [isLoading, setIsLoading] = useState(true);
  const [startDate, setStartDate] = useState(dayjs('2023-02-03'));
  const [endDate, setEndDate] = useState(dayjs('2024-05-29'));
  const [powerType, setPowerType] = useState("All");

  const [avgPrice, setAvgPrice] = useState();
  const [pieChartData, setPieChartData] = useState();
  const [pricingRateUtilisationChart, setPricingRateUtilisationChart] = useState();

  const handlePowerTypeChange = (event) => {
    setPowerType(event.target.value);
  }


  const refreshAccessToken = async (refreshToken) => {
    try {
      const response = await axios.post('http://localhost:8000/api/token/refresh/', {
        refresh: refreshToken
      });
      return response.data;  // { access: newAccessToken, refresh: newRefreshToken }
    } catch (error) {
      console.error('Failed to refresh token', error);
      throw error;
    }
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        const pricingCards = await axios.post('http://localhost:8000/pricingCards/', {
          start_date: startDate,
          end_date: endDate,
          power_type: powerType
        }, {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        })

        setAvgPrice(pricingCards.data.avg_price)

        const pricingPaymentModeChart = await axios.post('http://localhost:8000/pricingPaymentModeChart/', {
          start_date: startDate,
          end_date: endDate,
          power_type: powerType
        }, {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        })

        setPieChartData(pricingPaymentModeChart.data.payment_mode_donut);

        const pricingUtilisationPriceChart = await axios.post('http://localhost:8000/pricingUtilisationPriceChart/', {
          start_date: startDate,
          end_date: endDate,
          power_type: powerType
        }, {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        })

        setPricingRateUtilisationChart(pricingUtilisationPriceChart.data.util_price_chart)

      } catch (error) {
        if (error.response?.data?.detail === "Invalid or expired token") {
          try {
            const { access } = await refreshAccessToken(refreshToken);
            localStorage.setItem('accessToken', access);
            setAccessToken(access);
          } catch (refreshError) {
            console.error('Failed to refresh token and retry API call', refreshError);
            // Handle token refresh failure (e.g., redirect to login)
          }
        } else {
          console.error('API request failed', error);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [startDate, endDate, powerType, accessToken]);



 

  return (

    <div style={{ position: 'relative' }}>
      {isLoading && <LoadingOverlay />}
      <>
        <Sidebar tab={'Pricing'}></Sidebar>
        <Box sx={{
          display: 'flex',
          marginLeft: 'calc(max(15vw, 120px))',
          p: 2
        }}>
          <Grid container spacing={2} alignItems="stretch">
            <Grid item xs={12} md={12} lg={6} sx={{
              marginBottom: '30px'
            }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={12} md={12} lg={12}>
                  <Typography
                    sx={{
                      fontFamily: "Mukta",
                      fontSize: "40px",
                      fontWeight: "500",
                    }}
                  >
                    Pricing
                  </Typography>
                  <Stack direction={"column"} spacing={3} sx={{
                    marginTop: '20px'
                  }}>
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                      <DemoContainer components={["DatePicker"]}>
                        <DatePicker
                          label="Start Date"
                          value={startDate}
                          onChange={(newValue) => setStartDate(newValue)}
                          sx={{ width: '100%' }}
                        />
                      </DemoContainer>
                    </LocalizationProvider>

                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                      <DemoContainer components={["DatePicker"]}>
                        <DatePicker
                          label="End Date"
                          value={endDate}
                          onChange={(newValue) => setEndDate(newValue)}
                          sx={{ width: '100%' }}
                        />
                      </DemoContainer>
                    </LocalizationProvider>

                    <FormControl fullWidth>
                      <InputLabel id="powerType">Power Type</InputLabel>
                      <Select
                        labelId="powerType"
                        id="powerType"
                        value={powerType}
                        label="Power Type"
                        onChange={handlePowerTypeChange}
                      >
                        <MenuItem value={"All"}>All</MenuItem>
                        <MenuItem value={"AC"}>AC</MenuItem>
                        <MenuItem value={"DC"}>DC</MenuItem>
                      </Select>
                    </FormControl>
                    <PricingCard number={avgPrice} text={"Average Rate After Discount ($/kWh)"}></PricingCard>
                  </Stack>
                </Grid>
              </Grid>
            </Grid>
            <Grid item xs={12} md={12} lg={6} marginTop={'20px'}>
              <PieChart
                series={[
                  {
                    arcLabel: (item) => `${item.label} (${item.value})`,
                    arcLabelMinAngle: 45,
                    data: pieChartData
                      ? Object.entries(pieChartData).map(([label, value], id) => ({
                        id,
                        value,
                        label,
                      }))
                      : [],
                  },
                ]}
                sx={{
                  [`& .${pieArcLabelClasses.root}`]: {
                    fill: 'white',
                    fontWeight: 'bold',
                  },
                }}
                height={420}
              />
            </Grid>
            <Grid item xs={12} md={12} lg={12}>
            <div className="custom-y-padding-bottom"> 
              <ScatterChart
                height={700}
                grid={{ vertical: true, horizontal: true }}
                xAxis={[
                  {
                    label: "Utilisation Rate (%)",
                  },
                ]}
                yAxis={[
                  {
                    label: "Average Rate ($)",
                  },
                ]}
                series={[
                  {
                    data: pricingRateUtilisationChart
                      ? pricingRateUtilisationChart.map((v) => ({
                        x: v['Utilisation Rate'] * 100,
                        y: v['Rate'],
                        id: v['Charger ID'],
                      }))
                      : [],
                      color: '#001c71'
                  },
                ]}
              />
              </div>
            </Grid>
          </Grid>
        </Box>
      </>
    </div>



  )
}

export default Pricing