# Dater Club Registration - Email Configuration Guide

## Overview
This application now includes email functionality to send confirmation emails to parents upon form submission and final club assignment results after the registration deadline.

## Email Service Setup

### SendGrid Configuration

1. **Create a SendGrid Account**
   - Go to [SendGrid](https://sendgrid.com) and create an account
   - Or use the Azure Marketplace to add SendGrid to your Azure subscription

2. **Generate API Key**
   - In SendGrid Dashboard, go to Settings → API Keys
   - Click "Create API Key"
   - Give it a name (e.g., "dater-club-registration")
   - Select "Full Access" or "Restricted Access" with Mail Send permissions
   - Copy the API key (you won't be able to see it again)

3. **Verify Sender Domain**
   - In SendGrid, go to Settings → Sender Authentication
   - Add and verify the domain `saxtechnology.com`
   - Follow SendGrid's DNS verification process

## Azure Configuration

### Setting Environment Variables in Azure Static Web Apps

1. **Navigate to your Static Web App in Azure Portal**
   - Go to your Static Web App resource
   - Click on "Configuration" in the left menu

2. **Add Application Settings**
   Add the following environment variables:

   ```
   SENDGRID_API_KEY = [Your SendGrid API Key]
   AZURE_STORAGE_CONNECTION_STRING = [Your Azure Storage Connection String]
   ```

3. **For local development**, create a `local.settings.json` file in the `/api` folder:
   ```json
   {
     "IsEncrypted": false,
     "Values": {
       "AzureWebJobsStorage": "",
       "FUNCTIONS_WORKER_RUNTIME": "node",
       "SENDGRID_API_KEY": "your-sendgrid-api-key-here",
       "AZURE_STORAGE_CONNECTION_STRING": "your-storage-connection-string-here"
     }
   }
   ```
   **Note:** Never commit this file to source control!

## Email Features

### 1. Submission Confirmation Email
- **Triggered:** Automatically when a parent submits the registration form
- **Recipient:** Parent's email address from the form
- **Content:** 
  - Student information
  - List of ranked clubs
  - Contact information
  - Confirmation that registration was received

### 2. Final Results Email
- **Triggered:** Manually from the admin panel
- **Options:**
  - "Email All Final Results" - Sends to all registered families
  - Individual "Email Result" button per student
- **Content:**
  - List of clubs the student was assigned to
  - Preference ranking for each assigned club
  - Next steps and contact information
  - Special waitlist notification if no clubs were assigned

## Admin Panel Features

### Email Controls
Located in the admin panel (password: `dater2025`):

1. **Global Email Button**
   - "📧 Email All Final Results" button in the main controls
   - Sends assignment results to all families at once
   - Shows progress and completion status

2. **Individual Email Buttons**
   - Each student card has a "📧 Email Result" button
   - Sends assignment results to that specific family
   - Useful for re-sending or testing

## Testing the Email System

1. **Test without SendGrid:**
   - The system will work without SendGrid configured
   - Emails will be skipped but logged to console
   - All other functionality remains intact

2. **Test with SendGrid:**
   - Use a test email address first
   - Submit a test registration
   - Check that confirmation email is received
   - Use admin panel to send test result emails

## Troubleshooting

### Common Issues:

1. **Emails not sending:**
   - Check SendGrid API key is correctly set in Azure
   - Verify sender domain is authenticated in SendGrid
   - Check SendGrid dashboard for blocked or bounced emails

2. **Azure Function errors:**
   - Check Application Insights logs in Azure
   - Verify storage connection string is correct
   - Ensure all npm packages are installed

3. **Local development:**
   - Make sure `local.settings.json` exists with correct values
   - Run `npm install` in the `/api` directory
   - Use `func start` to run functions locally

## Email Templates

The email templates are defined in `/api/emailService.js` and include:
- HTML and plain text versions
- Responsive design for mobile devices
- School branding colors
- Clear call-to-action sections

To modify email templates, edit the functions in `emailService.js`:
- `sendSubmissionConfirmation()` - Registration confirmation
- `sendFinalResults()` - Club assignments
- `sendWaitlistEmail()` - Waitlist notification

## Support

For issues or questions:
- Technical support: Contact your Azure administrator
- Email delivery issues: Check SendGrid dashboard and logs
- Application issues: Review Azure Application Insights

## Security Notes

- Never expose API keys in client-side code
- Use Azure Key Vault for production environments
- Regularly rotate API keys
- Monitor SendGrid for unusual activity
- Keep email lists secure and GDPR compliant
