import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';

async function loadApi(client) {
    const context = vm.createContext({ console });
    const dependency = new vm.SyntheticModule(['supabase'], function () { this.setExport('supabase', client); }, { context });
    const source = await readFile(new URL('../src/api/finown.js', import.meta.url), 'utf8');
    const module = new vm.SourceTextModule(source, { context });
    await module.link(() => dependency);
    await module.evaluate();
    return module.namespace;
}
const auth = { getUser: async () => ({ data: { user: { id: 'fixture-user' } } }) };

test('tracker upsert uses composite user/key conflict target for true and false, never an id lookup', async () => {
    const calls = [];
    const api = await loadApi({ auth, from(table) {
        assert.equal(table, 'trackers');
        return { upsert(row, options) {
            calls.push({ row, options });
            return { select(columns) {
                assert.equal(columns, 'key,value');
                return { single: async () => ({ data: { key: row.key, value: row.value }, error: null }) };
            } };
        } };
    } });
    await api.upsertTracker('expense:7:2026:11', true);
    await api.upsertTracker('expense:7:2026:11', false);
    assert.equal(calls.length, 2);
    assert.equal(calls[0].row.user_id, 'fixture-user');
    assert.equal(calls[1].row.value, false);
    assert.equal(calls[0].options.onConflict, 'user_id,key');
});
test('failed subscription history read rejects the load rather than returning an empty successful history', async () => {
    const api = await loadApi({ auth, from(table) {
        return { select() { return { order: async () => ({ data: [], error: table === 'subscription_payments' ? new Error('fixture failure') : null }) }; } };
    } });
    await assert.rejects(api.getAllData, /fixture failure/);
});
test('getAllData reads data without any insert/upsert/migration operation', async () => {
    const api = await loadApi({ auth, from() {
        return { select() { return { order: async () => ({ data: [], error: null }) }; } };
    } });
    const result = await api.getAllData();
    assert.equal(result.subscriptionPayments.length, 0);
});
