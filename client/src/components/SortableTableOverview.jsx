import React, { useState, useEffect } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TableSortLabel, Paper, LinearProgress, Typography
} from '@mui/material';
import { Box } from '@mui/system';

function SortableTableOverview({ height, data }) {
  const [orderDirection, setOrderDirection] = useState('asc');
  const [orderBy, setOrderBy] = useState('chargerId');
  const [maxUtilizationRate, setMaxUtilizationRate] = useState(0);

  const handleSortRequest = (property) => {
    const isAsc = orderBy === property && orderDirection === 'asc';
    setOrderDirection(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  // Sort the data
  const sortedRows = [...data].sort((a, b) => {
    if (orderDirection === 'asc') {
      return a[orderBy] < b[orderBy] ? -1 : 1;
    } else {
      return a[orderBy] > b[orderBy] ? -1 : 1;
    }
  });

  // Calculate the maximum utilization rate whenever the data or sortedRows changes
  useEffect(() => {
    if (sortedRows.length > 0) {
      const maxRate = Math.max(...sortedRows.map(row => row.utilizationRate));
      setMaxUtilizationRate(maxRate);
    }
  }, [sortedRows]);

  // Progress bar without label
  function LinearProgressNoLabel(props) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Box sx={{ width: '85%', mr: 1 }}>
          <LinearProgress variant="determinate" {...props} />
        </Box>
        <Box>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {props.utilizationRate.toFixed(2)}
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ maxHeight: 600, height: height, overflow: 'auto', marginBottom: '20px' }}>
      <TableContainer component={Paper}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell sx={{ backgroundColor: '#d9d4d4' }}>
                <TableSortLabel
                  active={orderBy === 'chargerId'}
                  direction={orderDirection}
                  onClick={() => handleSortRequest('chargerId')}
                >
                  Charger ID
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ backgroundColor: '#d9d4d4' }}>
                <TableSortLabel
                  active={orderBy === 'utilizationRate'}
                  direction={orderDirection}
                  onClick={() => handleSortRequest('utilizationRate')}
                >
                  Utilization Rate (%)
                </TableSortLabel>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
          {sortedRows.map((row) => (
              <TableRow key={row.chargerId} sx={{ backgroundColor: row.chargerId % 2 === 0 ? 'white' : '#f7f5f5' }}>
                <TableCell>{row.chargerId}</TableCell>
                <TableCell>
                  {/* Pass the calculated progress value and utilization rate to LinearProgressNoLabel */}
                  <LinearProgressNoLabel value={(row.utilizationRate / maxUtilizationRate) * 100} utilizationRate={row.utilizationRate} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

export default SortableTableOverview;
