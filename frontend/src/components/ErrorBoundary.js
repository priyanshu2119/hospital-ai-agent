/**
 * ErrorBoundary.js — React Error Boundary Component
 *
 * Why this exists:
 *   React class component that catches JavaScript errors anywhere in the
 *   child component tree, logs the error, and displays a graceful fallback
 *   UI instead of crashing the entire application. Without this, a single
 *   component crash (e.g., in TextChat) would white-screen the whole app.
 *
 * Design decisions:
 *   - Uses class component because React error boundaries require
 *     getDerivedStateFromError / componentDidCatch (no hook equivalent).
 *   - Provides a "Try Again" button that resets the boundary state.
 *   - Styled to match the app's premium design language.
 */

import React, { Component } from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import { ErrorOutline as ErrorIcon, Refresh as RefreshIcon } from '@mui/icons-material';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  /**
   * Called when a descendant component throws an error.
   * Updates state so the next render shows the fallback UI.
   *
   * @param {Error} error — The error that was thrown
   * @returns {Object} — Partial state update
   */
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  /**
   * Called after an error is caught. Used for logging purposes.
   * In production, this would send errors to a monitoring service.
   *
   * @param {Error} error — The error that was thrown
   * @param {Object} errorInfo — Contains the component stack trace
   */
  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    /* eslint-disable-next-line no-console */
    console.error('[ErrorBoundary] Caught error:', error, errorInfo);
  }

  /**
   * Resets the error state, allowing the user to retry rendering
   * the child component tree.
   */
  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '60vh',
            p: 4,
          }}
        >
          <Paper
            elevation={3}
            sx={{
              p: 5,
              maxWidth: 520,
              textAlign: 'center',
              borderRadius: 4,
              background: 'linear-gradient(135deg, #FFF5F5 0%, #FFF 100%)',
              border: '1px solid rgba(239, 68, 68, 0.15)',
            }}
            className="animate-scale-in"
          >
            <Box
              sx={{
                width: 72,
                height: 72,
                borderRadius: '50%',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 3,
              }}
            >
              <ErrorIcon sx={{ fontSize: 36, color: '#EF4444' }} />
            </Box>

            <Typography variant="h5" gutterBottom sx={{ fontWeight: 700, color: '#0F2940' }}>
              Something went wrong
            </Typography>

            <Typography variant="body1" sx={{ color: '#64748B', mb: 3, lineHeight: 1.7 }}>
              An unexpected error occurred. This has been logged automatically.
              Please try again, or contact support if the problem persists.
            </Typography>

            {/* Show error details in development */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <Box
                sx={{
                  mt: 2,
                  mb: 3,
                  p: 2,
                  backgroundColor: 'rgba(239, 68, 68, 0.05)',
                  borderRadius: 2,
                  textAlign: 'left',
                  maxHeight: 150,
                  overflow: 'auto',
                }}
              >
                <Typography
                  variant="caption"
                  component="pre"
                  sx={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: '0.7rem',
                    color: '#DC2626',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  }}
                >
                  {this.state.error.toString()}
                </Typography>
              </Box>
            )}

            <Button
              variant="contained"
              startIcon={<RefreshIcon />}
              onClick={this.handleReset}
              sx={{
                background: 'linear-gradient(135deg, #0F2940 0%, #1A3A5C 100%)',
                px: 4,
                py: 1.5,
              }}
            >
              Try Again
            </Button>
          </Paper>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
