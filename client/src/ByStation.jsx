import React from 'react'
import { useState } from 'react';
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
import ByStationCard from './components/cards/ByStationCard';
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import dayjs from "dayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { DemoContainer } from "@mui/x-date-pickers/internals/demo";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { BarChart } from '@mui/x-charts/BarChart';
import { LineChart } from '@mui/x-charts/LineChart';
import { dataset } from './datasets/weather';
import { stationLocations } from './datasets/stationLocations'

function ByStation() {
  const [startDate, setStartDate] = useState(dayjs("2022-04-17"));
  const [endDate, setEndDate] = useState(dayjs("2022-04-17"));
  const [location, setLocation] = useState("");
  const [powerType, setPowerType] = useState("");

  const handleLocationChange = (event) => {
    setLocation(event.target.value);
  };

  const handlePowerTypeChange = (event) => {
    setPowerType(event.target.value);
  }

  const valueFormatter = (value) => `${value}mm`;

  const chartSetting = {
    xAxis: [
      {
        label: 'rainfall (mm)',
      },
    ],
    width: 700,
    height: 400,
  };

  return (
    <>
      <Sidebar tab={'ByStation'} />
      <Box sx={{
        display: 'flex',
        marginLeft: 'calc(max(15vw, 120px))',
        p: 2
      }}>
        <Grid container spacing={2} alignItems="stretch">
          <Grid item xs={12} md={12} lg={8}>
            <Grid container spacing={2} p={2}>
              <Typography
                sx={{
                  fontFamily: "Mukta",
                  fontSize: "40px",
                  fontWeight: "500",
                }}
              >
                By Station
              </Typography>
              <Grid item xs={12} md={12} lg={12}>
                <Card
                  sx={{
                    height: "70px",
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
                        fontWeight: "1000", // This applies to the rest of the text
                        fontSize: {
                          xs: '20px',
                          sm: '20px',
                          md: '25px',
                          lg: '25px',
                          xl: '25px'
                        },
                        textAlign: "center"
                      }}
                    >
                      Selected Location:{" "}
                      <Typography
                        component="span"
                        sx={{
                          fontWeight: "normal", // This applies to "Fernvale" only
                          fontSize: '25px'
                        }}
                      >
                        Fernvale
                      </Typography>
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={12} lg={4}>
                <ByStationCard number={3} text={"Total Chargers"}></ByStationCard>
              </Grid>
              <Grid item xs={12} md={12} lg={4}>
                <ByStationCard number={"$0.55/kWh"} text={"Average Price After Discount"}></ByStationCard>
              </Grid>
              <Grid item xs={12} md={12} lg={4}>
                <ByStationCard number={"6.8%"} text={"Average Utilisation Rate"}></ByStationCard>
              </Grid>
            </Grid>
          </Grid>
          <Grid item xs={12} md={12} lg={4}>
            <Stack direction={"column"} spacing={1} sx={{
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
                <InputLabel id="location">
                  Location
                </InputLabel>
                <Select
                  labelId="location"
                  id="location"
                  value={location}
                  label="Location"
                  onChange={handleLocationChange}
                >
                  {stationLocations.map((loc) => (
                    <MenuItem key={loc.id} value={loc.id}>
                      {loc.name}
                    </MenuItem>
                  ))}
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
            </Stack>
          </Grid>
          <Grid item xs={12} md={12} lg={12}>
            <BarChart
              xAxis={[{ scaleType: 'band', data: ['group A', 'group B', 'group C'] }]}
              series={[{ data: [4, 3, 5] }, { data: [1, 6, 3] }, { data: [2, 5, 6] }, , { data: [2, 5, 6] },]}
              width={1500}
              height={500}
            />
          </Grid>
          <Grid item xs={12} md={12} lg={12}>
            <LineChart
              xAxis={[{ data: [1, 2, 3, 5, 8, 10] }]}
              series={[
                {
                  data: [2, 5.5, 2, 8.5, 1.5, 5],
                },
              ]}
              width={1500}
              height={500}
            />
          </Grid>
          <Grid item xs={12} md={12} lg={12} xl={6}>
            <BarChart
              dataset={dataset}
              yAxis={[{ scaleType: 'band', dataKey: 'month' }]}
              series={[{ dataKey: 'seoul', label: 'Seoul rainfall', valueFormatter }]}
              layout="horizontal"
              {...chartSetting}
            />
          </Grid>
          <Grid item xs={12} md={12} lg={12} xl={6}>
            <BarChart
              dataset={dataset}
              yAxis={[{ scaleType: 'band', dataKey: 'month' }]}
              series={[{ dataKey: 'seoul', label: 'Seoul rainfall', valueFormatter }]}
              layout="horizontal"
              {...chartSetting}
            />
          </Grid>
        </Grid>












      </Box>
    </>

  )
}

export default ByStation;