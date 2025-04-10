import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Container,
  Typography,
  Button,
  Box,
  Paper,
  TextField,
  CircularProgress,
  Alert,
} from '@mui/material';
import { joinSession } from '../store/slices/sessionSlice';
import { AppDispatch, RootState } from '../store';
import { socketService } from '../services/socketService';

const JoinSessionPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { sessionCode } = useParams<{ sessionCode?: string }>();
  const [sessionUrlInput, setSessionUrlInput] = useState(sessionCode || '');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sessionError = useSelector((state: RootState) => state.session.error);

  useEffect(() => {
    if (sessionError) {
      setError(sessionError);
      setLoading(false);
    }
  }, [sessionError]);

  // Extract session code from URL if full URL is provided
  const extractSessionCode = (input: string): string => {
    // If input is already a short code (6 characters), return it
    if (/^[A-Za-z0-9]{6}$/.test(input)) {
      return input;
    }

    // Try to extract code from URL
    try {
      // Check if it's a URL
      if (input.includes('/')) {
        // Extract the last part of the URL
        const parts = input.split('/');
        const lastPart = parts[parts.length - 1];

        // If the last part is a 6-character code, return it
        if (/^[A-Za-z0-9]{6}$/.test(lastPart)) {
          return lastPart;
        }
      }
    } catch (err) {
      console.error('Error extracting session code:', err);
    }

    // Return original input if we couldn't extract a code
    return input;
  };

  const handleJoinSession = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!sessionUrlInput.trim()) {
      setError('Please enter a session URL or code');
      return;
    }

    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }

    setLoading(true);
    setError(null);

    // Extract session code from input
    const sessionCode = extractSessionCode(sessionUrlInput);

    try {
      const resultAction = await dispatch(joinSession(sessionCode));
      if (joinSession.fulfilled.match(resultAction)) {
        const session = resultAction.payload;
        // Store the user's name in localStorage
        localStorage.setItem(`participant_name_${session._id}`, name);
        // Connect to WebSocket with the actual session URL/code from the API response
        socketService.connect(session.url);

        navigate(`/session/${session.url}/participant`);
      } else {
        setError('Failed to join session. Please check the session code and try again.');
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
          Join a Q&A Session
        </Typography>
        <Typography variant="body1" paragraph textAlign="center">
          Enter the session code provided by the presenter to join the Q&A session.
        </Typography>

        <Paper elevation={3} sx={{ p: 4, mt: 4, borderRadius: 2 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleJoinSession} noValidate>
            <TextField
              margin="normal"
              required
              fullWidth
              id="sessionUrl"
              label="Session Code"
              name="sessionUrl"
              autoComplete="off"
              autoFocus
              value={sessionUrlInput}
              onChange={(e) => setSessionUrlInput(e.target.value)}
              disabled={loading}
              helperText="Enter the 6-character code provided by the presenter"
            />

            <TextField
              margin="normal"
              required
              fullWidth
              id="name"
              label="Your Name"
              name="name"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
            />

            <Box sx={{ mt: 3, textAlign: 'center' }}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                size="large"
                disabled={loading}
                sx={{ minWidth: 200 }}
              >
                {loading ? <CircularProgress size={24} /> : 'Join Session'}
              </Button>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default JoinSessionPage;
