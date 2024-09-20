import React from 'react'
import { useState, useEffect } from 'react'
import Sidebar from './components/Sidebar'
import { Box, Typography, Grid, Stack, FormControl, InputLabel, Select, MenuItem } from '@mui/material'
import OverviewCard from './components/cards/OverviewCard'
import SortableTableBilling from './components/SortableTableBilling'
import { BarChart } from '@mui/x-charts/BarChart';
import { LineChart } from '@mui/x-charts/LineChart';
import chargers from "./datasets/chargers.json";
import dayjs from "dayjs";
import axios from 'axios';
import LoadingOverlay from './components/LoadingOverlay'

function Billing() {

  const [accessToken, setAccessToken] = useState(localStorage.getItem('accessToken'))
  const [refreshToken, setRefreshToken] = useState(localStorage.getItem('refreshToken'))

  const [isLoading, setIsLoading] = useState(true);

  const [powerType, setPowerType] = useState("All");
  const [price, setPrice] = useState("All");
  const [charger, setCharger] = useState("All");

  const [billingRevenueChartData, setBillingRevenueChartData] = useState([]);
  const [billingEnergyChartData, setBillingEnergyChartData] = useState([]);

  const totalEnergies = billingRevenueChartData.map(data => data.total_energy);
  const totalRevenue = billingRevenueChartData.map(data => data.total_cost);
  const monthYear = billingRevenueChartData.map(data => data.month);

  const [avgEnergyPerMonthCard, setAvgEnergyPerMonthCard] = useState();
  const [avgCostPerMonthCard, setAvgCostPerMonthCard] = useState();

  // Table data
  const [tableData, setTableData] = useState([]);

  const handlePowerTypeChange = (event) => {
    setPowerType(event.target.value);
  }

  const handlePriceChange = (event) => {
    setPrice(event.target.value);
  }

  const handleChargerChange = (event) => {
    setCharger(event.target.value);
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
        
        const billingCards = await axios.post("http://localhost:8000/billingCards/", {
          power_type: powerType,
          price: price,
          charger: charger
        }, {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        })

        setAvgEnergyPerMonthCard(billingCards.data.average_energy_per_month)
        setAvgCostPerMonthCard(billingCards.data.average_cost_per_month)
        
        const tableResponse = await axios.post("http://localhost:8000/billingTable/", {
          power_type: powerType,
          price: price,
          charger: charger
        }, {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        });

        const tableDataArr = tableResponse.data;
        setTableData(tableDataArr.energy_expenditure_df);

        const billingRevenueChart = await axios.post("http://localhost:8000/billingRevenueChart/", {
          power_type: powerType,
          price: price,
          charger: charger
        }, {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        });

        setBillingRevenueChartData(billingRevenueChart.data.total_energy_cost);

        // const billingEnergyChart = await axios.post("http://localhost:8000/billingEnergyChart/", {
        //   power_type: powerType,
        //   price: price,
        //   charger: charger
        // }, {
        //   headers: {
        //     'Authorization': `Bearer ${accessToken}`
        //   }
        // })
        // const reformattedData = reformatBillingData(billingEnergyChart.data.total_monthly_charger);
        // console.log(reformattedData);
        // setBillingEnergyChartData(reformattedData)

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
  }, [powerType, price, charger, accessToken]);






  function reformatBillingData(billingEnergyChartData) {
    // Step 1: Initialize the reformatted data structure
    const chargerData = {};

    // Step 2: Loop through each data entry to populate the structure
    billingEnergyChartData.forEach(item => {
      const monthIndex = new Date(item.month).getMonth(); // Get the month index (0-11)

      Object.keys(item).forEach(key => {
        if (key !== 'month') {
          if (!chargerData[key]) {
            // Initialize the array with 12 zeros if it doesn't exist
            chargerData[key] = Array(12).fill(0);
          }
          // Update the monthly consumption
          chargerData[key][monthIndex] = item[key];
        }
      });
    });

    // Convert to the desired array format
    return Object.keys(chargerData).map(chargerId => ({
      chargerId,
      data: chargerData[chargerId]
    }));
  }



  return (

    <div style={{ position: 'relative' }}>
      {isLoading && <LoadingOverlay />}
      <>
        <Sidebar tab={'Billing'}></Sidebar>
        <Box sx={{
          display: 'flex',
          marginLeft: 'calc(max(15vw, 120px))',
          p: 2
        }}>
          <Grid container spacing={2} alignItems="stretch">
            <Grid item xs={12} md={12} lg={6} sx={{
              marginBottom: '30px'
            }}>
              <Grid container spacing={2} p={2}>
                <Typography
                  sx={{
                    fontFamily: "Mukta",
                    fontSize: "40px",
                    fontWeight: "500",
                  }}
                >
                  Billing
                </Typography>
                <Grid item xs={12} md={12} lg={12}>
                  <Stack direction={"column"} spacing={2}>
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
                    <FormControl fullWidth>
                      <InputLabel id="price">Price</InputLabel>
                      <Select
                        labelId="price"
                        id="price"
                        value={price}
                        label="Price"
                        onChange={handlePriceChange}
                      >
                        <MenuItem value={"All"}>All</MenuItem>
                        <MenuItem value={0.56}>0.56</MenuItem>
                        <MenuItem value={0.5955}>0.5955</MenuItem>
                        <MenuItem value={0.696}>0.696</MenuItem>
                        
                      </Select>
                    </FormControl>
                    <FormControl fullWidth>
                      <InputLabel id="charger">Charger</InputLabel>
                      <Select
                        labelId="charger"
                        id="charger"
                        value={charger}
                        label="Charger"
                        onChange={handleChargerChange}
                      >
                         {chargers.map((charger, index) => (
                        <MenuItem key={index} value={charger}>
                          {charger}
                        </MenuItem>
                      ))}
                      </Select>
                    </FormControl>
                  </Stack>
                </Grid>
                <Grid item xs={12} md={6} lg={6}>
                  <OverviewCard number={avgEnergyPerMonthCard} text={"Average Monthly Energy Consumption (kWh)"}></OverviewCard>
                </Grid>
                <Grid item xs={12} md={6} lg={6}>
                  <OverviewCard number={avgCostPerMonthCard !== undefined ? avgCostPerMonthCard.toFixed(2) : ''} text={"Average Monthly Revenue ($)"}></OverviewCard>
                </Grid>
              </Grid>
            </Grid>
            <Grid item xs={12} md={12} lg={6}>
              <SortableTableBilling height={"400px"} data={tableData} />
            </Grid>
            <Grid item xs={12} md={12} lg={12}>
              <BarChart
                series={[
                  { data: totalEnergies, label: 'Energy Consumption (kWh)', color: '#001c71' },
                  { data: totalRevenue, label: 'Revenue ($)', color: '#abca54' },
                ]}
                xAxis={[
                  {
                    data: monthYear,
                    scaleType: "band",
                  },
                ]}
                height={750}
                sx={{
                  padding: 2
                }}
              />
            </Grid>
            <Grid item xs={12} md={12} lg={12}>
              {/* <LineChart
                xAxis={[
                  {
                    data: monthYear,
                    scaleType: "band",
                  },
                ]}
                series={billingEnergyChartData.map(item => ({
                  data: item.data
                }))}
                height={700}
              /> */}
            </Grid>
          </Grid>
        </Box>
      </>
    </div>
  )
}

export default Billing