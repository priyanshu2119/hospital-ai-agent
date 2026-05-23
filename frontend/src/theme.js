/**
 * theme.js — Custom Material-UI Theme for Hospital Appointment Assistant
 *
 * Design philosophy:
 *   - Deep navy primary (#0F2940) for trust and professionalism
 *   - Teal accent (#00BFA6) for vitality and health
 *   - Warm coral secondary (#FF6B6B) for urgency indicators
 *   - Glassmorphism effects on cards and surfaces
 *   - Inter font family for modern, clean readability
 *
 * Why these choices:
 *   Medical/health UIs need to convey trust (navy), vitality (teal),
 *   and clarity (high contrast, clean spacing). The accent color
 *   differentiates this from generic blue dashboards.
 */

import { createTheme, alpha } from '@mui/material/styles';

/* ------------------------------------------------------------------ */
/*  Color Tokens                                                      */
/* ------------------------------------------------------------------ */
const COLORS = {
  /* Primary — deep navy blue, inspires trust and authority */
  primary: {
    main: '#0F2940',
    light: '#1A3A5C',
    dark: '#091E30',
    contrastText: '#FFFFFF',
  },

  /* Secondary — warm coral, used for alerts and urgency states */
  secondary: {
    main: '#FF6B6B',
    light: '#FF8E8E',
    dark: '#E64A4A',
    contrastText: '#FFFFFF',
  },

  /* Accent — teal, the brand signature color for health/vitality */
  accent: {
    main: '#00BFA6',
    light: '#33CCBA',
    dark: '#009688',
  },

  /* Backgrounds */
  background: {
    default: '#F0F4F8',
    paper: '#FFFFFF',
    gradient: 'linear-gradient(135deg, #0F2940 0%, #1A3A5C 50%, #0D4F4F 100%)',
    cardGlass: 'rgba(255, 255, 255, 0.85)',
  },

  /* Semantic status colors */
  status: {
    pending: '#F59E0B',
    confirmed: '#3B82F6',
    completed: '#10B981',
    cancelled: '#EF4444',
    emergency: '#DC2626',
  },
};

/* ------------------------------------------------------------------ */
/*  Theme Configuration                                               */
/* ------------------------------------------------------------------ */
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: COLORS.primary,
    secondary: COLORS.secondary,
    background: {
      default: COLORS.background.default,
      paper: COLORS.background.paper,
    },
    success: { main: COLORS.status.completed },
    warning: { main: COLORS.status.pending },
    error: { main: COLORS.status.cancelled },
    info: { main: COLORS.status.confirmed },
  },

  /* -------------------------------------------------------------- */
  /*  Typography — Inter for clean, modern readability               */
  /* -------------------------------------------------------------- */
  typography: {
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    h1: {
      fontWeight: 800,
      fontSize: '2.5rem',
      letterSpacing: '-0.02em',
      lineHeight: 1.2,
    },
    h2: {
      fontWeight: 700,
      fontSize: '2rem',
      letterSpacing: '-0.01em',
      lineHeight: 1.3,
    },
    h3: {
      fontWeight: 700,
      fontSize: '1.75rem',
      letterSpacing: '-0.01em',
    },
    h4: {
      fontWeight: 700,
      fontSize: '1.5rem',
      letterSpacing: '-0.005em',
    },
    h5: {
      fontWeight: 600,
      fontSize: '1.25rem',
    },
    h6: {
      fontWeight: 600,
      fontSize: '1.1rem',
    },
    subtitle1: {
      fontWeight: 500,
      fontSize: '1rem',
      color: '#64748B',
    },
    body1: {
      fontSize: '0.938rem',
      lineHeight: 1.7,
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.6,
    },
    button: {
      fontWeight: 600,
      textTransform: 'none',
      letterSpacing: '0.01em',
    },
    caption: {
      fontSize: '0.75rem',
      color: '#94A3B8',
    },
  },

  /* -------------------------------------------------------------- */
  /*  Shape — Slightly rounded for a soft, modern feel               */
  /* -------------------------------------------------------------- */
  shape: {
    borderRadius: 12,
  },

  /* -------------------------------------------------------------- */
  /*  Shadows — Subtle, layered depth                                */
  /* -------------------------------------------------------------- */
  shadows: [
    'none',
    '0 1px 3px rgba(15,41,64,0.04)',
    '0 2px 6px rgba(15,41,64,0.06)',
    '0 4px 12px rgba(15,41,64,0.08)',
    '0 6px 16px rgba(15,41,64,0.10)',
    '0 8px 24px rgba(15,41,64,0.12)',
    '0 12px 32px rgba(15,41,64,0.14)',
    '0 16px 40px rgba(15,41,64,0.16)',
    '0 20px 48px rgba(15,41,64,0.18)',
    /* Keep remaining shadow levels consistent */
    ...Array(16).fill('0 24px 56px rgba(15,41,64,0.20)'),
  ],

  /* -------------------------------------------------------------- */
  /*  Component Overrides — Premium polish on every element          */
  /* -------------------------------------------------------------- */
  components: {
    /* --- App Bar ------------------------------------------------- */
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: COLORS.background.gradient,
          boxShadow: '0 4px 20px rgba(15,41,64,0.25)',
          backdropFilter: 'blur(12px)',
        },
      },
    },

    /* --- Buttons ------------------------------------------------- */
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          padding: '10px 24px',
          fontSize: '0.875rem',
          fontWeight: 600,
          transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'translateY(-1px)',
            boxShadow: '0 6px 20px rgba(15,41,64,0.15)',
          },
          '&:active': {
            transform: 'translateY(0)',
          },
        },
        contained: {
          boxShadow: '0 2px 8px rgba(15,41,64,0.15)',
        },
        containedPrimary: {
          background: 'linear-gradient(135deg, #0F2940 0%, #1A3A5C 100%)',
          '&:hover': {
            background: 'linear-gradient(135deg, #1A3A5C 0%, #0F2940 100%)',
          },
        },
      },
    },

    /* --- Cards --------------------------------------------------- */
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          border: '1px solid rgba(15,41,64,0.06)',
          boxShadow: '0 4px 16px rgba(15,41,64,0.06)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            boxShadow: '0 8px 32px rgba(15,41,64,0.12)',
            transform: 'translateY(-2px)',
          },
        },
      },
    },

    /* --- Paper --------------------------------------------------- */
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          border: '1px solid rgba(15,41,64,0.05)',
        },
        elevation3: {
          boxShadow: '0 4px 16px rgba(15,41,64,0.08)',
        },
      },
    },

    /* --- Chip ---------------------------------------------------- */
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          borderRadius: 8,
          fontSize: '0.75rem',
        },
      },
    },

    /* --- Text Field ---------------------------------------------- */
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 12,
            transition: 'box-shadow 0.2s ease',
            '&:hover': {
              boxShadow: '0 2px 8px rgba(15,41,64,0.06)',
            },
            '&.Mui-focused': {
              boxShadow: `0 0 0 3px ${alpha(COLORS.accent.main, 0.15)}`,
            },
          },
        },
      },
    },

    /* --- Dialog -------------------------------------------------- */
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 20,
          boxShadow: '0 24px 64px rgba(15,41,64,0.20)',
        },
      },
    },

    /* --- Table --------------------------------------------------- */
    MuiTableHead: {
      styleOverrides: {
        root: {
          '& .MuiTableCell-head': {
            backgroundColor: alpha(COLORS.primary.main, 0.04),
            fontWeight: 700,
            fontSize: '0.8rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: COLORS.primary.main,
            borderBottom: `2px solid ${alpha(COLORS.primary.main, 0.1)}`,
          },
        },
      },
    },

    MuiTableRow: {
      styleOverrides: {
        root: {
          transition: 'background-color 0.15s ease',
          '&:hover': {
            backgroundColor: alpha(COLORS.accent.main, 0.04),
          },
        },
      },
    },

    /* --- Drawer -------------------------------------------------- */
    MuiDrawer: {
      styleOverrides: {
        paper: {
          background: COLORS.background.gradient,
          color: '#FFFFFF',
          borderRight: 'none',
          width: 280,
        },
      },
    },

    /* --- Alert --------------------------------------------------- */
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          fontWeight: 500,
        },
      },
    },

    /* --- Tooltip ------------------------------------------------- */
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: COLORS.primary.main,
          borderRadius: 8,
          fontSize: '0.75rem',
          fontWeight: 500,
          padding: '8px 14px',
        },
      },
    },

    /* --- IconButton ----------------------------------------------- */
    MuiIconButton: {
      styleOverrides: {
        root: {
          transition: 'all 0.2s ease',
          '&:hover': {
            transform: 'scale(1.08)',
          },
        },
      },
    },

    /* --- ListItemButton ------------------------------------------ */
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          margin: '2px 8px',
          '&.Mui-selected': {
            backgroundColor: 'rgba(0,191,166,0.15)',
            '&:hover': {
              backgroundColor: 'rgba(0,191,166,0.25)',
            },
          },
        },
      },
    },
  },
});

/**
 * Exported color tokens for use outside MUI components
 * (e.g., inline styles, CSS-in-JS, conditional rendering).
 */
export { COLORS };
export default theme;
