import React, { useEffect, useState } from 'react';

const APP_NAME = "DeFitX Coaching";
const MASTER_PASSWORD = "defitx2025"; // as requested
const STORAGE_PREFIX = "defitx_v1_"; // prefix to avoid collisions

function keyForUser(email, suffix) {
  const k = `${STORAGE_PREFIX}user_${email.toLowerCase()}_${suffix}`;
  return k;
}

function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch (e) {
    console.error("readJSON error", e);
    return fallback;
  }
}
function writeJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function nowISO() {
  return new Date().toISOString();
}

function validateDateDDMMYYYY(s) {
  if (!s) return false;
  const pattern = /^(0[1-9]|[12][0-9]|3[01])[:-\/.](0[1-9]|1[0-2])[:-\/.](\d{4})$/;
  return pattern.test(s);
}

export default function App() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [user, setUser] = useState(readJSON(`${STORAGE_PREFIX}session`, null)); // {email}
  const [view, setView] = useState('dashboard'); // dashboard, clients, clientDetail, activity
  const [clients, setClients] = useState([]);
  const [activity, setActivity] = useState([]);
  const [selectedClientId, setSelectedClientId] = useState(null);

  // load when user changes
  useEffect(() => {
    if (!user) return;
    const emailKey = user.email.toLowerCase();
    const c = readJSON(keyForUser(emailKey, 'clients'), []);
    const a = readJSON(keyForUser(emailKey, 'activity'), []);
    setClients(c);
    setActivity(a);
  }, [user]);

  // persist clients/activity when changed
  useEffect(() => {
    if (!user) return;
    const k = user.email.toLowerCase();
    writeJSON(keyForUser(k, 'clients'), clients);
  }, [clients, user]);

  useEffect(() => {
    if (!user) return;
    const k = user.email.toLowerCase();
    writeJSON(keyForUser(k, 'activity'), activity);
  }, [activity, user]);

  function addActivity(msg) {
    const a = [{ id: Date.now(), ts: nowISO(), msg }, ...activity].slice(0,100);
    setActivity(a);
  }

  function handleLogin(e) {
    e?.preventDefault?.();
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(normalizedEmail)) {
      alert("Enter a valid email.");
      return;
    }
    if (password !== MASTER_PASSWORD) {
      alert("Incorrect password.");
      return;
    }
    const session = { email: normalizedEmail, ts: nowISO() };
    setUser(session);
    if (remember) {
      writeJSON(`${STORAGE_PREFIX}session`, session);
    } else {
      localStorage.removeItem(`${STORAGE_PREFIX}session`);
    }
    // Ensure user data exists
    const existing = readJSON(keyForUser(normalizedEmail, 'clients'), null);
    if (existing === null) {
      writeJSON(keyForUser(normalizedEmail, 'clients'), []);
      writeJSON(keyForUser(normalizedEmail, 'activity'), []);
    }
    setEmail('');
    setPassword('');
    addActivity(`Logged in as ${normalizedEmail}`);
  }

  function handleLogout() {
    if (confirm("Log out?")) {
      addActivity("Logged out");
      setUser(null);
      localStorage.removeItem(`${STORAGE_PREFIX}session`);
      setView('dashboard');
    }
  }

  function addClient() {
    const name = prompt("Enter client's full name");
    if (!name) return;
    const newClient = {
      id: `c${Date.now()}`,
      name,
      startDate: '',
      endDate: '',
      goal: '',
      assessments: { bodyWeight:'', chest:'', waist:'', bellybutton:'', hips:'', thighs:'', arms:'' },
      results: [],
      amountPaid: ''
    };
    setClients([newClient, ...clients]);
    addActivity(`Added client ${name}`);
    setView('clients');
  }

  function deleteClient(id) {
    if (!confirm("Delete client?")) return;
    const c = clients.find(x=>x.id===id);
    setClients(clients.filter(x=>x.id!==id));
    addActivity(`Deleted client ${c?.name || id}`);
  }

  function openClientDetail(id) {
    setSelectedClientId(id);
    setView('clientDetail');
  }

  function saveClient(updated) {
    setClients(clients.map(c=>c.id===updated.id?updated:c));
    addActivity(`Saved client ${updated.name}`);
  }

  // UI - if not logged in show login
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
        <div className="w-full max-w-md bg-white rounded-2xl shadow p-6">
          <h1 className="text-2xl font-semibold mb-4">{APP_NAME} — Login</h1>
          <form onSubmit={handleLogin}>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input value={email} onChange={e=>setEmail(e.target.value)} type="email" className="w-full border rounded px-3 py-2 mb-3" placeholder="you@example.com" required />
            <label className="block text-sm font-medium mb-1">Password</label>
            <input value={password} onChange={e=>setPassword(e.target.value)} type="password" className="w-full border rounded px-3 py-2 mb-3" placeholder="Enter password" required />
            <div className="flex items-center justify-between mb-4">
              <label className="inline-flex items-center">
                <input type="checkbox" checked={remember} onChange={e=>setRemember(e.target.checked)} className="mr-2" />
                <span className="text-sm">Remember Me</span>
              </label>
            </div>
            <button className="w-full bg-blue-600 text-white py-2 rounded">Login</button>
          </form>
          <div className="text-xs text-gray-500 mt-3">Use the email you want to store data for. Password is provided by app owner.</div>
        </div>
      </div>
    );
  }

  // Logged in UI
  const currentClient = clients.find(c=>c.id===selectedClientId);

  return (
    <div className="min-h-screen p-6 bg-gray-100">
      <div className="max-w-5xl mx-auto">
        <header className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold">{APP_NAME}</h2>
            <div className="text-sm text-gray-600">Signed in as {user.email}</div>
          </div>
          <div className="flex gap-3">
            <button onClick={()=>setView('clients')} className="px-4 py-2 bg-white rounded shadow-sm border">View My Clients</button>
            <button onClick={()=>setView('activity')} className="px-4 py-2 bg-white rounded shadow-sm border">My Activity</button>
            <button onClick={handleLogout} className="px-4 py-2 bg-red-500 text-white rounded">Logout</button>
          </div>
        </header>

        <main className="bg-white shadow rounded p-6">
          {view==='dashboard' && (
            <div>
              <h3 className="text-lg font-semibold mb-2">Welcome back!</h3>
              <p className="text-sm text-gray-600">Use the buttons above to navigate. Add clients and record results.</p>
              <div className="mt-6">
                <button onClick={addClient} className="px-4 py-2 bg-green-600 text-white rounded">+ Add Client</button>
              </div>
            </div>
          )}

          {view==='clients' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">My Clients</h3>
                <div className="text-sm text-gray-500">Total: {clients.length}</div>
              </div>

              <div className="space-y-3">
                {clients.map(c=>(
                  <div key={c.id} className="border rounded p-3 flex items-center justify-between">
                    <div>
                      <div className="font-medium">{c.name}</div>
                      <div className="text-xs text-gray-500">Goal: {c.goal || '—'}</div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={()=>openClientDetail(c.id)} className="px-3 py-1 bg-blue-600 text-white rounded text-sm">View Checklist</button>
                      <button onClick={()=>deleteClient(c.id)} className="px-3 py-1 bg-red-100 text-red-700 rounded text-sm">Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {view==='clientDetail' && currentClient && (
            <ClientDetail
              client={currentClient}
              onSave={(u)=>{ saveClient(u); setSelectedClientId(u.id); setView('clients'); }}
              onBack={()=>setView('clients')}
              onActivity={(msg)=>{ addActivity(msg); }}
            />
          )}

          {view==='activity' && (
            <div>
              <h3 className="text-lg font-semibold mb-3">Recent Activity</h3>
              <div className="space-y-2">
                {activity.length===0 && <div className="text-sm text-gray-500">No activity yet.</div>}
                {activity.map(a=>(
                  <div key={a.id} className="text-sm border rounded p-2 bg-gray-50">
                    <div className="text-gray-700">{a.msg}</div>
                    <div className="text-xs text-gray-400">{new Date(a.ts).toLocaleString()}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function ClientDetail({ client, onSave, onBack, onActivity }) {
  const [local, setLocal] = useState(JSON.parse(JSON.stringify(client)));

  useEffect(()=> setLocal(JSON.parse(JSON.stringify(client))), [client]);

  function changeField(path, value) {
    setLocal(p=>{
      const copy = JSON.parse(JSON.stringify(p));
      const parts = path.split('.');
      let cur = copy;
      for (let i=0;i<parts.length-1;i++){
        cur[parts[i]] = cur[parts[i]] || {};
        cur = cur[parts[i]];
      }
      cur[parts[parts.length-1]] = value;
      return copy;
    });
  }

  function handleSave() {
    if (local.startDate && !validateDateDDMMYYYY(local.startDate)) {
      alert("Start date must be dd:mm:yyyy");
      return;
    }
    if (local.endDate && !validateDateDDMMYYYY(local.endDate)) {
      alert("End date must be dd:mm:yyyy");
      return;
    }
    onSave(local);
    onActivity(`Saved checklist for ${local.name}`);
  }

  function addResult() {
    const r = { id: `r${Date.now()}`, date: new Date().toLocaleDateString('en-GB').replace(/\//g, ':'), bodyWeight:'', chest:'', waist:'', bellybutton:'', hips:'', thighs:'', arms:'' };
    setLocal(p=> ({ ...p, results: [r, ...(p.results||[])] }));
  }

  function removeResult(id) {
    if (!confirm("Delete this result?")) return;
    setLocal(p=> ({ ...p, results: (p.results||[]).filter(x=>x.id!==id) }));
  }

  function saveResultsChanges() {
    for (const r of local.results || []) {
      if (r.date && !validateDateDDMMYYYY(r.date)) { alert("Result dates must be dd:mm:yyyy"); return; }
    }
    onSave(local);
    onActivity(`Saved results for ${local.name}`);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">{local.name} — Checklist</h3>
        <div>
          <button onClick={onBack} className="px-3 py-1 bg-gray-200 rounded mr-2">Back</button>
          <button onClick={handleSave} className="px-3 py-1 bg-blue-600 text-white rounded">Save</button>
        </div>
      </div>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="border rounded p-4 bg-gray-50">
          <h4 className="font-semibold mb-2">Dates</h4>
          <label className="text-xs">Start date (dd:mm:yyyy)</label>
          <input value={local.startDate||''} onChange={e=>changeField('startDate', e.target.value)} placeholder="01:11:2025" className="w-full border rounded px-2 py-1 mb-2" />
          <label className="text-xs">End date (dd:mm:yyyy)</label>
          <input value={local.endDate||''} onChange={e=>changeField('endDate', e.target.value)} placeholder="30:11:2025" className="w-full border rounded px-2 py-1" />
        </div>

        <div className="border rounded p-4 bg-gray-50">
          <h4 className="font-semibold mb-2">Goal</h4>
          <textarea value={local.goal||''} onChange={e=>changeField('goal', e.target.value)} className="w-full border rounded px-2 py-1" placeholder="Describe the client's goal"></textarea>
        </div>
      </section>

      <section className="mb-6">
        <h4 className="font-semibold mb-2">Assessments</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            { key: 'bodyWeight', label:'Body Weight' },
            { key: 'chest', label:'Chest' },
            { key: 'waist', label:'Waist' },
            { key: 'bellybutton', label:'Belly Button' },
            { key: 'hips', label:'Hips' },
            { key: 'thighs', label:'Thighs' },
            { key: 'arms', label:'Arms' }
          ].map(f=>(
            <div key={f.key} className="flex flex-col">
              <label className="text-xs">{f.label}</label>
              <input value={(local.assessments&&local.assessments[f.key])||''} onChange={e=>changeField(`assessments.${f.key}`, e.target.value)} className="border rounded px-2 py-1" />
            </div>
          ))}
        </div>
      </section>

      <section className="mb-6">
        <h4 className="font-semibold mb-2">Results</h4>
        <div className="mb-2 flex gap-2">
          <button onClick={addResult} className="px-3 py-1 bg-green-600 text-white rounded">+ Add Result</button>
          <button onClick={saveResultsChanges} className="px-3 py-1 bg-blue-600 text-white rounded">Save Results</button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full table-auto border-collapse">
            <thead>
              <tr className="text-left text-xs text-gray-600">
                <th className="border-b p-2">Date</th>
                <th className="border-b p-2">Body Wt</th>
                <th className="border-b p-2">Chest</th>
                <th className="border-b p-2">Waist</th>
                <th className="border-b p-2">Belly</th>
                <th className="border-b p-2">Hips</th>
                <th className="border-b p-2">Thighs</th>
                <th className="border-b p-2">Arms</th>
                <th className="border-b p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(local.results||[]).map(r=>(
                <tr key={r.id} className="text-sm">
                  <td className="border p-1">
                    <input value={r.date} onChange={e=>setLocal(p=>({...p, results: p.results.map(x=>x.id===r.id?{...x, date: e.target.value}:x)}))} className="w-32 border rounded px-1 py-0.5" />
                  </td>
                  <td className="border p-1"><input value={r.bodyWeight} onChange={e=>setLocal(p=>({...p, results: p.results.map(x=>x.id===r.id?{...x, bodyWeight: e.target.value}:x)}))} className="w-20 border rounded px-1 py-0.5" /></td>
                  <td className="border p-1"><input value={r.chest} onChange={e=>setLocal(p=>({...p, results: p.results.map(x=>x.id===r.id?{...x, chest: e.target.value}:x)}))} className="w-20 border rounded px-1 py-0.5" /></td>
                  <td className="border p-1"><input value={r.waist} onChange={e=>setLocal(p=>({...p, results: p.results.map(x=>x.id===r.id?{...x, waist: e.target.value}:x)}))} className="w-20 border rounded px-1 py-0.5" /></td>
                  <td className="border p-1"><input value={r.bellybutton} onChange={e=>setLocal(p=>({...p, results: p.results.map(x=>x.id===r.id?{...x, bellybutton: e.target.value}:x)}))} className="w-20 border rounded px-1 py-0.5" /></td>
                  <td className="border p-1"><input value={r.hips} onChange={e=>setLocal(p=>({...p, results: p.results.map(x=>x.id===r.id?{...x, hips: e.target.value}:x)}))} className="w-20 border rounded px-1 py-0.5" /></td>
                  <td className="border p-1"><input value={r.thighs} onChange={e=>setLocal(p=>({...p, results: p.results.map(x=>x.id===r.id?{...x, thighs: e.target.value}:x)}))} className="w-20 border rounded px-1 py-0.5" /></td>
                  <td className="border p-1"><input value={r.arms} onChange={e=>setLocal(p=>({...p, results: p.results.map(x=>x.id===r.id?{...x, arms: e.target.value}:x)}))} className="w-20 border rounded px-1 py-0.5" /></td>
                  <td className="border p-1">
                    <div className="flex gap-1">
                      <button onClick={()=>removeResult(r.id)} className="px-2 py-0.5 text-xs bg-red-100 text-red-700 rounded">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}

              {(local.results||[]).length===0 && (
                <tr>
                  <td colSpan={9} className="p-3 text-sm text-gray-500">No results yet. Click "Add Result" to create one.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mb-6">
        <h4 className="font-semibold mb-2">Amount Paid</h4>
        <input value={local.amountPaid||''} onChange={e=>changeField('amountPaid', e.target.value)} className="border rounded px-2 py-1 w-48" />
      </section>

      <div className="flex gap-2">
        <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded">Save Checklist</button>
        <button onClick={()=>{ onSave(local); alert('Checklist saved.'); }} className="px-4 py-2 bg-gray-200 rounded">Save & Stay</button>
      </div>
    </div>
  );
}