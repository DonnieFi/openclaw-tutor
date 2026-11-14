import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { TutorService } from '../dist/service.js';
import { resolveCalendarDate } from '../dist/validate.js';

const NOW = Date.parse('2026-11-14T12:00:00Z');
const calendarFixture = JSON.parse(await readFile(new URL('./fixtures/calendar-items.json', import.meta.url), 'utf8'));

function store(initial = new Map()) {
  const values = initial;
  return {
    values,
    async lookup(key) {
      return values.get(key);
    },
    async register(key, value, opts) {
      opts?.assertCurrent?.();
      values.set(key, structuredClone(value));
    },
  };
}

function clock(initial = NOW) {
  let value = initial;
  return { now: () => value, set(next) { value = next; } };
}

function scope(agentId = 'alice') {
  return { agentId, assertCurrent() {} };
}

test('setup records a calendar tool and sends the missing-calendar reminder once', async () => {
  const backing = store();
  const { service } = { service: new TutorService(backing, () => NOW) };
  const before = await service.getSetup(scope());
  assert.equal(before.calendarAvailable, false);
  assert.equal(before.calendarReminderDue, true);
  const first = await service.saveSetup({ calendarTool: null }, scope());
  assert.equal(first.calendarAvailable, false);
  assert.match(first.reminder, /needs a calendar/);
  const second = await service.saveSetup({ calendarTool: null }, scope());
  assert.equal(second.reminder, undefined);
  assert.equal((await service.getSetup(scope())).calendarReminderDue, false);
  const withCalendar = await service.saveSetup({ calendarTool: 'family_schedule' }, scope());
  assert.equal(withCalendar.calendarAvailable, true);
  assert.equal(withCalendar.calendarTool, 'family_schedule');
  assert.equal((await service.getSetup(scope())).calendarAvailable, true);
  await assert.rejects(service.saveSetup({ calendarTool: 'bad tool name!' }, scope()), /calendarTool must be a tool name/);
});

test('topics are agent-scoped, upsert by subject and title, and search every query word', async () => {
  const backing = store();
  const { service } = { service: new TutorService(backing, () => NOW) };
  await service.saveTopic({
    subject: 'Math',
    title: 'Fractions',
    notes: 'A fraction has a numerator and denominator. Course rule: cite the assistant if you use it.',
  }, scope('alice'));
  await service.saveTopic({ subject: 'Science', title: 'Photosynthesis', notes: 'Chlorophyll captures light.' }, scope('alice'));
  await service.saveTopic({
    subject: 'Math',
    title: 'Fractions',
    notes: 'Fractions can be simplified by dividing the numerator and denominator by a common factor.',
  }, scope('alice'));
  const listed = await service.listTopics({}, scope('alice'));
  assert.equal(listed.count, 2);
  assert.equal(listed.topics[0].subject, 'Math');
  assert.match(listed.topics[0].notesPreview, /simplified/);
  assert.equal((await service.listTopics({ subject: 'math' }, scope('alice'))).count, 1);
  assert.equal((await service.listTopics({}, scope('bob'))).count, 0);
  const found = await service.searchTopics({ query: 'fractions DENOMINATOR' }, scope('alice'));
  assert.equal(found.count, 1);
  assert.equal(found.matches[0].title, 'Fractions');
  assert.deepEqual(found.matches[0].matchedIn.sort(), ['notes', 'title']);
  assert.match(found.matches[0].notes, /common factor/);
  assert.equal((await service.searchTopics({ query: 'fractions chemistry' }, scope('alice'))).count, 0);
  await assert.rejects(service.saveTopic({ subject: 'Math', title: 'Empty', notes: ' ' }, scope('alice')), /notes is required/);
});

test('hand-entered assessments upsert by subject and title and replace the date', async () => {
  const backing = store();
  const { service } = { service: new TutorService(backing, () => NOW) };
  await service.saveAssessment({ subject: 'Math', title: 'Unit test', date: '2026-11-20', time: '9:00 AM' }, scope());
  await service.saveAssessment({ subject: 'Math', title: 'Unit test', date: '2026-11-21', notes: 'Bring a ruler' }, scope());
  const listed = await service.listAssessments({ days: 30 }, scope());
  assert.equal(listed.assessments.length, 1);
  assert.equal(listed.assessments[0].date, '2026-11-21');
  assert.equal(listed.assessments[0].time, null);
  assert.equal(listed.assessments[0].notes, 'Bring a ruler');
  assert.equal(listed.assessments[0].source, 'tutor');
  await assert.rejects(service.saveAssessment({ subject: 'Math', title: 'Bad', date: '2026-02-30' }, scope()), /date must be a real date/);
  await assert.rejects(service.saveAssessment({ subject: 'Math', title: 'Bad', date: '2026-11-20', time: 'after lunch' }, scope()), /time must look like/);
});

test('list_assessments merges supplied calendar items without turning them into saved dates', async () => {
  const backing = store();
  const { service } = { service: new TutorService(backing, () => NOW) };
  await service.saveAssessment({ subject: 'Math', title: 'Unit test', date: '2026-11-20', time: '09:00' }, scope());
  const merged = await service.listAssessments({
    days: 30,
    calendarItems: [
      { title: 'Unit test', date: '2026-11-20', time: '8:05 AM', source: 'family_schedule' },
      { title: 'Science quiz', date: '2026-11-18', subject: 'Science', source: 'family_schedule' },
      { title: 'Science quiz', date: '2026-11-18', subject: 'Science', source: 'family_schedule' },
      { title: 'Old test', date: '2026-11-01' },
      { title: 'Far test', date: '2027-01-01' },
    ],
  }, scope());
  assert.equal(merged.calendarItemsConsidered, 5);
  assert.equal(merged.assessments.length, 2);
  assert.deepEqual(merged.assessments.map((assessment) => [assessment.title, assessment.source]), [
    ['Science quiz', 'calendar'],
    ['Unit test', 'both'],
  ]);
  assert.equal(merged.assessments[1].time, '09:00');
  assert.deepEqual(merged.assessments[1].sources.sort(), ['family_schedule', 'tutor']);
  assert.equal((await service.listAssessments({ days: 30 }, scope())).assessments.length, 1);
  const skipped = await service.listAssessments({ calendarItems: [{ title: 'Bad', date: 'Friday' }] }, scope());
  assert.equal(skipped.skippedCalendarItems.length, 1);
  assert.equal(skipped.calendarItemsConsidered, 0);
});

test('same title and date in different subjects stays separate and merges by subject', async () => {
  const backing = store();
  const { service } = { service: new TutorService(backing, () => NOW) };
  await service.saveAssessment({ subject: 'Math', title: 'Unit test', date: '2026-11-20' }, scope());
  await service.saveAssessment({ subject: 'Science', title: 'Unit test', date: '2026-11-20' }, scope());
  const merged = await service.listAssessments({
    days: 30,
    calendarItems: [{ title: 'Unit test', date: '2026-11-20', subject: 'Math', source: 'family_schedule' }],
  }, scope());
  assert.equal(merged.assessments.length, 2);
  assert.deepEqual(merged.assessments.map((assessment) => [assessment.subject, assessment.source]), [
    ['Math', 'both'],
    ['Science', 'tutor'],
  ]);
  const ambiguous = await service.listAssessments({
    days: 30,
    calendarItems: [{ title: 'Unit test', date: '2026-11-20', source: 'family_schedule' }],
  }, scope());
  assert.equal(ambiguous.assessments.length, 3);
  assert.equal(ambiguous.assessments.filter((assessment) => assessment.source === 'calendar').length, 1);
});

test('a due guide is built on demand, stored, and reused unchanged until the date passes', async () => {
  const backing = store();
  const time = clock();
  const service = new TutorService(backing, time.now);
  await service.saveTopic({
    subject: 'Math',
    title: 'Fractions',
    notes: 'Simplify by dividing both parts by a common factor. Course rule: cite the assistant if you use it.',
  }, scope());
  await service.saveAssessment({ subject: 'Math', title: 'Fractions quiz', date: '2026-11-15', time: '10:30 AM' }, scope());
  const early = await service.getDueStudyGuides({}, scope());
  assert.equal(early.guides.length, 1);
  assert.equal(early.guides[0].reused, false);
  assert.match(early.guides[0].markdown, /# Study guide: Fractions quiz/);
  assert.match(early.guides[0].markdown, /common factor/);
  assert.match(early.guides[0].markdown, /cite the assistant/);
  assert.match(early.guides[0].markdown, /not a finished assignment/);
  await service.saveTopic({
    subject: 'Math',
    title: 'Fractions',
    notes: 'Updated notes that should not replace a stored guide.',
  }, scope());
  const again = await service.getDueStudyGuides({}, scope());
  assert.equal(again.guides.length, 1);
  assert.equal(again.guides[0].reused, true);
  assert.equal(again.guides[0].markdown, early.guides[0].markdown);
  time.set(Date.parse('2026-11-16T12:00:00Z'));
  const after = await service.getDueStudyGuides({}, scope());
  assert.equal(after.guides.length, 0);
  assert.equal((await service.listAssessments({ days: 30 }, scope())).assessments.length, 0);
});

test('calendar fixtures can be the only source of a due guide, and an empty topic still gets a guide', async () => {
  const backing = store();
  const service = new TutorService(backing, () => NOW);
  const due = await service.getDueStudyGuides({ calendarItems: [calendarFixture[0]] }, scope());
  assert.equal(due.guides.length, 1);
  assert.match(due.guides[0].markdown, /No topic notes are saved/);
  assert.equal(due.calendarItemsConsidered, 1);
  const listed = await service.listAssessments({ days: 7, calendarItems: calendarFixture }, scope());
  assert.deepEqual(listed.assessments.map((assessment) => assessment.title), ['Math quiz', 'Science test']);
  assert.equal(listed.assessments[0].time, '8:05 AM');
  assert.equal((await service.listAssessments({ days: 30 }, scope())).assessments.length, 0);
});

test('a guide outside the two-day window is not generated', async () => {
  const backing = store();
  const service = new TutorService(backing, () => NOW);
  await service.saveTopic({ subject: 'Math', title: 'Fractions', notes: 'Notes' }, scope());
  await service.saveAssessment({ subject: 'Math', title: 'Fractions quiz', date: '2026-11-17' }, scope());
  const result = await service.getDueStudyGuides({}, scope());
  assert.equal(result.guides.length, 0);
  assert.match(result.note, /No assessment is in the next two days/);
  assert.equal(backing.values.get('agent:alice').guides.length, 0);
});

test('a revoked invocation stops before setup is written, and corrupt state reads as empty', async () => {
  const backing = store(new Map([['agent:alice', { version: 99, topics: 'nope' }]]));
  const service = new TutorService(backing, () => NOW);
  assert.deepEqual((await service.listTopics({}, scope())).topics, []);
  await assert.rejects(
    service.saveSetup({ calendarTool: 'family_schedule' }, {
      agentId: 'alice',
      assertCurrent() { throw new Error('revoked'); },
    }),
    /revoked/,
  );
  assert.deepEqual(backing.values.get('agent:alice'), { version: 99, topics: 'nope' });
});

test('display dates resolve near today, and one bad calendar item does not drop the rest', async () => {
  assert.equal(resolveCalendarDate('Mon Nov 16', '2026-11-14'), '2026-11-16');
  assert.equal(resolveCalendarDate('Fri Oct 9, 2026', '2026-11-14'), '2026-10-09');
  assert.equal(resolveCalendarDate('Wed Dec 31', '2026-01-02'), '2025-12-31');
  const backing = store();
  const service = new TutorService(backing, () => NOW);
  await service.saveTopic({ subject: 'Math', title: 'Fractions', notes: 'Parts of a whole.' }, scope());
  const listed = await service.listAssessments({
    days: 7,
    calendarItems: [
      { title: 'Unit test', date: 'Mon Nov 16', subject: 'Math', source: 'family_schedule' },
      { title: 'Nope', date: 'not a date', source: 'family_schedule' },
    ],
  }, scope());
  assert.equal(listed.assessments.length, 1);
  assert.equal(listed.assessments[0].date, '2026-11-16');
  assert.equal(listed.skippedCalendarItems.length, 1);
  const guides = await service.getDueStudyGuides({
    calendarItems: [
      { title: 'Unit test', date: 'Mon Nov 16', subject: 'Math' },
      { title: 'Nope', date: 'not a date' },
    ],
  }, scope());
  assert.equal(guides.guides.length, 1);
  assert.equal(guides.skippedCalendarItems.length, 1);
});

test('a saved timezone decides today, and topics and assessments can be removed', async () => {
  const backing = store();
  const lateUtc = Date.parse('2026-11-15T02:30:00Z');
  const service = new TutorService(backing, () => lateUtc);
  await service.saveSetup({ timezone: 'America/Halifax' }, scope());
  const setup = await service.getSetup(scope());
  assert.equal(setup.timezone, 'America/Halifax');
  await service.saveAssessment({ subject: 'Math', title: 'Quiz', date: '2026-11-14' }, scope());
  const listed = await service.listAssessments({ days: 2 }, scope());
  assert.equal(listed.today, '2026-11-14');
  assert.equal(listed.assessments.length, 1);
  await service.saveTopic({ subject: 'Math', title: 'Quiz notes', notes: 'Practice one problem.' }, scope());
  const removedTopic = await service.deleteTopic({ subject: 'Math', title: 'Quiz notes' }, scope());
  assert.equal(removedTopic.removed, true);
  assert.equal((await service.listTopics({}, scope())).count, 0);
  const removed = await service.deleteAssessment({ subject: 'Math', title: 'Quiz' }, scope());
  assert.equal(removed.removed, true);
  assert.equal((await service.listAssessments({ days: 2 }, scope())).assessments.length, 0);
  await assert.rejects(service.saveSetup({ timezone: 'Not/AZone' }, scope()), /timezone must be an IANA name/);
});

test('topic matching falls back to title words when the subject differs', async () => {
  const backing = store();
  const service = new TutorService(backing, () => NOW);
  await service.saveTopic({ subject: 'Biology', title: 'Cell division', notes: 'Mitosis has phases.' }, scope());
  await service.saveAssessment({ subject: 'Science', title: 'Cell division quiz', date: '2026-11-15' }, scope());
  const result = await service.getDueStudyGuides({}, scope());
  assert.match(result.guides[0].markdown, /Mitosis has phases/);
});
