import React, { useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Container,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import { authAPI } from "../../services/api";

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const { token: tokenFromPath } = useParams();
  const navigate = useNavigate();

  const token = useMemo(
    () =>
      searchParams.get("token") ||
      searchParams.get("resetToken") ||
      searchParams.get("t") ||
      tokenFromPath ||
      "",
    [searchParams, tokenFromPath],
  );
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ text: "", type: "" });

    if (!token) {
      setMessage({ text: "Invalid reset link.", type: "error" });
      return;
    }

    if (password.length < 6) {
      setMessage({ text: "Password must be at least 6 characters long.", type: "error" });
      return;
    }

    if (password !== confirmPassword) {
      setMessage({ text: "Passwords do not match.", type: "error" });
      return;
    }

    setLoading(true);
    try {
      const res = await authAPI.resetPassword(token, password);
      setMessage({
        text: res?.data?.message || "Password reset successful.",
        type: "success",
      });

      setTimeout(() => {
        navigate("/login", { replace: true });
      }, 1200);
    } catch (error) {
      setMessage({
        text:
          error?.response?.data?.message ||
          "Reset link is invalid or expired. Please request a new one.",
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
          Reset Password
        </Typography>

        {!token && (
          <Alert severity="error" sx={{ mb: 2 }}>
            Invalid reset token. Please request a new reset link.
          </Alert>
        )}

        {message.text && (
          <Alert severity={message.type} sx={{ mb: 2 }}>
            {message.text}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} autoComplete="off">
          <TextField
            fullWidth
            required
            type="password"
            label="New Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            margin="normal"
          />

          <TextField
            fullWidth
            required
            type="password"
            label="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            margin="normal"
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            disabled={loading}
            sx={{ mt: 2 }}
          >
            {loading ? "Updating..." : "Update Password"}
          </Button>

          <Typography align="center" sx={{ mt: 2 }}>
            <Link to="/login">Back to Login</Link>
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default ResetPassword;
