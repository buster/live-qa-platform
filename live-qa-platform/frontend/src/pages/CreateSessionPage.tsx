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
  TextField,
  FormControlLabel,
  Switch,
  FormHelperText,
} from '@mui/material';
import { createSession } from '../store/slices/sessionSlice';
import { AppDispatch } from '../store';

const CreateSessionPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [presenterName, setPresenterName] = useState('');
  const [nameError, setNameError] = useState<string | null>(null);
  const [customCodeEnabled, setCustomCodeEnabled] = useState(false);
  const [customCode, setCustomCode] = useState('');
  const [customCodeError, setCustomCodeError] = useState<string | null>(null);

  const validateCustomCode = (code: string): boolean => {
    // Code must be 6 characters long and alphanumeric
    const codeRegex = /^[A-Za-z0-9]{6}$/;
    return codeRegex.test(code);
  };

  const handleCreateSession = async () => {
    // Validate presenter name
    if (!presenterName.trim()) {
      setNameError('Presenter name is required');
      return;
    }

    // Validate custom code if enabled
    if (customCodeEnabled) {
      if (!customCode.trim()) {
        setCustomCodeError('Session code is required');
        return;
      }

      if (!validateCustomCode(customCode)) {
        setCustomCodeError('Session code must be 6 alphanumeric characters');
        return;
      }
    }

    setLoading(true);
    setError(null);
    setNameError(null);
    setCustomCodeError(null);

    try {
      // If custom code is enabled, pass it to createSession
      const sessionData = {
        presenterName,
        customCode: customCodeEnabled ? customCode : undefined,
      };

      const resultAction = await dispatch(createSession(sessionData));
      if (createSession.fulfilled.match(resultAction)) {
        const session = resultAction.payload;
        navigate(`/session/${session.url}/presenter`);
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
            When you create a new session, you&apos;ll receive a unique link that you can share with
            your audience. They can use this link to join the session and submit questions.
          </Typography>

          <Typography variant="body1" paragraph>
            As the presenter, you&apos;ll have access to a dashboard where you can view and manage
            questions in real-time.
          </Typography>

          <Box sx={{ mt: 3 }}>
            <TextField
              fullWidth
              label="Your Name"
              variant="outlined"
              value={presenterName}
              onChange={(e) => setPresenterName(e.target.value)}
              error={!!nameError}
              helperText={nameError}
              disabled={loading}
              sx={{ mb: 3 }}
            />

            <FormControlLabel
              control={
                <Switch
                  checked={customCodeEnabled}
                  onChange={(e) => setCustomCodeEnabled(e.target.checked)}
                  disabled={loading}
                />
              }
              label="Use custom session code"
              sx={{ mb: 1 }}
            />

            <FormHelperText sx={{ mt: -1, mb: 2 }}>
              Enable this option to specify your own 6-character code for the session
            </FormHelperText>

            {customCodeEnabled && (
              <TextField
                fullWidth
                label="Custom Session Code"
                variant="outlined"
                value={customCode}
                onChange={(e) => setCustomCode(e.target.value.toUpperCase())}
                error={!!customCodeError}
                helperText={customCodeError || 'Enter a 6-character alphanumeric code (A-Z, 0-9)'}
                disabled={loading}
                inputProps={{ maxLength: 6 }}
                sx={{ mb: 3 }}
              />
            )}
          </Box>

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
