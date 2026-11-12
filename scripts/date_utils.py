import calendar
import re
from dataclasses import dataclass
from datetime import date
from typing import Optional, Tuple


@dataclass(frozen=True)
class ParsedExpirationDate:
    valid: bool
    kind: Optional[str]  # 'full' | 'month_year' | None
    iso: Optional[str]  # 'YYYY-MM-DD' | 'YYYY-MM' | None
    formatted: str  # 'DD/MM/YYYY' | 'MM/YYYY' | 'N/I'
    year: Optional[int] = None
    month: Optional[int] = None
    day: Optional[int] = None
    error: Optional[str] = None


_FULL_BR_RE = re.compile(r"^(\d{2})[./](\d{2})[./](\d{2}|\d{4})$")
_MONTH_YEAR_BR_RE = re.compile(r"^(\d{2})[./](\d{4})$")
_ISO_FULL_RE = re.compile(r"^(\d{4})-(\d{2})-(\d{2})$")
_ISO_MONTH_RE = re.compile(r"^(\d{4})-(\d{2})$")

_TEXT_EXP_RE = re.compile(
    r"(?:VAL(?:ID(?:ADE)?)?|VENC(?:IMENTO)?|DT\.?\s*VALID)\.?:?\s*"
    r"([0-9]{2}[./][0-9]{2}[./][0-9]{2,4}|[0-9]{2}[./][0-9]{4})",
    re.IGNORECASE,
)


def expand_two_digit_year(year_str: str) -> int:
    num = int(year_str)
    if len(year_str) == 2:
        return 2000 + num
    return num


def parse_brazilian_expiration_date(raw_input: Optional[str]) -> ParsedExpirationDate:
    """
    Strictly parse and validate Brazilian expiration dates:
    - Full dates: DD/MM/YYYY, DD.MM.YYYY, DD/MM/YY, DD.MM.YY -> YYYY-MM-DD / DD/MM/YYYY
    - Month/year-only dates: MM/YYYY, MM.YYYY -> YYYY-MM / MM/YYYY
    - ISO 8601 inputs (YYYY-MM-DD, YYYY-MM) are accepted for round-trip compatibility.

    Invalid calendar dates (e.g. 31/02/2030, 15/13/2030) are rejected with valid=False
    and formatted='N/I' without silent modification.
    """
    raw = (raw_input or "").strip()
    if not raw or raw.upper() == "N/I":
        return ParsedExpirationDate(
            valid=False, kind=None, iso=None, formatted="N/I", error="Empty or N/I"
        )

    m_full = _FULL_BR_RE.match(raw)
    if m_full:
        day = int(m_full.group(1))
        month = int(m_full.group(2))
        year = expand_two_digit_year(m_full.group(3))
        if not (1 <= month <= 12):
            return ParsedExpirationDate(
                valid=False,
                kind=None,
                iso=None,
                formatted="N/I",
                error=f"Invalid month ({month:02d}) in '{raw}'",
            )
        if not (1900 <= year <= 2199):
            return ParsedExpirationDate(
                valid=False,
                kind=None,
                iso=None,
                formatted="N/I",
                error=f"Invalid year ({year}) in '{raw}'",
            )
        try:
            dt = date(year, month, day)
        except ValueError as exc:
            return ParsedExpirationDate(
                valid=False,
                kind=None,
                iso=None,
                formatted="N/I",
                error=f"Invalid calendar date '{raw}': {exc}",
            )
        return ParsedExpirationDate(
            valid=True,
            kind="full",
            iso=dt.strftime("%Y-%m-%d"),
            formatted=dt.strftime("%d/%m/%Y"),
            year=year,
            month=month,
            day=day,
        )

    m_my = _MONTH_YEAR_BR_RE.match(raw)
    if m_my:
        month = int(m_my.group(1))
        year = int(m_my.group(2))
        if not (1 <= month <= 12):
            return ParsedExpirationDate(
                valid=False,
                kind=None,
                iso=None,
                formatted="N/I",
                error=f"Invalid month ({month:02d}) in '{raw}'",
            )
        if not (1900 <= year <= 2199):
            return ParsedExpirationDate(
                valid=False,
                kind=None,
                iso=None,
                formatted="N/I",
                error=f"Invalid year ({year}) in '{raw}'",
            )
        return ParsedExpirationDate(
            valid=True,
            kind="month_year",
            iso=f"{year:04d}-{month:02d}",
            formatted=f"{month:02d}/{year:04d}",
            year=year,
            month=month,
            day=None,
        )

    m_iso_full = _ISO_FULL_RE.match(raw)
    if m_iso_full:
        year, month, day = int(m_iso_full.group(1)), int(m_iso_full.group(2)), int(m_iso_full.group(3))
        try:
            dt = date(year, month, day)
        except ValueError as exc:
            return ParsedExpirationDate(
                valid=False, kind=None, iso=None, formatted="N/I", error=f"Invalid ISO date '{raw}': {exc}"
            )
        return ParsedExpirationDate(
            valid=True,
            kind="full",
            iso=dt.strftime("%Y-%m-%d"),
            formatted=dt.strftime("%d/%m/%Y"),
            year=year,
            month=month,
            day=day,
        )

    m_iso_my = _ISO_MONTH_RE.match(raw)
    if m_iso_my:
        year, month = int(m_iso_my.group(1)), int(m_iso_my.group(2))
        if not (1 <= month <= 12) or not (1900 <= year <= 2199):
            return ParsedExpirationDate(
                valid=False, kind=None, iso=None, formatted="N/I", error=f"Invalid ISO month/year '{raw}'"
            )
        return ParsedExpirationDate(
            valid=True,
            kind="month_year",
            iso=f"{year:04d}-{month:02d}",
            formatted=f"{month:02d}/{year:04d}",
            year=year,
            month=month,
            day=None,
        )

    return ParsedExpirationDate(
        valid=False,
        kind=None,
        iso=None,
        formatted="N/I",
        error=f"Unrecognized expiration date format: '{raw}'",
    )


def extract_expiration_from_text(text: Optional[str]) -> ParsedExpirationDate:
    """Find expiration marker (VAL/VALID/VALIDADE/VENC/VENCIMENTO/DT. VALID) and parse date."""
    if not text:
        return ParsedExpirationDate(valid=False, kind=None, iso=None, formatted="N/I", error="Empty text")
    m = _TEXT_EXP_RE.search(str(text))
    if not m:
        return ParsedExpirationDate(valid=False, kind=None, iso=None, formatted="N/I", error="No expiration marker")
    return parse_brazilian_expiration_date(m.group(1))


def compute_expiration_status(
    iso_or_raw: Optional[str], ref_date: Optional[date] = None
) -> Tuple[Optional[int], str]:
    """
    Compute (dias_para_vencer, status_validade) without timezone shifts.
    Month/year-only dates (YYYY-MM) are evaluated against the last calendar day of that month.
    """
    parsed = parse_brazilian_expiration_date(iso_or_raw)
    if not parsed.valid or parsed.year is None or parsed.month is None:
        return None, "SEM_DATA"

    target_day = parsed.day if parsed.day is not None else calendar.monthrange(parsed.year, parsed.month)[1]
    target_dt = date(parsed.year, parsed.month, target_day)
    today = ref_date or date.today()
    delta = (target_dt - today).days

    if delta < 0:
        status = "VENCIDO"
    elif delta <= 90:
        status = "CRITICO_90D"
    elif delta <= 180:
        status = "ATENCAO_180D"
    else:
        status = "REGULAR"

    return delta, status

