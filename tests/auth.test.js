const request = require('supertest');
const { app, server } = require('../index');
const mongoose = require("mongoose");
const crypto = require('crypto');

afterAll(() => {
  server.close()
  mongoose.connection.close()
})

describe('Auth Routes', () => {
  describe('POST /api/User/CreateUser', () => {
    it('should create a new user', async () => {
      const otp = crypto.randomInt(100, 999);
      const dob = new Date(1990, 0, 1);
      const response = await request(app).post('/api/User/CreateUser').send({
        first_name: 'John',
        last_name: 'Doe',
        email: `john${otp}.doe@example.com`,
        password: 'password123',
        gender: 'Male',
        country: 'USA',
        dob: dob,
        privilege: 'Student'
      });

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body).toHaveProperty('authtoken');
    });
  });
  it('should return validation errors for invalid input', async () => {
    const response = await request(app).post('/api/User/CreateUser').send({
      first_name: 'Jo',
      last_name: 'D',
      email: 'not-an-email',
      password: '123',
      gender: 'Unknown',
      country: 'USA',
      privilege: 'Invalid'
    });

    expect(response.statusCode).toBe(400);
    expect(response.body.errors).toBeDefined();
    expect(response.body.errors.length).toBeGreaterThan(0);
  });

  it('should not create a user if email already exists', async () => {
    const dob = new Date(1990, 0, 1);
    const response = await request(app).post('/api/User/CreateUser').send({
      first_name: 'Jane',
      last_name: 'Doe',
      email: 'insha.samnani2002@gmail.com',
      password: 'password123',
      gender: 'Female',
      country: 'USA',
      privilege: 'Student',
      dob: dob
    });

    expect(response.statusCode).toBe(400);
    expect(response.body.error).toBe('Sorry! A user with this email already exists');
  });
});

describe('POST /api/auth/LoginUser', () => {
  it('should log in an existing user', async () => {
    const response = await request(app).post('/api/User/LoginUser').send({
      email: 'insha.samnani2002@gmail.com',
      password: 'hello123'
    });

    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body).toHaveProperty('authtoken');
  });

  it('should not log in with incorrect credentials', async () => {
    const response = await request(app).post('/api/User/LoginUser').send({
      email: 'alice.smith@example.com',
      password: 'wrongpassword'
    });

    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toBe('Please try to login with correct credentials');
  });

  it('should return validation errors for invalid input', async () => {
    const response = await request(app).post('/api/User/LoginUser').send({
      email: 'not-an-email',
      password: ''
    });

    expect(response.statusCode).toBe(400);
    expect(response.body.errors).toBeDefined();
    expect(response.body.errors.length).toBeGreaterThan(0);
  });
});
