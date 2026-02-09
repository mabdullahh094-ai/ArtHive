import React from 'react';
import PropTypes from 'prop-types';
import { Box, CircularProgress, Typography } from '@mui/material';

const LoadingSpinner = ({ fullScreen, message }) => {
  const spinner = (
    <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center">
      <CircularProgress size={fullScreen ? 60 : 40} />
      {message && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          {message}
        </Typography>
      )}
    </Box>
  );

  if (fullScreen) {
    return (
      <Box
        position="fixed"
        top={0}
        left={0}
        right={0}
        bottom={0}
        display="flex"
        alignItems="center"
        justifyContent="center"
        bgcolor="background.paper"
        zIndex={9999}
      >
        {spinner}
      </Box>
    );
  }

  return spinner;
};

LoadingSpinner.propTypes = {
  fullScreen: PropTypes.bool,
  message: PropTypes.string,
};

LoadingSpinner.defaultProps = {
  fullScreen: false,
  message: '',
};

export default LoadingSpinner;