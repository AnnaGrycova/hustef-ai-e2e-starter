#!/usr/bin/env bash
# Workshop setup for macOS and Linux. Run from the repository folder:  ./scripts/setup.sh
# Checks Node.js, Git and Chrome, installs the pinned packages, downloads Playwright's Chromium,
# creates .env and runs the doctor. Safe to run more than once.
set -u
cd "$(dirname "$0")/.." || exit 1

ok()   { printf '  OK    %s\n' "$1"; }
warn() { printf '  WARN  %s\n' "$1"; }
fail() { printf '  FAIL  %s\n' "$1"; }

echo "Workshop setup"
echo

# 1. Node.js 20+ (24 LTS recommended)
if ! command -v node >/dev/null 2>&1; then
  fail "Node.js not found. Install Node.js 24 LTS from https://nodejs.org and run this script again."
  exit 1
fi
NODE_VERSION="$(node -p 'process.versions.node')"
NODE_MAJOR="${NODE_VERSION%%.*}"
if [ "$NODE_MAJOR" -lt 20 ]; then
  fail "Node.js $NODE_VERSION is too old. Playwright 1.63 needs 20 or newer; install 24 LTS from https://nodejs.org."
  exit 1
elif [ "$NODE_MAJOR" -lt 22 ]; then
  warn "Node.js $NODE_VERSION works, but Node 20 is end-of-life. Install 24 LTS when you can."
elif [ "$NODE_MAJOR" -lt 24 ]; then
  ok "Node.js $NODE_VERSION (24 LTS recommended)"
else
  ok "Node.js $NODE_VERSION"
fi

# 2. Git
if command -v git >/dev/null 2>&1; then
  ok "$(git --version)"
  [ -n "$(git config user.name 2>/dev/null)" ] || warn 'Git user.name is not set: git config --global user.name "Your Name"'
else
  fail "Git not found. Install it from https://git-scm.com/downloads."
  exit 1
fi

# 3. Google Chrome (Playwright MCP and CLI open it by default)
CHROME=""
for c in "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
         "$HOME/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
         /opt/google/chrome/chrome /usr/bin/google-chrome /usr/bin/google-chrome-stable; do
  if [ -x "$c" ]; then CHROME="$c"; break; fi
done
if [ -n "$CHROME" ]; then ok "Google Chrome ($CHROME)"; else warn "Google Chrome not found. Install it from https://www.google.com/chrome/ before the workshop."; fi

# 4. Packages (exact versions from package-lock.json)
echo
echo "Installing packages (npm ci)..."
if ! npm ci --no-audit --no-fund; then
  fail "npm ci failed. Behind a proxy? Set HTTPS_PROXY (and NODE_EXTRA_CA_CERTS if your company inspects TLS). See docs/TROUBLESHOOTING.md."
  exit 1
fi

# 5. Playwright's Chromium. Slow networks need a longer timeout than the 30 s default.
echo
echo "Downloading Playwright's Chromium..."
export PLAYWRIGHT_DOWNLOAD_CONNECTION_TIMEOUT="${PLAYWRIGHT_DOWNLOAD_CONNECTION_TIMEOUT:-120000}"
if ! npx playwright install chromium; then
  fail "The Chromium download failed."
  echo "        Behind a proxy: export HTTPS_PROXY=http://proxy.company.local:8080 and run the script again."
  echo "        The download hosts are cdn.playwright.dev and playwright.download.prss.microsoft.com."
  echo "        Or use your phone hotspot for this step. See docs/TROUBLESHOOTING.md."
  exit 1
fi
if [ "$(uname -s)" = "Linux" ]; then
  echo "        Linux: if the browser does not start, install its libraries: sudo npx playwright install-deps chromium"
fi

# 6. .env
if [ ! -f .env ]; then
  cp .env.example .env
  ok "Created .env from .env.example. Paste your HUSTEF_TOKEN and set AI_TOOL in it."
else
  ok ".env already exists (not changed)"
fi

# 7. Doctor
echo
node scripts/doctor.mjs
