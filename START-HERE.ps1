# 🎯 DATER SCHOOL CLUB REGISTRATION SYSTEM
# 🚀 One-click setup and deployment script

param(
    [switch]$SkipPrereqs
)

Write-Host @"
╔══════════════════════════════════════════════════════════════════════════════════════════════════════╗
║                                                                                                      ║
║  🎨 DATER SCHOOL CLUB REGISTRATION SYSTEM                                                           ║
║                                                                                                      ║
║  A complete Azure-hosted solution for managing school club registrations                            ║
║  • Beautiful parent signup forms with drag-and-drop club ranking                                    ║
║  • Real-time administrative dashboard                                                               ║
║  • Automatic club assignments with fair distribution                                                ║
║  • Export capabilities for record keeping                                                           ║
║                                                                                                      ║
╚══════════════════════════════════════════════════════════════════════════════════════════════════════╝
"@ -ForegroundColor Cyan

Write-Host "`n🔍 Checking system requirements..." -ForegroundColor Yellow

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")

if (-not $isAdmin) {
    Write-Host "⚠️  Administrator privileges required for installation." -ForegroundColor Red
    Write-Host "Right-click PowerShell and select 'Run as Administrator', then run this script again." -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

# Check prerequisites
$azureCliInstalled = $false
$nodeInstalled = $false
$gitInstalled = $false

try {
    az --version | Out-Null
    $azureCliInstalled = $true
    Write-Host "✅ Azure CLI found" -ForegroundColor Green
} catch {
    Write-Host "❌ Azure CLI not found" -ForegroundColor Red
}

try {
    node --version | Out-Null
    $nodeInstalled = $true
    Write-Host "✅ Node.js found" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js not found" -ForegroundColor Red
}

try {
    git --version | Out-Null
    $gitInstalled = $true
    Write-Host "✅ Git found" -ForegroundColor Green
} catch {
    Write-Host "❌ Git not found" -ForegroundColor Red
}

if (-not $azureCliInstalled -or -not $nodeInstalled -or -not $gitInstalled) {
    if (-not $SkipPrereqs) {
        Write-Host "`n🔧 Missing prerequisites detected. Installing required tools..." -ForegroundColor Yellow
        Write-Host "This will install:" -ForegroundColor Cyan
        if (-not $azureCliInstalled) { Write-Host "   • Azure CLI" }
        if (-not $nodeInstalled) { Write-Host "   • Node.js" }
        if (-not $gitInstalled) { Write-Host "   • Git" }
        
        $install = Read-Host "`nProceed with installation? (y/n)"
        if ($install -eq 'y' -or $install -eq 'Y' -or $install -eq '') {
            & ".\setup-prereqs.ps1"
            Write-Host "`n✅ Prerequisites installed! Please restart this script." -ForegroundColor Green
            Read-Host "Press Enter to exit"
            exit 0
        } else {
            Write-Host "❌ Cannot proceed without required tools." -ForegroundColor Red
            exit 1
        }
    }
}

Write-Host "`n🎯 All prerequisites met! Ready for deployment." -ForegroundColor Green

# Check Azure login status
Write-Host "`n🔐 Checking Azure authentication..." -ForegroundColor Yellow
$account = az account show --query "user.name" -o tsv 2>$null

if (-not $account) {
    Write-Host "🔑 Please login to your Azure account..." -ForegroundColor Cyan
    Write-Host "If you don't have an Azure account, get a free one at: https://azure.microsoft.com/free" -ForegroundColor Yellow
    
    $login = Read-Host "Login to Azure now? (y/n)"
    if ($login -eq 'y' -or $login -eq 'Y' -or $login -eq '') {
        az login
        $account = az account show --query "user.name" -o tsv 2>$null
        if (-not $account) {
            Write-Host "❌ Azure login failed or cancelled." -ForegroundColor Red
            exit 1
        }
    } else {
        Write-Host "❌ Azure login required for deployment." -ForegroundColor Red
        exit 1
    }
}

Write-Host "✅ Logged in to Azure as: $account" -ForegroundColor Green

# Show deployment options
Write-Host @"

🚀 DEPLOYMENT OPTIONS

Choose your deployment method:

1. 🎯 Full Automated Deployment (Recommended)
   • Deploys Azure Function automatically
   • Updates HTML files with correct URLs
   • Provides GitHub integration instructions
   • ~5-10 minutes total

2. 📋 Manual Step-by-Step
   • Guided manual deployment
   • More control over each step
   • Good for learning Azure

3. ❓ View Documentation
   • Read detailed README
   • Understand the architecture
   • Troubleshooting guide

"@ -ForegroundColor Cyan

$choice = Read-Host "Enter your choice (1-3)"

switch ($choice) {
    "1" {
        Write-Host "`n🚀 Starting automated deployment..." -ForegroundColor Green
        Write-Host "This will create Azure resources and deploy your Function App." -ForegroundColor Yellow
        
        $confirm = Read-Host "Continue? (y/n)"
        if ($confirm -eq 'y' -or $confirm -eq 'Y' -or $confirm -eq '') {
            & ".\deploy.ps1"
        } else {
            Write-Host "Deployment cancelled." -ForegroundColor Yellow
        }
    }
    
    "2" {
        Write-Host "`n📋 Manual deployment selected." -ForegroundColor Yellow
        Write-Host "Please follow the step-by-step instructions in README.md" -ForegroundColor Cyan
        Write-Host "Opening README.md..." -ForegroundColor Green
        Start-Process "README.md"
    }
    
    "3" {
        Write-Host "`n📖 Opening documentation..." -ForegroundColor Green
        Start-Process "README.md"
        Start-Process "QUICKSTART.md"
        Write-Host "Documentation opened in your default applications." -ForegroundColor Cyan
    }
    
    default {
        Write-Host "❌ Invalid choice. Please run the script again." -ForegroundColor Red
        exit 1
    }
}

Write-Host "`n🎉 Thank you for using the Dater School Club Registration System!" -ForegroundColor Green
Write-Host "For support or questions, check the troubleshooting section in README.md" -ForegroundColor Cyan
