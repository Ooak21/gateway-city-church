(function () {
  const CAMPUS = 'lasvegas';
  const FN = 'https://jtifhcvbgxqwlywugvjv.supabase.co/functions/v1/gcc-watch-hello';
  const ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp0aWZoY3ZiZ3hxd2x5d3Vndmp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1MDc5NTgsImV4cCI6MjA4ODA4Mzk1OH0.UfRVLuvM8_HPvKXUEDXb0cxR50znv16L5Tf99AnSc7g';
  const THREAD_KEY = 'gcc-watch-thread';
  const LOCAL_KEY = 'gcc-watch-local';
  const DEFAULT_AUTO = 'Hello from GateWay Las Vegas. Glad you are watching with us. A host will write back shortly.';

  const logEl = document.getElementById('helloLog');
  const nameEl = document.getElementById('helloName');
  const bodyEl = document.getElementById('helloBody');
  const sendEl = document.getElementById('helloSend');
  const errEl = document.getElementById('helloErr');
  if (!logEl || !sendEl) return;

  function esc(s) {
    return String(s || '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  }
  function loadLocal() {
    try { return JSON.parse(localStorage.getItem(LOCAL_KEY)) || { auto_reply: true, auto_reply_text: DEFAULT_AUTO, threads: [] }; }
    catch { return { auto_reply: true, auto_reply_text: DEFAULT_AUTO, threads: [] }; }
  }
  function saveLocal(store) { localStorage.setItem(LOCAL_KEY, JSON.stringify(store)); }

  function paint(messages) {
    if (!messages.length) {
      logEl.innerHTML = '<p class="tiny">Say hello. A host on the Watch desk will see it.</p>';
      return;
    }
    logEl.innerHTML = messages.map((m) => {
      const mine = m.role === 'viewer';
      const who = mine ? 'You' : (m.display_name || 'GateWay');
      return `<div class="hello-row ${mine ? 'me' : 'house'}"><span class="who">${esc(who)}</span>${esc(m.body)}</div>`;
    }).join('');
    logEl.scrollTop = logEl.scrollHeight;
  }

  async function call(payload) {
    const res = await fetch(FN, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: ANON, authorization: 'Bearer ' + ANON },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('http ' + res.status);
    return res.json();
  }

  function localHello(name, text) {
    const store = loadLocal();
    let id = localStorage.getItem(THREAD_KEY);
    let thread = store.threads.find((t) => t.id === id);
    if (!thread) {
      id = 't' + Date.now();
      thread = { id, display_name: name, created_at: new Date().toISOString(), messages: [] };
      store.threads.unshift(thread);
      localStorage.setItem(THREAD_KEY, id);
    }
    thread.messages.push({
      id: 'm' + Date.now(), role: 'viewer', display_name: name, body: text, created_at: new Date().toISOString()
    });
    if (store.auto_reply !== false) {
      thread.messages.push({
        id: 'a' + Date.now(), role: 'auto', display_name: 'GateWay Las Vegas',
        body: store.auto_reply_text || DEFAULT_AUTO, created_at: new Date().toISOString()
      });
    }
    saveLocal(store);
    return { thread_id: id, messages: thread.messages };
  }

  function localPoll() {
    const id = localStorage.getItem(THREAD_KEY);
    if (!id) return { messages: [] };
    const thread = loadLocal().threads.find((t) => t.id === id);
    return { thread_id: id, messages: thread ? thread.messages : [] };
  }

  async function refresh() {
    const id = localStorage.getItem(THREAD_KEY);
    if (!id) return;
    try {
      const data = await call({ action: 'poll', thread_id: id });
      paint(data.messages || []);
    } catch {
      paint(localPoll().messages || []);
    }
  }

  sendEl.onclick = async () => {
    errEl.textContent = '';
    const name = nameEl.value.trim();
    const text = bodyEl.value.trim() || 'Hello';
    if (!name) { errEl.textContent = 'Add your name so the host knows who is saying hello.'; return; }
    sendEl.disabled = true;
    try {
      let data;
      try {
        data = await call({ action: 'hello', campus: CAMPUS, name, body: text });
        if (data.thread_id) localStorage.setItem(THREAD_KEY, data.thread_id);
      } catch {
        data = localHello(name, text);
      }
      bodyEl.value = '';
      paint(data.messages || []);
    } catch (e) {
      errEl.textContent = 'Could not send. Try again.';
      console.error(e);
    }
    sendEl.disabled = false;
  };

  refresh();
  setInterval(refresh, 4000);
})();
