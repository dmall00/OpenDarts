"""Logging configuration with automatic trace ID injection."""

import logging

from autoscore.util.context import get_trace_id


class TraceIdFilter(logging.Filter):
    """Logging filter that automatically adds trace_id from context to log records."""

    def filter(self, record: logging.LogRecord) -> bool:
        """Add trace_id to the log record if available in context."""
        trace_id = get_trace_id()
        record.traceId = f"[traceId={trace_id}]" if trace_id else "[traceId=]"
        return True


def setup_logging(log_level: str) -> None:
    """Configure logging with trace ID support."""
    trace_filter = TraceIdFilter()

    logging.basicConfig(
        level=getattr(logging, log_level.upper()),
        format="%(asctime)s - %(name)s - %(levelname)s - %(traceId)s - %(message)s",
    )

    for handler in logging.root.handlers:
        handler.addFilter(trace_filter)
