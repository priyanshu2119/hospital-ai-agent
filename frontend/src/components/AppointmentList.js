/**
 * AppointmentList.js — Appointment Management Component
 *
 * Displays all appointments in a modern table with:
 *   - Status badges with semantic colors
 *   - Click-to-view detail dialog
 *   - Cancel functionality with confirmation
 *   - Refresh and create actions
 *   - Empty state with illustration
 *   - New appointment creation dialog
 *
 * Fixes from previous version:
 *   - Removed unused imports: TextField, MenuItem, EditIcon
 *   - Added functional "New Appointment" dialog
 *   - Added empty state UI
 *   - Improved status chips with custom styling
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  TextField,
  MenuItem,
  Grid,
  Tooltip,
  Fade,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  CalendarToday as CalendarIcon,
  Visibility as ViewIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { appointmentsAPI } from '../services/api';
import { format } from 'date-fns';

/* ------------------------------------------------------------------ */
/*  Status Configuration — Maps status to visual properties           */
/* ------------------------------------------------------------------ */

/**
 * Centralized status → color/label mapping.
 * Uses O(1) HashMap lookup instead of switch statements.
 */
const STATUS_CONFIG = {
  pending:   { color: '#F59E0B', bg: 'rgba(245,158,11,0.08)',  label: 'Pending' },
  confirmed: { color: '#3B82F6', bg: 'rgba(59,130,246,0.08)',  label: 'Confirmed' },
  completed: { color: '#10B981', bg: 'rgba(16,185,129,0.08)',  label: 'Completed' },
  cancelled: { color: '#EF4444', bg: 'rgba(239,68,68,0.08)',   label: 'Cancelled' },
};

/* ------------------------------------------------------------------ */
/*  StatusChip — Styled status indicator                              */
/* ------------------------------------------------------------------ */

/**
 * Renders a colored chip for appointment status.
 *
 * @param {Object} props
 * @param {string} props.status — One of: pending, confirmed, completed, cancelled
 */
function StatusChip({ status }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;

  return (
    <Chip
      label={config.label}
      size="small"
      sx={{
        backgroundColor: config.bg,
        color: config.color,
        fontWeight: 700,
        fontSize: '0.7rem',
        border: `1px solid ${config.color}20`,
      }}
    />
  );
}

/* ------------------------------------------------------------------ */
/*  EmptyState — Shown when no appointments exist                     */
/* ------------------------------------------------------------------ */

function EmptyState() {
  return (
    <Box className="empty-state" sx={{ py: 8 }}>
      <Box className="empty-state__icon">
        <CalendarIcon sx={{ fontSize: 40, color: '#00BFA6' }} />
      </Box>
      <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, color: '#0F2940' }}>
        No Appointments Yet
      </Typography>
      <Typography variant="body2" sx={{ color: '#94A3B8', maxWidth: 360, lineHeight: 1.6 }}>
        Appointments booked through the AI chat or created manually will appear here.
        Start a chat to get your first appointment scheduled.
      </Typography>
    </Box>
  );
}

/* ------------------------------------------------------------------ */
/*  AppointmentList — Main Component                                  */
/* ------------------------------------------------------------------ */

function AppointmentList() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [detailDialog, setDetailDialog] = useState(false);
  const [createDialog, setCreateDialog] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);

  /* New appointment form state */
  const [newAppointment, setNewAppointment] = useState({
    patient_name: '',
    patient_phone: '',
    patient_email: '',
    symptoms: '',
    appointment_type: 'general',
    appointment_date: '',
    department: '',
    doctor_name: '',
  });
  const [creating, setCreating] = useState(false);

  /**
   * Fetches all appointments from the backend API.
   */
  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await appointmentsAPI.getAll();
      setAppointments(response.data);
    } catch (err) {
      console.error('Error fetching appointments:', err);
      setError('Failed to load appointments. Is the backend running?');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  /**
   * Cancels an appointment after user confirmation.
   *
   * @param {number} id — Appointment ID to cancel
   */
  const handleCancelAppointment = useCallback(
    async (id) => {
      if (!window.confirm('Are you sure you want to cancel this appointment?')) return;

      try {
        await appointmentsAPI.cancel(id);
        fetchAppointments();
      } catch (err) {
        console.error('Error cancelling appointment:', err);
        setError('Failed to cancel appointment');
      }
    },
    [fetchAppointments]
  );

  /**
   * Opens the detail dialog for a specific appointment.
   *
   * @param {number} id — Appointment ID to view
   */
  const handleViewDetails = useCallback(async (id) => {
    try {
      const response = await appointmentsAPI.getById(id);
      setSelectedAppointment(response.data);
      setDetailDialog(true);
    } catch (err) {
      console.error('Error fetching appointment details:', err);
      setError('Failed to load appointment details');
    }
  }, []);

  /**
   * Creates a new appointment via the API.
   */
  const handleCreateAppointment = useCallback(async () => {
    /* Validate required fields */
    if (!newAppointment.patient_name || !newAppointment.patient_phone || !newAppointment.appointment_date) {
      setError('Please fill in all required fields (name, phone, date)');
      return;
    }

    setCreating(true);
    try {
      await appointmentsAPI.create({
        ...newAppointment,
        appointment_date: new Date(newAppointment.appointment_date).toISOString(),
      });

      setCreateDialog(false);
      setNewAppointment({
        patient_name: '',
        patient_phone: '',
        patient_email: '',
        symptoms: '',
        appointment_type: 'general',
        appointment_date: '',
        department: '',
        doctor_name: '',
      });
      fetchAppointments();
    } catch (err) {
      console.error('Error creating appointment:', err);
      setError('Failed to create appointment');
    } finally {
      setCreating(false);
    }
  }, [newAppointment, fetchAppointments]);

  return (
    <Box className="animate-fade-in-up">
      {/* Page Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800 }}>
            Appointments
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748B', mt: 0.5 }}>
            Manage and track all scheduled appointments.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Refresh list">
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={fetchAppointments}
              disabled={loading}
              sx={{ borderRadius: 2 }}
            >
              Refresh
            </Button>
          </Tooltip>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCreateDialog(true)}
            sx={{
              borderRadius: 2,
              background: 'linear-gradient(135deg, #00BFA6 0%, #009688 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #009688 0%, #00BFA6 100%)',
              },
            }}
          >
            New Appointment
          </Button>
        </Box>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Loading State */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress sx={{ color: '#00BFA6' }} />
        </Box>
      ) : appointments.length === 0 ? (
        <Paper elevation={0} sx={{ border: '1px solid rgba(15,41,64,0.06)' }}>
          <EmptyState />
        </Paper>
      ) : (
        /* Appointments Table */
        <TableContainer
          component={Paper}
          elevation={0}
          sx={{ border: '1px solid rgba(15,41,64,0.06)' }}
        >
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Patient Name</TableCell>
                <TableCell>Phone</TableCell>
                <TableCell>Date & Time</TableCell>
                <TableCell>Department</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {appointments.map((appointment) => (
                <TableRow
                  key={appointment.id}
                  hover
                  sx={{
                    cursor: 'pointer',
                    '&:last-child td': { borderBottom: 0 },
                  }}
                >
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#64748B' }}>
                      #{appointment.id}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {appointment.patient_name}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ color: '#64748B' }}>
                      {appointment.patient_phone}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {format(new Date(appointment.appointment_date), 'PPp')}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ color: '#64748B' }}>
                      {appointment.department || 'General'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <StatusChip status={appointment.status} />
                  </TableCell>
                  <TableCell align="right">
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                      <Tooltip title="View details">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewDetails(appointment.id);
                          }}
                          sx={{ color: '#3B82F6' }}
                        >
                          <ViewIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Cancel appointment">
                        <span>
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCancelAppointment(appointment.id);
                            }}
                            disabled={appointment.status === 'cancelled'}
                            sx={{ color: '#EF4444' }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* ============================================================ */}
      {/*  Appointment Detail Dialog                                    */}
      {/* ============================================================ */}
      <Dialog
        open={detailDialog}
        onClose={() => setDetailDialog(false)}
        maxWidth="sm"
        fullWidth
        TransitionComponent={Fade}
      >
        {selectedAppointment && (
          <>
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Appointment #{selectedAppointment.id}
              </Typography>
              <IconButton onClick={() => setDetailDialog(false)} size="small">
                <CloseIcon />
              </IconButton>
            </DialogTitle>
            <DialogContent dividers>
              <Box sx={{ pt: 1 }}>
                {/* Patient Info */}
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Patient Information
                </Typography>
                <Box sx={{ mt: 1, mb: 3, p: 2, backgroundColor: 'rgba(15,41,64,0.02)', borderRadius: 2 }}>
                  <Typography variant="body2"><strong>Name:</strong> {selectedAppointment.patient_name}</Typography>
                  <Typography variant="body2"><strong>Phone:</strong> {selectedAppointment.patient_phone}</Typography>
                  {selectedAppointment.patient_email && (
                    <Typography variant="body2"><strong>Email:</strong> {selectedAppointment.patient_email}</Typography>
                  )}
                </Box>

                {/* Appointment Info */}
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Appointment Details
                </Typography>
                <Box sx={{ mt: 1, mb: 3, p: 2, backgroundColor: 'rgba(15,41,64,0.02)', borderRadius: 2 }}>
                  <Typography variant="body2">
                    <strong>Date & Time:</strong> {format(new Date(selectedAppointment.appointment_date), 'PPpp')}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Department:</strong> {selectedAppointment.department || 'General'}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Doctor:</strong> {selectedAppointment.doctor_name || 'To be assigned'}
                  </Typography>
                  <Box sx={{ mt: 1 }}>
                    <strong>Status: </strong>
                    <StatusChip status={selectedAppointment.status} />
                  </Box>
                </Box>

                {/* Symptoms */}
                {selectedAppointment.symptoms && (
                  <>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Symptoms
                    </Typography>
                    <Box sx={{ mt: 1, mb: 3, p: 2, backgroundColor: 'rgba(245,158,11,0.04)', borderRadius: 2, border: '1px solid rgba(245,158,11,0.1)' }}>
                      <Typography variant="body2">{selectedAppointment.symptoms}</Typography>
                    </Box>
                  </>
                )}

                {/* AI Recommendation */}
                {selectedAppointment.ai_recommendation && (
                  <>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      AI Recommendation
                    </Typography>
                    <Box sx={{ mt: 1, p: 2, backgroundColor: 'rgba(0,191,166,0.04)', borderRadius: 2, border: '1px solid rgba(0,191,166,0.1)' }}>
                      <Typography variant="body2">{selectedAppointment.ai_recommendation}</Typography>
                    </Box>
                  </>
                )}
              </Box>
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
              <Button onClick={() => setDetailDialog(false)}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* ============================================================ */}
      {/*  Create Appointment Dialog                                    */}
      {/* ============================================================ */}
      <Dialog
        open={createDialog}
        onClose={() => setCreateDialog(false)}
        maxWidth="sm"
        fullWidth
        TransitionComponent={Fade}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            New Appointment
          </Typography>
          <IconButton onClick={() => setCreateDialog(false)} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ pt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                required
                label="Patient Name"
                value={newAppointment.patient_name}
                onChange={(e) => setNewAppointment((prev) => ({ ...prev, patient_name: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                required
                label="Phone Number"
                type="tel"
                value={newAppointment.patient_phone}
                onChange={(e) => setNewAppointment((prev) => ({ ...prev, patient_phone: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email (Optional)"
                type="email"
                value={newAppointment.patient_email}
                onChange={(e) => setNewAppointment((prev) => ({ ...prev, patient_email: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                required
                label="Appointment Date & Time"
                type="datetime-local"
                value={newAppointment.appointment_date}
                onChange={(e) => setNewAppointment((prev) => ({ ...prev, appointment_date: e.target.value }))}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Appointment Type"
                value={newAppointment.appointment_type}
                onChange={(e) => setNewAppointment((prev) => ({ ...prev, appointment_type: e.target.value }))}
              >
                <MenuItem value="general">General</MenuItem>
                <MenuItem value="consultation">Consultation</MenuItem>
                <MenuItem value="follow_up">Follow-up</MenuItem>
                <MenuItem value="emergency">Emergency</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Department"
                value={newAppointment.department}
                onChange={(e) => setNewAppointment((prev) => ({ ...prev, department: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Symptoms / Notes"
                value={newAppointment.symptoms}
                onChange={(e) => setNewAppointment((prev) => ({ ...prev, symptoms: e.target.value }))}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setCreateDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleCreateAppointment}
            disabled={creating}
            startIcon={creating ? <CircularProgress size={16} /> : <AddIcon />}
            sx={{
              background: 'linear-gradient(135deg, #00BFA6 0%, #009688 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #009688 0%, #00BFA6 100%)',
              },
            }}
          >
            {creating ? 'Creating...' : 'Create Appointment'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default AppointmentList;
