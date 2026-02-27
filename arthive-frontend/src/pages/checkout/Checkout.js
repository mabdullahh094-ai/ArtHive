import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  TextField,
  Button,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../../context/NotificationContext';

const Checkout = () => {
  const navigate = useNavigate();
  const notification = useNotification();

  const [formData, setFormData] = useState({
    accountHolderName: '',
    bankName: '',
    accountNumber: '',
    iban: '',
    swiftCode: '',
    branchCode: '',
  });
  const [errors, setErrors] = useState({});

  const handleChange = (field) => (event) => {
    const value = event.target.value;
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    setErrors((prev) => ({
      ...prev,
      [field]: '',
    }));
  };

  const validateForm = () => {
    const nextErrors = {};

    if (!formData.accountHolderName.trim()) {
      nextErrors.accountHolderName = 'Account holder name is required';
    }

    if (!formData.bankName.trim()) {
      nextErrors.bankName = 'Bank name is required';
    }

    if (!/^\d{4,12}$/.test(formData.branchCode.trim())) {
      nextErrors.branchCode = 'Branch code must be 4-12 digits';
    }

    if (!/^\d{8,20}$/.test(formData.accountNumber.trim())) {
      nextErrors.accountNumber = 'Account number must be 8-20 digits';
    }

    if (!/^[A-Z]{2}[A-Z0-9]{13,32}$/.test(formData.iban.trim().toUpperCase())) {
      nextErrors.iban = 'Enter a valid IBAN (e.g. PK36SCBL0000001123456702)';
    }

    if (!/^[A-Z0-9]{8}([A-Z0-9]{3})?$/.test(formData.swiftCode.trim().toUpperCase())) {
      nextErrors.swiftCode = 'SWIFT must be 8 or 11 characters';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!validateForm()) {
      notification.showError('Please correct the highlighted fields');
      return;
    }

    notification.showSuccess('Bank details submitted successfully');
    navigate('/cart');
  };

  return (
    <Container maxWidth="md" sx={{ py: { xs: 3, md: 5 } }}>
      <Paper elevation={0} variant="outlined" sx={{ p: { xs: 2, md: 3 } }}>
        <Typography variant="h4" sx={{ mb: 0.5 }}>
          Bank Details
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Please provide your bank information to continue payment.
        </Typography>

        <Box component="form" onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Account Holder Name"
                value={formData.accountHolderName}
                onChange={handleChange('accountHolderName')}
                error={Boolean(errors.accountHolderName)}
                helperText={errors.accountHolderName}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Bank Name"
                value={formData.bankName}
                onChange={handleChange('bankName')}
                error={Boolean(errors.bankName)}
                helperText={errors.bankName}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Branch Code"
                value={formData.branchCode}
                onChange={handleChange('branchCode')}
                error={Boolean(errors.branchCode)}
                helperText={errors.branchCode || 'Only digits'}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Account Number"
                value={formData.accountNumber}
                onChange={handleChange('accountNumber')}
                error={Boolean(errors.accountNumber)}
                helperText={errors.accountNumber || '8-20 digits'}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="IBAN"
                value={formData.iban}
                onChange={handleChange('iban')}
                error={Boolean(errors.iban)}
                helperText={errors.iban || 'Country code + account info'}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="SWIFT Code"
                value={formData.swiftCode}
                onChange={handleChange('swiftCode')}
                error={Boolean(errors.swiftCode)}
                helperText={errors.swiftCode || '8 or 11 characters'}
              />
            </Grid>
          </Grid>

          <Box sx={{ mt: 3, display: 'flex', gap: 1.25, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
            <Button variant="outlined" onClick={() => navigate('/cart')}>
              Cancel
            </Button>
            <Button type="submit" variant="contained">
              Submit Payment Details
            </Button>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default Checkout;