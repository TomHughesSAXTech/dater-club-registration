# Quick Start Guide

## 🚀 One-Click Deployment

### Prerequisites
1. **Azure subscription** (free tier works fine)
2. **Azure CLI** installed: `winget install Microsoft.AzureCLI`
3. **Node.js 18+** installed: `winget install OpenJS.NodeJS`

### Deploy in 3 Steps

#### Step 1: Run the automated deployment script
```powershell
cd C:\Users\owen1\DaterClubRegistration
.\deploy.ps1
```

This script will:
- ✅ Create Azure Resource Group
- ✅ Create Storage Account for data
- ✅ Create Azure Function App
- ✅ Deploy the registration API
- ✅ Update HTML files with correct URLs

#### Step 2: Deploy the website
Choose **Option A** (recommended) or **Option B**:

**Option A: GitHub Integration (Recommended)**
1. Push this folder to GitHub:
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/dater-club-registration.git
git push -u origin main
```

2. Go to [Azure Portal](https://portal.azure.com) → Static Web Apps → Create
3. Connect to your GitHub repository
4. Set configuration:
   - **App location**: `/`
   - **API location**: `api`
   - **Output location**: (leave empty)

**Option B: Direct Upload**
1. Zip the entire project folder
2. Go to [Azure Portal](https://portal.azure.com) → Static Web Apps → Create
3. Choose "Other" for source
4. Upload your zip file

#### Step 3: Test everything
1. **Registration Form**: Visit your Static Web App URL
2. **Admin Panel**: Visit `https://your-app.azurestaticapps.net/admin`
3. **API**: Visit your Function App URL

## 🎯 What You Get

### For Parents
- **Beautiful registration form** at your main URL
- **Drag-and-drop club ranking** (super intuitive!)
- **Mobile-friendly** design
- **Deadline enforcement** (no late submissions)

### For School Administrators  
- **Real-time dashboard** at `/admin`
- **Automatic club assignments** with fair distribution
- **Export to Excel/CSV** for record keeping
- **Statistics and reports**

### Technical Features
- **Serverless architecture** (scales automatically)
- **Free hosting** (uses Azure free tier)
- **Secure data storage** (Azure Table Storage)
- **HTTPS everywhere** (automatic SSL)

## 📊 Cost Breakdown
- **Azure Static Web Apps**: FREE (100GB bandwidth/month)
- **Azure Functions**: FREE (1M requests/month) 
- **Table Storage**: ~$1/month (typical school usage)

**Total: ~$1-2/month** 💰

## 🎨 Customization

### Change School Name/Logo
Edit these lines in `index.html`:
```html
<img src="YOUR_LOGO_URL" alt="Your School Logo" class="logo">
<h1>🎨 Your School Club Registration</h1>
```

### Update Clubs/Capacity
Edit the `clubs` object in both HTML files:
```javascript
const clubs = {
    '4': [
        {
            id: 'new-club-4',
            name: 'Your New Club - 4th Grade', 
            description: 'Club description...',
            capacity: 25
        }
    ]
}
```

### Change Deadline
Update this date in both files:
```javascript
const deadline = new Date('2025-09-21T23:59:59');
```

## 🆘 Quick Troubleshooting

### "Function not found" error
- ✅ Check that Azure Function deployed successfully
- ✅ Verify API URL in HTML files is correct
- ✅ Test API directly: `https://YOUR-FUNCTION-APP.azurewebsites.net/api/club-registration`

### "CORS error" in browser
- ✅ Function App automatically allows all origins for development
- ✅ For production, update CORS in Azure Portal → Function App → API → CORS

### No data showing in admin panel
- ✅ Submit a test registration first
- ✅ Check browser network tab for API errors
- ✅ Verify storage connection in Function App settings

## 🔧 Advanced Configuration

### Add Authentication to Admin Panel
1. Go to Azure Portal → Static Web Apps → Authentication
2. Add provider (Microsoft, Google, GitHub, etc.)
3. Update `staticwebapp.config.json` routes to require authentication

### Custom Domain
1. In Azure Portal → Static Web Apps → Custom domains
2. Add your domain and configure DNS
3. SSL certificate is automatic!

### Production Security
1. **Update CORS**: Restrict to your domain only
2. **Add rate limiting**: Use Azure API Management  
3. **Enable monitoring**: Use Application Insights
4. **Backup data**: Regular storage exports

## 📞 Support

If you run into issues:
1. **Check the logs**: Azure Portal → Function App → Functions → Monitor
2. **Test API directly**: Use Postman or browser to test endpoints
3. **Review deployment**: Make sure all Azure resources are running
4. **Browser console**: Check for JavaScript errors

## 🎉 You're All Set!

Your school club registration system is now live and ready to handle hundreds of parent submissions with automatic club assignments. The system will handle everything from form validation to final club rosters!

**Main URL**: Your registration form  
**Admin URL**: `/admin` - Your administrative dashboard

Enjoy your automated club registration system! 🎊
