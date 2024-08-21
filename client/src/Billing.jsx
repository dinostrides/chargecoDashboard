import React from 'react'
import { useState } from 'react'
import Sidebar from './components/Sidebar'
import { Box, Typography, Grid, Stack, FormControl, InputLabel, Select, MenuItem } from '@mui/material'
import OverviewCard from './components/cards/OverviewCard'
import SortableTable from './components/SortableTable'
import { BarChart } from '@mui/x-charts/BarChart';

function Billing() {
  const [powerType, setPowerType] = useState("");
  const [price, setPrice] = useState("");
  const [charger, setCharger] = useState("");

  const handlePowerTypeChange = (event) => {
    setPowerType(event.target.value);
  }

  const handlePriceChange = (event) => {
    setPrice(event.target.value);
  }

  const handleChargerChange = (event) => {
    setCharger(event.target.value);
  }

  return (
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
                      <MenuItem value={10}>All</MenuItem>
                      <MenuItem value={20}>Option</MenuItem>
                      <MenuItem value={30}>Option</MenuItem>
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
                      <MenuItem value={10}>All</MenuItem>
                      <MenuItem value={20}>Option</MenuItem>
                      <MenuItem value={30}>Option</MenuItem>
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
              <Grid item xs={12} md={6} lg={6}>
                <OverviewCard number={"41542 kWh"} text={"Average Monthly Energy Consumption"}></OverviewCard>
              </Grid>
              <Grid item xs={12} md={6} lg={6}>
                <OverviewCard number={"$24346.06"} text={"Average Monthly Revenue"}></OverviewCard>
              </Grid>
            </Grid>
          </Grid>
          <Grid item xs={12} md={12} lg={6}>
            <SortableTable height={"400px"}/>
          </Grid>
          <Grid item xs={12} md={12} lg={12}>
            <BarChart
              series={[
                { data: [4, 2, 5, 4, 1], stack: 'A', label: 'Series A1' },
                { data: [2, 8, 1, 3, 1], stack: 'A', label: 'Series A2' },
                { data: [14, 6, 5, 8, 9], label: 'Series B1' },
              ]}
              barLabel={(item, context) => {
                if ((item.value ?? 0) > 10) {
                  return 'High';
                }
                return context.bar.height < 60 ? null : item.value?.toString();
              }}
              width={1500}
              height={550}
            />
          </Grid>
          <Grid item xs={12} md={12} lg={12}>
            <BarChart
              series={[
                { data: [4, 2, 5, 4, 1], stack: 'A', label: 'Series A1' },
                { data: [2, 8, 1, 3, 1], stack: 'A', label: 'Series A2' },
                { data: [14, 6, 5, 8, 9], label: 'Series B1' },
              ]}
              barLabel={(item, context) => {
                if ((item.value ?? 0) > 10) {
                  return 'High';
                }
                return context.bar.height < 60 ? null : item.value?.toString();
              }}
              width={1500}
              height={550}
            />
          </Grid>
        </Grid>
      </Box>
    </>

  )
}

export default Billing