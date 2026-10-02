# Workshop setup for Windows. Run from the repository folder in PowerShell:
#   powershell -ExecutionPolicy Bypass -File scripts\setup.ps1
# Checks Node.js, Git and Chrome, installs the pinned packages, downloads Playwright's Chromium,
# creates .env and runs the doctor. Safe to run more than once.

$ErrorActionPreference = 'Continue'
Set-Location (Split-Path -Parent $PSScriptRoot)

function Ok($m)   { Write-Host "  OK    $m" -ForegroundColor Green }
function Warn($m) { Write-Host "  WARN  $m" -ForegroundColor Yellow }
function Fail($m) { Write-Host "  FAIL  $m" -ForegroundColor Red }

Write-Host "Workshop setup"
Write-Host ""

# 1. Node.js 20+ (24 LTS recommended)
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  Fail "Node.js not found. Install Node.js 24 LTS from https://nodejs.org, open a new PowerShell window and run this script again."
  exit 1
}
$nodeVersion = (node -p "process.versions.node").Trim()
$nodeMajor = [int]($nodeVersion.Split('.')[0])
if ($nodeMajor -lt 20) {
  Fail "Node.js $nodeVersion is too old. Playwright 1.63 needs 20 or newer; install 24 LTS from https://nodejs.org."
  exit 1
} elseif ($nodeMajor -lt 22) {
  Warn "Node.js $nodeVersion works, but Node 20 is end-of-life. Install 24 LTS when you can."
} elseif ($nodeMajor -lt 24) {
  Ok "Node.js $nodeVersion (24 LTS recommended)"
} else {
  Ok "Node.js $nodeVersion"
}

# 2. Git
if (Get-Command git -ErrorAction SilentlyContinue) {
  Ok (git --version)
  if (-not (git config user.name)) { Warn 'Git user.name is not set: git config --global user.name "Your Name"' }
} else {
  Fail "Git not found. Install it from https://git-scm.com/download/win and open a new PowerShell window."
  exit 1
}

# 3. Google Chrome (Playwright MCP and CLI open it by default)
$chromePaths = @(
  "$env:ProgramFiles\Google\Chrome\Application\chrome.exe",
  "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe",
  "$env:LOCALAPPDATA\Google\Chrome\Application\chrome.exe"
)
$chrome = $chromePaths | Where-Object { $_ -and (Test-Path $_) } | Select-Object -First 1
if ($chrome) { Ok "Google Chrome ($chrome)" } else { Warn "Google Chrome not found. Install it from https://www.google.com/chrome/ before the workshop." }

# 4. PowerShell execution policy. In PowerShell, npm and npx start as npm.ps1 and npx.ps1. This script runs
#    with -ExecutionPolicy Bypass, but later commands in a normal window follow your policy, and with the
#    Windows default (Restricted) they stop with "running scripts is disabled on this system".
$policy = 'Restricted'
$policyScope = 'default'
foreach ($scope in 'MachinePolicy', 'UserPolicy', 'CurrentUser', 'LocalMachine') {
  $p = "$(Get-ExecutionPolicy -Scope $scope)"
  if ($p -ne 'Undefined') { $policy = $p; $policyScope = $scope; break }
}
if ($policy -eq 'Restricted' -or $policy -eq 'AllSigned') {
  if ($policyScope -eq 'MachinePolicy' -or $policyScope -eq 'UserPolicy') {
    Warn "PowerShell execution policy is $policy (set by your company), so npm and npx do not start in PowerShell. Use npm.cmd and npx.cmd instead (npx.cmd playwright test), or a Command Prompt (cmd) window."
  } else {
    Warn "PowerShell execution policy is $policy, so npm and npx will not start in a normal PowerShell window. Fix it once with: Set-ExecutionPolicy -Scope CurrentUser RemoteSigned"
  }
} else {
  Ok "PowerShell execution policy $policy ($policyScope)"
}

# 5. Packages (exact versions from package-lock.json)
Write-Host ""
Write-Host "Installing packages (npm ci)..."
npm ci --no-audit --no-fund
if ($LASTEXITCODE -ne 0) {
  Fail "npm ci failed. Behind a proxy? Set HTTPS_PROXY (and NODE_EXTRA_CA_CERTS if your company inspects TLS). See docs\TROUBLESHOOTING.md."
  exit 1
}

# 6. Playwright's Chromium. Windows laptops on slow or inspected networks often need more than the 30 s default.
Write-Host ""
Write-Host "Downloading Playwright's Chromium..."
if (-not $env:PLAYWRIGHT_DOWNLOAD_CONNECTION_TIMEOUT) { $env:PLAYWRIGHT_DOWNLOAD_CONNECTION_TIMEOUT = "120000" }
npx playwright install chromium
if ($LASTEXITCODE -ne 0) {
  Fail "The Chromium download failed."
  Write-Host '        Behind a proxy: $env:HTTPS_PROXY="http://proxy.company.local:8080" and run the script again.'
  Write-Host "        The download hosts are cdn.playwright.dev and playwright.download.prss.microsoft.com."
  Write-Host "        Or use your phone hotspot for this step. See docs\TROUBLESHOOTING.md."
  exit 1
}

# 7. .env
if (-not (Test-Path .env)) {
  Copy-Item .env.example .env
  Ok "Created .env from .env.example. Paste your HUSTEF_TOKEN and set AI_TOOL in it."
} else {
  Ok ".env already exists (not changed)"
}

# 8. Doctor
Write-Host ""
node scripts\doctor.mjs
exit $LASTEXITCODE
