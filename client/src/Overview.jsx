import React, { useEffect } from "react";
import { useState } from "react";
import Sidebar from "./components/Sidebar";
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
import Legend from "./components/Legend";
import LeafletMap from "./components/LeafletMap";
import OverviewCard from "./components/cards/OverviewCard";
import SortableTable from './components/SortableTable'
import axios from 'axios';

function Overview() {
  const today = dayjs();
  const oneYearAgo = today.subtract(1, 'year');
  const [startDate, setStartDate] = useState(oneYearAgo);
  const [endDate, setEndDate] = useState(today);
  const [locationStatus, setLocationStatus] = useState();
  const [powerType, setPowerType] = useState("");
  const [mapData, setMapData] = useState({ lat: [], lon: [], color: [] });

  //Left cards
  const [locationsUtilised, setLocationsUtilised] = useState();
  const [avgChargingSessionsPerLocation, setAvgChargingSessionsPerLocation] = useState();
  const [avgUniqueVehiclesPerLocation, setAvgUniqueVehiclesPerLocation] = useState();
  const [avgUtilisation, setAvgUtilisation] = useState();

  // Right cards
  const [totalLocations, setTotalLocations] = useState();
  const [totalChargingPoints, setTotalChargingPoints] = useState();

  // useEffect(()=>{
  //   console.log(startDate.$d, endDate.$d)
  // }, [startDate, endDate])


  const handleLocationStatusChange = (event) => {
    setLocationStatus(event.target.value);
  };

  const handlePowerTypeChange = (event) => {
    setPowerType(event.target.value);
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetching map coordinates
        const map_coordinates = await axios.post('http://localhost:8000/overviewMap/', {
          location_status: locationStatus,
          power_type: powerType
        })
        const dataString = map_coordinates.data
        const data = JSON.parse(dataString)
        setMapData(data);

        const rightCards = await axios.post('http://localhost:8000/overviewRightCards/', {
          location_status: locationStatus,
          power_type: powerType
        });

        setTotalLocations(rightCards.data.total_locations)
        setTotalChargingPoints(rightCards.data.total_charging_points)

        const leftCards = await axios.post('http://localhost:8000/overviewLeftCards/', {
          start_date: startDate,
          end_date: endDate
        });
        
        setLocationsUtilised(leftCards.data.locations_utilised);
        setAvgChargingSessionsPerLocation(leftCards.data.avg_charging_sessions_per_location);
        setAvgUniqueVehiclesPerLocation(leftCards.data.avg_unique_vehicles_per_location);
        setAvgUtilisation(leftCards.data.avg_utilisation);

        
      }
      catch (error) {
        console.log(error.message)
      }
    }
    fetchData();
  }, [startDate, endDate])

  return (
    <>
      <Sidebar tab={"Overview"} />
      <Box
        sx={{
          display: "flex",
          marginLeft: "calc(max(15vw, 120px))",
          p: 2
        }}
      >
        <Grid container spacing={2} alignItems={"stretch"}>
          <Grid item md={12} lg={6}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={12} md={12} lg={12}>
                <Typography
                  sx={{
                    fontFamily: "Mukta",
                    fontSize: "40px",
                    fontWeight: "500",
                    marginBottom: "20px",
                  }}
                >
                  Overview
                </Typography>
                <Stack direction={"row"} spacing={2}>
                  <Grid item xs={6} sm={6} md={6} lg={6}>
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
                  </Grid>
                  <Grid item xs={6} sm={6} md={6} lg={6}>
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
                  </Grid>
                </Stack>
              </Grid>
              <Grid item md={12} lg={12}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={12} md={6} lg={6}>
                    <OverviewCard number={locationsUtilised} text={"Locations utilized"}></OverviewCard>
                  </Grid>
                  <Grid item xs={12} sm={12} md={6} lg={6}>
                    <OverviewCard number={avgChargingSessionsPerLocation} text={"Average charging sessions/location"}></OverviewCard>
                  </Grid>
                  <Grid item xs={12} sm={12} md={6} lg={6}>
                    <OverviewCard number={avgUniqueVehiclesPerLocation} text={"Average unique vehicles/location"}></OverviewCard>
                  </Grid>
                  <Grid item xs={12} sm={12} md={6} lg={6}>
                    <OverviewCard number={avgUtilisation} text={"Average utilization"}></OverviewCard>
                  </Grid>
                </Grid>
                <Grid item md={12} lg={12} sx={{
                  marginTop: '30px'
                }}>
                  <SortableTable height={"600px"}></SortableTable>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
          <Grid
            item
            sm={12}
            md={12}
            lg={6}
            sx={{ display: "flex", alignItems: "stretch" }}
          >
            <Box
              sx={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
              }}
            >
              <Card
                sx={{
                  height: "100%",
                  boxShadow: "none",
                  display: "flex",
                  flexDirection: "column", // Ensure CardContent takes space correctly
                  flexGrow: 1, // Makes sure the CardContent can take full height
                }}
              >
                <CardContent
                  sx={{
                    flex: 1, // Allows CardContent to grow and fill available space
                    display: "flex",
                    flexDirection: "column", // Arrange children in a column
                  }}
                >
                  <Typography
                    sx={{
                      fontFamily: "Mukta",
                      fontSize: "40px",
                      fontWeight: "500",
                      marginBottom: "20px",
                      marginTop: "-15px"
                    }}
                  >
                    Active Chargers
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <OverviewCard number={totalLocations} text={"Total Locations"}></OverviewCard>
                    </Grid>
                    <Grid item xs={6}>
                      <OverviewCard number={totalChargingPoints} text={"Total Charging Points"}></OverviewCard>
                    </Grid>
                  </Grid>
                  <Stack direction={"row"} spacing={3} sx={{
                    marginTop: '20px'
                  }}>
                    <FormControl
                      fullWidth
                    >
                      <InputLabel id="locationStatus">
                        Location Status
                      </InputLabel>
                      <Select
                        labelId="locationStatus"
                        id="locationStatus"
                        value={locationStatus}
                        label="Location Status"
                        onChange={handleLocationStatusChange}
                      >
                        <MenuItem value={10}>All</MenuItem>
                        <MenuItem value={20}>Option</MenuItem>
                        <MenuItem value={30}>Option</MenuItem>
                      </Select>
                    </FormControl>
                    <FormControl fullWidth>
                      <InputLabel id="powerType">Power Type</InputLabel>
                      <Select
                        labelId="powerType"
                        id="powerType"
                        value={powerType}
                        label="Power Type"
                        onChange={handlePowerTypeChange}
                      >
                        <MenuItem value={10}>All</MenuItem>
                        <MenuItem value={20}>Option</MenuItem>
                        <MenuItem value={30}>Option</MenuItem>
                      </Select>
                    </FormControl>
                    <Legend></Legend>
                  </Stack>
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "row",
                      flexGrow: 1
                    }}
                  >
                    <LeafletMap lat={mapData.lat} lon={mapData.lon} color={mapData.color} />
                  </Box>
                </CardContent>
              </Card>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </>
  );
}

export default Overview;
