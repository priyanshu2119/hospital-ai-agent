/**
 * Dashboard.js — Premium Dashboard Component
 *
 * Displays:
 *   1. Hero welcome section with gradient background
 *   2. Animated statistics cards (total, pending, completed, cancelled)
 *   3. Quick action buttons (Start Chat, View Appointments, Hospital Info)
 *   4. Features overview section
 *
 * Data flow:
 *   Mount → fetch /api/appointments → compute stats → render cards
 *
 * Design decisions:
 *   - Stats cards use color-coded top borders matching their semantic meaning
 *   - Hero section uses the brand gradient for strong visual identity
 *   - Quick action cards have hover animations to encourage interaction
 *   - All stat values use useMemo to avoid recalculating on unrelated re-renders
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Typography,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Avatar,
  Button,
} from '@mui/material';
import {
  People as PeopleIcon,
  CalendarToday as CalendarIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Chat as ChatIcon,
  LocalHospital as HospitalIcon,
  ArrowForward as ArrowForwardIcon,
  TrendingUp as TrendingIcon,
  MedicalServices as MedicalIcon,
  Schedule as ScheduleIcon,
  Mic as MicIcon,
} from '@mui/icons-material';
import { appointmentsAPI } from '../services/api';

/* ------------------------------------------------------------------ */
/*  StatCard — Individual statistics display card                     */
/* ------------------------------------------------------------------ */

/**
 * Renders a single statistics card with icon, label, value, and
 * a color-coded top border strip.
 *
 * @param {Object}  props
 * @param {string}  props.title      — Label text (e.g., "Total Appointments")
 * @param {number}  props.value      — Numeric value to display
 * @param {React.Element} props.icon — MUI icon element
 * @param {string}  props.color      — Hex color for the accent
 * @param {string}  props.variant    — CSS class suffix for top border color
 * @param {number}  props.delay      — Animation delay in ms for stagger effect
 */
function StatCard({ title, value, icon, color, variant, delay }) {
  return (
    <Card
      className={`stat-card stat-card--${variant}`}
      sx={{
        animation: `fadeInUp 0.5s var(--ease-out) ${delay}ms forwards`,
        opacity: 0,
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography
              variant="caption"
              sx={{
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: '#94A3B8',
                mb: 0.5,
                display: 'block',
              }}
            >
              {title}
            </Typography>
            <Typography
              variant="h3"
              component="div"
              sx={{
                fontWeight: 800,
                color,
                lineHeight: 1,
                mt: 1,
              }}
            >
              {value}
            </Typography>
          </Box>
          <Avatar
            sx={{
              width: 56,
              height: 56,
              backgroundColor: `${color}12`,
              color,
            }}
          >
            {icon}
          </Avatar>
        </Box>
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/*  QuickActionCard — Clickable navigation card                       */
/* ------------------------------------------------------------------ */

/**
 * Renders a clickable card that navigates to a specific section of the app.
 *
 * @param {Object}   props
 * @param {string}   props.title       — Card heading
 * @param {string}   props.description — Brief description
 * @param {React.Element} props.icon   — MUI icon element
 * @param {string}   props.gradient    — CSS gradient for the icon background
 * @param {Function} props.onClick     — Navigation callback
 */
function QuickActionCard({ title, description, icon, gradient, onClick }) {
  return (
    <Card
      className="action-card"
      onClick={onClick}
      sx={{ height: '100%' }}
    >
      <CardContent sx={{ p: 3 }}>
        <Avatar
          sx={{
            width: 48,
            height: 48,
            background: gradient,
            mb: 2,
            boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
          }}
        >
          {icon}
        </Avatar>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5, fontSize: '1rem' }}>
          {title}
        </Typography>
        <Typography variant="body2" sx={{ color: '#64748B', lineHeight: 1.5 }}>
          {description}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', mt: 2, color: '#00BFA6' }}>
          <Typography variant="caption" sx={{ fontWeight: 700, color: 'inherit' }}>
            Get started
          </Typography>
          <ArrowForwardIcon sx={{ fontSize: 14, ml: 0.5 }} />
        </Box>
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/*  Dashboard — Main Component                                        */
/* ------------------------------------------------------------------ */

function Dashboard() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  /**
   * Fetches appointment data to compute dashboard statistics.
   * Wrapped in useCallback since it's referenced in the useEffect dep array.
   */
  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await appointmentsAPI.getAll();
      setAppointments(response.data);
    } catch (err) {
      console.error('Error fetching statistics:', err);
      setAppointments([]);
      setError('Could not load appointment data. The backend may not be running.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  /**
   * Compute stats from the appointments array.
   * Uses useMemo to avoid recalculating when unrelated state changes.
   * Uses a single pass through the array (O(n)) instead of multiple .filter() calls.
   */
  const stats = useMemo(() => {
    const result = { total: appointments.length, pending: 0, confirmed: 0, completed: 0, cancelled: 0 };

    for (const apt of appointments) {
      switch (apt.status) {
        case 'pending':   result.pending++;   break;
        case 'confirmed': result.confirmed++; break;
        case 'completed': result.completed++; break;
        case 'cancelled': result.cancelled++; break;
        default: break;
      }
    }

    return result;
  }, [appointments]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 12 }}>
        <CircularProgress sx={{ color: '#00BFA6' }} />
      </Box>
    );
  }

  return (
    <Box className="animate-fade-in-up">
      {/* ============================================================ */}
      {/*  Hero Section                                                 */}
      {/* ============================================================ */}
      <Box
        className="hero-gradient"
        sx={{
          p: { xs: 4, md: 6 },
          mb: 4,
          color: '#FFF',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <Typography
          variant="h3"
          sx={{
            fontWeight: 800,
            mb: 1.5,
            position: 'relative',
            zIndex: 2,
            fontSize: { xs: '1.5rem', sm: '2rem', md: '2.25rem' },
          }}
        >
          Welcome to Hospital Assistant
        </Typography>
        <Typography
          variant="body1"
          sx={{
            color: 'rgba(255,255,255,0.75)',
            maxWidth: 600,
            mb: 3,
            position: 'relative',
            zIndex: 2,
            lineHeight: 1.7,
          }}
        >
          AI-powered medical triage, symptom assessment, and appointment scheduling.
          Chat with our intelligent assistant for quick healthcare guidance.
        </Typography>
        <Button
          variant="contained"
          startIcon={<ChatIcon />}
          onClick={() => navigate('/chat')}
          sx={{
            background: 'linear-gradient(135deg, #00BFA6 0%, #009688 100%)',
            px: 4,
            py: 1.5,
            fontSize: '0.9rem',
            position: 'relative',
            zIndex: 2,
            boxShadow: '0 4px 16px rgba(0,191,166,0.35)',
            '&:hover': {
              background: 'linear-gradient(135deg, #009688 0%, #00BFA6 100%)',
              boxShadow: '0 6px 24px rgba(0,191,166,0.45)',
            },
          }}
        >
          Start AI Consultation
        </Button>
      </Box>

      {/* Error Banner */}
      {error && (
        <Alert severity="warning" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* ============================================================ */}
      {/*  Statistics Cards                                             */}
      {/* ============================================================ */}
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 3 }}>
        Appointment Overview
      </Typography>

      <Grid container spacing={3} sx={{ mb: 5 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Appointments"
            value={stats.total}
            icon={<CalendarIcon fontSize="large" />}
            color="#0F2940"
            variant="primary"
            delay={0}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Pending"
            value={stats.pending}
            icon={<PeopleIcon fontSize="large" />}
            color="#F59E0B"
            variant="warning"
            delay={100}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Completed"
            value={stats.completed}
            icon={<CheckCircleIcon fontSize="large" />}
            color="#10B981"
            variant="success"
            delay={200}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Cancelled"
            value={stats.cancelled}
            icon={<CancelIcon fontSize="large" />}
            color="#EF4444"
            variant="error"
            delay={300}
          />
        </Grid>
      </Grid>

      {/* ============================================================ */}
      {/*  Quick Actions                                                */}
      {/* ============================================================ */}
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 3 }}>
        Quick Actions
      </Typography>

      <Grid container spacing={3} sx={{ mb: 5 }}>
        <Grid item xs={12} sm={6} md={3}>
          <QuickActionCard
            title="AI Text Chat"
            description="Describe your symptoms and get instant triage guidance."
            icon={<ChatIcon />}
            gradient="linear-gradient(135deg, #00BFA6 0%, #009688 100%)"
            onClick={() => navigate('/chat')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <QuickActionCard
            title="Voice Input"
            description="Use your microphone for hands-free symptom reporting."
            icon={<MicIcon />}
            gradient="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
            onClick={() => navigate('/chat')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <QuickActionCard
            title="Appointments"
            description="View, manage, and track all your scheduled appointments."
            icon={<ScheduleIcon />}
            gradient="linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"
            onClick={() => navigate('/appointments')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <QuickActionCard
            title="Hospital Info"
            description="Browse departments, doctors, and available services."
            icon={<HospitalIcon />}
            gradient="linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)"
            onClick={() => navigate('/hospital')}
          />
        </Grid>
      </Grid>

      {/* ============================================================ */}
      {/*  Features Section                                             */}
      {/* ============================================================ */}
      <Card sx={{ overflow: 'hidden' }}>
        <CardContent sx={{ p: { xs: 3, md: 5 } }}>
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
            How It Works
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748B', mb: 4, maxWidth: 600 }}>
            Our AI-powered system streamlines the healthcare experience from symptom
            assessment to appointment booking.
          </Typography>

          <Grid container spacing={4}>
            {[
              {
                icon: <ChatIcon />,
                title: 'Describe Symptoms',
                desc: 'Tell our AI assistant about your symptoms via text or voice input.',
                color: '#00BFA6',
              },
              {
                icon: <MedicalIcon />,
                title: 'AI Triage Assessment',
                desc: 'Our AI analyzes your symptoms and recommends the right department.',
                color: '#3B82F6',
              },
              {
                icon: <CalendarIcon />,
                title: 'Book Appointment',
                desc: 'Schedule with the right doctor based on availability and your needs.',
                color: '#8B5CF6',
              },
              {
                icon: <TrendingIcon />,
                title: 'Track & Follow Up',
                desc: 'Monitor your appointments and get reminders for follow-up visits.',
                color: '#F59E0B',
              },
            ].map((step, index) => (
              <Grid item xs={12} sm={6} md={3} key={step.title}>
                <Box sx={{ textAlign: 'center' }}>
                  <Avatar
                    sx={{
                      width: 56,
                      height: 56,
                      backgroundColor: `${step.color}12`,
                      color: step.color,
                      mx: 'auto',
                      mb: 2,
                    }}
                  >
                    {step.icon}
                  </Avatar>
                  <Typography
                    variant="caption"
                    sx={{
                      color: step.color,
                      fontWeight: 700,
                      display: 'block',
                      mb: 0.5,
                    }}
                  >
                    Step {index + 1}
                  </Typography>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
                    {step.title}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#64748B', lineHeight: 1.5 }}>
                    {step.desc}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
}

export default Dashboard;
