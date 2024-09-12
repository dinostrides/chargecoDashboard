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
import './lineGraph.css';
import chargers from "./datasets/chargers.json";

function Users() {

  const [accessToken, setAccessToken] = useState(localStorage.getItem('accessToken'))
  const [refreshToken, setRefreshToken] = useState(localStorage.getItem('refreshToken'))

  const [isLoading, setIsLoading] = useState(true);
  const [startDate, setStartDate] = useState(dayjs("2022-04-17"));
  const [endDate, setEndDate] = useState(dayjs("2022-04-17"));
  const [address, setAddress] = useState("All");
  const [charger, setCharger] = useState("All");
  const [pieChartDataUser, setPieChartDataUser] = useState();
  const [pieChartDataFleet, setPieChartDataFleet] = useState();
  const [pieChartDataMember, setPieChartDataMember] = useState();
  const [pieChartDataPartner, setPieChartDataPartner] = useState();
  const [fleetOverTime, setFleetOverTime] = useState([]);
  const [memberOverTime, setMemberOverTime] = useState([]);
  const [partnerOverTime, setPartnerOverTime] = useState([]);
  const [publicOverTime, setPublicOverTime] = useState([]);

  //User cards
  const [totalUsersCard, setTotalUsersCard] = useState();
  const [publicCard, setPublicCard] = useState();
  const [fleetCard, setFleetCard] = useState();
  const [memberCard, setMemberCard] = useState();
  const [partnerCard, setPartnerCard] = useState();


  const formatLabel = (label, maxLength) => {
    if (label.length <= maxLength) return label;
  
    // Calculate break points
    const firstBreak = Math.ceil(label.length / 3)-1;
    const secondBreak = Math.ceil((2 * label.length) / 3)-1;
  
    return `${label.slice(0, firstBreak)}\n${label.slice(firstBreak, secondBreak)}\n${label.slice(secondBreak)}`;
  };
  
  const handleAddressChange = (event) => {
    setAddress(event.target.value);
  };

  const handleChargerChange = (event) => {
    setCharger(event.target.value);
  }
  
  const truncateLabel = (label, maxLength) => {
    if (label.length <= maxLength) return label;
    return label.slice(0, maxLength) + '...'; // Add ellipsis if truncating
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
        
        const userCards = await axios.post("http://localhost:8000/usersCards/", {
          start_date: startDate,
          end_date: endDate,
          address: address,
          charger: charger
        }, {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        })

        setTotalUsersCard(userCards.data.num_total)
        setFleetCard(userCards.data.num_fleet)
        setPublicCard(userCards.data.num_public)
        setPartnerCard(userCards.data.num_partner)
        setMemberCard(userCards.data.num_member)

        

        const allData = await axios.post("http://localhost:8000/usersDonutCharts/", {
          start_date: startDate,
          end_date: endDate,
          address: address,
          charger: charger
        }, {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        })

        setPieChartDataUser(allData.data.user_donut)
        setPieChartDataFleet(allData.data.fleet_donut)
        setPieChartDataMember(allData.data.member_donut)
        setPieChartDataPartner(allData.data.partner_donut)
        setFleetOverTime(Object.values(allData.data.user_across_time_chart.Fleet))
        setMemberOverTime(Object.values(allData.data.user_across_time_chart.Member))
        setPartnerOverTime(Object.values(allData.data.user_across_time_chart.Partner))
        setPublicOverTime(Object.values(allData.data.user_across_time_chart.Public))

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
                  {chargers.map((charger, index) => (
                        <MenuItem key={index} value={charger}>
                          {charger}
                        </MenuItem>
                      ))}
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
                        {totalUsersCard}
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
                  <UserCard number={publicCard} text={"Public"}></UserCard>
                </Grid>
                <Grid item xs={12} sm={12} md={6} lg={6}>
                  <UserCard number={fleetCard} text={"Fleet"}></UserCard>

                </Grid>
                <Grid item xs={12} sm={12} md={6} lg={6}>
                  <UserCard number={memberCard} text={"Members"}></UserCard>
                </Grid>
                <Grid item xs={12} sm={12} md={6} lg={6}>
                  <UserCard number={partnerCard} text={"Partner"}></UserCard>
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
          arcLabel: (item) => `${formatLabel(item.label, 20)}\n(${item.value})`,
          arcLabelMinAngle: 45,
          data: pieChartDataMember
            ? Object.entries(pieChartDataMember).map(([label, value], id) => ({
                id,
                value,
                label: formatLabel(label, 20),
              }))
            : [],
        },
      ]}
      sx={{
        [`& .${pieArcLabelClasses.root}`]: {
          fill: 'white',
          fontWeight: 'bold',
          fontSize: '12px', // Adjust font size here
          whiteSpace: 'pre-line', // Ensures that \n is treated as a line break
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
            <div className="custom-y-padding-bottom">
      <LineChart
        xAxis={[{ data: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15] }]}
        series={[
          { data: fleetOverTime, label: "Fleet" },
          { data: memberOverTime, label: "Member" },
          { data: publicOverTime, label: "Public" },
          { data: partnerOverTime, label: "Partner" }
        ]}
        yAxis={[{ label: "Number of users" }]}
        height={800}
      />
    </div>
            </Grid>
          </Grid>
        </Box>
      </>
    </div>



  )
}

export default Users