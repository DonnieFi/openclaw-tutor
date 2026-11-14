# Tutor hookup contract

Plugin id: `tutor`. Package: `openclaw-tutor-plugin`, version `0.1.0`. There is no
published ClawHub coordinate yet. Do not invent one.

## Native tools

- `get_tutor_setup({})`: recorded calendar tool and saved counts.
- `save_tutor_setup({ calendarTool? })`: record a visible tool name or `null`.
- `list_topics({ subject? })`: topic summaries.
- `save_topic({ subject, title, notes })`: save or replace one topic.
- `search_topics({ query, limit? })`: every query word must appear.
- `list_assessments({ days?, calendarItems? })`: merge stored dates with supplied
  calendar items.
- `save_assessment({ subject, title, date, time?, notes? })`: save or replace one
  hand-entered date.
- `get_due_study_guides({ calendarItems? })`: the only guide read and write.

Grant these actual names through ordinary tool policy. A minimal profile needs
explicit allowances. Do not grant unrestricted tools or shell execution to
compensate for missing ones.

## Source integration

Keep one plugin source owner. Build first, then place the eligible distributable
files (`package.json`, `openclaw.plugin.json`, `dist/`, README, LICENSE) in the
template's self-contained `plugins/tutor` folder, or use a verified pinned registry
dependency once published. Do not copy `node_modules`, test state, provider
credentials, data caches, or the entire source repository into the Template.

For bundled delivery, `CLAW.md` declares:

    plugins:
      - path: plugins/tutor

The template grants the eight tools plus workspace `read` under a minimal profile.
It does not include `family_schedule` or `family_members` in `alsoAllow`, and it
does not list Family Pack under `requiresPlugins`.

## Calendar integration

The plugin cannot see or call another tool. The skill checks for a visible calendar
and passes items into `list_assessments` and `get_due_study_guides`. When Family
Pack's `family_schedule` is used:

- call it with `{ days: 7 }` and no `query`;
- without `query`, `days` defaults to 1;
- with `query`, every word must appear in the title, so `test quiz exam` matches
  nothing;
- read sections locally for test, quiz, and exam titles;
- convert display dates to `YYYY-MM-DD`;
- the calendar remains the date authority;
- do not create, edit, or delete a calendar event.

Without a calendar, topic search and hand-entered dates still work. Setup returns
the missing-calendar reminder once.

## State and privacy

State is keyed by the host-supplied agent ID in the `tutor-state` keyed store. It
contains setup, topics, hand-entered dates, and stored guides. A different agent
does not see them. Notes and guides stay in the plugin store, not workspace files.

## Study guides

`get_due_study_guides` is the only guide read and write. It builds on demand inside
the two-day window, stores the guide, and returns it unchanged until the assessment
date passes. Past guides are pruned. There is no background scan, cron,
notification, or message delivery. The guide is a starting point, not an answer key
or a finished assignment.

## Proof status

The plugin tests and bundled Template preview pass. A live calendar read, Template
Add, model conversation, receiving-host grants, and Family Pack integration remain
untested. The plugin is development software, not a grade or calendar-accuracy
promise.
