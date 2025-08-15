# Dater School Club Registration - Azure Deployment Script
# Run this script to deploy the complete solution to Azure

param(
    [Parameter(Mandatory=$false)]
    [string]$ResourceGroupName = "DaterClubRegistration-rg",
    
    [Parameter(Mandatory=$false)]
    [string]$Location = "East US",
    
    [Parameter(Mandatory=$false)]
    [string]$StorageAccountPrefix = "daterclubstorage",
    
    [Parameter(Mandatory=$false)]
    [string]$FunctionAppPrefix = "dater-club-functions",
    
    [Parameter(Mandatory=$false)]
    [string]$StaticWebAppName = "dater-club-webapp"
)

Write-Host "🚀 Starting Dater Club Registration System deployment..." -ForegroundColor Green

# Check if Azure CLI is installed
try {
    az version | Out-Null
    Write-Host "✅ Azure CLI found" -ForegroundColor Green
} catch {
    Write-Error "❌ Azure CLI not found. Please install it first: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli"
    exit 1
}

# Check if logged in to Azure
$account = az account show --query "user.name" -o tsv 2>$null
if (-not $account) {
    Write-Host "🔐 Please login to Azure..." -ForegroundColor Yellow
    az login
}

Write-Host "📋 Logged in as: $account" -ForegroundColor Cyan

# Generate unique names
$randomSuffix = Get-Random -Minimum 10000 -Maximum 99999
$storageAccountName = "$StorageAccountPrefix$randomSuffix"
$functionAppName = "$FunctionAppPrefix-$randomSuffix"

Write-Host "📝 Using the following resource names:" -ForegroundColor Cyan
Write-Host "   Resource Group: $ResourceGroupName"
Write-Host "   Storage Account: $storageAccountName"
Write-Host "   Function App: $functionAppName"
Write-Host "   Static Web App: $StaticWebAppName"

# Create Resource Group
Write-Host "🏗️ Creating resource group..." -ForegroundColor Yellow
az group create --name $ResourceGroupName --location $Location --output none
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Resource group created" -ForegroundColor Green
} else {
    Write-Error "❌ Failed to create resource group"
    exit 1
}

# Create Storage Account
Write-Host "💾 Creating storage account..." -ForegroundColor Yellow
az storage account create `
    --name $storageAccountName `
    --resource-group $ResourceGroupName `
    --location $Location `
    --sku "Standard_LRS" `
    --output none

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Storage account created" -ForegroundColor Green
} else {
    Write-Error "❌ Failed to create storage account"
    exit 1
}

# Get Storage Connection String
Write-Host "🔑 Getting storage connection string..." -ForegroundColor Yellow
$connectionString = az storage account show-connection-string `
    --name $storageAccountName `
    --resource-group $ResourceGroupName `
    --query "connectionString" -o tsv

if (-not $connectionString) {
    Write-Error "❌ Failed to get storage connection string"
    exit 1
}
Write-Host "✅ Connection string retrieved" -ForegroundColor Green

# Create Function App
Write-Host "⚡ Creating Azure Function App..." -ForegroundColor Yellow
az functionapp create `
    --resource-group $ResourceGroupName `
    --consumption-plan-location $Location `
    --runtime node `
    --runtime-version 18 `
    --functions-version 4 `
    --name $functionAppName `
    --storage-account $storageAccountName `
    --output none

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Function App created" -ForegroundColor Green
} else {
    Write-Error "❌ Failed to create Function App"
    exit 1
}

# Set Storage Connection String in Function App
Write-Host "🔧 Configuring Function App settings..." -ForegroundColor Yellow
az functionapp config appsettings set `
    --name $functionAppName `
    --resource-group $ResourceGroupName `
    --settings "AZURE_STORAGE_CONNECTION_STRING=$connectionString" `
    --output none

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Function App configured" -ForegroundColor Green
} else {
    Write-Error "❌ Failed to configure Function App"
    exit 1
}

# Deploy Function Code
Write-Host "📦 Deploying function code..." -ForegroundColor Yellow
Push-Location -Path "api"
try {
    # Install dependencies
    Write-Host "📥 Installing dependencies..." -ForegroundColor Yellow
    npm install

    # Check if Azure Functions Core Tools is installed
    try {
        func --version | Out-Null
        Write-Host "✅ Azure Functions Core Tools found" -ForegroundColor Green
    } catch {
        Write-Host "📥 Installing Azure Functions Core Tools..." -ForegroundColor Yellow
        npm install -g azure-functions-core-tools@4 --unsafe-perm true
    }

    # Deploy to Azure
    func azure functionapp publish $functionAppName --javascript
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Function code deployed successfully" -ForegroundColor Green
    } else {
        Write-Error "❌ Failed to deploy function code"
        exit 1
    }
} finally {
    Pop-Location
}

# Update HTML files with correct API URL
Write-Host "🔧 Updating HTML files with Function App URL..." -ForegroundColor Yellow
$functionAppUrl = "https://$functionAppName.azurewebsites.net/api/club-registration"

# Update index.html
$indexContent = Get-Content "index.html" -Raw
$indexContent = $indexContent -replace "const API_URL = 'https://YOUR-FUNCTION-APP\.azurewebsites\.net/api/club-registration';", "const API_URL = '$functionAppUrl';"
Set-Content "index.html" -Value $indexContent -Encoding UTF8

# Update admin.html
$adminContent = Get-Content "admin.html" -Raw
$adminContent = $adminContent -replace "const API_URL = 'https://YOUR-FUNCTION-APP\.azurewebsites\.net/api/club-registration';", "const API_URL = '$functionAppUrl';"
Set-Content "admin.html" -Value $adminContent -Encoding UTF8

Write-Host "✅ HTML files updated with API URL" -ForegroundColor Green

# Display deployment summary
Write-Host "`n🎉 Deployment completed successfully!" -ForegroundColor Green
Write-Host "📋 Summary:" -ForegroundColor Cyan
Write-Host "   Resource Group: $ResourceGroupName"
Write-Host "   Function App: https://$functionAppName.azurewebsites.net"
Write-Host "   API Endpoint: $functionAppUrl"
Write-Host "   Storage Account: $storageAccountName"

Write-Host "`n📝 Next Steps:" -ForegroundColor Yellow
Write-Host "1. Test your Function App: $functionAppUrl"
Write-Host "2. Deploy Static Web App using one of these methods:"
Write-Host "   a) GitHub integration (recommended):"
Write-Host "      - Push this code to GitHub"
Write-Host "      - Create Static Web App in Azure Portal"
Write-Host "      - Connect to your GitHub repo"
Write-Host "   b) Azure CLI:"
Write-Host "      az staticwebapp create --name $StaticWebAppName --resource-group $ResourceGroupName --location 'East US2' --source . --branch main --app-location / --api-location api"
Write-Host "3. Test the complete solution"

Write-Host "`n🔗 Useful Links:" -ForegroundColor Cyan
Write-Host "   Azure Portal: https://portal.azure.com"
Write-Host "   Resource Group: https://portal.azure.com/#@/resource/subscriptions/$(az account show --query id -o tsv)/resourceGroups/$ResourceGroupName/overview"
Write-Host "   Function App: https://portal.azure.com/#@/resource/subscriptions/$(az account show --query id -o tsv)/resourceGroups/$ResourceGroupName/providers/Microsoft.Web/sites/$functionAppName/overview"

Write-Host "`n🎯 Your Azure Function is ready! The HTML files have been updated with the correct API URL." -ForegroundColor Green
