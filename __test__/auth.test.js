const { describe, it, test, expect } = require('@jest/globals');
const app = require('../app');
const request = require('supertest');
const { sequelize } = require('../models');
const { queryInterface } = sequelize;
const redis = require('../config/redis.js');
const deleteAllRedis = require('../helpers/deleteAllRedis.js');

afterAll((done) => {
  queryInterface
    .bulkDelete('Users', null, { truncate: true, cascade: true, restartIdentity: true })
    .then(() => {
      return queryInterface.bulkDelete('Activities', null, { truncate: true, cascade: true, restartIdentity: true });
    })
    .then(() => {
      return queryInterface.bulkDelete('Goals', null, { truncate: true, cascade: true, restartIdentity: true });
    })
    .then(() => {
      return queryInterface.bulkDelete('UserProfiles', null, { truncate: true, cascade: true, restartIdentity: true });
    })
    .then(() => {
      return deleteAllRedis();
    })
    .then(() => {
      redis.disconnect();
      done();
    })
    .catch((err) => done(err));
});

describe('Trying Register Endpoint auth/register', () => {
  it('success POST /auth/register', async () => {
    const response = await request(app)
      .post('/auth/register')
      .send({
        name: 'shaqila',
        email: 'shaqila@mail.com',
        dateOfBirth: '2000-03-20',
        password: '123456',
      })
      .expect(201);
    expect({ message: 'User registered successfully' });
  });

  it("failed POST /auth/register because there's no name", async () => {
    const response = await request(app)
      .post('/auth/register')
      .send({
        name: '',
        email: 'shaqila1@mail.com',
        dateOfBirth: '2000-03-20',
        password: '123456',
      })
      .expect({
        message: 'Name cannot be empty',
      })
      .expect(400);
  });

  it("failed POST /auth/register because there's no email", async () => {
    const response = await request(app)
      .post('/auth/register')
      .send({
        name: 'shaqila',
        email: '',
        dateOfBirth: '2000-03-20',
        password: '123456',
      })
      .expect({
        message: 'Email cannot be empty',
      })
      .expect(400);
  });

  it("failed POST /auth/register because there's no date of birth", async () => {
    const response = await request(app)
      .post('/auth/register')
      .send({
        name: 'qilaaa',
        email: 'qilung@mail.com',
        dateOfBirth: '',
        password: '123456',
      })
      .expect({
        message: 'Date of birth cannot be empty',
      })
      .expect(400);
  });

  it("failed POST /auth/register because there's no password", async () => {
    const response = await request(app)
      .post('/auth/register')
      .send({
        name: 'qilaaa',
        email: 'qilung@mail.com',
        dateOfBirth: '2000-03-20',
        password: '',
      })
      .expect({
        message: 'Password cannot be empty',
      })
      .expect(400);
  });
  it('Failed POST /auth/register because the password is shorter than 6 characters', async () => {
    const response = await request(app)
      .post('/auth/register')
      .send({
        name: 'qilaaa',
        email: 'qilung@mail.com',
        dateOfBirth: '2000-03-20',
        password: '12345',
      })
      .expect({
        message: 'Password length must be at least 6 characters',
      })
      .expect(400);
  });

  it('Failed POST /auth/register because email is not in email format', async () => {
    const response = await request(app)
      .post('/auth/register')
      .send({
        name: 'qilaaa',
        email: 'qilung.com',
        dateOfBirth: '2000-03-20',
        password: '123456',
      })
      .expect({
        message: 'Invalid email format',
      })
      .expect(400);
  });

  it('failed POST /auth/register because email is not unique', async () => {
    const response = await request(app)
      .post('/auth/register')
      .send({
        name: 'shaqila',
        email: 'shaqila@mail.com',
        dateOfBirth: '2000-03-20',
        password: '123456',
      })
      .expect({
        message: 'email must be unique',
      })
      .expect(400);
  });
});

describe('Trying Login Endpoint auth/login', () => {
  it('success POST /auth/login', async () => {
    const response = await request(app)
      .post('/auth/login')
      .send({
        email: 'shaqila@mail.com',
        password: '123456',
      })
      .expect(200);
    expect(response.body).toHaveProperty('access_token');
    expect(typeof response.body.access_token).toBe('string');
  });

  it("failed POST /auth/login because there's no email", async () => {
    const response = await request(app)
      .post('/auth/login')
      .send({
        email: '',
        password: '123456',
      })
      .expect({
        message: 'Email is required',
      })
      .expect(400);
  });

  it("failed POST /auth/login because there's no password", async () => {
    const response = await request(app)
      .post('/auth/login')
      .send({
        email: 'shaqila@mail.com',
        password: '',
      })
      .expect({
        message: 'Password is required',
      })
      .expect(400);
  });

  it("failed POST /auth/login because user's email cannot be found", async () => {
    const response = await request(app)
      .post('/auth/login')
      .send({
        email: 'ginny.weasley@example.com',
        password: '123456',
      })
      .expect({
        message: 'Invalid email or password',
      })
      .expect(401);
  });

  it('failed POST /auth/login because user input the wrong password', async () => {
    const response = await request(app)
      .post('/auth/login')
      .send({
        email: 'shaqila@mail.com',
        password: '123459',
      })
      .expect({
        message: 'Invalid email or password',
      })
      .expect(401);
  });
});

describe('Trying Google Login Endpoint /auth/googlelogin', () => {
  it('success POST /auth/googlelogin', async () => {
    const mockGoogleToken =
      'eyJhbGciOiJSUzI1NiIsImtpZCI6IjM2MjgyNTg2MDExMTNlNjU3NmE0NTMzNzM2NWZlOGI4OTczZDE2NzEiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2FjY291bnRzLmdvb2dsZS5jb20iLCJhenAiOiI0MjMyNjQ1ODk0MDctOWd2NjhxMzVqZ3Q3ZGUwNnNvZjl2MjE1NDVzYmZxN3IuYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJhdWQiOiI0MjMyNjQ1ODk0MDctOWd2NjhxMzVqZ3Q3ZGUwNnNvZjl2MjE1NDVzYmZxN3IuYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJzdWIiOiIxMTQ2MTM1MjQzMzA4ODU0MjcxNjkiLCJlbWFpbCI6InNoYXFpbGFndW5hd2FuMjBAZ21haWwuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsIm5iZiI6MTczMjc3MTMyNCwibmFtZSI6IlNoYXFpbGEiLCJwaWN0dXJlIjoiaHR0cHM6Ly9saDMuZ29vZ2xldXNlcmNvbnRlbnQuY29tL2EvQUNnOG9jS2ljY2Z4Umozcmw4RkJwQWpIWHZzVlJZR3RPbXRVbGJCbV9MdC11MFBMbzBMZTJnPXM5Ni1jIiwiZ2l2ZW5fbmFtZSI6IlNoYXFpbGEiLCJpYXQiOjE3MzI3NzE2MjQsImV4cCI6MTczMjc3NTIyNCwianRpIjoiNTU2Mzg5ZjExMDc3MGU1ZGNjMzk0YWYzY2VlYmI3ODlkZmZlMjBhOSJ9.XOsFWBUTpXjQoQwQUeVwFS6fEnYAA69ILDGsNASbJBY4-yPaoqOunSibgWOnGFeazedqGI8OyL0eBgBdQwvaQfPEcX50Swxg14hH3LngQXuWF0xKYoAZGhHYtjKaf1OeJ65r2HAt77PaLwarJc4_kixsNMr_T0ZHDU6k8g64k8v9drjRzoD4aPpyJrMlu-J19CmJaBYKOBQGTQ407F8UNVAGMn1hKcrVJ3y17gsEe4MHszjoCIZ7uYdugpx3Gi-tRfak5nof7GyBMeqpiBRh3M16_LFCNt1zXQI-Fm-IqxTNKehmyFyvD7MUOAXKaMQTq49GMNbzOORguSkbnR_R9Q';

    const response = await request(app).post('/auth/googlelogin').set('authorization', `Bearer ${mockGoogleToken}`).expect(200);

    expect(response.body).toHaveProperty('access_token');
    expect(typeof response.body.access_token).toBe('string');
  });

  it("failed POST /auth/googlelogin because there's no idToken", async () => {
    const mockGoogleToken = '';

    const response = await request(app)
      .post('/auth/googlelogin')
      .set('token', mockGoogleToken)
      .expect({
        message: 'Token is required',
      })
      .expect(400);
    // .expect(400);

    // expect(response.body).toHaveProperty('message', 'Token is required');
  });

  // it('failed POST /auth/googlelogin with invalid idToken', async () => {
  //   const invalidGoogleToken = 'invalid-token';

  //   const response = await request(app)
  //     .post('/auth/googlelogin')
  //     .set("authorization", `Bearer ${invalidGoogleToken}`)
  //     .expect({
  //       message: 'Invalid Google token payload',
  //     }).expect(401)
  //     // .expect(401);

  //   // expect(response.body).toHaveProperty('message', 'Invalid Google token payload');
  // });
});
