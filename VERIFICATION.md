# Tutor plugin verification

Observed 2026-11-14. This is source/package evidence for an unpublished v1, not a
release or a production-readiness claim.

## Passed

- Node 26.13.0; OpenClaw CLI 2026.11.3 (`17db247`).
- `npm install --ignore-scripts`, `npm run typecheck`, `npm run build`, and `npm test`.
- 14/14 tests pass on a supported Node runtime. The tests use a fake v2 keyed store
  (`observe` / `compareAndApply` + `assertCurrent`), a fixed clock, and a
  fictional calendar-item fixture; no calendar, network, or host state is touched.
  Coverage includes interleaved concurrent-write preservation, bounded conflict
  retry, revoked invocation rejection, display dates such as `Fri Oct 9`, skipping
  one unrecognized calendar item, a saved IANA timezone for today, and
  `delete_topic` / `delete_assessment`.
- Source typecheck (`npm run typecheck`) against the installed `openclaw@2026.11.3`
  Plugin SDK declarations (`devDependencies`).
- Native Template checks for the bundled copy: `validate`, offline `dev`,
  `inspect`, and `build` passed with one skill, one plugin, zero MCP servers,
  zero automations, 11 preview actions, 3 capability escalations, and 0 blocked
  actions.
- Isolated receiving-host check (`OPENCLAW_STATE_DIR` / `OPENCLAW_CONFIG_PATH`
  under `/tmp`): `openclaw templates add` (`status: "complete"`,
  `configCommitted: true`) and `openclaw plugins list --json` showed
  `tutor-study@0.1.0` (`status: "loaded"`, 10 tools, `typebox@1.4.3`).
- The bundled Template archive integrity is recorded in the template
  repository's verification record, not pinned in this source repository.

## Package artifact

`openclaw-tutor-plugin@0.1.0`

SHA-256:
`250da7931131436cc94b21077b2e6f4ff93bc1d766f309ff873138e400e9e1e0`

The package contains compiled ESM, the plugin manifest, package metadata, README,
and LICENSE. It contains no `node_modules`, test fixture, student record, topic
note, assessment date, or syllabus.

## Not qualified

- A live `family_schedule` or other calendar read.
- A genuine multi-turn model conversation through the installed agent (ephemeral
  Gateway conversation proof was skipped).
- Runtime tool execution and cross-agent store isolation on a live Gateway.
- Family Pack installed alongside the template.
- npm or ClawHub publication.

No live Gateway modification, calendar write, publication, messaging, or scheduler
change was performed.
