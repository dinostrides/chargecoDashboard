import React from 'react'
import { useState } from 'react';
import Sidebar from './components/Sidebar'
import { Box, Typography, Grid, Stack, FormControl, InputLabel, Select, MenuItem } from '@mui/material'
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import dayjs from "dayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { DemoContainer } from "@mui/x-date-pickers/internals/demo";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { PieChart } from '@mui/x-charts/PieChart';
import { ScatterChart } from '@mui/x-charts/ScatterChart';
import { scatterdata } from './datasets/scatterdata.jsx';
import PricingCard from './components/cards/PricingCard.jsx';

function Pricing() {
  const today = dayjs();
  const oneYearAgo = today.subtract(1, 'year');
  const [startDate, setStartDate] = useState(oneYearAgo);
  const [endDate, setEndDate] = useState(today);
  const [powerType, setPowerType] = useState("All");

  const handlePowerTypeChange = (event) => {
    setPowerType(event.target.value);
  }

  return (
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
                  <PricingCard number={"$0.58/kWh"} text={"Average Rate After Discount"}></PricingCard>
                </Stack>
              </Grid>
            </Grid>
          </Grid>
          <Grid item xs={12} md={12} lg={6} marginTop={'20px'}>
            <PieChart
              series={[
                {
                  data: [
                    { id: 0, value: 10, label: 'series A' },
                    { id: 1, value: 15, label: 'series B' },
                    { id: 2, value: 20, label: 'series C' },
                  ],
                },
              ]}
              height={420}
            />
          </Grid>
          <Grid item xs={12} md={12} lg={12}>
            <ScatterChart
              height={700}
              series={[
                {
                  label: 'Series A',
                  data: scatterdata.map((v) => ({ x: v.x1, y: v.y1, id: v.id })),
                },
                {
                  label: 'Series B',
                  data: scatterdata.map((v) => ({ x: v.x1, y: v.y2, id: v.id })),
                },
              ]}
            />
          </Grid>
        </Grid>
      </Box>
    </>

  )
}

export default Pricing