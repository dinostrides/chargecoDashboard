import React from 'react'
import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar'
import { Box, Typography, Grid, Stack, MenuItem, FormControl, InputLabel, Select, Card, CardContent } from '@mui/material'
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import dayjs from "dayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { DemoContainer } from "@mui/x-date-pickers/internals/demo";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import UserCard from './components/cards/UserCard';
import { PieChart, pieArcLabelClasses } from '@mui/x-charts/PieChart';
import { LineChart } from '@mui/x-charts/LineChart';
import addresses from "./datasets/utilisationAddresses.json";
import LoadingOverlay from './components/LoadingOverlay';
import axios, { all } from 'axios';

function Users() {
  const [isLoading, setIsLoading] = useState(true);
  const [startDate, setStartDate] = useState(dayjs("2022-04-17"));
  const [endDate, setEndDate] = useState(dayjs("2022-04-17"));
  const [address, setAddress] = useState("");
  const [charger, setCharger] = useState("");
  const [pieChartDataUser, setPieChartDataUser] = useState();
  const [pieChartDataFleet, setPieChartDataFleet] = useState();
  const [pieChartDataMember, setPieChartDataMember] = useState();
  const [pieChartDataPartner, setPieChartDataPartner] = useState();

  const handleAddressChange = (event) => {
    setAddress(event.target.value);
  };

  const handleChargerChange = (event) => {
    setCharger(event.target.value);
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);

        const allData = await axios.post("http://localhost:8000/usersDonutCharts/", {
          start_date: startDate,
          end_date: endDate,
          address: address,
          charger: charger
        })

        setPieChartDataUser(allData.data.user_donut)
        setPieChartDataFleet(allData.data.fleet_donut)
        setPieChartDataMember(allData.data.member_donut)
        setPieChartDataPartner(allData.data.partner_donut)
      }
      catch (error) {
        console.log(error.message)
      }
      finally {
        setIsLoading(false); // Ensure this is executed even if there's an error
      }
    }
    fetchData();
  }, [startDate, endDate, address, charger])

  return (
    <div style={{ position: 'relative' }}>
      {isLoading && <LoadingOverlay />}
      <>
        <Sidebar tab={'Users'}></Sidebar>
        <Box sx={{
          display: 'flex',
          marginLeft: 'calc(max(15vw, 120px))',
          p: 2
        }}>
          <Grid container spacing={2} alignItems="stretch">
            <Grid item xs={12} md={12} lg={6} sx={{
              marginBottom: '30px'
            }}>
              <Grid item sm={12} md={12} lg={12}>
                <Typography
                  sx={{
                    fontFamily: "Mukta",
                    fontSize: "40px",
                    fontWeight: "500",
                  }}
                >
                  Users
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
              </Grid>


            </Grid>
            <Grid item xs={12} md={12} lg={6}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={12} md={12} lg={12} sx={{
                  marginTop: "55px"
                }}>
                  <Card
                    sx={{
                      height: "100px",
                      overflow: "hidden",
                      bgcolor: "white",
                      borderRadius: "20px",
                      color: "black",
                      boxShadow: 4
                    }}
                  >
                    <CardContent>
                      <Typography
                        sx={{
                          fontWeight: "1000",
                          fontSize: "25px",
                          textAlign: "center"
                        }}
                      >
                        3090
                      </Typography>
                      <Typography
                        sx={{
                          marginLeft: "20px",
                          textAlign: "center"
                        }}
                      >
                        Total Users
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={12} md={6} lg={6}>
                  <UserCard number={2432} text={"Public"}></UserCard>
                </Grid>
                <Grid item xs={12} sm={12} md={6} lg={6}>
                  <UserCard number={313} text={"Fleet"}></UserCard>

                </Grid>
                <Grid item xs={12} sm={12} md={6} lg={6}>
                  <UserCard number={359} text={"Members"}></UserCard>
                </Grid>
                <Grid item xs={12} sm={12} md={6} lg={6}>
                  <UserCard number={1} text={"Partner"}></UserCard>
                </Grid>
              </Grid>
            </Grid>
            <Grid item xs={12} md={12} lg={12} xl={6}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  height: '100%', // Ensures the box takes up the full height of the grid item
                }}
              >
                <PieChart
                series={[
                  {
                    arcLabel: (item) => `${item.label} (${item.value})`,
                    arcLabelMinAngle: 45,
                    data: pieChartDataUser
                      ? Object.entries(pieChartDataUser).map(([label, value], id) => ({
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
              </Box>
            </Grid>
            <Grid item xs={12} md={12} lg={12} xl={6}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  height: '100%', // Ensures the box takes up the full height of the grid item
                }}
              >
                <PieChart
                series={[
                  {
                    arcLabel: (item) => `${item.label} (${item.value})`,
                    arcLabelMinAngle: 45,
                    data: pieChartDataFleet
                      ? Object.entries(pieChartDataFleet).map(([label, value], id) => ({
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
              </Box>
            </Grid>
            <Grid item xs={12} md={12} lg={12} xl={6}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  height: '100%', // Ensures the box takes up the full height of the grid item
                }}
              >
                <PieChart
                series={[
                  {
                    arcLabel: (item) => `${item.label} (${item.value})`,
                    arcLabelMinAngle: 45,
                    data: pieChartDataMember
                      ? Object.entries(pieChartDataMember).map(([label, value], id) => ({
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
              </Box>
            </Grid>
            <Grid item xs={12} md={12} lg={12} xl={6}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  height: '100%', // Ensures the box takes up the full height of the grid item
                }}
              >
                <PieChart
                series={[
                  {
                    arcLabel: (item) => `${item.label} (${item.value})`,
                    arcLabelMinAngle: 45,
                    data: pieChartDataPartner
                      ? Object.entries(pieChartDataPartner).map(([label, value], id) => ({
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
              </Box>
            </Grid>
            <Grid item xs={12} md={12} lg={12}>
              <LineChart
                xAxis={[{ data: [1, 2, 3, 5, 8, 10] }]}
                series={[
                  {
                    data: [2, 5.5, 2, 8.5, 1.5, 5],
                  },
                ]}
                height={300}
                margin={{ left: 30, right: 30, top: 30, bottom: 30 }}
                grid={{ vertical: true, horizontal: true }}
              />
            </Grid>
          </Grid>
        </Box>
      </>
    </div>



  )
}

export default Users