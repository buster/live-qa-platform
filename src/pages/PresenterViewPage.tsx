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
  AppBar,
  Toolbar,
  IconButton,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Alert,
  Snackbar,
  Grid,
  SelectChangeEvent,
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

type SortByType = 'votes' | 'timestamp' | 'status';

const PresenterViewPage: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  
  const [copySuccess, setCopySuccess] = useState(false);
  const [confirmEnd, setConfirmEnd] = useState(false);
  
  const session = useSelector((state: RootState) => state.session.currentSession);
  const questions = useSelector((state: RootState) => state.questions.questions);
  const sortBy = useSelector((state: RootState) => state.ui.sortBy);
  const filterAnswered = useSelector((state: RootState) => state.ui.filterAnswered);
  const socketConnected = useSelector((state: RootState) => state.ui.socketConnected);
  
  useEffect(() => {
    if (!sessionId) {
      navigate('/');
      return;
    }
    
    // Check if presenter token exists
    const presenterToken = localStorage.getItem(`presenter_token_${sessionId}`);
    if (!presenterToken) {
      navigate('/');
      return;
    }
    
    // Connect to socket
    socketService.connect(sessionId);
    
    return () => {
      socketService.disconnect();
    };
  }, [sessionId, navigate]);
  
  const handleCopyLink = () => {
    if (!session) return;
    
    const joinUrl = `${window.location.origin}/join/${session.id}`;
    navigator.clipboard.writeText(joinUrl);
    setCopySuccess(true);
  };
  
  const handleEndSession = async () => {
    if (!sessionId) return;
    
    if (!confirmEnd) {
      setConfirmEnd(true);
      return;
    }
    
    try {
      await dispatch(endSession(sessionId));
      navigate('/');
    } catch (error) {
      console.error('Failed to end session:', error);
    }
  };
  
  const handleMarkAnswered = (questionId: string) => {
    dispatch(markAnswered({ questionId }));
    socketService.markAnswered(questionId);
  };
  
  const handleSortChange = (event: any) => {
    dispatch(setSortBy(event.target.value as SortByType));
  };
  
  const handleFilterToggle = () => {
    dispatch(toggleFilterAnswered());
  };
  
  // Sort and filter questions
  const sortedQuestions = [...questions].sort((a, b) => {
    if (sortBy === 'votes') {
      return (b.votes.up - b.votes.down) - (a.votes.up - a.votes.down);
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
          <Button
            color="inherit"
            startIcon={<ContentCopyIcon />}
            onClick={handleCopyLink}
          >
            Copy Link
          </Button>
          <Button
            color="inherit"
            startIcon={<ExitToAppIcon />}
            onClick={handleEndSession}
          >
            {confirmEnd ? 'Confirm End' : 'End Session'}
          </Button>
        </Toolbar>
      </AppBar>
      
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h5" gutterBottom>
                Session: {session.id}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Created: {new Date(session.createdAt).toLocaleString()}
              </Typography>
            </Paper>
          </Grid>
          
          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h5">
                  Questions ({filteredQuestions.length})
                </Typography>
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
                  {filteredQuestions.map((question) => (
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
                              <Typography
                                variant="body2"
                                color="text.secondary"
                                component="span"
                              >
                                From: {question.authorName} {' '}
                                | {new Date(question.createdAt).toLocaleString()}
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