const request = require('supertest');
const app = require('./index');

describe('Voting API', () => {

  test('GET /health returns healthy', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('healthy');
  });

  test('GET /results returns vote counts', async () => {
    const res = await request(app).get('/results');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('option_a');
    expect(res.body).toHaveProperty('option_b');
    expect(res.body).toHaveProperty('total');
  });

  test('POST /vote with valid option succeeds', async () => {
    const res = await request(app)
      .post('/vote')
      .send({ option: 'option_a' });
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toContain('Vote cast');
  });

  test('POST /vote with invalid option returns 400', async () => {
    const res = await request(app)
      .post('/vote')
      .send({ option: 'invalid' });
    expect(res.statusCode).toBe(400);
  });

  test('GET /results reflects votes', async () => {
    const res = await request(app).get('/results');
    expect(res.statusCode).toBe(200);
    expect(res.body.total).toBeGreaterThan(0);
  });

});