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

const JoinSessionPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { sessionId } = useParams<{ sessionId?: string }>();
  const [sessionIdInput, setSessionIdInput] = useState(sessionId || '');
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

  const handleJoinSession = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!sessionIdInput.trim()) {
      setError('Please enter a session ID');
      return;
    }
    
    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const resultAction = await dispatch(joinSession(sessionIdInput));
      if (joinSession.fulfilled.match(resultAction)) {
        // Store the user's name in localStorage
        localStorage.setItem(`participant_name_${sessionIdInput}`, name);
        navigate(`/session/${sessionIdInput}/participant`);
      } else {
        setError('Failed to join session. Please check the session ID and try again.');
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
          Enter the session ID provided by the presenter to join the Q&A session.
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
              id="sessionId"
              label="Session ID"
              name="sessionId"
              autoComplete="off"
              autoFocus
              value={sessionIdInput}
              onChange={(e) => setSessionIdInput(e.target.value)}
              disabled={loading}
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