"""Small local HTTP bridge between Civic Signal and the Laya Python SDK."""

import json
import threading
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer


QUESTIONS = {
    "service": {
        "type": "choice",
        "instructions": "Which public-service team should review this resident request?",
        "criteria": {
            "Water": "drinking water, pipes, flooding, water supply",
            "Housing": "shelter, unsafe home, rent, housing repairs",
            "Health": "clinic access, medicines, health services",
            "Sanitation": "waste collection, sewage, street cleanliness",
            "Other": "another public-service need",
        },
    },
    "urgency": {
        "type": "choice",
        "instructions": "How quickly should a human review this request based on the stated impact?",
        "criteria": {
            "Routine": "no time pressure or immediate harm described",
            "Soon": "service disruption or approaching deadline",
            "Urgent": "serious disruption affecting people now",
            "Immediate": "explicit present danger or people without an essential service",
        },
    },
    "access": {
        "type": "choice",
        "instructions": "Does the text describe a barrier to accessing an essential service?",
        "criteria": {
            "Yes": "people cannot access water, shelter, healthcare, or sanitation",
            "No": "no essential-service access barrier is described",
        },
    },
}

_router = None
_router_lock = threading.Lock()


def predict(text):
    global _router
    with _router_lock:
        if _router is None:
            from laya import Router
            _router = Router()
        result = _router.predict(text, QUESTIONS) or {}
    answers = result.get("answers", {})
    return {
        "source": "live",
        "answers": answers,
        "routing": result.get("routing", {}),
        "reviewRequired": True,
        "notice": "Laya output is a decision aid. A human must validate each recommendation before action.",
    }


class Handler(BaseHTTPRequestHandler):
    def _get_origin(self):
        origin = self.headers.get("Origin", "")
        # Allow standard localhost and 127.0.0.1 frontends on any port
        if origin.startswith("http://localhost:") or origin.startswith("http://127.0.0.1:") or origin in ("http://localhost", "http://127.0.0.1"):
            return origin
        return "http://localhost:5173"

    def _send_cors_headers(self):
        self.send_header("Access-Control-Allow-Origin", self._get_origin())
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.send_header("Access-Control-Max-Age", "86400")

    def _json(self, status, payload):
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self._send_cors_headers()
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self.send_response(204)
        self._send_cors_headers()
        self.end_headers()

    def do_GET(self):
        if self.path != "/api/health":
            return self._json(404, {"error": "Not found"})
        try:
            import laya  # noqa: F401
            available = True
        except ImportError:
            available = False
        return self._json(200, {"sdkAvailable": available, "mode": "local"})

    def do_POST(self):
        if self.path != "/api/analyze":
            return self._json(404, {"error": "Not found"})
        try:
            raw_len = self.headers.get("Content-Length", "0")
            try:
                length = int(raw_len)
            except ValueError:
                return self._json(400, {"error": "Invalid Content-Length header."})
            if length > 20000:
                return self._json(413, {"error": "Request is too long"})
            try:
                payload = json.loads(self.rfile.read(length))
            except json.JSONDecodeError:
                return self._json(400, {"error": "Invalid JSON body."})
            text = payload.get("text", "")
            if not isinstance(text, str) or len(text.strip()) < 12:
                return self._json(400, {"error": "Enter at least 12 characters of request text."})
            if len(text) > 8000:
                return self._json(400, {"error": "Keep the request under 8,000 characters."})
            return self._json(200, predict(text.strip()))
        except ImportError:
            return self._json(503, {"error": "The Laya SDK is not installed. Run the setup in README.md."})
        except Exception as exc:
            return self._json(503, {"error": f"Live inference could not complete: {exc}"})

    def log_message(self, format, *args):
        # Request bodies are intentionally never logged.
        return


if __name__ == "__main__":
    print("Civic Signal API on http://127.0.0.1:8000")
    ThreadingHTTPServer(("127.0.0.1", 8000), Handler).serve_forever()
