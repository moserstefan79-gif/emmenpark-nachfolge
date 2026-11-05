// Nur für lokale Sichtprüfung: minimaler In-Memory-Ersatz für @supabase/supabase-js
import seed from './data.json'

const db = JSON.parse(JSON.stringify(seed))
const me = db.profiles.find((p) => p.email === 'moser.stefan79@gmail.com')
const USER = { id: 'user-1', email: me.email }
me.user_id = USER.id
let session = JSON.parse(localStorage.getItem('mock-session') || 'null')
const listeners = []

class Q {
  constructor(table) { this.table = table; this.filters = []; this.orders = []; this.op = 'select'; this.payload = null; this.single = false }
  select() { if (this.op === 'select') this.op = 'select'; return this }
  eq(k, v) { this.filters.push((r) => r[k] === v); return this }
  in(k, arr) { this.filters.push((r) => arr.includes(r[k])); return this }
  is(k, v) { this.filters.push((r) => r[k] === v); return this }
  order(col, { ascending = true } = {}) { this.orders.push([col, ascending]); return this }
  maybeSingle() { this.single = 'maybe'; return this }
  single() { this.single = true; return this }
  insert(p) { this.op = 'insert'; this.payload = p; return this }
  update(p) { this.op = 'update'; this.payload = p; return this }
  upsert(p) { this.op = 'upsert'; this.payload = p; return this }
  delete() { this.op = 'delete'; return this }
  _rows() { let rows = (db[this.table] ?? []).filter((r) => this.filters.every((f) => f(r))); for (const [c, a] of this.orders.reverse()) rows.sort((x, y) => (x[c] > y[c] ? 1 : x[c] < y[c] ? -1 : 0) * (a ? 1 : -1)); return rows }
  then(res) {
    let data = null, error = null
    if (this.op === 'select') { const rows = this._rows(); data = this.single ? rows[0] ?? null : rows }
    if (this.op === 'insert') { const row = { id: crypto.randomUUID(), ...this.payload }; (db[this.table] ??= []).push(row); data = row; this._sync() }
    if (this.op === 'update') { const rows = this._rows(); rows.forEach((r) => Object.assign(r, this.payload)); data = rows[0]; this._sync() }
    if (this.op === 'upsert') { const p = this.payload; const ex = (db[this.table] ?? []).find((r) => r.canvas_id === p.canvas_id && r.dimension === p.dimension); if (ex) Object.assign(ex, p); else db[this.table].push({ id: crypto.randomUUID(), ...p }); data = p }
    if (this.op === 'delete') { const rows = this._rows(); db[this.table] = db[this.table].filter((r) => !rows.includes(r)); this._sync() }
    res({ data, error })
  }
  _sync() { if (this.table === 'milestones') db.v_milestones = db.milestones.map((m) => ({ ...m, phase_title: db.phases.find((p) => p.id === m.phase_id)?.title, phase_nr: db.phases.find((p) => p.id === m.phase_id)?.nr, owner_name: db.profiles.find((p) => p.id === m.owner_id)?.full_name })) }
}

export function createClient() {
  return {
    from: (t) => new Q(t),
    auth: {
      getSession: async () => ({ data: { session } }),
      onAuthStateChange: (cb) => { listeners.push(cb); return { data: { subscription: { unsubscribe() {} } } } },
      signInWithPassword: async ({ email }) => { session = { user: { ...USER, email } }; localStorage.setItem('mock-session', JSON.stringify(session)); listeners.forEach((l) => l('SIGNED_IN', session)); return { error: null } },
      signInWithOtp: async () => ({ error: null }),
      signOut: async () => { session = null; localStorage.removeItem('mock-session'); listeners.forEach((l) => l('SIGNED_OUT', null)) },
    },
    storage: { from: () => ({ upload: async () => ({ error: null }), createSignedUrl: async () => ({ data: { signedUrl: '#' } }), remove: async () => ({}) }) },
  }
}
