"""Context utilities for trace ID propagation across async calls."""

import contextvars

trace_id_var: contextvars.ContextVar[str | None] = contextvars.ContextVar("trace_id", default=None)


def set_trace_id(trace_id: str | None) -> None:
    """Set the trace ID for the current context."""
    trace_id_var.set(trace_id)


def get_trace_id() -> str | None:
    """Get the trace ID from the current context."""
    return trace_id_var.get()


def clear_trace_id() -> None:
    """Clear the trace ID from the current context."""
    trace_id_var.set(None)
