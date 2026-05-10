# gh-aw-actions

[![CI](https://github.com/github/gh-aw-actions/actions/workflows/ci.yml/badge.svg)](https://github.com/github/gh-aw-actions/actions/workflows/ci.yml)

This repository contains custom GitHub Actions for the [gh-aw](https://github.com/github/gh-aw) project. These actions are used by compiled workflows to provide functionality such as activation file management and CLI installation.

The version tags in this repository are aligned with the main gh-aw repository. For the changelog, issues, and feature requests, see the [gh-aw repository](https://github.com/github/gh-aw).

## Actions

- [setup](#setup) — Copy activation job files to the agent environment
- [setup-cli](#setup-cli) — Install the gh-aw CLI extension

## setup

See [setup/action.yml](setup/action.yml)

<!-- start usage -->
```yaml
- uses: github/gh-aw-actions/setup@v1
  with:
    # Destination directory for activation files.
    # Default: ${RUNNER_TEMP}/gh-aw/actions
    destination: ''

    # Install @actions/artifact so upload_artifact.cjs can upload GitHub Actions
    # artifacts via REST API directly.
    # Default: false
    safe-output-artifact-client: ''

    # Name of the job being set up. When OTEL_EXPORTER_OTLP_ENDPOINT is configured,
    # a gh-aw.<job-name>.setup span is pushed to the OTLP endpoint.
    # Default: ''
    job-name: ''

    # OTLP trace ID (32-character hexadecimal string) to reuse for cross-job span
    # correlation. Pass the trace-id output of the activation job setup step to
    # correlate all job spans under the same trace. When omitted a new trace ID is
    # generated.
    # Default: ''
    trace-id: ''
```
<!-- end usage -->

### Outputs

| Output | Description |
|--------|-------------|
| `files_copied` | Number of files copied |
| `trace-id` | The OTLP trace ID used for the gh-aw.<job-name>.setup span. Pass this to subsequent job setup steps via the `trace-id` input to correlate all job spans under a single trace. |

## setup-cli

See [setup-cli/action.yml](setup-cli/action.yml)

<!-- start usage -->
```yaml
- uses: github/gh-aw-actions/setup-cli@v1
  with:
    # Version to install (release tag like v0.37.18).
    # Required.
    version: ''

    # GitHub token for authentication (used for gh CLI and API calls).
    # Default: ${{ github.token }}
    github-token: ''
```
<!-- end usage -->

### Outputs

| Output | Description |
|--------|-------------|
| `installed-version` | The version that was installed |

## License

The scripts and documentation in this project are released under the [MIT License](LICENSE)

## Contributions

Contributions are welcome! See [Contributing Guide](CONTRIBUTING.md)

## Code of Conduct

:wave: Be nice. See [our code of conduct](CODE_OF_CONDUCT.md)
