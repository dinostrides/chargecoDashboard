import React from 'react';
import CircularProgress from '@mui/material/CircularProgress';
import './LoadingOverlay.css';

const LoadingOverlay = () => {
  return (
    <div className="loading-overlay">
      <CircularProgress />
    </div>
  );
};

export default LoadingOverlay;