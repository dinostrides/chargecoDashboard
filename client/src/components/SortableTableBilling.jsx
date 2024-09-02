import React, { useState } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TableSortLabel, Paper
} from '@mui/material';
import { Box } from '@mui/system';

function SortableTableBilling({ height, data }) {
  const [orderDirection, setOrderDirection] = useState('asc');
  const [orderBy, setOrderBy] = useState('chargerId');

  const handleSortRequest = (property) => {
    const isAsc = orderBy === property && orderDirection === 'asc';
    setOrderDirection(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const sortedRows = [...data].sort((a, b) => {
    if (orderDirection === 'asc') {
      return a[orderBy] < b[orderBy] ? -1 : 1;
    } else {
      return a[orderBy] > b[orderBy] ? -1 : 1;
    }
  });

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
              <TableRow key={row.chargerId} sx={{ backgroundColor: row.chargerId % 2 === 0 ? 'white' : '#f7f5f5' }}>
                <TableCell>{row.evse_id}</TableCell>
                <TableCell>{row.total_energy.toFixed(2)}</TableCell>
                <TableCell>{row.total_cost.toFixed(2)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

export default SortableTableBilling;
