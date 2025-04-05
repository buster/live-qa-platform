import React from 'react';
import { Link } from 'react-router-dom';
import { Container, Typography, Button, Box, Paper, Grid } from '@mui/material';
import QuestionAnswerIcon from '@mui/icons-material/QuestionAnswer';
import PresentToAllIcon from '@mui/icons-material/PresentToAll';

const HomePage: React.FC = () => {
  return (
    <Container maxWidth="md">
      <Box sx={{ my: 4, textAlign: 'center' }}>
        <Typography variant="h2" component="h1" gutterBottom>
          Live Q&A Platform
        </Typography>
        <Typography variant="h5" color="text.secondary" paragraph>
          Engage your audience with real-time questions and answers during presentations
        </Typography>

        <Paper elevation={3} sx={{ p: 4, mt: 4, borderRadius: 2 }}>
          <Grid container spacing={4} justifyContent="center">
            <Grid item xs={12} md={6}>
              <Box sx={{ p: 2, textAlign: 'center' }}>
                <PresentToAllIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
                <Typography variant="h5" gutterBottom>
                  Presenters
                </Typography>
                <Typography paragraph>
                  Create a new Q&A session for your presentation and manage audience questions in real-time.
                </Typography>
                <Button
                  variant="contained"
                  color="primary"
                  size="large"
                  component={Link}
                  to="/create"
                  fullWidth
                >
                  Create Session
                </Button>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box sx={{ p: 2, textAlign: 'center' }}>
                <QuestionAnswerIcon sx={{ fontSize: 60, color: 'secondary.main', mb: 2 }} />
                <Typography variant="h5" gutterBottom>
                  Participants
                </Typography>
                <Typography paragraph>
                  Join an existing Q&A session to ask questions and vote on questions from other participants.
                </Typography>
                <Button
                  variant="contained"
                  color="secondary"
                  size="large"
                  component={Link}
                  to="/join"
                  fullWidth
                >
                  Join Session
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      </Box>
    </Container>
  );
};

export default HomePage;