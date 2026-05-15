# Agent compatibility matrix

This directory holds `compat.json` — the matrix that pins agentic CLI versions
to gh-aw release ranges.

## What this answers

> Given a gh-aw release, which agent CLI version should the setup action install?

## File layout

| File | Purpose |
|------|---------|
| `compat.json`        | The matrix data |
| `compat.schema.json` | JSON Schema (draft-07) covering shape and types |
| `validate.cjs`       | Cross-row invariant checks the schema cannot express |

CI runs both validators on every PR via the `validate-compat` job.

## Matrix shape

Each agent's value is an ordered array of non-overlapping rows. Rows come in
two shapes:

- **Catch-all row** (`max-gh-aw: "*"`) — the row weekly bumps target. Carries
  the `open` field. `open: true` means weekly bumps may advance `max-agent`;
  `open: false` means an incident has held it.
- **Bounded row** (`max-gh-aw` is a concrete version) — covers older gh-aw
  releases that pre-date the current line. Closed-by-construction: bounded
  rows omit the `open` field. The validator rejects `open` on bounded rows.

## How a candidate version is validated

A `max-agent` bump means "this newer agent CLI version is approved for
production gh-aw users". The candidate must run on the canary repo with all
of the following scenarios green:

- `code-search` — github MCP read path (search files / content)
- `create-issue` — `safe-outputs.create-issue` write path
- `detection-not-skipped` — explicit regression test for the v1.0.22
  silent-success fingerprint (agent must produce output so the detection job
  does not skip)
- `list-prs` — github MCP read path (list PRs and issues)
- `strict-mode` — strict-mode behavior end to end
- `tool-connectivity` — MCP tool surface non-empty

These are the canary scenarios that exercise the `github` MCP server path
that the v1.0.22-class failure mode would affect. A candidate that breaks
the `github` MCP gateway will fail one of these scenarios with no available
tools.

## How to roll back

One PR to `main`:

1. Lower the catch-all's `max-agent` to the previous known-good agent version.
2. Set the catch-all's `open: false`.

Once merged, every in-flight run picks up the change on the next runtime fetch.
Weekly bumps skip the row while `open: false`. To recover, raise `min-agent`
above the bad version, bump `max-agent` to a newly validated version, and set
`open: true`.

## Split lifecycle

When a gh-aw release introduces a breaking change requiring a higher agent CLI
floor, a single atomic PR will (a) bump the catch-all's `min-gh-aw` to the new
floor and (b) insert a new bounded row covering the previous gh-aw range with
the last-working `max-agent`. The non-overlap invariant is preserved.

## Coverage notes

The current catch-all row's `[min-agent, max-agent]` of `1.0.21 .. 1.0.48` is
backed by a sweep that ran the canary's six working scenarios listed above
against twelve copilot CLI versions in that range, on `gh-aw v0.72.1`. All
twelve versions passed all six scenarios.

The bounded row's `max-agent: 1.0.21` for older gh-aw is taken directly from
the ADR — it was the last copilot CLI version known to work with pre-`0.72`
gh-aw releases before the `v1.0.22` detection-skip incident
([`github/gh-aw#25550`](https://github.com/github/gh-aw/issues/25550)). That
specific failure mode no longer reproduces against current `gh-aw` because
several MCP servers (`safeoutputs`, `mcpscripts`) moved out of the gateway and
into agent-container CLI tools, narrowing the surface that the v1.0.22 bug
could affect.

## What the matrix does *not* do (yet)

- It is not yet consumed by the `setup` action — until that ships, the matrix
  is documentation. Production gh-aw still installs whatever default it ships.
- There is no automated bump workflow yet — `max-agent` moves through human PRs.
- There is no automated rollback — incident response is still manual.

These are tracked as follow-ups.
