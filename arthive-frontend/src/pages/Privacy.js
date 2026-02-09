import React from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Divider,
} from '@mui/material';
import {
  Security,
  Lock,
  Visibility,
  Cookie,
  People,
  Email,
} from '@mui/icons-material';

const Privacy = () => {
  const sections = [
    {
      icon: <Security />,
      title: 'Information We Collect',
      content: `When you use ArtHive, we collect information that you provide directly to us:
      
• Account Information: Name, email address, password, and profile details when you register as a buyer, artist, or admin.
• Artist Portfolio: Artists provide additional information including bio, artwork images, artwork descriptions, pricing, and contact details.
• Transaction Data: Payment information, billing addresses, and order history when you purchase artwork.
• User Content: Reviews, ratings, comments, wishlist items, and cart contents.
• Communications: Messages you send to us or through our platform.`
    },
    {
      icon: <Visibility />,
      title: 'How We Use Your Information',
      content: `We use the information we collect to:
      
• Provide and improve our services, including artwork browsing, search, and purchasing.
• Process transactions and send purchase confirmations and receipts.
• Communicate with you about your account, orders, and platform updates.
• Display your artist profile and artwork to potential buyers.
• Personalize your experience and provide relevant recommendations.
• Detect, prevent, and address fraud, security issues, and technical problems.
• Comply with legal obligations and enforce our terms of service.`
    },
    {
      icon: <People />,
      title: 'Information Sharing',
      content: `We share your information only in the following circumstances:
      
• With Artists: When you purchase artwork, we share your name, email, and shipping address with the artist.
• With Buyers: Artists can see buyer names and order details for their sold artworks.
• Service Providers: We work with third-party companies for payment processing, hosting, and analytics.
• Legal Requirements: We may disclose information when required by law or to protect our rights.
• Business Transfers: In case of merger, acquisition, or sale of assets.

We never sell your personal information to third parties for marketing purposes.`
    },
    {
      icon: <Cookie />,
      title: 'Cookies and Tracking',
      content: `ArtHive uses cookies and similar technologies to:
      
• Remember your preferences and login sessions.
• Analyze platform usage and improve user experience.
• Provide personalized content and recommendations.
• Track cart items and wishlist selections.

You can control cookies through your browser settings. However, disabling cookies may limit certain features of our platform.`
    },
    {
      icon: <Lock />,
      title: 'Data Security',
      content: `We take the security of your data seriously and implement measures including:
      
• Encryption of sensitive data during transmission (SSL/TLS).
• Secure password storage using industry-standard hashing.
• Regular security audits and vulnerability assessments.
• Restricted access to personal information by our team.
• Secure payment processing through trusted payment gateways.

While we strive to protect your information, no method of transmission over the internet is 100% secure. We cannot guarantee absolute security.`
    },
    {
      icon: <Email />,
      title: 'Your Rights and Choices',
      content: `You have the following rights regarding your data:
      
• Access: Request a copy of the personal information we hold about you.
• Correction: Update or correct your account information at any time.
• Deletion: Request deletion of your account and associated data.
• Opt-out: Unsubscribe from marketing emails (account-related emails will still be sent).
• Data Portability: Request your data in a portable format.
• Withdraw Consent: Withdraw consent for data processing where applicable.

To exercise these rights, contact us at privacy@arthive.com or through your account settings.`
    },
  ];

  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      {/* Header */}
      <Box sx={{ textAlign: 'center', mb: 6 }}>
        <Security sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
        <Typography variant="h3" component="h1" gutterBottom fontWeight={700}>
          Privacy Policy
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Last Updated: January 22, 2026
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mt: 2, maxWidth: 800, mx: 'auto' }}>
          At ArtHive, we respect your privacy and are committed to protecting your personal information.
          This Privacy Policy explains how we collect, use, share, and safeguard your data when you use our
          online art marketplace platform.
        </Typography>
      </Box>

      {/* Introduction */}
      <Paper elevation={2} sx={{ p: 4, mb: 4, backgroundColor: 'primary.light', color: 'white' }}>
        <Typography variant="h5" gutterBottom fontWeight={600}>
          About ArtHive
        </Typography>
        <Typography variant="body1" paragraph>
          ArtHive is an online marketplace connecting artists with art collectors and enthusiasts worldwide.
          Our platform enables artists to showcase and sell their artwork, while buyers can discover, purchase,
          and collect unique pieces from talented creators.
        </Typography>
        <Typography variant="body1">
          By using ArtHive, you agree to the collection and use of information in accordance with this policy.
          If you do not agree with our policies and practices, please do not use our platform.
        </Typography>
      </Paper>

      {/* Main Sections */}
      {sections.map((section, index) => (
        <Paper key={index} elevation={1} sx={{ p: 4, mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Box sx={{ 
              p: 1.5, 
              borderRadius: 2, 
              backgroundColor: 'primary.main', 
              color: 'white',
              mr: 2,
              display: 'flex'
            }}>
              {section.icon}
            </Box>
            <Typography variant="h5" component="h2" fontWeight={600}>
              {section.title}
            </Typography>
          </Box>
          <Divider sx={{ mb: 2 }} />
          <Typography 
            variant="body1" 
            sx={{ 
              whiteSpace: 'pre-line',
              color: 'text.secondary',
              lineHeight: 1.8
            }}
          >
            {section.content}
          </Typography>
        </Paper>
      ))}

      {/* Additional Sections */}
      <Paper elevation={1} sx={{ p: 4, mb: 3 }}>
        <Typography variant="h5" component="h2" gutterBottom fontWeight={600}>
          Children's Privacy
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <Typography variant="body1" color="text.secondary" paragraph>
          ArtHive is not intended for users under the age of 18. We do not knowingly collect personal
          information from children. If you are a parent or guardian and believe your child has provided
          us with personal information, please contact us immediately so we can delete such information.
        </Typography>
      </Paper>

      <Paper elevation={1} sx={{ p: 4, mb: 3 }}>
        <Typography variant="h5" component="h2" gutterBottom fontWeight={600}>
          International Data Transfers
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <Typography variant="body1" color="text.secondary" paragraph>
          ArtHive operates globally, and your information may be transferred to and processed in countries
          other than your country of residence. These countries may have different data protection laws.
          By using our platform, you consent to the transfer of your information to our facilities and
          service providers worldwide.
        </Typography>
      </Paper>

      <Paper elevation={1} sx={{ p: 4, mb: 3 }}>
        <Typography variant="h5" component="h2" gutterBottom fontWeight={600}>
          Changes to This Privacy Policy
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <Typography variant="body1" color="text.secondary" paragraph>
          We may update this Privacy Policy from time to time to reflect changes in our practices or
          for legal, operational, or regulatory reasons. We will notify you of any material changes by
          posting the new Privacy Policy on this page and updating the "Last Updated" date.
        </Typography>
        <Typography variant="body1" color="text.secondary">
          We encourage you to review this Privacy Policy periodically to stay informed about how we
          protect your information. Your continued use of ArtHive after any modifications indicates
          your acceptance of the updated policy.
        </Typography>
      </Paper>

      {/* Contact Information */}
      <Paper 
        elevation={3} 
        sx={{ 
          p: 4, 
          backgroundColor: 'grey.50',
          border: '2px solid',
          borderColor: 'primary.main'
        }}
      >
        <Typography variant="h5" component="h2" gutterBottom fontWeight={600} color="primary">
          Contact Us
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <Typography variant="body1" paragraph>
          If you have any questions, concerns, or requests regarding this Privacy Policy or our data
          practices, please contact us:
        </Typography>
        <Box sx={{ pl: 2 }}>
          <Typography variant="body1" paragraph>
            <strong>Email:</strong> privacy@arthive.com
          </Typography>
          <Typography variant="body1" paragraph>
            <strong>Support:</strong> support@arthive.com
          </Typography>
          <Typography variant="body1" paragraph>
            <strong>Address:</strong> ArtHive Platform, [Your Address]
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 3 }}>
          We aim to respond to all privacy-related inquiries within 30 days.
        </Typography>
      </Paper>
    </Container>
  );
};

export default Privacy;
