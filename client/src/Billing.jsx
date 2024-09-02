import React from 'react'
import { useState, useEffect } from 'react'
import Sidebar from './components/Sidebar'
import { Box, Typography, Grid, Stack, FormControl, InputLabel, Select, MenuItem } from '@mui/material'
import OverviewCard from './components/cards/OverviewCard'
import SortableTableBilling from './components/SortableTableBilling'
import { BarChart } from '@mui/x-charts/BarChart';
import dayjs from "dayjs";
import axios from 'axios';
import LoadingOverlay from './components/LoadingOverlay'

function Billing() {

  const [isLoading, setIsLoading] = useState(true);
  const today = dayjs();
  const oneYearAgo = today.subtract(1, 'year');
  const [startDate, setStartDate] = useState(oneYearAgo);
  const [endDate, setEndDate] = useState(today);

  const [powerType, setPowerType] = useState("All");
  const [price, setPrice] = useState("");
  const [charger, setCharger] = useState("");

  const [billingRevenueChartData, setBillingRevenueChartData] = useState([])

  const totalEnergies = billingRevenueChartData.map(data => data.total_energy);
  const totalRevenue = billingRevenueChartData.map(data => data.total_cost);
  const monthYear = billingRevenueChartData.map(data => data.month);

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

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);

        const tableResponse = await axios.post("http://localhost:8000/billingTable/", {
          power_type: powerType,
          price: price,
          charger: charger
        });

        const tableDataArr = tableResponse.data;
        setTableData(tableDataArr.energy_expenditure_df);

        const billingRevenueChart = await axios.post("http://localhost:8000/billingRevenueChart/", {
          power_type: powerType,
          price: price,
          charger: charger
        });
        
        console.log(billingRevenueChart.data.total_energy_cost);
        setBillingRevenueChartData(billingRevenueChart.data.total_energy_cost);

        
      }
      catch (error) {
        console.log(error.message)
      }
      finally {
        setIsLoading(false); // Ensure this is executed even if there's an error
      }  
    }
    fetchData();
  }, [startDate, endDate])

  

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
            <SortableTableBilling height={"400px"} data={tableData}/>
          </Grid>
          <Grid item xs={12} md={12} lg={12}>
            <BarChart
              series={[
                { data: totalEnergies, label: 'Energy Consumption (kWh)' },
                { data: totalRevenue, label: 'Revenue ($)' },
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
              height={550}
            />
          </Grid>
        </Grid>
      </Box>
    </>
      </div>
  )
}

export default Billing