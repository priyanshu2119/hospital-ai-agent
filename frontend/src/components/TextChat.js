/**
 * TextChat.js — AI Chat Interface Component
 *
 * The primary interaction surface of the application. Handles:
 *   1. Patient registration (name + phone) before starting chat
 *   2. Real-time text messaging with AI assistant
 *   3. Voice input via MediaRecorder → STT transcription → AI response
 *   4. Text-to-speech (TTS) playback of AI responses
 *   5. Conversation history display with message bubbles
 *
 * Design decisions:
 *   - Chat bubbles use CSS classes (chat-bubble--user, chat-bubble--assistant)
 *     for consistent styling defined in App.css.
 *   - Voice recording state is visually indicated with a pulsing red dot.
 *   - TTS toggle persists within the session via component state.
 *   - All API errors are caught and displayed inline, never crashing the UI.
 *   - Uses onKeyDown (not deprecated onKeyPress) for Enter-to-send.
 *
 * Fixes applied from previous version:
 *   - Removed unused `recordedChunks` state variable
 *   - Replaced deprecated `onKeyPress` with `onKeyDown`
 *   - Added auto-dismiss for error messages (5 second timeout)
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Chip,
  IconButton,
  Switch,
  FormControlLabel,
  Avatar,
  Fade,
} from '@mui/material';
import {
  Chat as ChatIcon,
  Send as SendIcon,
  Person as PersonIcon,
  SmartToy as BotIcon,
  VolumeUp as VolumeUpIcon,
  VolumeOff as VolumeOffIcon,
  Mic as MicIcon,
  MicOff as MicOffIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { triageAPI } from '../services/api';

/* ------------------------------------------------------------------ */
/*  TypingIndicator — Three-dot animation while AI is generating      */
/* ------------------------------------------------------------------ */

/**
 * Displays an animated "..." indicator when the AI is processing a response.
 * Uses the CSS keyframe `typingDot` defined in index.css.
 */
function TypingIndicator() {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 1.5,
        mb: 2,
        animation: 'fadeInUp 0.3s var(--ease-out) forwards',
      }}
    >
      <Avatar
        sx={{
          width: 32,
          height: 32,
          background: 'linear-gradient(135deg, #00BFA6 0%, #009688 100%)',
          flexShrink: 0,
        }}
      >
        <BotIcon sx={{ fontSize: 18 }} />
      </Avatar>
      <Box
        sx={{
          backgroundColor: '#FFF',
          borderRadius: '18px 18px 18px 4px',
          border: '1px solid rgba(15,41,64,0.06)',
          px: 2.5,
          py: 1.5,
        }}
      >
        <Box className="typing-indicator">
          <span />
          <span />
          <span />
        </Box>
      </Box>
    </Box>
  );
}

/* ------------------------------------------------------------------ */
/*  ChatMessage — Single message bubble                               */
/* ------------------------------------------------------------------ */

/**
 * Renders a single chat message with avatar, content, and timestamp.
 *
 * @param {Object}  props
 * @param {Object}  props.message — { role, content, timestamp, isVoice }
 * @param {number}  props.index   — Message index for animation delay
 */
function ChatMessage({ message, index }) {
  const isUser = message.role === 'user';

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 1.5,
        mb: 2,
        flexDirection: isUser ? 'row-reverse' : 'row',
        animation: `fadeInUp 0.3s var(--ease-out) forwards`,
      }}
    >
      {/* Avatar */}
      <Avatar
        sx={{
          width: 32,
          height: 32,
          flexShrink: 0,
          background: isUser
            ? 'linear-gradient(135deg, #0F2940 0%, #1A3A5C 100%)'
            : 'linear-gradient(135deg, #00BFA6 0%, #009688 100%)',
        }}
      >
        {isUser ? <PersonIcon sx={{ fontSize: 18 }} /> : <BotIcon sx={{ fontSize: 18 }} />}
      </Avatar>

      {/* Message Bubble */}
      <Box sx={{ maxWidth: '75%', minWidth: 0 }}>
        <Box className={isUser ? 'chat-bubble--user' : 'chat-bubble--assistant'}>
          <Typography
            variant="body2"
            sx={{
              whiteSpace: 'pre-wrap',
              lineHeight: 1.6,
              color: isUser ? '#FFF' : '#0F2940',
            }}
          >
            {message.content}
          </Typography>
        </Box>

        {/* Metadata line: timestamp + voice indicator */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            mt: 0.5,
            px: 1,
            justifyContent: isUser ? 'flex-end' : 'flex-start',
          }}
        >
          <Typography variant="caption" sx={{ color: '#94A3B8', fontSize: '0.65rem' }}>
            {message.timestamp instanceof Date
              ? message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : ''}
          </Typography>
          {message.isVoice && (
            <Chip
              icon={<MicIcon />}
              label="Voice"
              size="small"
              sx={{ height: 18, fontSize: '0.6rem', '& .MuiChip-icon': { fontSize: 10 } }}
            />
          )}
        </Box>
      </Box>
    </Box>
  );
}

/* ------------------------------------------------------------------ */
/*  TextChat — Main Component                                         */
/* ------------------------------------------------------------------ */

function TextChat() {
  /* ---- State ---- */
  const [patientName, setPatientName] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [conversationLog, setConversationLog] = useState([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [enableTTS, setEnableTTS] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);

  /* ---- Refs ---- */
  const conversationEndRef = useRef(null);
  const inputRef = useRef(null);

  /* ---- Auto-scroll to latest message ---- */
  useEffect(() => {
    conversationEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversationLog, isTyping]);

  /* ---- Auto-dismiss error after 5 seconds ---- */
  useEffect(() => {
    if (!error) return;
    const timer = setTimeout(() => setError(''), 5000);
    return () => clearTimeout(timer);
  }, [error]);

  /**
   * Appends a message to the conversation log.
   * Uses functional state update to avoid stale closure issues.
   *
   * @param {Object} message — { role, content, timestamp, isVoice? }
   */
  const addMessage = useCallback((message) => {
    setConversationLog((prev) => [...prev, message]);
  }, []);

  /**
   * Decodes base64 audio data and plays it through the browser.
   * Creates a temporary Blob URL for playback, then revokes it after use.
   *
   * @param {string} audioData — Base64-encoded audio (MP3 format)
   */
  const playAudio = useCallback((audioData) => {
    if (!audioData) return;

    try {
      const binaryString = atob(audioData);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const audioBlob = new Blob([bytes], { type: 'audio/mpeg' });
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);

      /* Revoke the object URL after playback to free memory */
      audio.addEventListener('ended', () => URL.revokeObjectURL(audioUrl));
      audio.play().catch((e) => console.error('Audio playback failed:', e));
    } catch (e) {
      console.error('Error decoding audio data:', e);
    }
  }, []);

  /**
   * Initializes the chat session.
   * Validates patient info, sets connected state, and sends the
   * initial AI greeting message.
   */
  const startChat = useCallback(() => {
    if (!patientName.trim() || !patientPhone.trim()) {
      setError('Please enter your name and phone number');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      setIsConnected(true);
      setConversationLog([]);

      /* Delayed welcome message simulates natural greeting */
      setTimeout(() => {
        addMessage({
          role: 'assistant',
          content: `Hello ${patientName.trim()}! 👋\n\nI'm your AI medical assistant. I can help you with:\n\n• Symptom assessment and triage\n• Doctor and department information\n• Appointment scheduling\n\nHow can I help you today?`,
          timestamp: new Date(),
        });
      }, 600);
    } catch (err) {
      console.error('Error starting chat:', err);
      setError('Failed to start chat. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [patientName, patientPhone, addMessage]);

  /**
   * Ends the current chat session and resets all conversation state.
   */
  const endChat = useCallback(() => {
    setIsConnected(false);
    setConversationLog([]);
    setCurrentMessage('');
    setIsTyping(false);
  }, []);

  /**
   * Sends the current text message to the backend AI.
   * Flow: add user message → call API → add AI response → play audio if enabled.
   */
  const sendMessage = useCallback(async () => {
    if (!currentMessage.trim()) return;

    const userMessage = {
      role: 'user',
      content: currentMessage.trim(),
      timestamp: new Date(),
    };

    addMessage(userMessage);
    setCurrentMessage('');
    setIsTyping(true);

    try {
      /* Build conversation history for API context */
      const messages = conversationLog.concat(userMessage).map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      const response = await triageAPI.conversation({
        messages,
        enable_tts: enableTTS,
      });

      const assistantMessage = {
        role: 'assistant',
        content: response.data.response,
        timestamp: new Date(),
      };

      addMessage(assistantMessage);

      /* Play TTS audio if enabled and available */
      if (enableTTS && response.data.audio_data) {
        playAudio(response.data.audio_data);
      }
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to get a response. Please check if the backend is running.');
    } finally {
      setIsTyping(false);
      /* Refocus input field after sending */
      inputRef.current?.focus();
    }
  }, [currentMessage, conversationLog, enableTTS, addMessage, playAudio]);

  /**
   * Handles Enter key press to send message.
   * Shift+Enter creates a new line instead of sending.
   *
   * @param {KeyboardEvent} event
   */
  const handleKeyDown = useCallback(
    (event) => {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
      }
    },
    [sendMessage]
  );

  /**
   * Starts audio recording using the MediaRecorder API.
   * Requests microphone permission and begins collecting audio chunks.
   */
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: 'audio/wav' });
        await processVoiceInput(audioBlob);
        /* Release microphone */
        stream.getTracks().forEach((track) => track.stop());
      };

      setMediaRecorder(recorder);
      recorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Error accessing microphone:', err);
      setError('Could not access microphone. Please check browser permissions.');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Stops the current audio recording.
   * The `onstop` handler (set during startRecording) processes the audio.
   */
  const stopRecording = useCallback(() => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  }, [mediaRecorder]);

  /**
   * Processes a recorded audio blob:
   *   1. Sends audio to /api/triage/transcribe for STT
   *   2. Adds the transcribed text as a user message
   *   3. Sends the transcribed text for AI response
   *   4. Plays TTS audio if enabled
   *
   * @param {Blob} audioBlob — Recorded audio data
   */
  const processVoiceInput = async (audioBlob) => {
    setIsTyping(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('audio_file', audioBlob, 'voice_input.wav');

      const response = await triageAPI.transcribe(formData);
      const transcribedText = response.data.transcription;

      if (transcribedText && transcribedText.trim()) {
        const voiceMessage = {
          role: 'user',
          content: transcribedText.trim(),
          timestamp: new Date(),
          isVoice: true,
        };

        addMessage(voiceMessage);

        /* Get AI response for the transcribed text */
        const messages = conversationLog.concat(voiceMessage).map((msg) => ({
          role: msg.role,
          content: msg.content,
        }));

        const aiResponse = await triageAPI.conversation({
          messages,
          enable_tts: enableTTS,
        });

        addMessage({
          role: 'assistant',
          content: aiResponse.data.response,
          timestamp: new Date(),
        });

        if (enableTTS && aiResponse.data.audio_data) {
          playAudio(aiResponse.data.audio_data);
        }
      } else {
        setError('Could not transcribe audio. Please try speaking again or type your message.');
      }
    } catch (err) {
      console.error('Error processing voice input:', err);
      setError('Failed to process voice input. Please try typing instead.');
    } finally {
      setIsTyping(false);
    }
  };

  /* ================================================================ */
  /*  Render                                                           */
  /* ================================================================ */

  return (
    <Box className="animate-fade-in-up">
      <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>
        AI Chat Assistant
      </Typography>
      <Typography variant="body1" sx={{ color: '#64748B', mb: 3 }}>
        Describe your symptoms or ask about hospital services.
      </Typography>

      {/* ========================================================== */}
      {/*  Pre-Chat Registration Form                                */}
      {/* ========================================================== */}
      {!isConnected ? (
        <Fade in timeout={500}>
          <Paper
            elevation={3}
            sx={{
              p: { xs: 3, sm: 5 },
              maxWidth: 520,
              mx: 'auto',
              mt: 4,
              textAlign: 'center',
            }}
          >
            <Avatar
              sx={{
                width: 64,
                height: 64,
                mx: 'auto',
                mb: 3,
                background: 'linear-gradient(135deg, #00BFA6 0%, #009688 100%)',
                boxShadow: '0 6px 20px rgba(0,191,166,0.3)',
              }}
            >
              <ChatIcon sx={{ fontSize: 32 }} />
            </Avatar>

            <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
              Start Your Consultation
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748B', mb: 4 }}>
              Enter your details to begin chatting with our AI medical assistant.
            </Typography>

            <TextField
              fullWidth
              label="Your Name"
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
              margin="normal"
              required
              autoFocus
            />

            <TextField
              fullWidth
              label="Phone Number"
              value={patientPhone}
              onChange={(e) => setPatientPhone(e.target.value)}
              margin="normal"
              required
              type="tel"
            />

            {error && (
              <Alert severity="error" sx={{ mt: 2, textAlign: 'left' }}>
                {error}
              </Alert>
            )}

            <Button
              fullWidth
              variant="contained"
              size="large"
              startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : <ChatIcon />}
              onClick={startChat}
              disabled={isLoading}
              sx={{
                mt: 3,
                py: 1.5,
                background: 'linear-gradient(135deg, #00BFA6 0%, #009688 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #009688 0%, #00BFA6 100%)',
                },
              }}
            >
              {isLoading ? 'Starting...' : 'Start Chat'}
            </Button>
          </Paper>
        </Fade>
      ) : (
        /* ========================================================== */
        /*  Active Chat Interface                                     */
        /* ========================================================== */
        <Box>
          {/* Chat Header Bar */}
          <Paper
            elevation={0}
            sx={{
              p: 2,
              px: 3,
              mb: 0,
              borderRadius: '16px 16px 0 0',
              border: '1px solid rgba(15,41,64,0.06)',
              borderBottom: 'none',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'linear-gradient(135deg, #FAFBFC 0%, #F0F4F8 100%)',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <span className="status-dot status-dot--active" />
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                    {patientName}
                  </Typography>
                </Box>
                <Typography variant="caption" sx={{ color: '#94A3B8' }}>
                  Connected to AI Assistant
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={enableTTS}
                    onChange={(e) => setEnableTTS(e.target.checked)}
                    size="small"
                    sx={{
                      '& .MuiSwitch-switchBase.Mui-checked': { color: '#00BFA6' },
                      '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#00BFA6' },
                    }}
                  />
                }
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    {enableTTS ? <VolumeUpIcon sx={{ fontSize: 16 }} /> : <VolumeOffIcon sx={{ fontSize: 16 }} />}
                    <Typography variant="caption" sx={{ fontWeight: 600 }}>
                      Voice
                    </Typography>
                  </Box>
                }
                sx={{ mr: 0 }}
              />
              <Button
                variant="outlined"
                size="small"
                color="error"
                startIcon={<CloseIcon />}
                onClick={endChat}
                sx={{ borderRadius: 2 }}
              >
                End
              </Button>
            </Box>
          </Paper>

          {/* Chat Messages Area */}
          <Card
            sx={{
              borderRadius: '0 0 16px 16px',
              border: '1px solid rgba(15,41,64,0.06)',
              borderTop: 'none',
            }}
          >
            <CardContent sx={{ p: 0 }}>
              {/* Messages scroll container */}
              <Box
                sx={{
                  maxHeight: '450px',
                  minHeight: '300px',
                  overflowY: 'auto',
                  p: 3,
                  background: 'linear-gradient(180deg, #F8FAFC 0%, #F0F4F8 100%)',
                }}
              >
                {conversationLog.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 6 }}>
                    <Avatar
                      sx={{
                        width: 56,
                        height: 56,
                        mx: 'auto',
                        mb: 2,
                        background: 'linear-gradient(135deg, rgba(0,191,166,0.1) 0%, rgba(59,130,246,0.1) 100%)',
                        color: '#00BFA6',
                      }}
                    >
                      <ChatIcon />
                    </Avatar>
                    <Typography variant="body2" sx={{ color: '#94A3B8' }}>
                      Starting conversation...
                    </Typography>
                  </Box>
                ) : (
                  conversationLog.map((message, index) => (
                    <ChatMessage key={index} message={message} index={index} />
                  ))
                )}

                {/* Typing indicator */}
                {isTyping && <TypingIndicator />}

                {/* Scroll anchor */}
                <div ref={conversationEndRef} />
              </Box>

              {/* Recording Indicator */}
              {isRecording && (
                <Box
                  sx={{
                    px: 3,
                    py: 1.5,
                    borderTop: '1px solid rgba(15,41,64,0.06)',
                    backgroundColor: 'rgba(239, 68, 68, 0.04)',
                  }}
                >
                  <Box className="recording-indicator" sx={{ display: 'inline-flex' }}>
                    <span className="recording-indicator__dot" />
                    <Typography variant="caption" sx={{ color: '#EF4444', fontWeight: 600 }}>
                      Recording... Click mic to stop
                    </Typography>
                  </Box>
                </Box>
              )}

              {/* Message Input Area */}
              <Box
                sx={{
                  display: 'flex',
                  gap: 1,
                  alignItems: 'flex-end',
                  p: 2,
                  borderTop: '1px solid rgba(15,41,64,0.06)',
                  backgroundColor: '#FFF',
                  borderRadius: '0 0 16px 16px',
                }}
              >
                <TextField
                  fullWidth
                  multiline
                  maxRows={4}
                  placeholder="Type your message..."
                  value={currentMessage}
                  onChange={(e) => setCurrentMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={isTyping || isRecording}
                  inputRef={inputRef}
                  sx={{
                    flexGrow: 1,
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 3,
                      backgroundColor: '#F8FAFC',
                    },
                  }}
                  size="small"
                />

                {/* Voice Input Button */}
                <IconButton
                  color={isRecording ? 'error' : 'default'}
                  onClick={isRecording ? stopRecording : startRecording}
                  disabled={isTyping}
                  sx={{
                    width: 42,
                    height: 42,
                    backgroundColor: isRecording ? 'rgba(239,68,68,0.08)' : 'rgba(15,41,64,0.04)',
                    '&:hover': {
                      backgroundColor: isRecording ? 'rgba(239,68,68,0.15)' : 'rgba(15,41,64,0.08)',
                    },
                  }}
                >
                  {isRecording ? <MicOffIcon /> : <MicIcon />}
                </IconButton>

                {/* Send Button */}
                <IconButton
                  onClick={sendMessage}
                  disabled={!currentMessage.trim() || isTyping || isRecording}
                  sx={{
                    width: 42,
                    height: 42,
                    backgroundColor: currentMessage.trim()
                      ? '#00BFA6'
                      : 'rgba(15,41,64,0.04)',
                    color: currentMessage.trim() ? '#FFF' : '#94A3B8',
                    '&:hover': {
                      backgroundColor: currentMessage.trim()
                        ? '#009688'
                        : 'rgba(15,41,64,0.08)',
                    },
                    '&.Mui-disabled': {
                      backgroundColor: 'rgba(15,41,64,0.04)',
                      color: '#CBD5E1',
                    },
                  }}
                >
                  <SendIcon sx={{ fontSize: 20 }} />
                </IconButton>
              </Box>

              {/* Error Alert */}
              {error && (
                <Alert
                  severity="error"
                  sx={{ mx: 2, mb: 2 }}
                  onClose={() => setError('')}
                >
                  {error}
                </Alert>
              )}

              {/* Help Tip */}
              <Box sx={{ mx: 2, mb: 2, p: 2, backgroundColor: 'rgba(0,191,166,0.04)', borderRadius: 2 }}>
                <Typography variant="caption" sx={{ color: '#64748B' }}>
                  💡 <strong>Tip:</strong> Describe your symptoms clearly or use the microphone for voice input.
                  The AI can help assess your condition and schedule appointments.
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Box>
      )}
    </Box>
  );
}

export default TextChat;
