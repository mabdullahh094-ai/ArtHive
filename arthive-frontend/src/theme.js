import { createTheme, responsiveFontSizes } from '@mui/material/styles';

const basePalette = {
  mode: 'light',
  primary: {
    main: '#2563eb',
    light: '#60a5fa',
    dark: '#1e3a8a',
    contrastText: '#ffffff',
  },
  secondary: {
    main: '#f59e0b',
    light: '#fbbf24',
    dark: '#b45309',
    contrastText: '#111827',
  },
  error: {
    main: '#dc2626',
  },
  warning: {
    main: '#f97316',
  },
  info: {
    main: '#0ea5e9',
  },
  success: {
    main: '#16a34a',
  },
  background: {
    default: '#f9fafb',
    paper: '#ffffff',
  },
  text: {
    primary: '#0f172a',
    secondary: 'rgba(15, 23, 42, 0.65)',
    disabled: 'rgba(15, 23, 42, 0.4)',
  },
  divider: 'rgba(15, 23, 42, 0.08)',
};

let theme = createTheme({
  palette: basePalette,
  typography: {
    fontFamily: [
      '"Space Grotesk"',
      '"DM Sans"',
      'system-ui',
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'sans-serif',
    ].join(','),
    h1: { fontSize: '2.75rem', fontWeight: 700, lineHeight: 1.1 },
    h2: { fontSize: '2.25rem', fontWeight: 700, lineHeight: 1.2 },
    h3: { fontSize: '1.9rem', fontWeight: 600, lineHeight: 1.25 },
    h4: { fontSize: '1.6rem', fontWeight: 600, lineHeight: 1.3 },
    h5: { fontSize: '1.25rem', fontWeight: 600, lineHeight: 1.35 },
    h6: { fontSize: '1.05rem', fontWeight: 600, lineHeight: 1.4 },
    body1: { fontSize: '1.02rem', lineHeight: 1.6 },
    body2: { fontSize: '0.94rem', lineHeight: 1.5 },
    button: { textTransform: 'none', fontWeight: 600, letterSpacing: 0 },
  },
  shape: { borderRadius: 12 },
  shadows: Array(25).fill('none').map((_, idx) => {
    if (idx === 0) return 'none';
    return '0px 18px 38px rgba(15,23,42,0.08), 0px 8px 18px rgba(15,23,42,0.06)';
  }),
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          fontWeight: 700,
          paddingInline: 18,
        },
        contained: {
          boxShadow: '0 10px 30px rgba(37,99,235,0.25)',
          '&:hover': { boxShadow: '0 14px 40px rgba(37,99,235,0.3)' },
        },
        outlined: {
          borderWidth: 2,
          '&:hover': { borderWidth: 2 },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 18,
          border: '1px solid rgba(15, 23, 42, 0.06)',
          boxShadow: '0 10px 40px rgba(15,23,42,0.08)',
        },
      },
    },
    MuiAppBar: {
      defaultProps: {
        elevation: 0,
      },
      styleOverrides: {
        root: {
          backdropFilter: 'blur(14px)',
          backgroundColor: 'rgba(255,255,255,0.92)',
          borderBottom: '1px solid rgba(15, 23, 42, 0.08)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 16,
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        variant: 'outlined',
        size: 'small',
      },
    },
  },
});

theme = responsiveFontSizes(theme, { factor: 2 });

// Dark theme variant
export const darkTheme = responsiveFontSizes(
  createTheme({
  ...theme,
  palette: {
    mode: 'dark',
    primary: {
      main: '#90caf9',
      light: '#e3f2fd',
      dark: '#42a5f5',
    },
    secondary: {
      main: '#ce93d8',
      light: '#f3e5f5',
      dark: '#ab47bc',
    },
    background: {
      default: '#121212',
      paper: '#1e1e1e',
    },
    text: {
      primary: '#ffffff',
      secondary: 'rgba(255, 255, 255, 0.7)',
      disabled: 'rgba(255, 255, 255, 0.5)',
    },
    divider: 'rgba(255, 255, 255, 0.12)',
  },
  }),
  { factor: 2 }
);

export default theme;