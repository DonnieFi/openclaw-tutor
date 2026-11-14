# Tutor plugin verification

Observed 2026-11-14. This is source/package evidence for an unpublished v1, not a
release or a production-readiness claim.

## Passed

- Node 26.13.0; OpenClaw CLI 2026.11.3 (`17db247`).
- `npm install --ignore-scripts`, `npm run build`, and `npm test`.
- 10/10 tests pass on a supported Node runtime. The tests use a fake keyed store,
  a fixed clock, and a fictional calendar-item fixture; no calendar, network, or
  host state is touched.
- Source typecheck against a local Plugin SDK declaration shim. The installed
  OpenClaw distribution did not include the plugin-entry declaration file.
- Native Template checks for the bundled copy: `validate`, offline `dev`,
  `inspect`, and `build` passed with one skill, one plugin, zero MCP servers,
  zero automations, 11 preview actions, 3 capability escalations, and 0 blocked
  actions.
- Template archive integrity:
  `sha256:54083b17dbc2d2dc888d72c66a62034afebd9dad6e5213b5a24d195bab776bb1`.

## Package artifact

`openclaw-tutor-plugin@0.1.0`

SHA-256:
`132160ed6e734eca5b5ed4f04b37b6337adf57c4d75a87b17434d21cf11fb8`

The package contains compiled ESM, the plugin manifest, package metadata, README,
and LICENSE. It contains no `node_modules`, test fixture, student record, topic
note, assessment date, or syllabus.

## Not qualified

- A live `family_schedule` or other calendar read.
- Template Add on a receiving Gateway.
- A genuine model conversation through the installed agent.
- Receiving-host permission and tool-grant checks beyond offline preview.
- Family Pack installed alongside the template.
- ClawHub publication.

No live Add, calendar write, publication, messaging, or scheduler change was
performed.
