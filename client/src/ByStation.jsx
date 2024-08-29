import React from "react";
import { useState, useEffect } from "react";
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
import ByStationCard from "./components/cards/ByStationCard";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import dayjs from "dayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { DemoContainer } from "@mui/x-date-pickers/internals/demo";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { BarChart } from "@mui/x-charts/BarChart";
import { LineChart } from "@mui/x-charts/LineChart";
import stations from "./datasets/stations.json";
import axios from "axios";

function ByStation() {
  const today = dayjs();
  const oneYearAgo = today.subtract(1, "year");
  const [startDate, setStartDate] = useState(oneYearAgo);
  const [endDate, setEndDate] = useState(today);
  const [location, setLocation] = useState("Blk 80 Telok Blangah MSCP (TBMT)");
  const [powerType, setPowerType] = useState("All");

  const [totalChargers, setTotalChargers] = useState();
  const [avgPriceAfterDiscount, setAvgPriceAfterDiscount] = useState();
  const [avgUtilisationRate, setAvgUtilisationRate] = useState();

  const [byStationHour, setByStationHour] = useState([]);
  const xAxisDataHour = byStationHour.map((item) => item.Hour);
  const seriesDataHour = byStationHour.map(
    (item) => item["Average Utilisation"] * 100
  );

  // to do when data returned is fixed
  const [byStationMonth, setByStationMonth] = useState([]);
  const xAxisDataMonth = byStationHour.map((item) => item.Hour);
  const seriesDataMonth = byStationHour.map(
    (item) => item["Average Utilisation"] * 100
  );

  const [avgUtilisationDay, setAvgUtilisationDay] = useState();
  const [avgUtilisationNight, setAvgUtilisationNight] = useState();
  const [avgUtilisationWeekday, setAvgUtilisationWeekday] = useState();
  const [avgUtilisationWeekend, setAvgUtilisationWeekend] = useState();

  const handleLocationChange = (event) => {
    setLocation(event.target.value);
  };

  const handlePowerTypeChange = (event) => {
    setPowerType(event.target.value);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const byStationCards = await axios.post(
          "http://localhost:8000/byStationCards/",
          {
            start_date: startDate,
            end_date: endDate,
            location: location,
            power_type: powerType,
          }
        );

        setTotalChargers(byStationCards.data.num_chargers);
        setAvgPriceAfterDiscount(byStationCards.data.avg_price);
        setAvgUtilisationRate(byStationCards.data.avg_util);

        const byStationHour = await axios.post(
          "http://localhost:8000/byStationHour/",
          {
            start_date: startDate,
            end_date: endDate,
            location: location,
            power_type: powerType,
          }
        );

        setByStationHour(byStationHour.data.station_hour);

        // const byStationMonth = await axios.post(
        //   "http://localhost:8000/byStationTimeSeriesChart/",
        //   {
        //     start_date: startDate,
        //     end_date: endDate,
        //     location: location,
        //     power_type: powerType,
        //   }
        // );

        //console.log(byStationMonth.data) // current returns location number but line chart requires month as x axis, data shld be month, number
        //have not updated line chart data yet

        const byStationBarChart = await axios.post(
          "http://localhost:8000/byStationUtilBarChart/",
          {
            start_date: startDate,
            end_date: endDate,
            location: location,
            power_type: powerType,
          }
        );

        const dayNightData = byStationBarChart.data.util_dayNight;
        setAvgUtilisationDay(dayNightData[0].Utilisation);
        setAvgUtilisationNight(dayNightData[1].Utilisation);

        const weekdayWeekendData = byStationBarChart.data.util_weekdayWeekend;
        setAvgUtilisationWeekday(weekdayWeekendData[0].Utilisation);
        setAvgUtilisationWeekend(weekdayWeekendData[1].Utilisation);
        
      } catch (error) {
        console.log(error.message);
      }
    };
    fetchData();
  }, [startDate, endDate, location, powerType]);

  return (
    <>
      <Sidebar tab={"ByStation"} />
      <Box
        sx={{
          display: "flex",
          marginLeft: "calc(max(15vw, 120px))",
          p: 2,
        }}
      >
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
                    boxShadow: 4,
                  }}
                >
                  <CardContent>
                    <Typography
                      sx={{
                        fontWeight: "1000", // This applies to the rest of the text
                        fontSize: {
                          xs: "20px",
                          sm: "20px",
                          md: "25px",
                          lg: "25px",
                          xl: "25px",
                        },
                        textAlign: "center",
                      }}
                    >
                      Selected Location:{" "}
                      <Typography
                        component="span"
                        sx={{
                          fontWeight: "normal",
                          fontSize: "25px",
                        }}
                      >
                        {location === "" ? "None" : location}
                      </Typography>
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={12} lg={4}>
                <ByStationCard
                  number={totalChargers}
                  text={"Total Chargers"}
                ></ByStationCard>
              </Grid>
              <Grid item xs={12} md={12} lg={4}>
                <ByStationCard
                  number={avgPriceAfterDiscount}
                  text={"Average Price After Discount"}
                ></ByStationCard>
              </Grid>
              <Grid item xs={12} md={12} lg={4}>
                <ByStationCard
                  number={avgUtilisationRate}
                  text={"Average Utilisation Rate"}
                ></ByStationCard>
              </Grid>
            </Grid>
          </Grid>
          <Grid item xs={12} md={12} lg={4}>
            <Stack
              direction={"column"}
              spacing={1}
              sx={{
                marginTop: "20px",
              }}
            >
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DemoContainer components={["DatePicker"]}>
                  <DatePicker
                    label="Start Date"
                    value={startDate}
                    onChange={(newValue) => setStartDate(newValue)}
                    sx={{ width: "100%" }}
                  />
                </DemoContainer>
              </LocalizationProvider>

              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DemoContainer components={["DatePicker"]}>
                  <DatePicker
                    label="End Date"
                    value={endDate}
                    onChange={(newValue) => setEndDate(newValue)}
                    sx={{ width: "100%" }}
                  />
                </DemoContainer>
              </LocalizationProvider>
              <FormControl fullWidth>
                <InputLabel id="location">Location</InputLabel>
                <Select
                  labelId="location"
                  id="location"
                  value={location}
                  label="Location"
                  onChange={handleLocationChange}
                >
                  {stations.map((station, index) => (
                    <MenuItem key={index} value={station}>
                      {station}
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
                  <MenuItem value={"All"}>All</MenuItem>
                  <MenuItem value={"AC"}>AC</MenuItem>
                  <MenuItem value={"DC"}>DC</MenuItem>
                </Select>
              </FormControl>
            </Stack>
          </Grid>
          <Grid item xs={12} md={12} lg={12}>
            <BarChart
              series={[
                {
                  data: seriesDataHour,
                  label: "Average Utilisation Per Hour(%)",
                  color: "pink",
                },
              ]}
              height={700}
              xAxis={[
                {
                  data: xAxisDataHour,
                  scaleType: "band",
                  label: "Hour of Day",
                },
              ]}
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
              height={500}
            />
          </Grid>
          <Grid item xs={12} md={12} lg={12} xl={6}>
            <BarChart
              series={[
                {
                  data: [avgUtilisationDay, avgUtilisationNight],
                  label: "Average Utilisation (%)",
                  color: "pink",
                },
              ]}
              xAxis={[
                {
                  data: ["Day", "Night"],
                  scaleType: "band",
                  label: "Average Utilisation By Day / Night",
                },
              ]}
              height={500}
            />
          </Grid>
          <Grid item xs={12} md={12} lg={12} xl={6}>
            <BarChart
              series={[
                {
                  data: [avgUtilisationWeekday, avgUtilisationWeekend],
                  label: "Average Utilisation (%)",
                  color: "pink",
                },
              ]}
              xAxis={[
                {
                  data: ["Day", "Night"],
                  scaleType: "band",
                  label: 'Average Utilisation By Weekday / Weekend'
                },
              ]}
              height={500}
            />
          </Grid>
        </Grid>
      </Box>
    </>
  );
}

export default ByStation;
