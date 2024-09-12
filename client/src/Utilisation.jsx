import React from 'react'
import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar'
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Stack,
  InputLabel,
  MenuItem,
  FormControl,
  Select,
} from "@mui/material";
import { DemoContainer } from "@mui/x-date-pickers/internals/demo";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import dayjs from "dayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LineChart } from '@mui/x-charts/LineChart';
import { BarChart } from "@mui/x-charts/BarChart";
import UtilisationCard from './components/cards/UtilisationCard';
import axios from 'axios';
import addresses from "./datasets/utilisationAddresses.json";
import chargers from "./datasets/chargers.json";
import LoadingOverlay from './components/LoadingOverlay';
import ClusterMap from './components/ClusterMap';


function Utilisation() {
  const [accessToken, setAccessToken] = useState(localStorage.getItem('accessToken'))
  const [refreshToken, setRefreshToken] = useState(localStorage.getItem('refreshToken'))

  const [isLoading, setIsLoading] = useState(true);

  const [address, setAddress] = useState("All");
  const [charger, setCharger] = useState("All");
  const [startDate, setStartDate] = useState(dayjs("2022-04-17"));
  const [endDate, setEndDate] = useState(dayjs("2022-04-17"));

  //Cards
  const [totalChargingSessions, setTotalChargingSessions] = useState();
  const [acChargingStations, setAcChargingStations] = useState();
  const [dcChargingStations, setDcChargingStations] = useState();
  const [avgMinPerAcSession, setAvgMinPerAcSession] = useState();
  const [avgMinPerDcSession, setAvgMinPerDcSession] = useState();

  const [utilChartData, setUtilChartData] = useState([]);
  const xAxisData = utilChartData.map(item => item.Hour);
  const seriesData = utilChartData.map(item => item["Average Utilisation"] * 100);

  const [avgUtilisationDay, setAvgUtilisationDay] = useState();
  const [avgUtilisationNight, setAvgUtilisationNight] = useState();
  const [avgUtilisationWeekday, setAvgUtilisationWeekday] = useState();
  const [avgUtilisationWeekend, setAvgUtilisationWeekend] = useState();

  const [clusterMapData, setClusterMapData] = useState([]);

  const handleAddressChange = (event) => {
    setAddress(event.target.value);
  };

  const handleChargerChange = (event) => {
    setCharger(event.target.value);
  };


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
        const utilisationLeftCards = await axios.post("http://localhost:8000/utilisationLeftCards/", {
          start_date: startDate,
          end_date: endDate,
          address: address,
          charger: charger
        },{
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        })
        const data = utilisationLeftCards.data
        setTotalChargingSessions(data.total_charging_sessions);
        setAcChargingStations(data.ac_sessions);
        setDcChargingStations(data.dc_sessions);
        setAvgMinPerAcSession(data.ac_avg_duration);
        setAvgMinPerDcSession(data.dc_avg_duration);

        const utilisationClusterMap = await axios.post("http://localhost:8000/utilisationClusterMap/", {
          start_date: startDate,
          end_date: endDate
        },{
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        })

        setClusterMapData(utilisationClusterMap.data.clustermap_markers_json)
        

        const utilisationUtilChart = await axios.post("http://localhost:8000/utilisationUtilChart/", {
          start_date: startDate,
          end_date: endDate
        },{
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        })

        setUtilChartData(utilisationUtilChart.data.utilisation_hourly_chart_data_json)

        const utilisationBarChart = await axios.post("http://localhost:8000/utilisationBarChart/", {
          start_date: startDate,
          end_date: endDate
        },{
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        })

        const dayNightData = utilisationBarChart.data.util_dayNight_data_json;
        setAvgUtilisationDay(dayNightData[0].Utilisation);
        setAvgUtilisationNight(dayNightData[1].Utilisation);

        const weekdayWeekendData = utilisationBarChart.data.util_weekdayWeekend_data_json;
        setAvgUtilisationWeekday(weekdayWeekendData[0].Utilisation);
        setAvgUtilisationWeekend(weekdayWeekendData[1].Utilisation);
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
  }, [startDate, endDate, accessToken]);



  return (


    <div style={{ position: 'relative' }}>
      {isLoading && <LoadingOverlay />}
      <>
      <Sidebar tab={'Utilisation'}></Sidebar>
      <Box sx={{
        display: 'flex',
        marginLeft: 'calc(max(15vw, 120px))',
        p: 2
      }}>
        <Grid container spacing={2} alignItems="stretch">
          <Grid item md={12} lg={12} xl={4}>
            <Grid container spacing={2}>
              <Grid item sm={12}>
                <Typography
                  sx={{
                    fontFamily: "Mukta",
                    fontSize: "40px",
                    fontWeight: "500",
                    marginBottom: "20px",
                  }}
                >
                  Utilisation
                </Typography>
                <Stack direction={"row"} spacing={2}>
                  <Box sx={{ width: '100%' }}>
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                      <DemoContainer components={["DatePicker"]}>
                        <DatePicker
                          label="Start Date"
                          value={startDate}
                          onChange={(newValue) => setStartDate(newValue)}
                          sx={{ width: '100%' }} // Make the DatePicker full width
                        />
                      </DemoContainer>
                    </LocalizationProvider>
                  </Box>

                  <Box sx={{ width: '100%' }}>
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                      <DemoContainer components={["DatePicker"]}>
                        <DatePicker
                          label="End Date"
                          value={endDate}
                          onChange={(newValue) => setEndDate(newValue)}
                          sx={{ width: '100%' }} // Make the DatePicker full width
                        />
                      </DemoContainer>
                    </LocalizationProvider>
                  </Box>
                </Stack>
                <Stack direction={"row"} spacing={3} sx={{
                  marginTop: '40px'
                }}>
                  <FormControl
                    fullWidth
                  >
                    <InputLabel id="address">
                      Address
                    </InputLabel>
                    <Select
                      labelId="address"
                      id="address"
                      value={address}
                      label="Address"
                      onChange={handleAddressChange}
                    >
                      {addresses.map((addr, index) => (
                        <MenuItem key={index} value={addr}>
                          {addr}
                        </MenuItem>
                      ))}
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
                <Card
                  sx={{
                    height: "100px",
                    overflow: "hidden",
                    bgcolor: "white",
                    borderRadius: "20px",
                    color: "black",
                    boxShadow: '4',
                    marginTop: '30px'
                  }}
                >
                  <CardContent>
                    <Typography
                      sx={{
                        fontWeight: "1000",
                        fontSize: "25px",
                        textAlign: 'center'
                      }}
                    >
                      {totalChargingSessions}
                    </Typography>
                    <Typography
                      sx={{
                        marginLeft: "20px",
                        textAlign: 'center'
                      }}
                    >
                      Total Charging Sessions
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <UtilisationCard number={acChargingStations} text={"AC Charging Stations"}></UtilisationCard>
              </Grid>

              <Grid item xs={12} md={6}>
                <UtilisationCard number={dcChargingStations} text={"DC Charging Sessions"}></UtilisationCard>
              </Grid>

              <Grid item xs={12} md={6}>
                <UtilisationCard number={avgMinPerAcSession !== undefined ? avgMinPerAcSession.toFixed(2) : ''} text={"Avg. Minutes/AC Session"} />
              </Grid>


              <Grid item xs={12} md={6}>
                <UtilisationCard number={avgMinPerDcSession !== undefined ? avgMinPerDcSession.toFixed(2) : ''} text={"Avg. Minutes/DC Session"}></UtilisationCard>
              </Grid>
            </Grid>
          </Grid>
          <Grid item xs={12} md={12} lg={12} xl={8} sx={{ display: 'flex' }}>
            <ClusterMap data={clusterMapData}></ClusterMap>
          </Grid>
          {/* Bottom row with 2 items */}
          <Grid item xs={12}>
            <Box sx={{ p: 2 }}>
              <LineChart
                xAxis={[{ data: xAxisData, label: "Hour of Day" }]}
                series={[
                  {
                    data: seriesData,
                    area: true,
                    label: "Average Utilisation Rate (%)",
                    color: "#99c99e"
                  },
                ]}
                height={400}
              />
            </Box>
          </Grid>
          <Grid item xs={12}>
            <Box sx={{ p: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Box
                    sx={{
                      color: "white",
                      height: "50vh",
                    }}
                  >
                    <Card
                      sx={{
                        height: "100%",
                        boxShadow: "none",
                      }}
                    >
                      <CardContent
                        sx={{
                          height: "95%",
                        }}
                      >
                        <BarChart
                          series={[
                            { data: [avgUtilisationDay, avgUtilisationNight], label: 'Average Utilisation (%)', color: '#99c99e' },
                          ]}
                          xAxis={[
                            {
                              data: ["Day", "Night"],
                              scaleType: "band",
                            },
                          ]}
                        />
                      </CardContent>
                    </Card>
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Box
                    sx={{
                      color: "white",
                      height: "50vh",
                    }}
                  >
                    <Card
                      sx={{
                        height: "100%",
                        boxShadow: "none",
                      }}
                    >
                      <CardContent
                        sx={{
                          height: "95%",
                        }}
                      >
                        <BarChart
                          series={[
                            { data: [avgUtilisationWeekday, avgUtilisationWeekend], label: 'Average Utilisation (%)', color: '#99c99e' },
                          ]}
                          xAxis={[
                            {
                              data: ["Weekday", "Weekend"],
                              scaleType: "band",
                            },
                          ]}
                        />
                      </CardContent>
                    </Card>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </>

      </div>
    
  )
}

export default Utilisation