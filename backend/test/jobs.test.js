const request = require('supertest')
const app = require('../index')

describe('POST /api/jobs/apply', () => {
  it('returns 400 for missing fields', async () => {
    const res = await request(app).post('/api/jobs/apply').send({})
    expect(res.status).toBe(400)
  })

  it('returns 200 for valid request (logs when no Google keys)', async () => {
    const payload = { name: 'A', email: 'a@b.com', phone: '', cv: '', age: '30', motivation: 'I want this', location: '' }
    const res = await request(app).post('/api/jobs/apply').send(payload)
    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
  })
})
