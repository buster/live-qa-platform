import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import {
  Container,
  Typography,
  Button,
  Box,
  Paper,
  CircularProgress,
  Alert,
} from '@mui/material';
import { createSession } from '../store/slices/sessionSlice';
import { AppDispatch } from '../store';

const CreateSessionPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreateSession = async () => {
    setLoading(true);
    setError(null);

    try {
      const resultAction = await dispatch(createSession());
      if (createSession.fulfilled.match(resultAction)) {
        const session = resultAction.payload;
        navigate(`/session/${session.id}/presenter`);
      } else {
        setError('Failed to create session. Please try again.');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom textAlign="center">
          Create a New Q&A Session
        </Typography>
        <Typography variant="body1" paragraph textAlign="center">
          Create a new session for your presentation and share the link with your audience.
        </Typography>

        <Paper elevation={3} sx={{ p: 4, mt: 4, borderRadius: 2 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <Typography variant="body1" paragraph>
            When you create a new session, you'll receive a unique link that you can share with your
            audience. They can use this link to join the session and submit questions.
          </Typography>

          <Typography variant="body1" paragraph>
            As the presenter, you'll have access to a dashboard where you can view and manage
            questions in real-time.
          </Typography>

          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Button
              variant="contained"
              color="primary"
              size="large"
              onClick={handleCreateSession}
              disabled={loading}
              sx={{ minWidth: 200 }}
            >
              {loading ? <CircularProgress size={24} /> : 'Create Session'}
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default CreateSessionPage;