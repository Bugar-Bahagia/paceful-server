const app = require('../app.js');
const { User, sequelize } = require('../models');
const request = require('supertest');
const { queryInterface } = sequelize;
const { signToken } = require('../helpers/jwt');
const calculateCalories = require('../helpers/calculateCalories.js');
const redis = require('../config/redis.js');
const deleteAllRedis = require('../helpers/deleteAllRedis.js');

const userData = {
  email: 'fathan@mail.com',
  password: '123456',
  name: 'Fathan',
  dateOfBirth: '1999-11-27T03:10:39.262Z',
};

let userToken1, activity1Id, activity2Id, goal1Id;

const walkingActivity = { typeName: 'walking', duration: 30, distance: 500, notes: 'morning walk in jakarta', activityDate: '2024-11-27T03:10:39.262Z' };

const swimmingActivity = { typeName: 'swimming', duration: 30, distance: 500, notes: 'morning swim in jakarta', activityDate: '2024-11-27T03:10:39.262Z' };

const updateSwimmingActivity = { typeName: 'swimming', duration: 30, distance: 200, notes: 'morning swim in jakarta', activityDate: '2024-11-27T03:10:39.262Z' };

const distanceGoal = { typeName: 'distance', targetValue: 1000, startDate: '2024-11-20T03:10:39.262Z', endDate: '2024-11-30T03:10:39.262Z' };

const durationGoal = { typeName: 'duration', targetValue: 60, startDate: '2024-11-20T03:10:39.262Z', endDate: '2024-11-30T03:10:39.262Z' };

const caloriesGoal = { typeName: 'calories burned', targetValue: 20, startDate: '2024-11-20T03:10:39.262Z', endDate: '2024-11-30T03:10:39.262Z' };

beforeAll((done) => {
  User.create(userData)
    .then((data) => {
      userToken1 = signToken({ id: data.id, email: data.email }, 'secret');
    })
    .then(() => {
      done();
    })
    .catch((err) => {
      done(err);
    });
});

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

describe('GET /goals/:id should have dynamic currentValue ', () => {
  test('201 success add distance goal', (done) => {
    request(app)
      .post('/goals')
      .send(distanceGoal)
      .set('Authorization', `Bearer ${userToken1}`)
      .then((response) => {
        const { body, status } = response;

        goal1Id = body.id;
        expect(status).toBe(201);
        expect(body).toHaveProperty('id', expect.any(Number));
        expect(body).toHaveProperty('UserId', 1);
        expect(body).toHaveProperty('typeName', 'distance');
        expect(body).toHaveProperty('targetValue', 1000);
        expect(body).toHaveProperty('currentValue', 0);
        expect(body).toHaveProperty('startDate', expect.any(String));
        expect(body).toHaveProperty('endDate', expect.any(String));
        expect(body).toHaveProperty('isAchieved', false);
        done();
      })
      .catch((err) => {
        done(err);
      });
  });

  test('201 success add walking activity', (done) => {
    request(app)
      .post('/activities')
      .send(walkingActivity)
      .set('Authorization', `Bearer ${userToken1}`)
      .then((response) => {
        const { body, status } = response;
        const caloriesBurned = calculateCalories(walkingActivity.typeName, walkingActivity.duration);

        activity1Id = body.id;
        expect(status).toBe(201);
        expect(body).toHaveProperty('id', activity1Id);
        expect(body).toHaveProperty('UserId', 1);
        expect(body).toHaveProperty('typeName', 'walking');
        expect(body).toHaveProperty('duration', 30);
        expect(body).toHaveProperty('distance', 500);
        expect(body).toHaveProperty('caloriesBurned', caloriesBurned);
        expect(body).toHaveProperty('activityDate', expect.any(String));
        expect(body).toHaveProperty('notes', 'morning walk in jakarta');
        done();
      })
      .catch((err) => {
        done(err);
      });
  });

  test('200 success get distance goal with updated value', (done) => {
    request(app)
      .get(`/goals/${goal1Id}`)
      .set('Authorization', `Bearer ${userToken1}`)
      .then((response) => {
        const { body, status } = response;

        expect(status).toBe(200);
        expect(body).toHaveProperty('id', expect.any(Number));
        expect(body).toHaveProperty('UserId', 1);
        expect(body).toHaveProperty('typeName', 'distance');
        expect(body).toHaveProperty('targetValue', 1000);
        expect(body).toHaveProperty('currentValue', 500);
        expect(body).toHaveProperty('startDate', expect.any(String));
        expect(body).toHaveProperty('endDate', expect.any(String));
        expect(body).toHaveProperty('isAchieved', false);
        done();
      })
      .catch((err) => {
        done(err);
      });
  });

  test('201 success add swimming activity', (done) => {
    request(app)
      .post('/activities')
      .send(swimmingActivity)
      .set('Authorization', `Bearer ${userToken1}`)
      .then((response) => {
        const { body, status } = response;
        const caloriesBurned = calculateCalories(swimmingActivity.typeName, swimmingActivity.duration);

        activity2Id = body.id;
        expect(status).toBe(201);
        expect(body).toHaveProperty('id', activity2Id);
        expect(body).toHaveProperty('UserId', 1);
        expect(body).toHaveProperty('typeName', 'swimming');
        expect(body).toHaveProperty('duration', 30);
        expect(body).toHaveProperty('distance', 500);
        expect(body).toHaveProperty('caloriesBurned', caloriesBurned);
        expect(body).toHaveProperty('activityDate', expect.any(String));
        expect(body).toHaveProperty('notes', 'morning swim in jakarta');
        done();
      })
      .catch((err) => {
        done(err);
      });
  });

  test('200 success get distance goal with updated value', (done) => {
    request(app)
      .get(`/goals/${goal1Id}`)
      .set('Authorization', `Bearer ${userToken1}`)
      .then((response) => {
        const { body, status } = response;

        expect(status).toBe(200);
        expect(body).toHaveProperty('id', expect.any(Number));
        expect(body).toHaveProperty('UserId', 1);
        expect(body).toHaveProperty('typeName', 'distance');
        expect(body).toHaveProperty('targetValue', 1000);
        expect(body).toHaveProperty('currentValue', 1000);
        expect(body).toHaveProperty('startDate', expect.any(String));
        expect(body).toHaveProperty('endDate', expect.any(String));
        expect(body).toHaveProperty('isAchieved', true);
        done();
      })
      .catch((err) => {
        done(err);
      });
  });

  test('200 success update activity', (done) => {
    request(app)
      .put(`/activities/${activity2Id}`)
      .send(updateSwimmingActivity)
      .set('Authorization', `Bearer ${userToken1}`)
      .then((response) => {
        const { body, status } = response;
        const caloriesBurned = calculateCalories(body.typeName, updateSwimmingActivity.duration);

        expect(status).toBe(200);
        expect(body).toHaveProperty('id', activity2Id);
        expect(body).toHaveProperty('UserId', 1);
        expect(body).toHaveProperty('typeName', expect.any(String));
        expect(body).toHaveProperty('duration', 30);
        expect(body).toHaveProperty('distance', 200);
        expect(body).toHaveProperty('caloriesBurned', caloriesBurned);
        expect(body).toHaveProperty('activityDate', expect.any(String));
        expect(body).toHaveProperty('notes', 'morning swim in jakarta');
        done();
      })
      .catch((err) => {
        done(err);
      });
  });

  test('200 success get distance goal with updated value', (done) => {
    request(app)
      .get(`/goals/${goal1Id}`)
      .set('Authorization', `Bearer ${userToken1}`)
      .then((response) => {
        const { body, status } = response;

        expect(status).toBe(200);
        expect(body).toHaveProperty('id', expect.any(Number));
        expect(body).toHaveProperty('UserId', 1);
        expect(body).toHaveProperty('typeName', 'distance');
        expect(body).toHaveProperty('targetValue', 1000);
        expect(body).toHaveProperty('currentValue', 700);
        expect(body).toHaveProperty('startDate', expect.any(String));
        expect(body).toHaveProperty('endDate', expect.any(String));
        expect(body).toHaveProperty('isAchieved', false);
        done();
      })
      .catch((err) => {
        done(err);
      });
  });

  test('200 success delete swimming activity', (done) => {
    request(app)
      .delete(`/activities/${activity2Id}`)
      .send(null)
      .set('Authorization', `Bearer ${userToken1}`)
      .then((response) => {
        const { body, status } = response;

        expect(status).toBe(200);
        expect(body).toHaveProperty('message', 'Activity deleted successfully');
        done();
      })
      .catch((err) => {
        done(err);
      });
  });

  test('200 success get distance goal with updated value', (done) => {
    request(app)
      .get(`/goals/${goal1Id}`)
      .set('Authorization', `Bearer ${userToken1}`)
      .then((response) => {
        const { body, status } = response;

        expect(status).toBe(200);
        expect(body).toHaveProperty('id', expect.any(Number));
        expect(body).toHaveProperty('UserId', 1);
        expect(body).toHaveProperty('typeName', 'distance');
        expect(body).toHaveProperty('targetValue', 1000);
        expect(body).toHaveProperty('currentValue', 500);
        expect(body).toHaveProperty('startDate', expect.any(String));
        expect(body).toHaveProperty('endDate', expect.any(String));
        expect(body).toHaveProperty('isAchieved', false);
        done();
      })
      .catch((err) => {
        done(err);
      });
  });

  test('201 success add duration goal', (done) => {
    request(app)
      .post('/goals')
      .send(durationGoal)
      .set('Authorization', `Bearer ${userToken1}`)
      .then((response) => {
        const { body, status } = response;

        expect(status).toBe(201);
        expect(body).toHaveProperty('id', expect.any(Number));
        expect(body).toHaveProperty('UserId', 1);
        expect(body).toHaveProperty('typeName', 'duration');
        expect(body).toHaveProperty('targetValue', 60);
        expect(body).toHaveProperty('currentValue', 30);
        expect(body).toHaveProperty('startDate', expect.any(String));
        expect(body).toHaveProperty('endDate', expect.any(String));
        expect(body).toHaveProperty('isAchieved', false);
        done();
      })
      .catch((err) => {
        done(err);
      });
  });

  test('201 success add calories burned goal', (done) => {
    request(app)
      .post('/goals')
      .send(caloriesGoal)
      .set('Authorization', `Bearer ${userToken1}`)
      .then((response) => {
        const { body, status } = response;

        expect(status).toBe(201);
        expect(body).toHaveProperty('id', expect.any(Number));
        expect(body).toHaveProperty('UserId', 1);
        expect(body).toHaveProperty('typeName', 'calories burned');
        expect(body).toHaveProperty('targetValue', 20);
        expect(body).toHaveProperty('currentValue', expect.any(Number));
        expect(body).toHaveProperty('startDate', expect.any(String));
        expect(body).toHaveProperty('endDate', expect.any(String));
        expect(body).toHaveProperty('isAchieved', true);
        done();
      })
      .catch((err) => {
        done(err);
      });
  });
});
