import os
import logging
from typing import Optional, Tuple
import requests
from app.core.config import settings

logger = logging.getLogger(__name__)


def is_sms_configured() -> bool:
    """
    Returns True only if valid third-party SMS provider credentials
    (Twilio or Fast2SMS) are provided in the environment.
    """
    twilio_ready = bool(
        settings.TWILIO_ACCOUNT_SID
        and settings.TWILIO_AUTH_TOKEN
        and settings.TWILIO_FROM_NUMBER
    )
    fast2sms_ready = bool(settings.FAST2SMS_API_KEY)
    return twilio_ready or fast2sms_ready


def send_sms_otp(mobile_number: str, otp_code: str) -> Tuple[bool, Optional[str]]:
    """
    Dispatches a 6-digit OTP code to the recipient mobile number using
    the configured production SMS provider (Twilio or Fast2SMS).
    
    Security: The raw OTP code is never logged or exposed in stack traces.
    """
    clean_number = "".join(filter(str.isdigit, mobile_number))

    # 1. Twilio Integration
    if settings.TWILIO_ACCOUNT_SID and settings.TWILIO_AUTH_TOKEN and settings.TWILIO_FROM_NUMBER:
        try:
            formatted_to = f"+91{clean_number[-10:]}" if len(clean_number) == 10 else f"+{clean_number}"
            twilio_url = (
                f"https://api.twilio.com/2010-04-01/Accounts/{settings.TWILIO_ACCOUNT_SID}/Messages.json"
            )
            resp = requests.post(
                twilio_url,
                auth=(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN),
                data={
                    "From": settings.TWILIO_FROM_NUMBER,
                    "To": formatted_to,
                    "Body": f"Your Arogya Lens verification code is: {otp_code}. Valid for 5 minutes. Do not share this code.",
                },
                timeout=10,
            )
            if resp.status_code in (200, 201):
                logger.info("SMS OTP dispatched successfully via Twilio.")
                return True, None
            else:
                logger.error("Twilio SMS dispatch failed with status: %d", resp.status_code)
                return False, f"Twilio SMS delivery failed ({resp.status_code})"
        except Exception as e:
            logger.error("Twilio request exception: %s", type(e).__name__)
            return False, "SMS delivery failed due to network error"

    # 2. Fast2SMS Integration (Indian Mobile Numbers)
    if settings.FAST2SMS_API_KEY:
        try:
            recipient = clean_number[-10:]
            resp = requests.post(
                "https://www.fast2sms.com/dev/bulkV2",
                headers={
                    "authorization": settings.FAST2SMS_API_KEY,
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                data={
                    "variables_values": otp_code,
                    "route": "otp",
                    "numbers": recipient,
                },
                timeout=10,
            )
            data = resp.json() if resp.status_code == 200 else {}
            if resp.status_code == 200 and data.get("return") is True:
                logger.info("SMS OTP dispatched successfully via Fast2SMS.")
                return True, None
            else:
                logger.error("Fast2SMS delivery failed: %s", data.get("message", "Unknown error"))
                return False, data.get("message", "Fast2SMS delivery failed")
        except Exception as e:
            logger.error("Fast2SMS request exception: %s", type(e).__name__)
            return False, "SMS delivery failed due to network error"

    return False, "SMS provider not configured"

