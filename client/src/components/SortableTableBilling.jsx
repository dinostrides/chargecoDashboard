import React, { useState, useEffect } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TableSortLabel, Paper, LinearProgress, Typography
} from '@mui/material';
import { Box } from '@mui/system';

function SortableTableBilling({ height, data }) {
  const [orderDirection, setOrderDirection] = useState('desc');
  const [orderBy, setOrderBy] = useState('total_energy');
  
  const [maxEnergy, setMaxEnergy] = useState(0);
  const [maxRevenue, setMaxRevenue] = useState(0);

  const handleSortRequest = (property) => {
    const isAsc = orderBy === property && orderDirection === 'asc';
    setOrderDirection(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  // Sort the rows based on the selected column
  const sortedRows = [...data].sort((a, b) => {
    if (orderDirection === 'asc') {
      return a[orderBy] < b[orderBy] ? -1 : 1;
    } else {
      return a[orderBy] > b[orderBy] ? -1 : 1;
    }
  });

  // Calculate the maximum total energy and revenue whenever the sortedRows changes
  useEffect(() => {
    if (sortedRows.length > 0) {
      const maxEnergyValue = Math.max(...sortedRows.map(row => row.total_energy));
      const maxRevenueValue = Math.max(...sortedRows.map(row => row.total_cost));
      setMaxEnergy(maxEnergyValue);
      setMaxRevenue(maxRevenueValue);
    }
  }, [sortedRows]);

  // Progress bar for Total Energy (kWh)
  function LinearProgressNoLabel(props) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Box sx={{ width: '85%', mr: 1 }}>
          <LinearProgress variant="determinate" {...props} />
        </Box>
        <Box>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {props.valueLabel.toFixed(2)}
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
                  active={orderBy === 'evse_id'}
                  direction={orderDirection}
                  onClick={() => handleSortRequest('evse_id')}
                >
                  Charger ID
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ backgroundColor: '#d9d4d4' }}>
                <TableSortLabel
                  active={orderBy === 'total_energy'}
                  direction={orderDirection}
                  onClick={() => handleSortRequest('total_energy')}
                >
                  Total Energy (kWh)
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ backgroundColor: '#d9d4d4' }}>
                <TableSortLabel
                  active={orderBy === 'total_cost'}
                  direction={orderDirection}
                  onClick={() => handleSortRequest('total_cost')}
                >
                  Total Revenue ($)
                </TableSortLabel>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
          {sortedRows.map((row) => (
              <TableRow key={row.evse_id} sx={{ backgroundColor: row.evse_id % 2 === 0 ? 'white' : '#f7f5f5' }}>
                <TableCell>{row.evse_id}</TableCell>
                <TableCell>
                  <LinearProgressNoLabel 
                    value={(row.total_energy / maxEnergy) * 100} 
                    valueLabel={row.total_energy}
                    unit="kWh"
                  />
                </TableCell>
                <TableCell>
                  <LinearProgressNoLabel 
                    value={(row.total_cost / maxRevenue) * 100} 
                    valueLabel={row.total_cost}
                    unit="$"
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

export default SortableTableBilling;
