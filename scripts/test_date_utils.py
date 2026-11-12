import os
import sys
import unittest
from datetime import date

sys.path.insert(0, os.path.dirname(__file__))

from date_utils import (
    compute_expiration_status,
    extract_expiration_from_text,
    parse_brazilian_expiration_date,
)


class TestBrazilianExpirationDate(unittest.TestCase):
    def test_required_valid_cases(self):
        cases = [
            ("01.12.30", "01/12/2030", "2030-12-01", "full"),
            ("01/12/30", "01/12/2030", "2030-12-01", "full"),
            ("01/12/2030", "01/12/2030", "2030-12-01", "full"),
            ("12/2030", "12/2030", "2030-12", "month_year"),
            ("02.05.2027", "02/05/2027", "2027-05-02", "full"),
        ]
        for raw, expected_br, expected_iso, expected_kind in cases:
            with self.subTest(raw=raw):
                parsed = parse_brazilian_expiration_date(raw)
                self.assertTrue(parsed.valid)
                self.assertEqual(parsed.formatted, expected_br)
                self.assertEqual(parsed.iso, expected_iso)
                self.assertEqual(parsed.kind, expected_kind)

    def test_required_invalid_cases_rejected_without_mutation(self):
        for raw in ("31/02/2030", "15/13/2030", "32/13/2030", "13/2030", "00/12/2030"):
            with self.subTest(raw=raw):
                parsed = parse_brazilian_expiration_date(raw)
                self.assertFalse(parsed.valid)
                self.assertIsNone(parsed.iso)
                self.assertEqual(parsed.formatted, "N/I")
                self.assertIsNotNone(parsed.error)

    def test_round_trip_iso_and_brazilian_preservation(self):
        for raw, expected_br in [("01.12.30", "01/12/2030"), ("12/2030", "12/2030")]:
            parsed = parse_brazilian_expiration_date(raw)
            self.assertTrue(parsed.valid)
            re_parsed = parse_brazilian_expiration_date(parsed.iso)
            self.assertTrue(re_parsed.valid)
            self.assertEqual(re_parsed.formatted, expected_br)
            self.assertEqual(re_parsed.kind, parsed.kind)

    def test_extract_from_product_descriptions(self):
        p1 = extract_expiration_from_text("campo operatorio CREMER 261110 Venc.:04/2031")
        self.assertTrue(p1.valid)
        self.assertEqual(p1.formatted, "04/2031")
        self.assertEqual(p1.iso, "2031-04")
        self.assertEqual(p1.kind, "month_year")

        p2 = extract_expiration_from_text("tubo mini Firstlab - Lt.:25102425 valid.:05.09.2027")
        self.assertTrue(p2.valid)
        self.assertEqual(p2.formatted, "05/09/2027")
        self.assertEqual(p2.iso, "2027-09-05")
        self.assertEqual(p2.kind, "full")

        p3 = extract_expiration_from_text("LAMINA FOSCA - LOTE: YCLJ251218 DT. VALID: 18/12/30")
        self.assertTrue(p3.valid)
        self.assertEqual(p3.formatted, "18/12/2030")
        self.assertEqual(p3.iso, "2030-12-18")

        p_invalid = extract_expiration_from_text("PRODUTO TESTE VAL: 31/02/2030")
        self.assertFalse(p_invalid.valid)
        self.assertEqual(p_invalid.formatted, "N/I")

    def test_month_year_expiration_status_uses_month_end(self):
        dias, status = compute_expiration_status("2030-12", ref_date=date(2030, 12, 1))
        self.assertEqual(dias, 30)  # Dec 31 - Dec 1
        self.assertEqual(status, "CRITICO_90D")


if __name__ == "__main__":
    unittest.main()

