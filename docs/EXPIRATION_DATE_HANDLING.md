# Brazilian Product Expiration Date Handling (`pt-BR`)

## Overview

This document describes the parsing, validation, internal storage, and display formatting rules for product expiration dates in the MedStock BI / SmartPOS Dashboard.

## Root Cause

Previously, expiration date extraction and formatting had three issues:

1. **Duplicated & incomplete regex/parsing logic** across `scripts/process-excel.py` and `scripts/sync-smartpos.py`:
   - Month/year-only formats (`MM/YYYY` / `MM.YYYY`, e.g., `Venc.:04/2031`) were ignored.
   - Abbreviated prefixes such as `valid.` (e.g., `valid.:05.09.2027`) were not matched.
   - Invalid calendar dates (e.g., `31/02/2030`) fell back to storing the raw invalid string instead of being rejected.
2. **Missing shared TypeScript domain module** for consistent validation, ISO 8601 normalization, and timezone-safe day calculations.

## Supported Formats & Internal Representation

| Input Example | Accepted Separators | Internal ISO 8601 | Display Format (`pt-BR`) | Kind |
|---|---|---|---|---|
| `01.12.30` | `.` or `/` | `2030-12-01` | `01/12/2030` | `full` |
| `01/12/30` | `.` or `/` | `2030-12-01` | `01/12/2030` | `full` |
| `01/12/2030` | `.` or `/` | `2030-12-01` | `01/12/2030` | `full` |
| `02.05.2027` | `.` or `/` | `2027-05-02` | `02/05/2027` | `full` |
| `12/2030` | `.` or `/` | `2030-12` | `12/2030` | `month_year` |
| `31/02/2030` | — | `null` (Rejected) | `N/I` | Invalid |
| `15/13/2030` | — | `null` (Rejected) | `N/I` | Invalid |

### Key Rules

- **Two-digit years (`YY`)** are consistently expanded to `20YY`.
- **Month/year-only dates (`MM/YYYY`)** are stored as `YYYY-MM` and never converted into fake full dates (`DD/MM/YYYY`). When computing `dias_para_vencer` and `status_validade`, they are evaluated against the last calendar day of that month.
- **Strict calendar validation:** Months must be `01`–`12`, and days must be valid for the given month/year (including leap years). Invalid dates are rejected without silent modification.
- **Timezone safety:** All date comparisons use pure UTC calendar-day arithmetic (`Date.UTC(year, month - 1, day)` in TypeScript and `datetime.date` in Python) so local timezones never shift expiration dates by ±1 day.

## Implementation Files

- **Python shared module:** `scripts/date_utils.py`
- **Python consumers (deduplicated):** `scripts/process-excel.py`, `scripts/sync-smartpos.py`
- **TypeScript domain module:** `lib/domain/expirationDate.ts`
- **TypeScript utilities & service integration:** `lib/utils.ts`, `lib/api/inventoryService.ts`
- **Synchronized catalog dataset:** `lib/data/inventoryData.json`

## Automated Tests

- **Python (`unittest`):**
  ```bash
  python -m unittest scripts/test_date_utils.py -v
  ```
- **TypeScript (`node --test`):**
  Tests in `lib/domain/expirationDate.test.ts` cover all valid formats, invalid calendar dates, ISO ↔ `pt-BR` round-trip preservation, and timezone-safe month-end metrics.

## Git Convention

All repository commits must be written in **English** using clear, imperative commit messages (e.g., `fix: standardize Brazilian expiration date parsing and validation`).
