import React, { useState } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TableSortLabel, Paper
} from '@mui/material';
import { Box } from '@mui/system';

function createData(id, energy, revenue) {
  return { id, energy, revenue };
}

function getRandomNumber(min, max) {
  return (Math.random() * (max - min) + min).toFixed(2);
}

const rows = Array.from({ length: 50 }, (_, index) =>
  createData(index + 1, getRandomNumber(100, 500), getRandomNumber(1000, 5000))
);

function SortableTable( {height} ) {
  const [orderDirection, setOrderDirection] = useState('asc');
  const [orderBy, setOrderBy] = useState('id');

  const handleSortRequest = (property) => {
    const isAsc = orderBy === property && orderDirection === 'asc';
    setOrderDirection(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const sortedRows = [...rows].sort((a, b) => {
    if (orderDirection === 'asc') {
      return a[orderBy] < b[orderBy] ? -1 : 1;
    } else {
      return a[orderBy] > b[orderBy] ? -1 : 1;
    }
  });

  return (
    <Box sx={{ maxHeight: 600, height: {height}, overflow: 'auto', marginBottom: '20px' }}>
      <TableContainer component={Paper}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell sx={{
                backgroundColor: '#d9d4d4'
              }}>
                <TableSortLabel
                  active={orderBy === 'id'}
                  direction={orderDirection}
                  onClick={() => handleSortRequest('id')}
                >
                  Charger ID
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{
                backgroundColor: '#d9d4d4',
              }}>
                <TableSortLabel
                  active={orderBy === 'energy'}
                  direction={orderDirection}
                  onClick={() => handleSortRequest('energy')}
                >
                  Total Energy (kWh)
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{
                backgroundColor: '#d9d4d4'
              }}>
                <TableSortLabel
                  active={orderBy === 'revenue'}
                  direction={orderDirection}
                  onClick={() => handleSortRequest('revenue')}
                >
                  Total Revenue ($)
                </TableSortLabel>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedRows.map((row) => (
              <TableRow key={row.id} sx={{
                backgroundColor: row.id % 2 === 0 ? 'white' : '#f7f5f5'
              }}>
                <TableCell>{row.id}</TableCell>
                <TableCell>{row.energy}</TableCell>
                <TableCell>{row.revenue}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

export default SortableTable;
