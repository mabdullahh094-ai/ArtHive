import React from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Divider,
} from '@mui/material';
import {
  Gavel,
  AccountCircle,
  Payment,
  Block,
  Copyright,
  Report,
} from '@mui/icons-material';

const TermsAndConditions = () => {
  const sections = [
    {
      icon: <AccountCircle />,
      title: 'User Accounts and Registration',
      content: `By creating an account on ArtHive, you agree to:

• Provide accurate, current, and complete information during registration.
• Maintain and update your account information to keep it accurate.
• Keep your password secure and confidential.
• Be responsible for all activities that occur under your account.
• Notify us immediately of any unauthorized access or security breach.

You must be at least 18 years old to create an account. Artists must verify their identity and provide authentic portfolio information. Buyers must provide valid payment and shipping information for purchases.`
    },
    {
      icon: <Gavel />,
      title: 'User Conduct and Responsibilities',
      content: `All users of ArtHive agree to:

• Use the platform lawfully and respect all applicable laws and regulations.
• Not engage in fraudulent, abusive, or harmful activities.
• Not upload or share content that is illegal, offensive, or violates third-party rights.
• Not attempt to interfere with the platform's security or functionality.
• Not impersonate others or misrepresent your identity or affiliation.
• Not scrape, copy, or misuse platform content without authorization.

Artists specifically agree to:
• Own or have rights to all artwork they upload.
• Provide accurate descriptions, pricing, and availability information.
• Fulfill orders promptly and ship items as described.
• Not list counterfeit, stolen, or unauthorized artwork.

Buyers agree to:
• Make purchases in good faith and honor payment obligations.
• Not dispute legitimate charges or abuse refund policies.
• Respect intellectual property rights of artists.`
    },
    {
      icon: <Copyright />,
      title: 'Intellectual Property Rights',
      content: `Artwork and Artist Content:
• Artists retain full ownership and intellectual property rights to their artwork.
• By uploading artwork, artists grant ArtHive a limited license to display, promote, and facilitate sales.
• Buyers purchasing artwork receive ownership of the physical piece but not reproduction rights unless explicitly stated.
• Artists are responsible for ensuring they have rights to all uploaded content.

Platform Content:
• ArtHive owns all rights to the platform design, features, logos, and original content.
• You may not copy, modify, or distribute our platform code or design without permission.
• All trademarks, service marks, and logos are property of ArtHive or respective owners.

Copyright Infringement:
• We respect intellectual property rights and expect users to do the same.
• If you believe content infringes your copyright, contact us at copyright@arthive.com.
• We will investigate and remove infringing content in accordance with applicable law.`
    },
    {
      icon: <Payment />,
      title: 'Pricing, Payments, and Transactions',
      content: `Artwork Pricing:
• Artists set their own prices for artwork.
• All prices are displayed in USD unless otherwise specified.
• Prices may be subject to change, but changes do not affect existing orders.

Payment Processing:
• ArtHive uses secure third-party payment processors.
• Buyers authorize charges when placing orders.
• Payment is processed when the order is confirmed.
• ArtHive collects a service fee from artists on each sale.

Refunds and Returns:
• Refund policies are set by individual artists and must be clearly stated.
• Buyers may request refunds for items significantly not as described or damaged.
• Disputes should be resolved between buyers and artists; ArtHive may mediate.
• Refunds are processed within 5-10 business days when approved.

Taxes:
• Prices do not include applicable taxes unless specified.
• Buyers are responsible for any customs, duties, or local taxes.
• Artists are responsible for reporting and paying taxes on their sales.`
    },
    {
      icon: <Block />,
      title: 'Prohibited Activities',
      content: `The following activities are strictly prohibited on ArtHive:

• Posting false, misleading, or fraudulent content.
• Selling counterfeit, stolen, or unauthorized artwork.
• Engaging in money laundering or other illegal financial activities.
• Harassing, threatening, or abusing other users.
• Attempting to bypass or manipulate our systems or fees.
• Using the platform for any unlawful purpose.
• Collecting user information without consent.
• Posting spam, malware, or malicious code.
• Creating multiple accounts to manipulate reviews or ratings.
• Price manipulation or unfair competitive practices.

Violation of these terms may result in:
• Immediate account suspension or termination.
• Removal of content and listings.
• Forfeiture of pending payments or credits.
• Legal action and liability for damages.
• Permanent ban from the platform.`
    },
    {
      icon: <Report />,
      title: 'Dispute Resolution and Limitation of Liability',
      content: `Dispute Resolution:
• We encourage users to resolve disputes directly and amicably.
• ArtHive may provide mediation services but is not obligated to do so.
• By using ArtHive, you agree to binding arbitration for disputes exceeding $10,000.
• Small claims may be pursued in your local jurisdiction.

Limitation of Liability:
• ArtHive is a marketplace platform connecting buyers and sellers.
• We do not guarantee the quality, authenticity, or legality of artwork.
• We are not responsible for disputes between buyers and artists.
• We do not guarantee uninterrupted or error-free service.
• Our liability is limited to the amount of fees you paid to us in the past 12 months.

Disclaimer of Warranties:
• The platform is provided "as is" without warranties of any kind.
• We do not warrant that the service will meet your requirements.
• We are not liable for any indirect, incidental, or consequential damages.

Indemnification:
• You agree to indemnify and hold ArtHive harmless from any claims arising from your use of the platform.
• This includes claims related to your content, transactions, or violations of these terms.`
    },
  ];

  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      {/* Header */}
      <Box sx={{ textAlign: 'center', mb: 6 }}>
        <Gavel sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
        <Typography variant="h3" component="h1" gutterBottom fontWeight={700}>
          Terms & Conditions
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Last Updated: January 22, 2026
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mt: 2, maxWidth: 800, mx: 'auto' }}>
          Welcome to ArtHive! By accessing or using our platform, you agree to be bound by these
          Terms & Conditions. Please read them carefully before using our services.
        </Typography>
      </Box>

      {/* Introduction */}
      <Paper elevation={2} sx={{ p: 4, mb: 4, backgroundColor: 'primary.light', color: 'white' }}>
        <Typography variant="h5" gutterBottom fontWeight={600}>
          Agreement to Terms
        </Typography>
        <Typography variant="body1" paragraph>
          These Terms & Conditions ("Terms") govern your use of the ArtHive platform, including our
          website, mobile applications, and related services (collectively, the "Service"). By registering,
          accessing, or using ArtHive, you accept and agree to be bound by these Terms.
        </Typography>
        <Typography variant="body1" paragraph>
          If you do not agree with any part of these Terms, you may not access or use our Service.
          We reserve the right to modify these Terms at any time, and your continued use of the
          platform after changes are posted constitutes acceptance of those changes.
        </Typography>
        <Typography variant="body1">
          ArtHive is an online marketplace that connects artists with buyers worldwide. We facilitate
          transactions but do not take ownership of artwork or guarantee transactions between users.
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
          Account Termination
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <Typography variant="body1" color="text.secondary" paragraph>
          You may terminate your account at any time through your account settings. Upon termination:
        </Typography>
        <Box sx={{ pl: 2, color: 'text.secondary' }}>
          <Typography variant="body1" paragraph>
            • Your profile and artwork listings will be removed from public view.
          </Typography>
          <Typography variant="body1" paragraph>
            • Pending orders must be fulfilled or refunded.
          </Typography>
          <Typography variant="body1" paragraph>
            • Outstanding payments will be processed according to our payment schedule.
          </Typography>
          <Typography variant="body1" paragraph>
            • You remain liable for any obligations incurred before termination.
          </Typography>
        </Box>
        <Typography variant="body1" color="text.secondary" paragraph sx={{ mt: 2 }}>
          ArtHive reserves the right to suspend or terminate accounts that violate these Terms,
          engage in fraudulent activity, or for any other reason at our sole discretion, with or
          without notice.
        </Typography>
      </Paper>

      <Paper elevation={1} sx={{ p: 4, mb: 3 }}>
        <Typography variant="h5" component="h2" gutterBottom fontWeight={600}>
          Modifications to Service
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <Typography variant="body1" color="text.secondary" paragraph>
          ArtHive reserves the right to modify, suspend, or discontinue any aspect of the Service
          at any time, with or without notice. This includes:
        </Typography>
        <Box sx={{ pl: 2, color: 'text.secondary' }}>
          <Typography variant="body1" paragraph>
            • Adding or removing features and functionality.
          </Typography>
          <Typography variant="body1" paragraph>
            • Changing fee structures with 30 days notice to artists.
          </Typography>
          <Typography variant="body1" paragraph>
            • Implementing new policies or updating existing ones.
          </Typography>
        </Box>
        <Typography variant="body1" color="text.secondary">
          We will make reasonable efforts to notify users of significant changes, but are not
          obligated to do so. Your continued use of the Service after modifications indicates
          acceptance of the changes.
        </Typography>
      </Paper>

      <Paper elevation={1} sx={{ p: 4, mb: 3 }}>
        <Typography variant="h5" component="h2" gutterBottom fontWeight={600}>
          Governing Law
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <Typography variant="body1" color="text.secondary" paragraph>
          These Terms shall be governed by and construed in accordance with the laws of [Your Jurisdiction],
          without regard to its conflict of law provisions. Any legal action or proceeding arising out
          of or relating to these Terms shall be brought exclusively in the courts of [Your Jurisdiction].
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
          Questions About Terms?
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <Typography variant="body1" paragraph>
          If you have any questions or concerns about these Terms & Conditions, please contact us:
        </Typography>
        <Box sx={{ pl: 2 }}>
          <Typography variant="body1" paragraph>
            <strong>Email:</strong> legal@arthive.com
          </Typography>
          <Typography variant="body1" paragraph>
            <strong>Support:</strong> support@arthive.com
          </Typography>
          <Typography variant="body1" paragraph>
            <strong>Address:</strong> ArtHive Platform, [Your Address]
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 3 }}>
          By using ArtHive, you acknowledge that you have read, understood, and agree to be bound
          by these Terms & Conditions.
        </Typography>
      </Paper>
    </Container>
  );
};

export default TermsAndConditions;
