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

const userData2 = {
  email: 'abdul@mail.com',
  password: '123456',
  name: 'Abdul',
  dateOfBirth: '2000-11-27T03:10:39.262Z',
};

let userToken1, userToken2, activityId;

const invalidToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImJvbm9AbWFpbC5jb20iLCJpZCI6MSwiaWF0IjoxNjIxMTYzNDYyfQ.WhdvxtOveekRlXU0';

const dataActivity = { typeName: 'walking', duration: 30, distance: 500, notes: 'morning walk in jakarta', activityDate: '2000-11-27T03:10:39.262Z' };

const dataUpdateActivity = { duration: 60, distance: 1000, notes: 'morning walk in jakarta selatan' };

beforeAll((done) => {
  User.create(userData)
    .then((data) => {
      userToken1 = signToken({ id: data.id, email: data.email }, 'secret');
      return User.create(userData2);
    })
    .then((data2) => {
      userToken2 = signToken({ id: data2.id, email: data2.email }, 'secret');
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

describe('POST /activities', () => {
  test('201 success add activity', (done) => {
    request(app)
      .post('/activities')
      .send(dataActivity)
      .set('Authorization', `Bearer ${userToken1}`)
      .then((response) => {
        const { body, status } = response;
        const caloriesBurned = calculateCalories(dataActivity.typeName, dataActivity.duration);
        activityId = body.id;
        expect(status).toBe(201);
        expect(body).toHaveProperty('id', expect.any(Number));
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

  test('401 add activity without token', (done) => {
    request(app)
      .post('/activities')
      .send(dataActivity)
      .then((response) => {
        const { body, status } = response;
        expect(status).toBe(401);

        expect(body).toHaveProperty('message', 'Invalid token');
        done();
      })
      .catch((err) => {
        done(err);
      });
  });

  test('401 add activity invalid token', (done) => {
    request(app)
      .post('/activities')
      .set('Authorization', `Bearer ${invalidToken}`)
      .then((response) => {
        const { body, status } = response;
        expect(status).toBe(401);
        expect(body).toHaveProperty('message', 'Invalid token');
        done();
      })
      .catch((err) => {
        done(err);
      });
  });
});

describe('GET /activities', () => {
  test('200 success get all user activities', (done) => {
    request(app)
      .get('/activities')
      .set('Authorization', `Bearer ${userToken1}`)
      .then((response) => {
        const { body, status } = response;

        expect(status).toBe(200);
        expect(Array.isArray(body)).toBeTruthy();
        expect(body.length).toBeGreaterThan(0);
        done();
      })
      .catch((err) => {
        done(err);
      });
  });

  test('401 get all user activities without token', (done) => {
    request(app)
      .get('/activities')
      .then((response) => {
        const { body, status } = response;
        expect(status).toBe(401);

        expect(body).toHaveProperty('message', 'Invalid token');
        done();
      })
      .catch((err) => {
        done(err);
      });
  });

  test('401 get all user activities invalid token', (done) => {
    request(app)
      .get('/activities')
      .set('Authorization', `Bearer ${invalidToken}`)
      .then((response) => {
        const { body, status } = response;
        expect(status).toBe(401);

        expect(body).toHaveProperty('message', 'Invalid token');
        done();
      })
      .catch((err) => {
        done(err);
      });
  });
});

describe('GET /activities/:id', () => {
  test('200 success get activity', (done) => {
    request(app)
      .get(`/activities/${activityId}`)
      .set('Authorization', `Bearer ${userToken1}`)
      .then((response) => {
        const { body, status } = response;

        expect(status).toBe(200);
        expect(body).toHaveProperty('id', expect.any(Number));
        expect(body).toHaveProperty('typeName', 'walking');
        expect(body).toHaveProperty('duration', 30);
        expect(body).toHaveProperty('distance', 500);
        expect(body).toHaveProperty('caloriesBurned', expect.any(Number));
        expect(body).toHaveProperty('activityDate', expect.any(String));
        expect(body).toHaveProperty('notes', 'morning walk in jakarta');
        done();
      })
      .catch((err) => {
        done(err);
      });
  });

  test('401 get activity without token', (done) => {
    request(app)
      .get(`/activities/${activityId}`)
      .then((response) => {
        const { body, status } = response;
        expect(status).toBe(401);

        expect(body).toHaveProperty('message', 'Invalid token');
        done();
      })
      .catch((err) => {
        done(err);
      });
  });

  test('401 get activity invalid token', (done) => {
    request(app)
      .get(`/activities/${activityId}`)
      .set('Authorization', `Bearer ${invalidToken}`)
      .then((response) => {
        const { body, status } = response;
        expect(status).toBe(401);

        expect(body).toHaveProperty('message', 'Invalid token');
        done();
      })
      .catch((err) => {
        done(err);
      });
  });
});

describe('PUT /activities/:id', () => {
  test('200 success update activity', (done) => {
    request(app)
      .put(`/activities/${activityId}`)
      .send(dataUpdateActivity)
      .set('Authorization', `Bearer ${userToken1}`)
      .then((response) => {
        const { body, status } = response;
        const caloriesBurned = calculateCalories(body.typeName, dataUpdateActivity.duration);

        expect(status).toBe(200);
        expect(body).toHaveProperty('id', expect.any(Number));
        expect(body).toHaveProperty('UserId', 1);
        expect(body).toHaveProperty('typeName', expect.any(String));
        expect(body).toHaveProperty('duration', 60);
        expect(body).toHaveProperty('distance', 1000);
        expect(body).toHaveProperty('caloriesBurned', caloriesBurned);
        expect(body).toHaveProperty('activityDate', expect.any(String));
        expect(body).toHaveProperty('notes', 'morning walk in jakarta selatan');
        done();
      })
      .catch((err) => {
        done(err);
      });
  });

  test('403 update activity unauthorized user', (done) => {
    request(app)
      .put(`/activities/${activityId}`)
      .send(dataUpdateActivity)
      .set('Authorization', `Bearer ${userToken2}`)
      .then((response) => {
        const { body, status } = response;

        expect(status).toBe(403);
        expect(body).toHaveProperty('message', 'You are not authorized');
        done();
      })
      .catch((err) => {
        done(err);
      });
  });

  test('401 update activity without token', (done) => {
    request(app)
      .patch(`/activities/${activityId}`)
      .send(null)
      .then((response) => {
        const { body, status } = response;

        expect(status).toBe(401);
        expect(body).toHaveProperty('message', 'Invalid token');
        done();
      })
      .catch((err) => {
        done(err);
      });
  });

  test('401 update activity invalid token', (done) => {
    request(app)
      .patch(`/activities/${activityId}`)
      .send(dataUpdateActivity)
      .set('Authorization', `Bearer ${invalidToken}`)
      .then((response) => {
        const { body, status } = response;

        expect(status).toBe(401);
        expect(body).toHaveProperty('message', 'Invalid token');
        done();
      })
      .catch((err) => {
        done(err);
      });
  });

  test('404 activity not found', (done) => {
    request(app)
      .put(`/activities/99`)
      .send(dataUpdateActivity)
      .set('Authorization', `Bearer ${userToken1}`)
      .then((response) => {
        const { body, status } = response;

        expect(status).toBe(404);
        expect(body).toHaveProperty('message', 'Activity Not Found');
        done();
      })
      .catch((err) => {
        done(err);
      });
  });
});

describe('DELETE /activites/:id', () => {
  test('403 delete activity unauthorized user', (done) => {
    request(app)
      .delete(`/activities/${activityId}`)
      .set('Authorization', `Bearer ${userToken2}`)
      .then((response) => {
        const { body, status } = response;
        expect(status).toBe(403);
        expect(body).toHaveProperty('message', 'You are not authorized');
        done();
      })
      .catch((err) => {
        done(err);
      });
  });

  test('401 delete activity without token', (done) => {
    request(app)
      .delete(`/activities/${activityId}`)
      .send(null)
      .then((response) => {
        const { body, status } = response;
        expect(status).toBe(401);

        expect(body).toHaveProperty('message', 'Invalid token');
        done();
      })
      .catch((err) => {
        done(err);
      });
  });

  test('404 delete activity failed cause not found', (done) => {
    request(app)
      .delete('/activities/99')
      .send(null)
      .set('Authorization', `Bearer ${userToken2}`)
      .then((response) => {
        const { body, status } = response;

        expect(status).toBe(404);
        expect(body).toHaveProperty('message', 'Activity Not Found');
        done();
      })
      .catch((err) => {
        done(err);
      });
  });

  test('200 success delete user activity', (done) => {
    request(app)
      .delete(`/activities/${activityId}`)
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
});
