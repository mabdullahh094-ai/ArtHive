// register.js - UPDATED VERSION
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  Container, Paper, TextField, Button, Typography, Box, Alert,
  MenuItem, Select, FormControl, InputLabel, InputAdornment, IconButton, useTheme, useMediaQuery 
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { useAuth } from "../../context/AuthContext";
import { normalizeEmailInput, toTitleCaseInput } from "../../utils/formatters";

const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [isAccountTypeOpen, setIsAccountTypeOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    confirmPassword: "",
    user_type: "buyer"  // Default to buyer
  });
  
  const [message, setMessage] = useState({ text: "", type: "" });
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    const handleScroll = () => {
      setIsAccountTypeOpen(false);
    };

    window.addEventListener('scroll', handleScroll, true);
    return () => {
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, []);

  // Password validation helper
  const validatePassword = (pwd) => {
    // 8-15 chars, at least one uppercase, one lowercase, one special char
    const minLen = 8;
    const maxLen = 15;
    if (!pwd || typeof pwd !== 'string') return { ok: false, msg: 'Password is required' };
    if (pwd.length < minLen || pwd.length > maxLen) return { ok: false, msg: `Password must be ${minLen}-${maxLen} characters long` };
    if (!/[A-Z]/.test(pwd)) return { ok: false, msg: 'Password must include at least one uppercase letter' };
    if (!/[a-z]/.test(pwd)) return { ok: false, msg: 'Password must include at least one lowercase letter' };
    if (!/[!@#$%^&*(),.?"':{}|<>[\]\\~`\-_=+]/.test(pwd)) return { ok: false, msg: 'Password must include at least one special character' };
    return { ok: true };
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'email' && emailError) {
      setEmailError('');
    }

    let nextValue = value;
    if (name === 'email') {
      nextValue = normalizeEmailInput(value);
    }
    if (name === 'first_name' || name === 'last_name') {
      nextValue = toTitleCaseInput(value);
    }

    setFormData({ ...formData, [name]: nextValue });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: "", type: "" });
    setEmailError("");

    // Validate password strength
    const pwdCheck = validatePassword(formData.password);
    if (!pwdCheck.ok) {
      setMessage({ text: pwdCheck.msg, type: "error" });
      setLoading(false);
      return;
    }

    // Confirm passwords match
    if (formData.password !== formData.confirmPassword) {
      setMessage({ text: "Passwords do not match", type: "error" });
      setLoading(false);
      return;
    }
    
    try {
      // Don't send confirmPassword to backend—it's only for client validation
      const { confirmPassword, ...registrationData } = formData;
      
      // Trim all string fields
      const trimmedData = {
        ...registrationData,
        email: registrationData.email.trim(),
        first_name: registrationData.first_name.trim(),
        last_name: registrationData.last_name.trim(),
        password: registrationData.password.trim()
      };
      
      const result = await register(trimmedData);
      
      if (result.success) {
        // Prefer message from API if available, otherwise use generic
        setMessage({ 
          text: result.data?.message || result.user ? 'Account created successfully!' : 'Account created successfully!', 
          type: "success" 
        });

        // Clear form
        setFormData({ 
          first_name: "", 
          last_name: "", 
          email: "", 
          password: "",
          confirmPassword: "",
          user_type: "buyer" 
        });

        // Redirect to login page after successful registration
        setTimeout(() => {
          navigate('/login', { replace: true });
        }, 1500);
      } else {
        const errorText = result.error || "Registration failed";
        if (/already exists|already registered/i.test(errorText)) {
          setEmailError('This email is already registered. Please login.');
        }
        setMessage({ 
          text: errorText,
          type: "error" 
        });
      }
    } catch (error) {
      const errorText = "An error occurred: " + error.message;
      if (/already exists|already registered/i.test(errorText)) {
        setEmailError('This email is already registered. Please login.');
      }
      setMessage({ 
        text: errorText,
        type: "error" 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ py: 6 }}>
      <Paper elevation={3} sx={{ p: 3, borderRadius: 3, maxWidth: 520, mx: 'auto' }}>
        <Typography variant="h5" align="center" gutterBottom sx={{ fontWeight: 700 }}>
          Sign Up
        </Typography>
        
        {message.text && (
          <Alert severity={message.type} sx={{ mb: 2 }}>
            {message.text}
          </Alert>
        )}
        
        <Box component="form" onSubmit={handleSubmit}>
          {/* First Name */}
          <TextField
            fullWidth
            label="First Name"
            name="first_name"
            value={formData.first_name}
            onChange={handleChange}
            margin={isMobile ? 'dense' : 'normal'}
            size={isMobile ? 'small' : 'medium'}
            required
            disabled={loading}
          />
          
          {/* Last Name */}
          <TextField
            fullWidth
            label="Last Name"
            name="last_name"
            value={formData.last_name}
            onChange={handleChange}
            margin={isMobile ? 'dense' : 'normal'}
            size={isMobile ? 'small' : 'medium'}
            required
            disabled={loading}
          />
          
          {/* Email */}
          <TextField
            fullWidth
            label="Email Address"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            margin={isMobile ? 'dense' : 'normal'}
            size={isMobile ? 'small' : 'medium'}
            required
            disabled={loading}
            error={!!emailError}
            helperText={emailError || ''}
          />
          
          {/* Password */}
          <TextField
            fullWidth
            label="Password"
            name="password"
            type={showPassword ? "text" : "password"}
            value={formData.password}
            onChange={handleChange}
            margin={isMobile ? 'dense' : 'normal'}
            size={isMobile ? 'small' : 'medium'}
            required
            disabled={loading}
            helperText="8-15 chars, 1 uppercase, 1 lowercase, 1 special character"
            sx={{
              '& input::-ms-reveal, & input::-ms-clear': {
                display: 'none',
              },
              '& input::-webkit-credentials-auto-fill-button': {
                display: 'none',
              },
            }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    onClick={() => setShowPassword((value) => !value)}
                    edge="end"
                    size={isMobile ? 'small' : 'medium'}
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          {/* Confirm Password */}
          <TextField
            fullWidth
            label="Confirm Password"
            name="confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
            value={formData.confirmPassword}
            onChange={handleChange}
            margin={isMobile ? 'dense' : 'normal'}
            size={isMobile ? 'small' : 'medium'}
            required
            disabled={loading}
            sx={{
              '& input::-ms-reveal, & input::-ms-clear': {
                display: 'none',
              },
              '& input::-webkit-credentials-auto-fill-button': {
                display: 'none',
              },
            }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                    onClick={() => setShowConfirmPassword((value) => !value)}
                    edge="end"
                    size={isMobile ? 'small' : 'medium'}
                  >
                    {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          
          {/* User Type */}
          <FormControl fullWidth margin="normal" disabled={loading}>
            <InputLabel>Account Type</InputLabel>
            <Select
              name="user_type"
              value={formData.user_type}
              onChange={handleChange}
              label="Account Type"
              open={isAccountTypeOpen}
              onOpen={() => setIsAccountTypeOpen(true)}
              onClose={() => setIsAccountTypeOpen(false)}
              MenuProps={{
                disablePortal: true,
                anchorOrigin: {
                  vertical: 'bottom',
                  horizontal: 'left',
                },
                transformOrigin: {
                  vertical: 'top',
                  horizontal: 'left',
                },
                PaperProps: {
                  sx: {
                    mt: 0.5,
                  },
                },
              }}
            >
              <MenuItem value="buyer">Buyer (Purchase Art)</MenuItem>
              <MenuItem value="artist">Artist (Sell Art)</MenuItem>
            </Select>
          </FormControl>
          
          <Button
            type="submit"
            fullWidth
            variant="contained"
            size={isMobile ? 'small' : 'large'}
            disabled={loading}
            sx={{ mt: isMobile ? 1.5 : 2.5, mb: 1.5 }}
          >
            {loading ? "Creating Account..." : "Sign Up"}
          </Button>
          
          <Typography align="center" sx={{ mt: 1.5, fontSize: '0.9rem' }}>
            Already have an account?{" "}
            <Link to="/login" style={{ textDecoration: "none", color: '#1976d2', fontWeight: 600 }}>
              Sign In
            </Link>
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default Register;