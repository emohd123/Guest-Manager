const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const EVENT = 'e5000000-0000-4000-8000-000000000001';
function load(file, imports, env = {}) {
  const exports = {};
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  vm.runInNewContext(code, { exports, require: (key) => { if (!(key in imports)) throw Error('Unexpected import: ' + key); return imports[key]; }, Date, process: { env } });
  return exports;
}
const seatsio = load('src/lib/seatsio.ts', {});
function route(overrides = {}, workspace = '') {
  const tables = { events: [{ id: EVENT, status: 'published', event_type: 'single', deleted_at: null, settings: {} }], seating_plans: [{ id: 'plan', event_id: EVENT, enabled: true }], seat_sections: [{ id: 'section', plan_id: 'plan' }], seat_rows: [{ id: 'row', section_id: 'section' }], reserved_seats: [{ id: 'seat', row_id: 'row', sold_ticket_id: null, inventory_status: 'available', seat_holds: [] }], ...overrides };
  const queries = [];
  const db = { from(table) {
    queries.push(table);
    let records = tables[table] || [];
    const filters = [];
    const result = () => ({ data: records instanceof Error ? null : records.filter((row) => filters.every((fn) => fn(row))), error: records instanceof Error ? records : null });
    const builder = {
      select() { return this; },
      eq(key, value) { filters.push((row) => row[key] === value); return this; },
      neq(key, value) { filters.push((row) => row[key] !== value); return this; },
      is(key, value) { filters.push((row) => row[key] === value); return this; },
      in(key, values) { filters.push((row) => values.includes(row[key])); return this; },
      async maybeSingle() { const value = result(); return { ...value, data: value.data?.[0] || null }; },
      then(resolve, reject) { return Promise.resolve(result()).then(resolve, reject); },
    }; return builder;
  } };
  const { GET } = load('src/app/api/mobile/v1/events/[eventId]/booking-options/route.ts', {
    'next/server': { NextResponse: { json: (body, init) => new Response(JSON.stringify(body), init) } },
    zod: require('zod'), '@/server/supabase/admin': { createSupabaseAdminClient: () => db }, '@/lib/seatsio': seatsio,
  }, { NEXT_PUBLIC_SEATSIO_WORKSPACE_KEY: workspace });
  return { run: (eventId = EVENT) => GET({}, { params: Promise.resolve({ eventId }) }), queries };
}
test('enabled native map with an unbooked seat is offered without exposing its data', async () => {
  const response = await route().run();
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('Cache-Control'), 'no-store');
  assert.deepEqual(await response.json(), { eventId: EVENT, hasReservedSeating: true });
});
test('no map, disabled map, no sections, no rows and no seats all hide seat selection', async () => {
  for (const overrides of [{ seating_plans: [] }, { seating_plans: [{ id: 'plan', event_id: EVENT, enabled: false }] }, { seat_sections: [] }, { seat_rows: [] }, { reserved_seats: [] }]) {
    assert.equal((await (await route(overrides).run()).json()).hasReservedSeating, false);
  }
});
test('sold seats and active holds are not offered; expired holds become selectable', async () => {
  const seat = { id: 'seat', row_id: 'row', sold_ticket_id: null, inventory_status: 'available', seat_holds: [] };
  for (const unavailable of [{ ...seat, inventory_status: 'blocked' }, { ...seat, sold_ticket_id: 'private-ticket-id' }, { ...seat, seat_holds: [{ status: 'pending', expires_at: new Date(Date.now() + 60000).toISOString() }] }]) {
    assert.equal((await (await route({ reserved_seats: [unavailable] }).run()).json()).hasReservedSeating, false);
  }
  const expired = { ...seat, seat_holds: [{ status: 'pending', expires_at: new Date(Date.now() - 60000).toISOString() }] };
  assert.equal((await (await route({ reserved_seats: [expired] }).run()).json()).hasReservedSeating, true);
});
test('configured Seats.io works only with workspace configuration; a default chart is never invented', async () => {
  const record = { id: EVENT, status: 'published', event_type: 'single', deleted_at: null, settings: { seatsIo: { chartKey: 'configured-chart' } } };
  const enabled = route({ events: [record], seating_plans: [] }, 'workspace');
  assert.equal((await (await enabled.run()).json()).hasReservedSeating, true);
  assert.deepEqual(enabled.queries, ['events']);
  assert.equal((await (await route({ events: [record], seating_plans: [] }).run()).json()).hasReservedSeating, false);
  assert.equal((await (await route({ seating_plans: [] }, 'workspace').run()).json()).hasReservedSeating, false);
});
test('unpublished, deleted, hidden and conference events cannot expose booking options', async () => {
  for (const change of [{ status: 'draft' }, { deleted_at: '2026-01-01' }, { event_type: 'conference' }, { settings: { publicPage: { enabled: false } } }, { settings: { publicPage: { showInApp: false } } }]) {
    const record = { id: EVENT, status: 'published', event_type: 'single', deleted_at: null, settings: {}, ...change };
    assert.equal((await route({ events: [record] }).run()).status, 404);
  }
});
test('database failure returns no capability and never leaks database diagnostics', async () => {
  const response = await route({ seat_rows: new Error('private SQL details') }).run();
  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), { error: 'Booking options are temporarily unavailable' });
});
test('invalid event input is rejected before creating a privileged database client', async () => {
  const api = route(); assert.equal((await api.run('not-a-uuid')).status, 400);
  assert.equal(api.queries.length, 0);
});
