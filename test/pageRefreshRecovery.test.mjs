import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

// Execute the actual App loader with controlled service promises and state setters.
const source = await readFile(new URL('../src/App.jsx', import.meta.url), 'utf8');
const loaderBody = source.split('const loadPage = useCallback(')[1].split('\n  }, []);')[0] + '\n  }';
function harness(loader) {
  const state = { data: {}, status: {}, error: {}, refreshing: {} };
  const loaded = { current: new Set() }, ready = { current: new Set() }, requests = { current: new Map() };
  const set = (key) => (update) => { state[key] = update(state[key]); };
  const load = new Function('PAGE_BY_KEY', 'pageDataKey', 'loadedRef', 'readyPagesRef', 'pageLoadPromisesRef',
    'setPageData', 'setPageStatus', 'setPageError', 'setPageRefreshing', `return (${loaderBody});`)(
    { home: { loader }, tactics: { loader } }, (key) => key, loaded, ready, requests,
    set('data'), set('status'), set('error'), set('refreshing'));
  return { state, load, reset() { loaded.current.clear(); ready.current.clear(); requests.current.clear();
    state.data = {}; state.status = {}; state.error = {}; state.refreshing = {}; } };
}
const failure = new Error('CRM query failed');
test('failed refresh preserves data, exposes error, and successful retry clears it', async () => {
  let fail = false, value = { version: 1 };
  const h = harness(async () => { if (fail) throw failure; return value; });
  await h.load('home'); fail = true;
  await assert.rejects(h.load('home', { background: true, force: true }), /CRM query/);
  assert.equal(h.state.status.home, 'ready'); assert.equal(h.state.data.home, value);
  assert.equal(h.state.error.home, failure); assert.equal(h.state.refreshing.home, false);
  fail = false; value = { version: 2 };
  await h.load('home', { background: true, force: true });
  assert.equal(h.state.data.home.version, 2); assert.equal(h.state.error.home, undefined);
});
test('failed initial background preload remains an error with no fabricated data', async () => {
  const h = harness(async () => { throw failure; });
  await assert.rejects(h.load('tactics', { background: true }));
  assert.equal(h.state.status.tactics, 'error'); assert.equal(h.state.data.tactics, undefined);
});
test('first-load failure supports explicit successful retry', async () => {
  let fail = true;
  const h = harness(async () => { if (fail) throw failure; return { version: 1 }; });
  await assert.rejects(h.load('home')); fail = false;
  await h.load('home', { force: true });
  assert.equal(h.state.status.home, 'ready'); assert.equal(h.state.error.home, undefined);
});
test('an obsolete request cannot replace a newer successful result with an error', async () => {
  let rejectOld, count = 0;
  const h = harness(() => ++count === 1 ? new Promise((_, reject) => { rejectOld = reject; }) : Promise.resolve({ version: 2 }));
  const old = h.load('home'); await Promise.resolve();
  await h.load('home', { force: true }); rejectOld(failure); await assert.rejects(old);
  assert.equal(h.state.status.home, 'ready'); assert.equal(h.state.data.home.version, 2);
  assert.equal(h.state.error.home, undefined);
});
test('switching plans clears cached readiness and ignores the old request', async () => {
  let rejectRefresh, count = 0;
  const h = harness(() => ++count === 1 ? Promise.resolve({ plan: 'A' }) : new Promise((_, reject) => { rejectRefresh = reject; }));
  await h.load('home'); const refresh = h.load('home', { background: true, force: true });
  await Promise.resolve(); h.reset(); rejectRefresh(failure); await assert.rejects(refresh);
  assert.deepEqual(h.state.data, {}); assert.deepEqual(h.state.status, {});
});
