# Dater School Club Registration System

A complete Azure-hosted solution for managing school club registrations with parent signup forms and admin management tools.

## Architecture

- **Azure Static Web Apps**: Hosts the front-end HTML files
- **Azure Functions**: Provides the REST API for data management
- **Azure Table Storage**: Stores registration submissions and club assignments

## Files Structure

```
DaterClubRegistration/
├── index.html              # Parent registration form
├── admin.html              # Administrative dashboard
├── staticwebapp.config.json # Azure Static Web Apps configuration
├── api/                    # Azure Functions
│   ├── host.json
│   ├── package.json
│   └── club-registration/
│       ├── function.json
│       ├── index.js
│       └── package.json
└── README.md
```

## Deployment Instructions

### 1. Prerequisites

- Azure subscription
- Azure CLI installed
- Git repository (GitHub recommended)
- Node.js 18+ installed

### 2. Create Azure Resources

#### Step 1: Create Resource Group
```bash
az group create --name "DaterClubRegistration-rg" --location "East US"
```

#### Step 2: Create Storage Account
```bash
az storage account create \
  --name "daterclubstorage$(Get-Random)" \
  --resource-group "DaterClubRegistration-rg" \
  --location "East US" \
  --sku "Standard_LRS"
```

#### Step 3: Get Storage Connection String
```bash
az storage account show-connection-string \
  --name "YOUR_STORAGE_ACCOUNT_NAME" \
  --resource-group "DaterClubRegistration-rg"
```
Save this connection string - you'll need it for the Function App.

### 3. Deploy Azure Function

#### Option A: Using Azure CLI
```bash
# Create Function App
az functionapp create \
  --resource-group "DaterClubRegistration-rg" \
  --consumption-plan-location "East US" \
  --runtime node \
  --runtime-version 18 \
  --functions-version 4 \
  --name "dater-club-functions-$(Get-Random)" \
  --storage-account "YOUR_STORAGE_ACCOUNT_NAME"

# Set the storage connection string
az functionapp config appsettings set \
  --name "YOUR_FUNCTION_APP_NAME" \
  --resource-group "DaterClubRegistration-rg" \
  --settings "AZURE_STORAGE_CONNECTION_STRING=YOUR_CONNECTION_STRING"

# Deploy function code
cd api
func azure functionapp publish "YOUR_FUNCTION_APP_NAME"
```

#### Option B: Using Azure Portal
1. Go to Azure Portal
2. Create new Function App
3. Choose Consumption plan
4. Set runtime to Node.js 18
5. Connect to your storage account
6. Deploy using VS Code Azure Functions extension or zip deploy

### 4. Deploy Static Web App

#### Option A: Using Azure CLI
```bash
# Create Static Web App
az staticwebapp create \
  --name "dater-club-webapp" \
  --resource-group "DaterClubRegistration-rg" \
  --source "https://github.com/YOUR_GITHUB_USERNAME/YOUR_REPO" \
  --location "East US2" \
  --branch "main" \
  --app-location "/" \
  --api-location "api" \
  --output-location ""
```

#### Option B: Using GitHub Integration
1. Push your code to GitHub
2. Go to Azure Portal → Static Web Apps
3. Create new Static Web App
4. Connect to your GitHub repository
5. Set build configuration:
   - App location: `/`
   - Api location: `api`
   - Output location: `` (empty)

### 5. Configure API URLs

After deployment, update the API URLs in both HTML files:

1. Get your Function App URL from Azure Portal
2. Update both files:
   - `index.html` line 618: Replace `YOUR-FUNCTION-APP` with your Function App name
   - `admin.html` line 490: Replace `YOUR-FUNCTION-APP` with your Function App name

Example:
```javascript
const API_URL = 'https://dater-club-functions-123456.azurewebsites.net/api/club-registration';
```

### 6. Testing

1. **Test Registration Form**: Visit your Static Web App URL
2. **Test Admin Panel**: Visit `https://YOUR-STATIC-WEBAPP-URL/admin`
3. **Test API**: Visit `https://YOUR-FUNCTION-APP.azurewebsites.net/api/club-registration`

## Features

### Parent Registration Form (`index.html`)
- Responsive design with drag-and-drop club ranking
- Real-time form validation
- Deadline enforcement (September 21st, 2025)
- Duplicate submission handling (overwrites previous submissions)
- Mobile-friendly interface

### Admin Dashboard (`admin.html`)
- Real-time submission monitoring
- Automatic assignment algorithm
- Export to CSV functionality
- Statistics and analytics
- Grade-based filtering

### Azure Function API
- RESTful endpoints for submissions and assignments
- CORS enabled for web access
- Automatic table creation
- Error handling and logging
- Deadline enforcement

## API Endpoints

- `GET /api/club-registration` - Get all submissions
- `GET /api/club-registration?type=assignments` - Get club assignments
- `POST /api/club-registration` - Submit new registration
- `POST /api/club-registration` (with type=assignment) - Save assignments
- `DELETE /api/club-registration?type=assignments` - Clear assignments
- `OPTIONS /api/club-registration` - CORS preflight

## Security Considerations

### For Production:
1. **Update CORS settings** in the Azure Function to only allow your domain
2. **Add authentication** to the admin panel (Azure AD recommended)
3. **Enable HTTPS** on your Static Web App (automatic)
4. **Add rate limiting** to prevent abuse
5. **Review CSP headers** in staticwebapp.config.json

### Environment Variables:
- `AZURE_STORAGE_CONNECTION_STRING` - Set in Function App settings
- `AzureWebJobsStorage` - Automatically set by Azure

## Troubleshooting

### Common Issues:
1. **CORS errors**: Check that the Function App allows your domain
2. **API not found**: Verify the Function App URL in HTML files
3. **Storage errors**: Check connection string in Function App settings
4. **Build failures**: Ensure Node.js version compatibility

### Logs:
- Function App logs: Azure Portal → Function App → Functions → Monitor
- Static Web App logs: Azure Portal → Static Web App → Functions

## Support

For issues with the club registration system:
1. Check Azure Function logs
2. Verify storage account access
3. Test API endpoints directly
4. Review browser console for client-side errors

## Cost Estimation

Using Azure free tier:
- **Static Web Apps**: $0/month (100GB bandwidth, 0.5GB storage)
- **Functions**: $0/month (1M requests, 400,000 GB-seconds)
- **Table Storage**: ~$1/month (for typical usage)

Total estimated cost: **$1-5/month**
