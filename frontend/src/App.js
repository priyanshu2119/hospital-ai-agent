/**
 * App.js — Root Application Component
 *
 * Responsibilities:
 *   1. Wraps the entire app with the custom MUI ThemeProvider
 *   2. Provides error boundary protection
 *   3. Renders the modern sidebar navigation with glass effect
 *   4. Manages client-side routing (Dashboard, Chat, Appointments, Hospital Info)
 *   5. Includes an animated footer
 *
 * Design decisions:
 *   - ThemeProvider at the root ensures all MUI components inherit our
 *     premium theme (colors, typography, component overrides).
 *   - ErrorBoundary wraps the main content area so navigation remains
 *     accessible even if a page component crashes.
 *   - Sidebar uses the gradient background from our theme for visual consistency.
 *   - CssBaseline normalizes browser defaults using MUI's built-in reset.
 */

import React, { useState, useCallback, useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  Box,
  Button,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  Divider,
  Avatar,
  Tooltip,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Chat as ChatIcon,
  CalendarToday as CalendarIcon,
  Dashboard as DashboardIcon,
  LocalHospital as HospitalIcon,
  Info as InfoIcon,
  Close as CloseIcon,
  Favorite as HeartIcon,
} from '@mui/icons-material';

import theme, { COLORS } from './theme';
import ErrorBoundary from './components/ErrorBoundary';
import TextChat from './components/TextChat';
import AppointmentList from './components/AppointmentList';
import Dashboard from './components/Dashboard';
import HospitalInfo from './components/HospitalInfo';
import './App.css';

/* ------------------------------------------------------------------ */
/*  Navigation Menu Configuration                                     */
/* ------------------------------------------------------------------ */

/**
 * Centralized menu item definitions.
 * Each entry maps a label + icon to a route path.
 * Adding a new page only requires adding an entry here + a <Route>.
 */
const MENU_ITEMS = [
  { text: 'Dashboard',     icon: <DashboardIcon />, path: '/' },
  { text: 'AI Chat',       icon: <ChatIcon />,      path: '/chat' },
  { text: 'Appointments',  icon: <CalendarIcon />,  path: '/appointments' },
  { text: 'Hospital Info', icon: <InfoIcon />,       path: '/hospital' },
];

/* ------------------------------------------------------------------ */
/*  NavigationContent — Extracted for reuse & readability              */
/* ------------------------------------------------------------------ */

/**
 * Renders the sidebar navigation list.
 * Highlights the currently active route using react-router's useLocation.
 *
 * @param {Object}   props
 * @param {Function} props.onClose — Callback to close the drawer (mobile)
 */
function NavigationContent({ onClose }) {
  const location = useLocation();

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Sidebar Header */}
      <Box sx={{ p: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar
            sx={{
              width: 40,
              height: 40,
              background: 'linear-gradient(135deg, #00BFA6 0%, #009688 100%)',
              boxShadow: '0 4px 12px rgba(0,191,166,0.3)',
            }}
          >
            <HospitalIcon sx={{ fontSize: 22 }} />
          </Avatar>
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#FFF', lineHeight: 1.2 }}>
              Hospital AI
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.65rem' }}>
              Appointment Assistant
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={onClose} sx={{ color: 'rgba(255,255,255,0.6)' }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', mx: 2 }} />

      {/* Navigation Links */}
      <List sx={{ px: 1, py: 2, flex: 1 }}>
        {MENU_ITEMS.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <ListItemButton
              key={item.text}
              component={Link}
              to={item.path}
              onClick={onClose}
              selected={isActive}
              sx={{
                mb: 0.5,
                py: 1.5,
                '& .MuiListItemIcon-root': {
                  color: isActive ? '#00BFA6' : 'rgba(255,255,255,0.6)',
                  minWidth: 40,
                  transition: 'color 0.2s ease',
                },
                '& .MuiListItemText-primary': {
                  color: isActive ? '#FFF' : 'rgba(255,255,255,0.75)',
                  fontWeight: isActive ? 700 : 500,
                  fontSize: '0.9rem',
                },
              }}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
              {isActive && (
                <Box
                  sx={{
                    width: 4,
                    height: 24,
                    borderRadius: 2,
                    backgroundColor: '#00BFA6',
                    boxShadow: '0 0 8px rgba(0,191,166,0.5)',
                  }}
                />
              )}
            </ListItemButton>
          );
        })}
      </List>

      {/* Sidebar Footer */}
      <Box sx={{ p: 3 }}>
        <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', mb: 2 }} />
        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', display: 'block', textAlign: 'center' }}>
          v1.0.0 — HAA
        </Typography>
      </Box>
    </Box>
  );
}

/* ------------------------------------------------------------------ */
/*  App — Root Component                                              */
/* ------------------------------------------------------------------ */

function App() {
  const [drawerOpen, setDrawerOpen] = useState(false);

  /**
   * Memoized toggle handler prevents unnecessary re-renders.
   * Uses useCallback because it's passed as a prop to child components.
   */
  const handleDrawerOpen = useCallback(() => setDrawerOpen(true), []);
  const handleDrawerClose = useCallback(() => setDrawerOpen(false), []);

  /**
   * Year is memoized since it only changes once per calendar year.
   * Avoids creating a new Date on every render.
   */
  const currentYear = useMemo(() => new Date().getFullYear(), []);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          {/* ======================================================= */}
          {/*  Top App Bar                                            */}
          {/* ======================================================= */}
          <AppBar position="sticky" elevation={0}>
            <Toolbar sx={{ py: 0.5 }}>
              <IconButton
                size="large"
                edge="start"
                color="inherit"
                aria-label="Open navigation menu"
                sx={{ mr: 2 }}
                onClick={handleDrawerOpen}
              >
                <MenuIcon />
              </IconButton>

              <Avatar
                sx={{
                  width: 36,
                  height: 36,
                  mr: 1.5,
                  background: 'linear-gradient(135deg, #00BFA6 0%, #009688 100%)',
                  boxShadow: '0 2px 8px rgba(0,191,166,0.3)',
                }}
              >
                <HospitalIcon sx={{ fontSize: 20 }} />
              </Avatar>

              <Typography
                variant="h6"
                component="div"
                sx={{
                  flexGrow: 1,
                  fontWeight: 700,
                  letterSpacing: '-0.01em',
                  fontSize: { xs: '0.95rem', sm: '1.15rem' },
                }}
              >
                Hospital Appointment Assistant
              </Typography>

              <Tooltip title="Start AI consultation">
                <Button
                  color="inherit"
                  component={Link}
                  to="/chat"
                  startIcon={<ChatIcon />}
                  sx={{
                    backgroundColor: 'rgba(0,191,166,0.15)',
                    border: '1px solid rgba(0,191,166,0.3)',
                    borderRadius: 3,
                    px: 2.5,
                    '&:hover': {
                      backgroundColor: 'rgba(0,191,166,0.25)',
                      transform: 'translateY(-1px)',
                    },
                    display: { xs: 'none', sm: 'flex' },
                  }}
                >
                  Start Chat
                </Button>
              </Tooltip>
            </Toolbar>
          </AppBar>

          {/* ======================================================= */}
          {/*  Sidebar Drawer                                         */}
          {/* ======================================================= */}
          <Drawer
            anchor="left"
            open={drawerOpen}
            onClose={handleDrawerClose}
          >
            <NavigationContent onClose={handleDrawerClose} />
          </Drawer>

          {/* ======================================================= */}
          {/*  Main Content Area — wrapped in ErrorBoundary            */}
          {/* ======================================================= */}
          <Container
            maxWidth="lg"
            sx={{
              mt: 4,
              mb: 4,
              flex: 1,
              px: { xs: 2, sm: 3 },
            }}
          >
            <ErrorBoundary>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/chat" element={<TextChat />} />
                <Route path="/appointments" element={<AppointmentList />} />
                <Route path="/hospital" element={<HospitalInfo />} />
              </Routes>
            </ErrorBoundary>
          </Container>

          {/* ======================================================= */}
          {/*  Footer                                                 */}
          {/* ======================================================= */}
          <Box
            component="footer"
            sx={{
              py: 3,
              px: 2,
              mt: 'auto',
              backgroundColor: '#FFF',
              borderTop: '1px solid rgba(15,41,64,0.06)',
            }}
          >
            <Container maxWidth="sm">
              <Typography
                variant="body2"
                sx={{
                  color: '#94A3B8',
                  textAlign: 'center',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 0.5,
                  fontSize: '0.8rem',
                }}
              >
                © {currentYear} Hospital Appointment Assistant. Made with{' '}
                <HeartIcon sx={{ fontSize: 14, color: COLORS.secondary.main }} />
              </Typography>
            </Container>
          </Box>
        </Box>
      </Router>
    </ThemeProvider>
  );
}

export default App;
