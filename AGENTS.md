# Project agent roles

- Use `gpt-6-astra` for planning, overall orchestration, architectural decisions, review synthesis, and final acceptance.
- Delegate medium and high complexity implementation, debugging, and security review to `gpt-6-sol`.
- Delegate bounded low complexity tasks, inventories, documentation checks, and straightforward edits to `gpt-6-luna`.
- Select the worker model explicitly when delegation tools support it. If a requested model is unavailable, report that limitation instead of silently substituting it.
- Delegate independent work with clear scope and file ownership; keep dependent decisions with the coordinator.
- These are project role instructions, not a runtime model switch. Do not claim to have changed the main session model without runtime confirmation.
