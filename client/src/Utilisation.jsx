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
import addresses from "./datasets/addresses.json"


function Utilisation() {

  const [address, setAddress] = useState();
  const [charger, setCharger] = useState();
  const [startDate, setStartDate] = useState(dayjs("2022-04-17"));
  const [endDate, setEndDate] = useState(dayjs("2022-04-17"));

  //Cards
  const [totalChargingSessions, setTotalChargingSessions] = useState();
  const [acChargingStations, setAcChargingStations] = useState();
  const [dcChargingStations, setDcChargingStations] = useState();
  const [avgMinPerAcSession, setAvgMinPerAcSession] = useState();
  const [avgMinPerDcSession, setAvgMinPerDcSession] = useState();

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
          end_date: endDate
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
        console.log(utilisationClusterMap.data.clustermap_markers_json)
        // can get data already (lat long) but need to ask about how we want to display it
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
                <UtilisationCard number={avgMinPerAcSession} text={"Avg. Minutes/AC Session"}></UtilisationCard>
              </Grid>

              <Grid item xs={12} md={6}>
                <UtilisationCard number={avgMinPerDcSession} text={"Avg. Minutes/DC Session"}></UtilisationCard>
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
                xAxis={[{ data: [1, 2, 3, 5, 8, 10] }]}
                series={[
                  {
                    data: [2, 5.5, 2, 8.5, 1.5, 5],
                  },
                ]}
                width={1500}
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
                          height: "100%",
                        }}
                      >
                        <BarChart
                          series={[
                            { data: [35, 44, 24, 34] },
                            { data: [51, 6, 49, 30] },
                            { data: [15, 25, 30, 50] },
                            { data: [60, 50, 15, 25] },
                          ]}
                          xAxis={[
                            {
                              data: ["Q1", "Q2", "Q3", "Q4"],
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
                          height: "100%",
                        }}
                      >
                        <BarChart
                          series={[
                            { data: [35, 44, 24, 34] },
                            { data: [51, 6, 49, 30] },
                            { data: [15, 25, 30, 50] },
                            { data: [60, 50, 15, 25] },
                          ]}
                          xAxis={[
                            {
                              data: ["Q1", "Q2", "Q3", "Q4"],
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
  )
}

export default Utilisation