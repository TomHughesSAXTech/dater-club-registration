# Setup Prerequisites for Dater Club Registration System
# This script installs Azure CLI, Node.js, and other required tools

Write-Host "🔧 Setting up prerequisites for Dater Club Registration System..." -ForegroundColor Green

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")

if (-not $isAdmin) {
    Write-Host "⚠️  This script requires Administrator privileges to install software." -ForegroundColor Yellow
    Write-Host "Please run PowerShell as Administrator and try again." -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

# Check if winget is available
try {
    winget --version | Out-Null
    Write-Host "✅ Windows Package Manager (winget) is available" -ForegroundColor Green
} catch {
    Write-Host "❌ Windows Package Manager (winget) is not available" -ForegroundColor Red
    Write-Host "Please update to Windows 10 version 1809 or later, or install App Installer from Microsoft Store" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

# Install Azure CLI
Write-Host "📦 Installing Azure CLI..." -ForegroundColor Yellow
try {
    az --version | Out-Null
    Write-Host "✅ Azure CLI is already installed" -ForegroundColor Green
} catch {
    Write-Host "📥 Installing Azure CLI..." -ForegroundColor Yellow
    winget install Microsoft.AzureCLI --accept-source-agreements --accept-package-agreements
    
    # Refresh PATH for current session
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
    
    try {
        az --version | Out-Null
        Write-Host "✅ Azure CLI installed successfully" -ForegroundColor Green
    } catch {
        Write-Host "⚠️  Azure CLI installed but may require a new terminal session" -ForegroundColor Yellow
    }
}

# Install Node.js
Write-Host "📦 Installing Node.js..." -ForegroundColor Yellow
try {
    node --version | Out-Null
    Write-Host "✅ Node.js is already installed" -ForegroundColor Green
} catch {
    Write-Host "📥 Installing Node.js..." -ForegroundColor Yellow
    winget install OpenJS.NodeJS --accept-source-agreements --accept-package-agreements
    
    # Refresh PATH for current session
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
    
    try {
        node --version | Out-Null
        Write-Host "✅ Node.js installed successfully" -ForegroundColor Green
    } catch {
        Write-Host "⚠️  Node.js installed but may require a new terminal session" -ForegroundColor Yellow
    }
}

# Install Git (if not present)
Write-Host "📦 Checking for Git..." -ForegroundColor Yellow
try {
    git --version | Out-Null
    Write-Host "✅ Git is already installed" -ForegroundColor Green
} catch {
    Write-Host "📥 Installing Git..." -ForegroundColor Yellow
    winget install Git.Git --accept-source-agreements --accept-package-agreements
    
    # Refresh PATH for current session
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
    
    try {
        git --version | Out-Null
        Write-Host "✅ Git installed successfully" -ForegroundColor Green
    } catch {
        Write-Host "⚠️  Git installed but may require a new terminal session" -ForegroundColor Yellow
    }
}

Write-Host "`n🎉 Prerequisites setup completed!" -ForegroundColor Green
Write-Host "`n📝 Next Steps:" -ForegroundColor Cyan
Write-Host "1. Close this PowerShell window"
Write-Host "2. Open a NEW PowerShell window as Administrator"
Write-Host "3. Navigate to: cd C:\Users\owen1\DaterClubRegistration"
Write-Host "4. Run the deployment: .\deploy.ps1"

Write-Host "`n🔧 What was installed:" -ForegroundColor Yellow
Write-Host "   ✅ Azure CLI - for deploying to Azure"
Write-Host "   ✅ Node.js - for running the Azure Functions"
Write-Host "   ✅ Git - for version control and GitHub integration"

Write-Host "`n💡 Pro Tips:" -ForegroundColor Cyan
Write-Host "   • Sign up for Azure free account at https://azure.microsoft.com/free"
Write-Host "   • Create a GitHub account at https://github.com for easy deployments"
Write-Host "   • The deployment script will guide you through the rest!"

Read-Host "`nPress Enter to close this window"
