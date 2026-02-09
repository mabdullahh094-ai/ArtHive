// register.js - UPDATED VERSION
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  Container, Paper, TextField, Button, Typography, Box, Alert,
  MenuItem, Select, FormControl, InputLabel 
} from "@mui/material";
import { useAuth } from "../../context/AuthContext";

const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  
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
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: "", type: "" });

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
        setMessage({ 
          text: result.error || "Registration failed", 
          type: "error" 
        });
      }
    } catch (error) {
      setMessage({ 
        text: "An error occurred: " + error.message, 
        type: "error" 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" align="center" gutterBottom>
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
            margin="normal"
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
            margin="normal"
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
            margin="normal"
            required
            disabled={loading}
          />
          
          {/* Password */}
          <TextField
            fullWidth
            label="Password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            margin="normal"
            required
            disabled={loading}
            helperText="8-15 chars, 1 uppercase, 1 lowercase, 1 special character"
          />

          {/* Confirm Password */}
          <TextField
            fullWidth
            label="Confirm Password"
            name="confirmPassword"
            type="password"
            value={formData.confirmPassword}
            onChange={handleChange}
            margin="normal"
            required
            disabled={loading}
          />
          
          {/* User Type */}
          <FormControl fullWidth margin="normal" disabled={loading}>
            <InputLabel>Account Type</InputLabel>
            <Select
              name="user_type"
              value={formData.user_type}
              onChange={handleChange}
              label="Account Type"
            >
              <MenuItem value="buyer">Buyer (Purchase Art)</MenuItem>
              <MenuItem value="artist">Artist (Sell Art)</MenuItem>
            </Select>
          </FormControl>
          
          <Button
            type="submit"
            fullWidth
            variant="contained"
            size="large"
            disabled={loading}
            sx={{ mt: 3, mb: 2 }}
          >
            {loading ? "Creating Account..." : "Sign Up"}
          </Button>
          
          <Typography align="center" sx={{ mt: 2 }}>
            Already have an account?{" "}
            <Link to="/login" style={{ textDecoration: "none" }}>
              Sign In
            </Link>
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default Register;