# Tutor plugin verification

Observed 2026-11-14. This is source/package evidence for an unpublished v1, not a
release or a production-readiness claim.

## Passed

- Node 26.13.0; OpenClaw CLI 2026.11.3 (`17db247`).
- `npm install --ignore-scripts`, `npm run build`, and `npm test`.
- 12/12 tests pass on a supported Node runtime. The tests use a fake keyed store,
  a fixed clock, and a fictional calendar-item fixture; no calendar, network, or
  host state is touched. Coverage includes display dates such as `Fri Oct 9`,
  skipping one unrecognized calendar item, a saved IANA timezone for today, and
  `delete_topic` / `delete_assessment`.
- Source typecheck against a local Plugin SDK declaration shim. The installed
  OpenClaw distribution did not include the plugin-entry declaration file.
- Native Template checks for the bundled copy: `validate`, offline `dev`,
  `inspect`, and `build` passed with one skill, one plugin, zero MCP servers,
  zero automations, 11 preview actions, 3 capability escalations, and 0 blocked
  actions.
- The bundled Template archive integrity is recorded in the template
  repository's verification record, not pinned in this source repository.

## Package artifact

`openclaw-tutor-plugin@0.1.0`

SHA-256:
`d389213e1e19abecd4c6ba5ae945f98078c7fc0bf3c2360d2346741e16cf4d26`

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
