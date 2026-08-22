from datetime import datetime, date, time, timezone


def get_current_utc_datetime() -> datetime:
    """Returns current UTC datetime."""
    return datetime.now(timezone.utc)


def get_current_date() -> date:
    """Returns current date."""
    return date.today()


def get_current_time() -> time:
    """Returns current time without microseconds."""
    now = datetime.now().time()
    return now.replace(microsecond=0)
