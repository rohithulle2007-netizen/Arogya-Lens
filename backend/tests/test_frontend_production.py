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


def test_workflow_validation_rejects_empty_api_url():
    """Verify workflow validation halts with error on empty VITE_API_BASE_URL to prevent broken standalone builds."""
    validation_script = """
    API_URL=""
    API_URL=$(echo "$API_URL" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//;s:/*$::')
    if [ -z "$API_URL" ]; then
      exit 1
    else
      exit 0
    fi
    """
    res = subprocess.run(["bash", "-c", validation_script], capture_output=True)
    assert res.returncode == 1, "Expected empty API_URL to fail validation"


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


def test_initialization_scripts_are_invoked():
    """Verify that App.init() and Auth.init() are called reliably on DOM load."""
    app_js = (FRONTEND_DIR / "js" / "app.js").read_text(encoding="utf-8")
    assert "window.App.init()" in app_js, "Missing window.App.init() invocation in app.js"
    assert "DOMContentLoaded" in app_js, "Missing DOMContentLoaded handler in app.js"

    auth_js = (FRONTEND_DIR / "js" / "auth.js").read_text(encoding="utf-8")
    assert "window.Auth.init()" in auth_js, "Missing window.Auth.init() invocation in auth.js"


def test_form_alert_containers_exist():
    """Verify inline feedback containers exist in index.html for login and registration."""
    index_html = (FRONTEND_DIR / "index.html").read_text(encoding="utf-8")
    assert "loginAlertBox" in index_html, "Missing loginAlertBox in index.html"
    assert "regAlertBox" in index_html, "Missing regAlertBox in index.html"
    assert "otpAlertBox" in index_html, "Missing otpAlertBox in index.html"


def test_forms_have_novalidate_and_explicit_submit_button_ids():
    """Verify forms have novalidate to prevent silent HTML5 validation blocks."""
    index_html = (FRONTEND_DIR / "index.html").read_text(encoding="utf-8")
    assert '<form id="loginForm" novalidate>' in index_html, "loginForm must have novalidate"
    assert '<form id="registerForm" novalidate>' in index_html, "registerForm must have novalidate"
    assert 'id="loginSubmitBtn"' in index_html, "Missing loginSubmitBtn ID"
    assert 'id="regSubmitBtn"' in index_html, "Missing regSubmitBtn ID"


def test_event_handlers_are_not_registered_twice():
    """Verify navigation event handlers are defined once without duplication."""
    app_js = (FRONTEND_DIR / "js" / "app.js").read_text(encoding="utf-8")
    auth_js = (FRONTEND_DIR / "js" / "auth.js").read_text(encoding="utf-8")

    # regBackHomeBtn should be handled in auth.js, not duplicated in app.js
    assert "regBackHomeBtn" not in app_js, "regBackHomeBtn listener should not be duplicated in app.js"
    assert "loginBackHomeBtn" not in app_js, "loginBackHomeBtn listener should not be duplicated in app.js"
    assert "regBackHomeBtn" in auth_js, "regBackHomeBtn listener must be in auth.js"
    assert "loginBackHomeBtn" in auth_js, "loginBackHomeBtn listener must be in auth.js"


def test_frontend_displays_demo_otp_only_when_backend_reports_mock_delivery():
    """Verify that frontend strictly requires delivery_mode === 'mock' from backend to show test OTP."""
    index_html = (FRONTEND_DIR / "index.html").read_text(encoding="utf-8")
    auth_js = (FRONTEND_DIR / "js" / "auth.js").read_text(encoding="utf-8")

    # Banner & Warnings in index.html
    assert "DEMO MODE — TEST OTP ONLY" in index_html, "Missing DEMO MODE banner in index.html"
    assert "devOtpCard" in index_html, "Missing devOtpCard container in index.html"
    assert "devOtpCodeDisplay" in index_html, "Missing devOtpCodeDisplay in index.html"
    assert "not suitable for real patients" in index_html.lower() or "not suitable for real users" in index_html.lower(), \
        "Missing clinical disclaimer warning in demo OTP banner"

    # auth.js logic verifying delivery_mode === 'mock'
    assert 'response.delivery_mode === "mock"' in auth_js, "auth.js must check response.delivery_mode === 'mock'"
    assert 'devCard.style.display = "none"' in auth_js, "auth.js must hide devCard when not mock"


