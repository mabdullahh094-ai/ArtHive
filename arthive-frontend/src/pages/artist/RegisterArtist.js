import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Paper, TextField, Button, Typography, Box, Alert, InputAdornment, IconButton, useTheme, useMediaQuery } from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { authAPI } from '../../services/api';
import { normalizeEmailInput, toTitleCaseInput } from '../../utils/formatters';

const RegisterArtist = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ first_name: '', last_name: '', email: '', password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [emailError, setEmailError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const validatePassword = (pwd) => {
    if (!pwd) return { ok: false, msg: 'Password is required' };
    if (pwd.length < 8 || pwd.length > 15) return { ok: false, msg: 'Password must be 8-15 characters' };
    if (!/[A-Z]/.test(pwd)) return { ok: false, msg: 'Password must include an uppercase letter' };
    if (!/[a-z]/.test(pwd)) return { ok: false, msg: 'Password must include a lowercase letter' };
    if (!/[!@#$%^&*(),.?"':{}|<>[\]\\~`\-_=+]/.test(pwd)) return { ok: false, msg: 'Password must include a special character' };
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
    setMessage({ text: '', type: '' });
    setEmailError('');

    const pwdCheck = validatePassword(formData.password);
    if (!pwdCheck.ok) return setMessage({ text: pwdCheck.msg, type: 'error' });
    if (formData.password !== formData.confirmPassword) return setMessage({ text: 'Passwords do not match', type: 'error' });

    setLoading(true);
    try {
      const payload = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        password: formData.password,
        user_type: 'artist'
      };

      const { data } = await authAPI.register(payload);
      if (data && data.token) {
        // success - backend stores token and user in response; auth context may handle it
        setMessage({ text: 'Account created. Complete your profile to get verified...', type: 'success' });
        setTimeout(() => {
          navigate('/artist/profile', { replace: true });
        }, 1000);
      } else {
        setMessage({ text: 'Registration failed', type: 'error' });
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Registration error';
      if (/already exists|already registered/i.test(msg)) {
        setEmailError('This email is already registered. Please login.');
      }
      setMessage({ text: msg, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ py: 6 }}>
      <Paper sx={{ p: 4 }} elevation={3}>
        <Typography variant="h4" align="center" gutterBottom>Artist Sign Up</Typography>
        {message.text && <Alert severity={message.type} sx={{ mb: 2 }}>{message.text}</Alert>}
        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="First Name"
            name="first_name"
            value={formData.first_name}
            onChange={handleChange}
            margin={isMobile ? 'dense' : 'normal'}
            size={isMobile ? 'small' : 'medium'}
            required
          />
          <TextField
            fullWidth
            label="Last Name"
            name="last_name"
            value={formData.last_name}
            onChange={handleChange}
            margin={isMobile ? 'dense' : 'normal'}
            size={isMobile ? 'small' : 'medium'}
            required
          />
          <TextField
            fullWidth
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            margin={isMobile ? 'dense' : 'normal'}
            size={isMobile ? 'small' : 'medium'}
            error={!!emailError}
            helperText={emailError || ''}
            required
          />
          <TextField
            fullWidth
            label="Password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            value={formData.password}
            onChange={handleChange}
            margin={isMobile ? 'dense' : 'normal'}
            size={isMobile ? 'small' : 'medium'}
            helperText="8-15 chars, 1 uppercase, 1 lowercase, 1 special"
            required
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
          <TextField
            fullWidth
            label="Confirm Password"
            name="confirmPassword"
            type={showConfirmPassword ? 'text' : 'password'}
            value={formData.confirmPassword}
            onChange={handleChange}
            margin={isMobile ? 'dense' : 'normal'}
            size={isMobile ? 'small' : 'medium'}
            required
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
          <Button type="submit" fullWidth variant="contained" size={isMobile ? 'small' : 'medium'} sx={{ mt: isMobile ? 1.5 : 3 }}>{loading ? 'Creating...' : 'Create Artist Account'}</Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default RegisterArtist;
