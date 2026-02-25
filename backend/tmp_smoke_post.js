;(async function(){
  try {
    const url = 'http://localhost:3000/api/jobs/apply'
    const body = {
      name: 'Smoke Tester',
      email: 'smoke@example.com',
      phone: '+10000000000',
      cv: 'http://example.com/cv.pdf',
      age: '29',
      motivation: 'Testing',
      location: 'Remote'
    }
    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    const text = await res.text()
    console.log('STATUS', res.status)
    console.log(text)
  } catch (e) {
    console.error('request error', e)
  }
})()
