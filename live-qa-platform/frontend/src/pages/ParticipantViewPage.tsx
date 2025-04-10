import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  Container,
  Typography,
  Box,
  Paper,
  List,
  ListItem,
  ListItemText,
  Chip,
  Button,
  TextField,
  IconButton,
  Divider,
  AppBar,
  Toolbar,
  // Snackbar, // Removed unused import
  // Alert, // Removed unused import
  // Grid, // Removed unused import
} from '@mui/material';
import {
  ThumbUp as ThumbUpIcon,
  ThumbDown as ThumbDownIcon,
  Send as SendIcon,
  Check as CheckIcon,
} from '@mui/icons-material';
import { socketService } from '../services/socketService';
import { RootState, AppDispatch } from '../store';
// import { createQuestion } from '../store/slices/questionSlice'; // Removed unused import
import { showSnackbar } from '../store/slices/uiSlice';

const ParticipantViewPage: React.FC = () => {
  const { sessionCode } = useParams<{ sessionCode: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  const [questionText, setQuestionText] = useState('');
  const [userName, setUserName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);

  const session = useSelector((state: RootState) => state.session.currentSession);
  const questions = useSelector((state: RootState) => state.questions.questions);
  const userVotes = useSelector((state: RootState) => state.questions.userVotes);
  const socketConnected = useSelector((state: RootState) => state.ui.socketConnected);

  // Funktion zum manuellen Wiederverbinden
  const handleReconnect = () => {
    if (!sessionCode) return;
    
    setIsReconnecting(true);
    socketService.connect(sessionCode);
    
    // Setze den Reconnecting-Status nach 2 Sekunden zurück
    setTimeout(() => {
      setIsReconnecting(false);
    }, 2000);
  };

  useEffect(() => {
    if (!sessionCode) {
      navigate('/');
      return;
    }

    // Benutzernamen aus dem localStorage laden
    const storedName = localStorage.getItem(`participant_name_${sessionCode}`);
    if (storedName) {
      setUserName(storedName);
    }

    // Mit Socket verbinden
    socketService.connect(sessionCode);

    // Bereinigungsfunktion
    return () => {
      socketService.disconnect();
    };
  }, [sessionCode, navigate]);

  const handleSubmitQuestion = async (e: React.FormEvent) => {
    e.preventDefault();

    // Prüfe, ob alle erforderlichen Daten vorhanden sind
    if (!questionText.trim() || !userName.trim() || !sessionCode || !session) {
      dispatch(
        showSnackbar({
          message: 'Sessiondaten nicht geladen. Frage kann nicht gesendet werden.',
          severity: 'error',
        }),
      );
      return;
    }

    setSubmitting(true);

    try {
      // Speichere Namen im localStorage
      localStorage.setItem(`participant_name_${sessionCode}`, userName);

      // Bereite Fragedaten vor
      const questionData = {
        sessionId: session.id,
        text: questionText,
        authorName: userName,
      };

      console.log('Sende Fragedaten:', questionData);

      // Sende Frage über Socket-Service
      // Der Socket-Service kümmert sich jetzt um Offline-Handling
      socketService.submitQuestion(questionData);

      // Leere das Eingabefeld
      setQuestionText('');

      // Zeige Erfolgsmeldung nur, wenn verbunden
      // Bei Offline-Modus zeigt der Socket-Service eine eigene Meldung
      if (socketConnected) {
        dispatch(
          showSnackbar({
            message: 'Frage erfolgreich gesendet',
            severity: 'success',
          }),
        );
      }
    } catch (error) {
      console.error('Fehler beim Senden der Frage:', error);
      dispatch(
        showSnackbar({
          message: 'Fehler beim Senden der Frage. Bitte versuche es erneut.',
          severity: 'error',
        }),
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleVote = (questionId: string, voteType: 'up' | 'down') => {
    if (!userName || !sessionCode) return;

    // Der Socket-Service kümmert sich jetzt um optimistische Updates und Offline-Handling
    socketService.submitVote({
      questionId,
      voterName: userName,
      type: voteType,
    });
  };

  // Sort questions by votes (descending)
  const sortedQuestions = [...questions].sort(
    (a, b) => b.votes.up - b.votes.down - (a.votes.up - a.votes.down),
  );

  const getUserVote = (questionId: string) => {
    if (!userName) return null;
    return userVotes[`${userName}-${questionId}`] || null;
  };

  if (!session) {
    return (
      <Container>
        <Box sx={{ my: 4, textAlign: 'center' }}>
          <Typography variant="h4">Loading session...</Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, pb: 8 }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Q&A Session
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Chip
              label={socketConnected ? 'Verbunden' : 'Getrennt'}
              color={socketConnected ? 'success' : 'error'}
              size="small"
              sx={{ mr: 1 }}
            />
            {!socketConnected && (
              <Button
                size="small"
                variant="outlined"
                color="primary"
                onClick={handleReconnect}
                disabled={isReconnecting}
              >
                {isReconnecting ? 'Verbinde...' : 'Neu verbinden'}
              </Button>
            )}
          </Box>
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Paper sx={{ p: 3, mb: 4 }}>
          <Typography variant="h5" gutterBottom>
            Ask a Question
          </Typography>
          <Box component="form" onSubmit={handleSubmitQuestion} noValidate>
            <TextField
              margin="normal"
              required
              fullWidth
              id="name"
              label="Your Name"
              name="name"
              autoComplete="name"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              disabled={submitting}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              id="question"
              label="Your Question"
              name="question"
              multiline
              rows={3}
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              disabled={submitting}
              inputProps={{ maxLength: 500 }}
              helperText={`${questionText.length}/500 characters`}
            />
            <Box sx={{ mt: 2, textAlign: 'right' }}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                endIcon={<SendIcon />}
                disabled={submitting || !questionText.trim() || !userName.trim()}
              >
                Submit Question
              </Button>
            </Box>
          </Box>
        </Paper>

        <Paper sx={{ p: 3 }}>
          <Typography variant="h5" gutterBottom>
            Questions ({sortedQuestions.length})
          </Typography>
          <Divider sx={{ mb: 2 }} />

          {sortedQuestions.length === 0 ? (
            <Typography variant="body1" sx={{ textAlign: 'center', py: 4 }}>
              No questions yet. Be the first to ask a question!
            </Typography>
          ) : (
            <List>
              {sortedQuestions.map((question) => (
                <Paper
                  key={question.id}
                  elevation={1}
                  sx={{
                    mb: 2,
                    p: 2,
                    borderLeft: question.isAnswered ? '4px solid #4caf50' : '4px solid #2196f3',
                  }}
                >
                  <ListItem alignItems="flex-start">
                    <ListItemText
                      primary={
                        <Typography variant="h6">
                          {question.text}
                          {question.isAnswered && (
                            <Chip
                              label="Answered"
                              color="success"
                              size="small"
                              icon={<CheckIcon />}
                              sx={{ ml: 1 }}
                            />
                          )}
                        </Typography>
                      }
                      secondary={
                        <Box sx={{ mt: 1 }}>
                          <Typography variant="body2" color="text.secondary" component="span">
                            From: {question.authorName} |{' '}
                            {new Date(question.createdAt).toLocaleString()}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                            <IconButton
                              size="small"
                              color={getUserVote(question.id) === 'up' ? 'primary' : 'default'}
                              onClick={() => {
                                console.log('Upvote button clicked for question.id:', question.id);
                                handleVote(question.id, 'up');
                              }}
                              disabled={question.isAnswered}
                            >
                              <ThumbUpIcon fontSize="small" />
                            </IconButton>
                            <Typography variant="body2" sx={{ mx: 1 }}>
                              {question.votes.up}
                            </Typography>

                            <IconButton
                              size="small"
                              color={getUserVote(question.id) === 'down' ? 'primary' : 'default'}
                              onClick={() => handleVote(question.id, 'down')}
                              disabled={question.isAnswered}
                            >
                              <ThumbDownIcon fontSize="small" />
                            </IconButton>
                            <Typography variant="body2" sx={{ mx: 1 }}>
                              {question.votes.down}
                            </Typography>

                            <Chip
                              label={`Score: ${question.votes.up - question.votes.down}`}
                              color={
                                question.votes.up - question.votes.down > 0 ? 'success' : 'default'
                              }
                              size="small"
                              sx={{ ml: 1 }}
                            />
                          </Box>
                        </Box>
                      }
                    />
                  </ListItem>
                </Paper>
              ))}
            </List>
          )}
        </Paper>
      </Container>
    </Box>
  );
};

export default ParticipantViewPage;
