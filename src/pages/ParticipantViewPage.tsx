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
  Snackbar,
  Alert,
  Grid,
} from '@mui/material';
import {
  ThumbUp as ThumbUpIcon,
  ThumbDown as ThumbDownIcon,
  Send as SendIcon,
  Check as CheckIcon,
} from '@mui/icons-material';
import { socketService } from '../services/socketService';
import { RootState, AppDispatch } from '../store';
import { createQuestion } from '../store/slices/questionSlice';
import { showSnackbar } from '../store/slices/uiSlice';

const ParticipantViewPage: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  
  const [questionText, setQuestionText] = useState('');
  const [userName, setUserName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  const session = useSelector((state: RootState) => state.session.currentSession);
  const questions = useSelector((state: RootState) => state.questions.questions);
  const userVotes = useSelector((state: RootState) => state.questions.userVotes);
  const socketConnected = useSelector((state: RootState) => state.ui.socketConnected);
  
  useEffect(() => {
    if (!sessionId) {
      navigate('/');
      return;
    }
    
    // Get user name from localStorage
    const storedName = localStorage.getItem(`participant_name_${sessionId}`);
    if (storedName) {
      setUserName(storedName);
    }
    
    // Connect to socket
    socketService.connect(sessionId);
    
    return () => {
      socketService.disconnect();
    };
  }, [sessionId, navigate]);
  
  const handleSubmitQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!questionText.trim() || !userName.trim() || !sessionId) {
      return;
    }
    
    setSubmitting(true);
    
    try {
      // Save name to localStorage
      localStorage.setItem(`participant_name_${sessionId}`, userName);
      
      // Submit question via socket
      socketService.submitQuestion({
        sessionId,
        text: questionText,
        authorName: userName,
      });
      
      // Clear input
      setQuestionText('');
      
      dispatch(showSnackbar({
        message: 'Question submitted successfully',
        severity: 'success',
      }));
    } catch (error) {
      console.error('Failed to submit question:', error);
      dispatch(showSnackbar({
        message: 'Failed to submit question. Please try again.',
        severity: 'error',
      }));
    } finally {
      setSubmitting(false);
    }
  };
  
  const handleVote = (questionId: string, voteType: 'up' | 'down') => {
    if (!userName || !sessionId) return;
    
    socketService.submitVote({
      questionId,
      voterName: userName,
      type: voteType,
    });
  };
  
  // Sort questions by votes (descending)
  const sortedQuestions = [...questions].sort(
    (a, b) => (b.votes.up - b.votes.down) - (a.votes.up - a.votes.down)
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
          <Chip
            label={socketConnected ? 'Connected' : 'Disconnected'}
            color={socketConnected ? 'success' : 'error'}
            size="small"
          />
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
                    borderLeft: question.isAnswered
                      ? '4px solid #4caf50'
                      : '4px solid #2196f3',
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
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            component="span"
                          >
                            From: {question.authorName} | {new Date(question.createdAt).toLocaleString()}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                            <IconButton
                              size="small"
                              color={getUserVote(question.id) === 'up' ? 'primary' : 'default'}
                              onClick={() => handleVote(question.id, 'up')}
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
                              color={question.votes.up - question.votes.down > 0 ? 'success' : 'default'}
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