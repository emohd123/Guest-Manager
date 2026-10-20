const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

function loadTs(relative, overrides = {}) {
  const filename = path.resolve(__dirname, '..', relative);
  const js = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText;
  const result = { exports: {} };
  new Function('require', 'module', 'exports', js)(
    id => Object.hasOwn(overrides, id) ? overrides[id] : require(id), result, result.exports,
  );
  return result.exports;
}

process.env.PRIVATE_EVENT_ACCESS_SECRET = 'test-only-conference-access-secret';
const access = loadTs('src/server/services/private-event-access.ts');
const speaker = loadTs('src/lib/conference-speaker.ts');
const identity = { eventId: 'event-test', guestId: 'guest-test', username: 'Demo Attendee', role: 'attendee' };

test('ended conferences cannot issue new attendee or speaker sessions', () => {
  for (const role of ['attendee', 'speaker']) {
    assert.throws(() => access.createPrivateEventAccess({ ...identity, role }, new Date(Date.now() - 1000).toISOString()), /ended/);
  }
});

test('a session lasts until the actual future conference end', () => {
  const endsAt = new Date(Date.now() + 86400000).toISOString();
  const session = access.createPrivateEventAccess(identity, endsAt);
  const decoded = access.readPrivateEventAccess(session.token);
  assert.equal(decoded.expiresAt, Date.parse(endsAt));
  assert.equal(decoded.username, identity.username);
  assert.ok(session.maxAge > 86000);
});

test('a nearly ended session is not extended by a minimum 60-second cookie', () => {
  const session = access.createPrivateEventAccess(identity, new Date(Date.now() + 10000).toISOString());
  assert.ok(session.maxAge <= 10 && session.maxAge > 0);
});

test('forged and malformed signatures are rejected without a server error', () => {
  const session = access.createPrivateEventAccess(identity);
  const [payload, signature] = session.token.split('.');
  assert.equal(access.readPrivateEventAccess(`${payload}.${'é'.repeat(signature.length)}`), null);
  assert.equal(access.readPrivateEventAccess(`${payload}.${signature}.extra`), null);
  assert.equal(access.readPrivateEventAccess(`x${payload}.${signature}`), null);
});

test('an old signed session is rejected when the conference is ended or unavailable', async () => {
  let event = { id: identity.eventId, ends_at: new Date(Date.now() + 86400000).toISOString(), settings: {} };
  const chain = { from() { return this; }, select() { return this; }, eq() { return this; }, is() { return this; }, async maybeSingle() { return { data: event, error: null }; } };
  const verified = loadTs('src/server/services/verified-private-event-access.ts', {
    '@/server/supabase/admin': { createSupabaseAdminClient: () => chain },
    './private-event-access': access,
  });
  const session = access.createPrivateEventAccess(identity);
  assert.ok(await verified.readVerifiedPrivateEventAccess(session.token));
  event.ends_at = new Date(Date.now() - 1000).toISOString();
  assert.equal(await verified.readVerifiedPrivateEventAccess(session.token), null);
  event.ends_at = new Date(Date.now() + 86400000).toISOString();
  event.settings = { publicPage: { enabled: false } };
  assert.equal(await verified.readVerifiedPrivateEventAccess(session.token), null);
  event = null;
  assert.equal(await verified.readVerifiedPrivateEventAccess(session.token), null);
});

test('co-presenters get only exact assigned-name matches', () => {
  assert.equal(speaker.isAssignedConferenceSpeaker('Omar Nova, Maya Cedar & Zayd Atlas', 'Maya Cedar'), true);
  assert.equal(speaker.isAssignedConferenceSpeaker('Omar Nova, Maya Cedar & Zayd Atlas', 'Zayd Atlas'), true);
  assert.equal(speaker.isAssignedConferenceSpeaker('Lina Horizon', 'Lina'), false);
  assert.equal(speaker.isAssignedConferenceSpeaker('Lina Horizon', ''), false);
});

test('attendee data contains no speaker credentials and does not mutate admin data', () => {
  const session = { id: 'keynote', speakerAccessCode: 'PRIVATE', title: 'Keynote' };
  assert.equal('speakerAccessCode' in speaker.withoutSpeakerCredentials([session])[0], false);
  const settings = { sessionDetails: { keynote: session } };
  assert.equal('speakerAccessCode' in speaker.attendeeConferenceSettings(settings).sessionDetails.keynote, false);
  assert.equal(settings.sessionDetails.keynote.speakerAccessCode, 'PRIVATE');
});
