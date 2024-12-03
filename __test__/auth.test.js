const { describe, it, test, expect } = require('@jest/globals');
const app = require('../app');
const request = require('supertest');
const { sequelize } = require('../models');
const { queryInterface } = sequelize;
const redis = require('../config/redis.js');
const deleteAllRedis = require('../helpers/deleteAllRedis.js');
const { OAuth2Client } = require('google-auth-library');

beforeAll(async () => {
   
  await queryInterface.addColumn('UserProfiles', 'avatar', {
    type: sequelize.Sequelize.STRING,
    allowNull: true,
  });
});


// afterAll((done) => {
//   queryInterface
//     .removeColumn('UserProfiles', 'avatar');
//     .bulkDelete('Users', null, { truncate: true, cascade: true, restartIdentity: true })
//     .then(() => {
//       return queryInterface.bulkDelete('Activities', null, { truncate: true, cascade: true, restartIdentity: true });
//     })
//     .then(() => {
//       return queryInterface.bulkDelete('Goals', null, { truncate: true, cascade: true, restartIdentity: true });
//     })
//     .then(() => {
//       return queryInterface.bulkDelete('UserProfiles', null, { truncate: true, cascade: true, restartIdentity: true });
//     })
//     .then(() => {
//       return deleteAllRedis();
//     })
//     .then(() => {
//       redis.disconnect();
//       done();
//     })
//     .catch((err) => done(err));
// });


afterAll(async () => {
  try {
    await queryInterface.removeColumn('UserProfiles', 'avatar');
    await queryInterface.bulkDelete('Users', null, { truncate: true, cascade: true, restartIdentity: true });
    await queryInterface.bulkDelete('Activities', null, { truncate: true, cascade: true, restartIdentity: true });
    await queryInterface.bulkDelete('Goals', null, { truncate: true, cascade: true, restartIdentity: true });
    await queryInterface.bulkDelete('UserProfiles', null, { truncate: true, cascade: true, restartIdentity: true });
    await deleteAllRedis();
    redis.disconnect();
  } catch (error) {
    console.error('Error during afterAll:', error);
    throw error;
  }
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
        avatar: null
      })
      .expect(201);
    expect({ message: 'User registered successfully'});
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


jest.mock('google-auth-library'); 

describe('Trying Google Login Endpoint /auth/googlelogin', () => {
  const mockVerifyIdToken = jest.fn();

  beforeAll(() => {
    
    OAuth2Client.mockImplementation(() => {
      return {
        verifyIdToken: mockVerifyIdToken,
      };
    });
  });

  it('failed POST /auth/googlelogin because Google payload does not include email', async () => {
    
    mockVerifyIdToken.mockResolvedValueOnce({
      getPayload: () => ({
        name: 'Qila', 
      }),
    });

    const mockGoogleToken = 'mock-google-token';

    const response = await request(app)
      .post('/auth/googlelogin')
      .set('Authorization', `Bearer ${mockGoogleToken}`)
      .expect(400);

    expect(response.body).toHaveProperty('message', 'Invalid Google token payload');
  });

  it('failed POST /auth/googlelogin because Google payload does not include name', async () => {
    
    mockVerifyIdToken.mockResolvedValueOnce({
      getPayload: () => ({
        email: 'qila@mail.com', 
      }),
    });

    const mockGoogleToken = 'mock-google-token';

    const response = await request(app)
      .post('/auth/googlelogin')
      .set('Authorization', `Bearer ${mockGoogleToken}`)
      .expect(400);

    expect(response.body).toHaveProperty('message', 'Invalid Google token payload');
  });

  it('failed POST /auth/googlelogin because there is no idToken', async () => {
    const response = await request(app)
      .post('/auth/googlelogin')
      .set('Authorization', '')
      .expect(400);

    expect(response.body).toHaveProperty('message', 'Token is required');
  });

  it('success POST /auth/googlelogin', async () => {
   
    mockVerifyIdToken.mockResolvedValueOnce({
      getPayload: () => ({
        email: 'qila@mail.com',
        name: 'qila',
      }),
    });

    const mockGoogleToken = 'mock-google-token';

    const response = await request(app)
      .post('/auth/googlelogin')
      .set('Authorization', `Bearer ${mockGoogleToken}`)
      .expect(200);

    expect(response.body).toHaveProperty('access_token');
    expect(typeof response.body.access_token).toBe('string');
  });
});