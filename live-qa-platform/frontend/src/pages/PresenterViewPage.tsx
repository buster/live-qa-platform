import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { joinSession } from '../store/slices/sessionSlice';
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
  AppBar,
  Toolbar,
  // IconButton, // Removed unused import
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  // TextField, // Removed unused import
  // Alert, // Removed unused import
  Snackbar,
  Grid,
  SelectChangeEvent, // Import SelectChangeEvent
} from '@mui/material';
import {
  ThumbUp as ThumbUpIcon,
  ThumbDown as ThumbDownIcon,
  Check as CheckIcon,
  ContentCopy as ContentCopyIcon,
  ExitToApp as ExitToAppIcon,
  Sort as SortIcon,
} from '@mui/icons-material';
import { socketService } from '../services/socketService';
import { RootState, AppDispatch } from '../store';
import { endSession } from '../store/slices/sessionSlice';
import { markAnswered } from '../store/slices/questionSlice';
import { setSortBy, toggleFilterAnswered } from '../store/slices/uiSlice';

const PresenterViewPage: React.FC = () => {
  const { sessionCode } = useParams<{ sessionCode: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  const [copySuccess, setCopySuccess] = useState(false);
  const [confirmEnd, setConfirmEnd] = useState(false);

  const session = useSelector((state: RootState) => state.session.currentSession);
  const questions = useSelector((state: RootState) => state.questions.questions);
  const sortBy = useSelector((state: RootState) => state.ui.sortBy);
  const filterAnswered = useSelector((state: RootState) => state.ui.filterAnswered);
  const socketConnected = useSelector((state: RootState) => state.ui.socketConnected);

  // First useEffect to load the session if needed
  useEffect(() => {
    if (!sessionCode) {
      navigate('/');
      return;
    }

    // If session is not loaded (e.g., after page refresh), load it
    if (!session) {
      dispatch(joinSession(sessionCode));
    }
  }, [sessionCode, navigate, session, dispatch]);

  // Second useEffect to check presenter token and connect to socket
  useEffect(() => {
    if (!sessionCode || !session) {
      return;
    }

    // Check if presenter token exists
    const presenterToken = localStorage.getItem(`presenter_token_${session.id}`);
    if (!presenterToken) {
      navigate('/');
      return;
    }

    // Connect to socket only when session is loaded and presenter token exists
    socketService.connect(sessionCode);

    return () => {
      socketService.disconnect();
    };
  }, [sessionCode, navigate, session]);

  const handleCopyLink = () => {
    if (!session) return;

    const joinUrl = `${window.location.origin}/join/${session.url}`; // Use session.url

    try {
      // Try to use the Clipboard API if available
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard
          .writeText(joinUrl)
          .then(() => {
            setCopySuccess(true);
          })
          .catch((err) => {
            console.error('Failed to copy with Clipboard API:', err);
            fallbackCopyToClipboard(joinUrl);
          });
      } else {
        // Fallback for browsers where Clipboard API is not available
        fallbackCopyToClipboard(joinUrl);
      }
    } catch (err) {
      console.error('Copy to clipboard error:', err);
      fallbackCopyToClipboard(joinUrl);
    }
  };

  // Fallback method to copy text to clipboard
  const fallbackCopyToClipboard = (text: string) => {
    try {
      // Create a temporary textarea element
      const textArea = document.createElement('textarea');
      textArea.value = text;

      // Make the textarea out of viewport
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';

      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();

      // Execute the copy command
      const successful = document.execCommand('copy');

      // Remove the temporary element
      document.body.removeChild(textArea);

      if (successful) {
        setCopySuccess(true);
      } else {
        console.error('Fallback: Unable to copy to clipboard');
        alert('Copy to clipboard failed. Please copy this URL manually: ' + text);
      }
    } catch (err) {
      console.error('Fallback: Copy to clipboard failed:', err);
      alert('Copy to clipboard failed. Please copy this URL manually: ' + text);
    }
  };

  const handleEndSession = async () => {
    if (!sessionCode || !session) return; // Check session as well

    if (!confirmEnd) {
      setConfirmEnd(true);
      return;
    }

    try {
      // endSession thunk likely expects the MongoDB _id
      await dispatch(endSession(session.id));
      navigate('/');
    } catch (error) {
      console.error('Failed to end session:', error);
    }
  };

  const handleMarkAnswered = (questionId: string) => {
    dispatch(markAnswered({ questionId }));
    socketService.markAnswered(questionId);
  };

  const handleSortChange = (event: SelectChangeEvent<'votes' | 'timestamp' | 'status'>) => {
    // Use SelectChangeEvent
    dispatch(setSortBy(event.target.value as 'votes' | 'timestamp' | 'status'));
  };

  const handleFilterToggle = () => {
    dispatch(toggleFilterAnswered());
  };

  // Sort and filter questions
  const sortedQuestions = [...questions].sort((a, b) => {
    if (sortBy === 'votes') {
      return b.votes.up - b.votes.down - (a.votes.up - a.votes.down);
    } else if (sortBy === 'timestamp') {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    } else {
      // Sort by status (answered last)
      return a.isAnswered === b.isAnswered ? 0 : a.isAnswered ? 1 : -1;
    }
  });

  const filteredQuestions = filterAnswered
    ? sortedQuestions.filter((q) => !q.isAnswered)
    : sortedQuestions;

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
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Presenter View
          </Typography>
          <Chip
            label={socketConnected ? 'Connected' : 'Disconnected'}
            color={socketConnected ? 'success' : 'error'}
            size="small"
            sx={{ mr: 2 }}
          />
          <Button color="inherit" startIcon={<ContentCopyIcon />} onClick={handleCopyLink}>
            Copy Link
          </Button>
          <Button color="inherit" startIcon={<ExitToAppIcon />} onClick={handleEndSession}>
            {confirmEnd ? 'Confirm End' : 'End Session'}
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h5" gutterBottom>
                Session Code: {session.url}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Created: {new Date(session.createdAt).toLocaleString()}
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h5">Questions ({filteredQuestions.length})</Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <FormControl size="small" sx={{ minWidth: 120 }}>
                    <InputLabel id="sort-select-label">Sort By</InputLabel>
                    <Select
                      labelId="sort-select-label"
                      value={sortBy}
                      label="Sort By"
                      onChange={handleSortChange}
                    >
                      <MenuItem value="votes">Votes</MenuItem>
                      <MenuItem value="timestamp">Newest</MenuItem>
                      <MenuItem value="status">Status</MenuItem>
                    </Select>
                  </FormControl>
                  <Button
                    variant={filterAnswered ? 'contained' : 'outlined'}
                    onClick={handleFilterToggle}
                    startIcon={<SortIcon />}
                  >
                    Hide Answered
                  </Button>
                </Box>
              </Box>

              <Divider sx={{ mb: 2 }} />

              {filteredQuestions.length === 0 ? (
                <Typography variant="body1" sx={{ textAlign: 'center', py: 4 }}>
                  No questions yet. Share the session link with your audience to get started.
                </Typography>
              ) : (
                <List>
                  {filteredQuestions
                    .filter((question) => question && question.id)
                    .map((question) => (
                      <Paper
                        key={question.id}
                        elevation={1}
                        sx={{
                          mb: 2,
                          p: 2,
                          borderLeft: question.isAnswered
                            ? '4px solid #4caf50'
                            : '4px solid #2196f3',
                        }}
                      >
                        <ListItem
                          alignItems="flex-start"
                          secondaryAction={
                            !question.isAnswered && (
                              <Button
                                variant="outlined"
                                color="success"
                                startIcon={<CheckIcon />}
                                onClick={() => handleMarkAnswered(question.id)}
                              >
                                Mark Answered
                              </Button>
                            )
                          }
                        >
                          <ListItemText
                            primary={
                              <Typography variant="h6">
                                {question.text}
                                {question.isAnswered && (
                                  <Chip
                                    label="Answered"
                                    color="success"
                                    size="small"
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
                                  <Chip
                                    icon={<ThumbUpIcon />}
                                    label={question.votes.up}
                                    variant="outlined"
                                    size="small"
                                    sx={{ mr: 1 }}
                                  />
                                  <Chip
                                    icon={<ThumbDownIcon />}
                                    label={question.votes.down}
                                    variant="outlined"
                                    size="small"
                                  />
                                  <Chip
                                    label={`Score: ${question.votes.up - question.votes.down}`}
                                    color={
                                      question.votes.up - question.votes.down > 0
                                        ? 'success'
                                        : 'default'
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
          </Grid>
        </Grid>
      </Container>

      <Snackbar
        open={copySuccess}
        autoHideDuration={3000}
        onClose={() => setCopySuccess(false)}
        message="Link copied to clipboard"
      />
    </Box>
  );
};

export default PresenterViewPage;
