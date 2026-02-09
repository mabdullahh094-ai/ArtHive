import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Container, Paper, TextField, Button, Typography, Box, Alert } from "@mui/material";
import { useAuth } from "../../context/AuthContext";

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [message, setMessage] = useState({ text: "", type: "" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: "", type: "" });

    try {
      const result = await login(formData.email, formData.password);

      if (result.success) {
        setMessage({
          text: "Login successful! Redirecting...",
          type: "success",
        });

        // Determine redirect destination based on user type
        const userType = (result.user && result.user.user_type) || "buyer";
        let redirectPath = "/";
        
        if (userType === "artist") {
          redirectPath = "/artist/profile";
        } else if (userType === "admin") {
          redirectPath = "/admin";
        }

        setTimeout(() => {
          navigate(redirectPath, { replace: true });
        }, 1000);
      } else {
        setMessage({
          text: result.error || "Login failed",
          type: "error",
        });
      }
    } catch (error) {
      setMessage({
        text: "An error occurred: " + error.message,
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" align="center" gutterBottom>
          Sign In
        </Typography>

        {message.text && (
          <Alert severity={message.type} sx={{ mb: 2 }}>
            {message.text}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} autoComplete="off">
          <TextField
            fullWidth
            label="Email"
            name="email"
            autoComplete="off"
            inputProps={{ autoComplete: 'new-email' }}
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            margin="normal"
            required
          />

          <TextField
            fullWidth
            label="Password"
            name="password"
            type="password"
            autoComplete="new-password"
            inputProps={{ autoComplete: 'new-password' }}
            value={formData.password}
            onChange={(e) =>
              setFormData({ ...formData, password: e.target.value })
            }
            margin="normal"
            required
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            disabled={loading}
            sx={{ mt: 3 }}
          >
            {loading ? "Signing In..." : "Sign In"}
          </Button>

          <Typography align="center" sx={{ mt: 2 }}>
            Don't have an account?{" "}
            <Link to="/register">Sign Up</Link>
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default Login;
