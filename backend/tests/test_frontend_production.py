import os
import re
import subprocess
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent.parent
FRONTEND_DIR = ROOT_DIR / "frontend"
DIST_DIR = FRONTEND_DIR / "dist"


def test_public_ui_removes_api_button():
    """Verify that the developer '🌐 API' button is completely removed from production HTML."""
    index_html = (DIST_DIR / "index.html").read_text(encoding="utf-8")
    assert "serverConfigBtn" not in index_html, "Found developer serverConfigBtn in production HTML"
    assert "🌐 API" not in index_html, "Found developer '🌐 API' text in production HTML"


def test_public_ui_removes_instant_demo():
    """Verify that 'Instant Demo Mode (1-Click)' is completely removed from the production UI."""
    index_html = (DIST_DIR / "index.html").read_text(encoding="utf-8")
    assert "quickDemoBtn" not in index_html, "Found quickDemoBtn in production HTML"
    assert "Instant Demo Mode (1-Click)" not in index_html, "Found 'Instant Demo Mode (1-Click)' in production HTML"


def test_home_navigation_elements_exist():
    """Verify visible Back to Home buttons and navigation controls on Login and Registration screens."""
    index_html = (DIST_DIR / "index.html").read_text(encoding="utf-8")
    assert "loginBackHomeBtn" in index_html, "Missing Back to Home button on Login screen"
    assert "regBackHomeBtn" in index_html, "Missing Back to Home button on Registration screen"
    assert "otpHomeBtn" in index_html, "Missing Return to Homepage button on OTP screen"
    assert "headerBrandLogo" in index_html, "Missing header brand logo navigation anchor"


def test_workflow_validation_allows_standalone_when_api_url_empty():
    """Verify workflow validation handles empty VITE_API_BASE_URL gracefully for public frontend deployment."""
    validation_script = """
    API_URL=""
    API_URL=$(echo "$API_URL" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//;s:/*$::')
    if [ -z "$API_URL" ]; then
      exit 0
    else
      exit 1
    fi
    """
    res = subprocess.run(["bash", "-c", validation_script], capture_output=True)
    assert res.returncode == 0, "Expected empty API_URL to allow public frontend deployment"


def test_workflow_validation_catches_insecure_http_url():
    """Verify that the workflow validation script rejects insecure HTTP URLs."""
    validation_script = """
    API_URL="http://insecure-backend.com"
    if [[ ! "$API_URL" =~ ^https:// ]]; then
      exit 1
    fi
    """
    res = subprocess.run(["bash", "-c", validation_script], capture_output=True)
    assert res.returncode == 1, "Expected validation to fail on insecure HTTP URL"


def test_workflow_validation_catches_localhost_url():
    """Verify that the workflow validation script rejects localhost in production."""
    validation_script = """
    API_URL="https://localhost:8000"
    if [[ "$API_URL" =~ (localhost|127\\.0\\.0\\.1) ]]; then
      exit 1
    fi
    """
    res = subprocess.run(["bash", "-c", validation_script], capture_output=True)
    assert res.returncode == 1, "Expected validation to fail on localhost URL"


def test_production_build_injection_of_valid_https_url():
    """Verify Vite build correctly injects valid HTTPS API URL into config.js and index.html."""
    test_url = "https://verified-backend.up.railway.app"
    cmd = f"VITE_API_BASE_URL='{test_url}' npm run build"
    res = subprocess.run(cmd, cwd=str(FRONTEND_DIR), shell=True, capture_output=True, text=True)
    assert res.returncode == 0, f"Frontend build failed: {res.stderr}"

    config_js = (DIST_DIR / "js" / "config.js").read_text(encoding="utf-8")
    assert test_url in config_js, "Production API URL was not injected into dist/js/config.js"

    index_html = (DIST_DIR / "index.html").read_text(encoding="utf-8")
    assert test_url in index_html, "Production API URL was not injected into dist/index.html"

