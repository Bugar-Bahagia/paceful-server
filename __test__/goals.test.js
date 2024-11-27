const app = require('../app.js');
const { User, sequelize } = require('../models');
const request = require('supertest');
const { queryInterface } = sequelize;
const { signToken } = require('../helpers/jwt');

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

let userToken1, userToken2, goalId;

const invalidToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImJvbm9AbWFpbC5jb20iLCJpZCI6MSwiaWF0IjoxNjIxMTYzNDYyfQ.WhdvxtOveekRlXU0';

const dataGoal = { typeName: 'steps', targetValue: 1000, startDate: '2024-11-20T03:10:39.262Z', endDate: '2024-11-30T03:10:39.262Z' };

const dataUpdateGoal = { targetValue: 0, startDate: '2024-11-20T03:10:39.262Z', endDate: '2024-11-30T03:10:39.262Z' };

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
      done();
    })
    .catch((err) => done(err));
});

describe('POST /goals', () => {
  test('201 success add goal', (done) => {
    request(app)
      .post('/goals')
      .send(dataGoal)
      .set('Authorization', `Bearer ${userToken1}`)
      .then((response) => {
        const { body, status } = response;

        goalId = body.id;
        expect(status).toBe(201);
        expect(body).toHaveProperty('id', expect.any(Number));
        expect(body).toHaveProperty('UserId', 1);
        expect(body).toHaveProperty('typeName', 'steps');
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

  test('401 add goal without token', (done) => {
    request(app)
      .post('/goals')
      .send(dataGoal)
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

  test('401 add goal invalid token', (done) => {
    request(app)
      .post('/goals')
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

describe('GET /goals', () => {
  test('200 success get all user goals', (done) => {
    request(app)
      .get('/goals')
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

  test('401 get all user goals without token', (done) => {
    request(app)
      .get('/goals')
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

  test('401 get all user goals invalid token', (done) => {
    request(app)
      .get('/goals')
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

describe('GET /goals/:id', () => {
  test('200 success get goal', (done) => {
    request(app)
      .get(`/goals/${goalId}`)
      .set('Authorization', `Bearer ${userToken1}`)
      .then((response) => {
        const { body, status } = response;

        expect(status).toBe(200);
        expect(body).toHaveProperty('id', expect.any(Number));
        expect(body).toHaveProperty('UserId', 1);
        expect(body).toHaveProperty('typeName', 'steps');
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

  test('401 get goal without token', (done) => {
    request(app)
      .get(`/goals/${goalId}`)
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

  test('401 get goal invalid token', (done) => {
    request(app)
      .get(`/goals/${goalId}`)
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

describe('PUT /goals/:id', () => {
  test('200 success update goal', (done) => {
    request(app)
      .put(`/goals/${goalId}`)
      .send(dataUpdateGoal)
      .set('Authorization', `Bearer ${userToken1}`)
      .then((response) => {
        const { body, status } = response;

        expect(status).toBe(200);
        expect(body).toHaveProperty('id', expect.any(Number));
        expect(body).toHaveProperty('UserId', 1);
        expect(body).toHaveProperty('typeName', 'steps');
        expect(body).toHaveProperty('targetValue', 0);
        expect(body).toHaveProperty('currentValue', 0);
        expect(body).toHaveProperty('startDate', expect.any(String));
        expect(body).toHaveProperty('endDate', expect.any(String));
        expect(body).toHaveProperty('isAchieved', true);
        done();
      })
      .catch((err) => {
        done(err);
      });
  });

  test('403 update goal unauthorized user', (done) => {
    request(app)
      .put(`/goals/${goalId}`)
      .send(dataUpdateGoal)
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
      .patch(`/goals/${goalId}`)
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

  test('401 update goal invalid token', (done) => {
    request(app)
      .patch(`/goals/${goalId}`)
      .send(dataUpdateGoal)
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
      .put(`/goals/99`)
      .send(dataUpdateGoal)
      .set('Authorization', `Bearer ${userToken1}`)
      .then((response) => {
        const { body, status } = response;

        expect(status).toBe(404);
        expect(body).toHaveProperty('message', 'Goal Not Found');
        done();
      })
      .catch((err) => {
        done(err);
      });
  });
});

describe('GET /goals/achieved', () => {
  test('200 success get all user achieved goals', (done) => {
    request(app)
      .get('/goals/achieved')
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

  test('401 get all user achieved goals without token', (done) => {
    request(app)
      .get('/goals/achieved')
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

  test('401 get all user achieved goals invalid token', (done) => {
    request(app)
      .get('/goals/achieved')
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

describe('DELETE /goals/:id', () => {
  test('403 delete goal unauthorized user', (done) => {
    request(app)
      .delete(`/goals/${goalId}`)
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

  test('401 delete goal without token', (done) => {
    request(app)
      .delete(`/goals/${goalId}`)
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

  test('404 delete goal failed cause not found', (done) => {
    request(app)
      .delete('/goals/99')
      .send(null)
      .set('Authorization', `Bearer ${userToken2}`)
      .then((response) => {
        const { body, status } = response;

        expect(status).toBe(404);
        expect(body).toHaveProperty('message', 'Goal Not Found');
        done();
      })
      .catch((err) => {
        done(err);
      });
  });

  test('200 success delete user activity', (done) => {
    request(app)
      .delete(`/goals/${goalId}`)
      .send(null)
      .set('Authorization', `Bearer ${userToken1}`)
      .then((response) => {
        const { body, status } = response;

        expect(status).toBe(200);
        expect(body).toHaveProperty('message', 'Goal deleted successfully');
        done();
      })
      .catch((err) => {
        done(err);
      });
  });
});
