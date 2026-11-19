import unittest

import server


class ValidationTests(unittest.TestCase):
    def test_http_and_https_job_urls_are_allowed(self):
        self.assertEqual(server.clean_http_url("https://example.com/jobs/1"), "https://example.com/jobs/1")
        self.assertEqual(server.clean_http_url("http://example.com/careers"), "http://example.com/careers")

    def test_empty_job_url_is_allowed(self):
        self.assertEqual(server.clean_http_url(""), "")

    def test_unsafe_job_url_schemes_are_rejected(self):
        for value in ("javascript:alert(1)", "data:text/html,hello", "file:///etc/passwd", "not-a-url"):
            with self.subTest(value=value):
                with self.assertRaises(ValueError):
                    server.clean_http_url(value)

    def test_csv_formula_prefixes_are_neutralised(self):
        for value in ("=1+1", "+SUM(A1:A2)", "-2+3", "@SUM(A1)", "\t=1", "\r=1"):
            with self.subTest(value=value):
                self.assertTrue(server.safe_csv_cell(value).startswith("'"))

    def test_normal_csv_values_are_preserved(self):
        self.assertEqual(server.safe_csv_cell("Mechanical Design Engineer"), "Mechanical Design Engineer")

    def test_allowed_statuses_are_explicit(self):
        self.assertEqual(server.STATUSES, {"Saved", "Shortlisted", "Preparing", "Applied", "Interview", "Rejected", "Closed"})


if __name__ == "__main__":
    unittest.main()
