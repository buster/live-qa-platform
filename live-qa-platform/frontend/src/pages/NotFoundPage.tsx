import React from 'react';
import { Link } from 'react-router-dom';
import { Container, Typography, Button, Box, Paper } from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

const NotFoundPage: React.FC = () => {
  return (
    <Container maxWidth="md">
      <Box sx={{ my: 8, textAlign: 'center' }}>
        <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
          <ErrorOutlineIcon sx={{ fontSize: 80, color: 'error.main', mb: 2 }} />
          <Typography variant="h3" component="h1" gutterBottom>
            Page Not Found
          </Typography>
          <Typography variant="h5" color="text.secondary" paragraph>
            The page you are looking for doesn&apos;t exist or has been moved.
          </Typography>
          <Button
            variant="contained"
            color="primary"
            component={Link}
            to="/"
            size="large"
            sx={{ mt: 2 }}
          >
            Go to Home Page
          </Button>
        </Paper>
      </Box>
    </Container>
  );
};

export default NotFoundPage;
