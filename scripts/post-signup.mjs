// Simple script to POST a signup to the local dev server and print response
const u = Date.now()
const payload = {
  name: 'AgentVerify',
  username: `agent_verify_${u}`,
  email: `agent_verify_${u}@example.com`,
  password: 'TestPass1!'
}

;(async () => {
  try {
    const res = await fetch('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const text = await res.text()
    console.log('STATUS', res.status)
    try { console.log('HEADERS', Object.fromEntries(res.headers.entries())) } catch (e) {}
    console.log('BODY', text)
  } catch (e) {
    console.error('REQUEST ERROR', e && e.message ? e.message : e)
    process.exit(1)
  }
})()
