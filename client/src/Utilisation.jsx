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
import LeafletMap from './components/LeafletMap';
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


function Utilisation() {

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

  const handleAddressChange = (event) => {
    setAddress(event.target.value);
  };

  const handleChargerChange = (event) => {
    setCharger(event.target.value);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const utilisationLeftCards = await axios.post("http://localhost:8000/utilisationLeftCards/", {
          start_date: startDate,
          end_date: endDate,
          address: address,
          charger: charger
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
        })
        // console.log(utilisationClusterMap.data.clustermap_markers_json)
        // can get data already (lat long) but need to ask about how we want to display it

        const utilisationUtilChart = await axios.post("http://localhost:8000/utilisationUtilChart/", {
          start_date: startDate,
          end_date: endDate
        })

        setUtilChartData(utilisationUtilChart.data.utilisation_hourly_chart_data_json)

        const utilisationBarChart = await axios.post("http://localhost:8000/utilisationBarChart/", {
          start_date: startDate,
          end_date: endDate
        })

        const dayNightData = utilisationBarChart.data.util_dayNight_data_json;
        setAvgUtilisationDay(dayNightData[0].Utilisation);
        setAvgUtilisationNight(dayNightData[1].Utilisation);

        const weekdayWeekendData = utilisationBarChart.data.util_weekdayWeekend_data_json;
        setAvgUtilisationWeekday(weekdayWeekendData[0].Utilisation);
        setAvgUtilisationWeekend(weekdayWeekendData[1].Utilisation);

      }
      catch (error) {
        console.log(error.message)
      }
    }
    fetchData();
    console.log(startDate.$d, endDate.$d)
  }, [startDate, endDate])

  return (
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
                      <MenuItem value={10}>All</MenuItem>
                      <MenuItem value={20}>Option</MenuItem>
                      <MenuItem value={30}>Option</MenuItem>
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
            <LeafletMap />
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
                    color: "pink"
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
                            { data: [avgUtilisationDay, avgUtilisationNight], label: 'Average Utilisation (%)', color: 'pink' },
                          ]}
                          xAxis={[
                            {
                              data: ["Day", "Night"],
                              scaleType: "band",
                              label: 'Average Utilisation By Day / Night'
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
                            { data: [avgUtilisationWeekday, avgUtilisationWeekend], label: 'Average Utilisation (%)', color: 'pink' },
                          ]}
                          xAxis={[
                            {
                              data: ["Weekday", "Weekend"],
                              scaleType: "band",
                              label: 'Average Utilisation By Weekday / Weekend'
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
  )
}

export default Utilisation