/**
 * HospitalInfo.js — Hospital Information Browser Component
 *
 * Displays departments, doctors, and hospital services in a modern,
 * browseable card layout. Data is fetched from the backend API.
 *
 * Why this component exists:
 *   The synopsis requires a hospital-specific knowledge interface where
 *   users can browse departments, view doctor profiles with schedules,
 *   and explore available services — separate from the AI chat.
 *
 * Data flow:
 *   Mount → fetch /api/hospital/departments → render department cards
 *   Expand department → show doctors in that department
 *   Tab switch → fetch /api/hospital/services → render service cards
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Avatar,
  Chip,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
  Paper,
  Collapse,
  IconButton,
  Divider,
} from '@mui/material';
import {
  LocalHospital as HospitalIcon,
  Person as DoctorIcon,
  MedicalServices as ServiceIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  AccessTime as TimeIcon,
  LocationOn as LocationIcon,
  Star as StarIcon,
} from '@mui/icons-material';
import { hospitalAPI } from '../services/api';

/**
 * Maps department names to gradient color pairs for visual distinction.
 * Uses a deterministic hash so the same department always gets the same color.
 *
 * @param {string} name — Department name
 * @returns {string} — CSS linear-gradient string
 */
function getDepartmentGradient(name) {
  const gradients = [
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
    'linear-gradient(135deg, #fccb90 0%, #d57eeb 100%)',
    'linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)',
    'linear-gradient(135deg, #f5576c 0%, #ff4e50 100%)',
    'linear-gradient(135deg, #13547a 0%, #80d0c7 100%)',
  ];

  /* Simple deterministic hash based on character codes */
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return gradients[Math.abs(hash) % gradients.length];
}

/**
 * DepartmentCard — Expandable card showing department info and its doctors.
 *
 * @param {Object}  props
 * @param {Object}  props.department — Department data object
 * @param {boolean} props.isExpanded — Whether the card is currently expanded
 * @param {Function} props.onToggle — Toggle expand/collapse
 */
function DepartmentCard({ department, isExpanded, onToggle }) {
  const gradient = getDepartmentGradient(department.name);

  return (
    <Card
      className="dept-card"
      sx={{ overflow: 'visible' }}
      onClick={onToggle}
    >
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
          <Avatar
            sx={{
              width: 52,
              height: 52,
              background: gradient,
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              flexShrink: 0,
            }}
          >
            <HospitalIcon sx={{ fontSize: 26 }} />
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
              {department.name}
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748B', lineHeight: 1.5 }}>
              {department.description}
            </Typography>

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1.5 }}>
              {department.location && (
                <Chip
                  icon={<LocationIcon />}
                  label={department.location}
                  size="small"
                  variant="outlined"
                  sx={{ fontSize: '0.7rem' }}
                />
              )}
              {department.operating_hours && (
                <Chip
                  icon={<TimeIcon />}
                  label={department.operating_hours}
                  size="small"
                  variant="outlined"
                  sx={{ fontSize: '0.7rem' }}
                />
              )}
              {department.doctors && (
                <Chip
                  icon={<DoctorIcon />}
                  label={`${department.doctors.length} Doctor${department.doctors.length !== 1 ? 's' : ''}`}
                  size="small"
                  color="primary"
                  sx={{ fontSize: '0.7rem' }}
                />
              )}
            </Box>
          </Box>

          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              onToggle();
            }}
            sx={{ mt: 0.5 }}
          >
            {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        </Box>
      </CardContent>

      {/* Expanded section — doctors list */}
      <Collapse in={isExpanded} timeout="auto">
        <Divider />
        <Box sx={{ p: 3, backgroundColor: 'rgba(15,41,64,0.02)' }}>
          <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 700, color: '#0F2940' }}>
            Doctors in {department.name}
          </Typography>

          {department.doctors && department.doctors.length > 0 ? (
            <Grid container spacing={2}>
              {department.doctors.map((doctor) => (
                <Grid item xs={12} sm={6} key={doctor.id}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      borderRadius: 3,
                      border: '1px solid rgba(15,41,64,0.06)',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        boxShadow: '0 4px 12px rgba(15,41,64,0.08)',
                        borderColor: 'rgba(0,191,166,0.3)',
                      },
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                      <Avatar sx={{ width: 36, height: 36, background: gradient, fontSize: '0.85rem' }}>
                        {doctor.name.charAt(0)}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                          Dr. {doctor.name}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#64748B' }}>
                          {doctor.specialization}
                        </Typography>
                      </Box>
                    </Box>

                    {doctor.experience_years && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1 }}>
                        <StarIcon sx={{ fontSize: 14, color: '#F59E0B' }} />
                        <Typography variant="caption" sx={{ color: '#64748B' }}>
                          {doctor.experience_years} years experience
                        </Typography>
                      </Box>
                    )}

                    {doctor.available_days && (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                        {doctor.available_days.map((day) => (
                          <Chip
                            key={day}
                            label={day.slice(0, 3)}
                            size="small"
                            sx={{ fontSize: '0.65rem', height: 22 }}
                          />
                        ))}
                      </Box>
                    )}
                  </Paper>
                </Grid>
              ))}
            </Grid>
          ) : (
            <Typography variant="body2" sx={{ color: '#94A3B8', fontStyle: 'italic' }}>
              No doctors currently listed for this department.
            </Typography>
          )}
        </Box>
      </Collapse>
    </Card>
  );
}

/**
 * ServiceCard — Displays a single hospital service.
 *
 * @param {Object} props
 * @param {Object} props.service — Service data object
 */
function ServiceCard({ service }) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
          <Avatar
            sx={{
              width: 40,
              height: 40,
              background: 'linear-gradient(135deg, #00BFA6 0%, #009688 100%)',
            }}
          >
            <ServiceIcon sx={{ fontSize: 20 }} />
          </Avatar>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0F2940' }}>
            {service.name}
          </Typography>
        </Box>

        <Typography variant="body2" sx={{ color: '#64748B', mb: 2 }}>
          {service.description}
        </Typography>

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {service.department && (
            <Chip label={service.department} size="small" variant="outlined" />
          )}
          {service.duration_minutes && (
            <Chip
              icon={<TimeIcon />}
              label={`${service.duration_minutes} min`}
              size="small"
              variant="outlined"
            />
          )}
        </Box>
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/*  Main HospitalInfo Component                                       */
/* ------------------------------------------------------------------ */

function HospitalInfo() {
  const [activeTab, setActiveTab] = useState(0);
  const [departments, setDepartments] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedDept, setExpandedDept] = useState(null);

  /**
   * Fetches department data from the backend API.
   * Called on component mount and when the departments tab is active.
   */
  const fetchDepartments = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await hospitalAPI.getDepartments();
      setDepartments(response.data);
    } catch (err) {
      console.error('Error fetching departments:', err);
      /* If API isn't available yet, show placeholder data */
      setDepartments([
        {
          id: 1,
          name: 'General Medicine',
          description: 'Comprehensive primary care and internal medicine services for adults.',
          location: 'Building A, Floor 1',
          operating_hours: '8:00 AM - 6:00 PM',
          doctors: [
            { id: 1, name: 'Sharma', specialization: 'Internal Medicine', experience_years: 15, available_days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] },
            { id: 2, name: 'Patel', specialization: 'Family Medicine', experience_years: 10, available_days: ['Monday', 'Wednesday', 'Friday'] },
          ],
        },
        {
          id: 2,
          name: 'Cardiology',
          description: 'Advanced heart and cardiovascular disease diagnosis and treatment.',
          location: 'Building B, Floor 3',
          operating_hours: '9:00 AM - 5:00 PM',
          doctors: [
            { id: 3, name: 'Gupta', specialization: 'Interventional Cardiology', experience_years: 20, available_days: ['Monday', 'Tuesday', 'Thursday'] },
          ],
        },
        {
          id: 3,
          name: 'Orthopedics',
          description: 'Bone, joint, and musculoskeletal care including sports medicine.',
          location: 'Building A, Floor 2',
          operating_hours: '9:00 AM - 5:00 PM',
          doctors: [
            { id: 4, name: 'Singh', specialization: 'Joint Replacement', experience_years: 18, available_days: ['Tuesday', 'Wednesday', 'Friday'] },
          ],
        },
        {
          id: 4,
          name: 'Pediatrics',
          description: 'Specialized medical care for infants, children, and adolescents.',
          location: 'Building C, Floor 1',
          operating_hours: '8:00 AM - 7:00 PM',
          doctors: [
            { id: 5, name: 'Verma', specialization: 'Pediatric Care', experience_years: 12, available_days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] },
          ],
        },
        {
          id: 5,
          name: 'ENT (Ear, Nose & Throat)',
          description: 'Diagnosis and treatment of ear, nose, throat, and related disorders.',
          location: 'Building B, Floor 2',
          operating_hours: '9:00 AM - 4:00 PM',
          doctors: [
            { id: 6, name: 'Kumar', specialization: 'Otolaryngology', experience_years: 14, available_days: ['Monday', 'Wednesday', 'Friday'] },
          ],
        },
        {
          id: 6,
          name: 'Dermatology',
          description: 'Skin, hair, and nail disorder treatment with cosmetic dermatology.',
          location: 'Building A, Floor 3',
          operating_hours: '10:00 AM - 4:00 PM',
          doctors: [
            { id: 7, name: 'Reddy', specialization: 'Clinical Dermatology', experience_years: 8, available_days: ['Tuesday', 'Thursday', 'Saturday'] },
          ],
        },
        {
          id: 7,
          name: 'Gynecology',
          description: 'Women\'s health services including obstetrics and reproductive care.',
          location: 'Building C, Floor 2',
          operating_hours: '9:00 AM - 5:00 PM',
          doctors: [
            { id: 8, name: 'Joshi', specialization: 'Obstetrics & Gynecology', experience_years: 16, available_days: ['Monday', 'Tuesday', 'Thursday', 'Friday'] },
          ],
        },
        {
          id: 8,
          name: 'Neurology',
          description: 'Brain, spinal cord, and nervous system disorder diagnosis and care.',
          location: 'Building B, Floor 4',
          operating_hours: '9:00 AM - 5:00 PM',
          doctors: [
            { id: 9, name: 'Iyer', specialization: 'Clinical Neurology', experience_years: 22, available_days: ['Monday', 'Wednesday', 'Friday'] },
          ],
        },
      ]);
      setError('Using demo data — backend API not connected');
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Fetches services data from the backend API.
   */
  const fetchServices = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await hospitalAPI.getServices();
      setServices(response.data);
    } catch (err) {
      console.error('Error fetching services:', err);
      /* Placeholder data when API isn't available */
      setServices([
        { id: 1, name: 'General Consultation', description: 'Standard doctor consultation and diagnosis.', department: 'General Medicine', duration_minutes: 30 },
        { id: 2, name: 'Blood Test Panel', description: 'Complete blood count, lipid profile, and metabolic panel.', department: 'Pathology', duration_minutes: 15 },
        { id: 3, name: 'X-Ray Imaging', description: 'Digital X-ray for bones, chest, and other body parts.', department: 'Radiology', duration_minutes: 20 },
        { id: 4, name: 'ECG / EKG', description: 'Electrocardiogram for heart rhythm and activity analysis.', department: 'Cardiology', duration_minutes: 15 },
        { id: 5, name: 'Ultrasound Scan', description: 'Non-invasive imaging for abdomen, obstetric, and other scans.', department: 'Radiology', duration_minutes: 30 },
        { id: 6, name: 'Physiotherapy Session', description: 'Guided rehabilitation exercises and pain management.', department: 'Orthopedics', duration_minutes: 45 },
        { id: 7, name: 'Eye Examination', description: 'Comprehensive eye check-up including vision and pressure tests.', department: 'Ophthalmology', duration_minutes: 25 },
        { id: 8, name: 'Vaccination', description: 'Immunization services for children and adults.', department: 'General Medicine', duration_minutes: 10 },
      ]);
      setError('Using demo data — backend API not connected');
    } finally {
      setLoading(false);
    }
  }, []);

  /* Fetch data based on active tab */
  useEffect(() => {
    if (activeTab === 0) {
      fetchDepartments();
    } else {
      fetchServices();
    }
  }, [activeTab, fetchDepartments, fetchServices]);

  /**
   * Toggles which department card is expanded.
   * Only one can be expanded at a time for clarity.
   *
   * @param {number} deptId — Department ID to toggle
   */
  const handleToggleDept = useCallback((deptId) => {
    setExpandedDept((prev) => (prev === deptId ? null : deptId));
  }, []);

  return (
    <Box className="animate-fade-in-up">
      {/* Page Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>
          Hospital Information
        </Typography>
        <Typography variant="body1" sx={{ color: '#64748B' }}>
          Browse departments, doctors, and available services.
        </Typography>
      </Box>

      {/* Tab Navigation */}
      <Paper
        elevation={0}
        sx={{
          mb: 3,
          borderRadius: 3,
          border: '1px solid rgba(15,41,64,0.06)',
        }}
      >
        <Tabs
          value={activeTab}
          onChange={(_, newValue) => setActiveTab(newValue)}
          sx={{
            '& .MuiTab-root': {
              fontWeight: 600,
              textTransform: 'none',
              fontSize: '0.9rem',
              minHeight: 56,
            },
            '& .MuiTabs-indicator': {
              backgroundColor: '#00BFA6',
              height: 3,
              borderRadius: '3px 3px 0 0',
            },
          }}
        >
          <Tab icon={<HospitalIcon />} iconPosition="start" label="Departments & Doctors" />
          <Tab icon={<ServiceIcon />} iconPosition="start" label="Services" />
        </Tabs>
      </Paper>

      {/* Error Banner */}
      {error && (
        <Alert
          severity="info"
          sx={{ mb: 3 }}
          onClose={() => setError('')}
        >
          {error}
        </Alert>
      )}

      {/* Loading State */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress sx={{ color: '#00BFA6' }} />
        </Box>
      ) : (
        <>
          {/* Departments Tab */}
          {activeTab === 0 && (
            <Grid container spacing={3} className="stagger-children">
              {departments.map((dept) => (
                <Grid item xs={12} key={dept.id}>
                  <DepartmentCard
                    department={dept}
                    isExpanded={expandedDept === dept.id}
                    onToggle={() => handleToggleDept(dept.id)}
                  />
                </Grid>
              ))}
            </Grid>
          )}

          {/* Services Tab */}
          {activeTab === 1 && (
            <Grid container spacing={3} className="stagger-children">
              {services.map((service) => (
                <Grid item xs={12} sm={6} md={4} key={service.id}>
                  <ServiceCard service={service} />
                </Grid>
              ))}
            </Grid>
          )}
        </>
      )}
    </Box>
  );
}

export default HospitalInfo;
