const { describe, it, beforeAll, afterAll, expect } = require("@jest/globals");
const app = require("../app");
const request = require("supertest");
const { sequelize } = require('../models');
const { queryInterface } = sequelize;
const redis = require('../config/redis.js');
const deleteAllRedis = require('../helpers/deleteAllRedis.js');

let token;
const invalidToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NywiZW1haWwiOiJRaWx1bmdAbWFpbC5jb20iLCJpYXQiOjE3MzI4MzgwNTR9.iyOP-gZm0sRWfkvLZcXX9AP018gyJqPXFBaW1Di6B2A'

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

beforeAll(async () => {
  
  await request(app)
    .post("/auth/register")
    .send({
      name: "shaqila",
      email: "shaqila@mail.com",
      dateOfBirth: "2000-03-20",
      password: "123456",
    })
    .expect(201);

  
  const response = await request(app)
    .post("/auth/login")
    .send({
      email: "shaqila@mail.com",
      password: "123456",
    })
    .expect(200);

  token = response.body.access_token;
  expect(typeof token).toBe("string");
});


describe("User Endpoints /users/profile", () => {
  it("success GET users/profile", async () => {
    const response = await request(app)
      .get("/users/profile")
      .set("authorization", `Bearer ${token}`)
      .expect(200);

    expect(response.body).toHaveProperty("data");
    expect(typeof response.body.data).toBe("object");
  });

  it("failed GET users/profile because token is invalid", async () => {
    const response = await request(app)
      .get("/users/profile")
      .set("authorization", `Bearer ${invalidToken}`)
      .expect(401);

      expect(response.body).toHaveProperty("message", "Invalid token");
  });

  it("failed GET users/profile because there's no token", async () => {
    const response = await request(app)
      .get("/users/profile")
      .expect(401);

    expect(response.body).toHaveProperty("message", "Invalid token");
  });

  it("successfully updates the user's profile", async () => {
    const response = await request(app)
      .put("/users/profile")
      .set("authorization", `Bearer ${token}`)
      .send({
        name: "Updated Name",
        dateOfBirth: "1990-01-01",
        email: "updatedemail@mail.com",
      })
      .expect(200);

    expect(response.body).toHaveProperty("message", "Your Profile has been updated");
    expect(response.body.data).toHaveProperty("name");
    expect(response.body.data).toHaveProperty("dateOfBirth");
    expect(response.body).toHaveProperty("emailuser");
  });

  it("failed updates the user's profile because there's no token", async () => {
    const response = await request(app)
      .put("/users/profile")
      .set("authorization", ``)
      .send({
        name: "Updated Name",
        dateOfBirth: "1990-01-01",
        email: "updatedemail@mail.com",
      })
      .expect(401);

      expect(response.body).toHaveProperty("message", "Invalid token")
  });

  it("failed updates the user's profile because user's email is in invalid format", async () => {
    const response = await request(app)
      .put("/users/profile")
      .set("authorization", `Bearer ${token}`)
      .send({
        name: "Updated Name",
        dateOfBirth: "1990-01-01",
        email: "updatedemail.com",
      })
      .expect(400);

      expect(response.body).toHaveProperty("message", "Invalid email format")
  });

  it("failed updates the user's profile because user's name is empty", async () => {
    const response = await request(app)
      .put("/users/profile")
      .set("authorization", `Bearer ${token}`)
      .send({
        name: "",
        dateOfBirth: "1990-01-01",
        email: "updatedemail.com",
      })
      .expect(400);

      expect(response.body).toHaveProperty("message", "Name cannot be empty")
  });

  it("failed updates the user's profile because user's date Of Birth is empty", async () => {
    const response = await request(app)
      .put("/users/profile")
      .set("authorization", `Bearer ${token}`)
      .send({
        name: "updated name",
        dateOfBirth: "",
        email: "updatedemail.com",
      })
      .expect(400);

      expect(response.body).toHaveProperty("message", "Date of birth cannot be empty")
  });

  it("failed updates the user's profile because token is invalid", async () => {
    const response = await request(app)
      .put("/users/profile")
      .set("authorization", `Bearer ${invalidToken}`)
      .send({
        name: "Updated Name",
        dateOfBirth: "1990-01-01",
        email: "updatedemail@mail.com",
      })
      .expect(401);

      expect(response.body).toHaveProperty("message", "Invalid token")
  });

  it("successfully deletes the user's account", async () => {
    const response = await request(app)
      .delete("/users/profile")
      .set("authorization", `Bearer ${token}`)
      .expect(200);

    expect(response.body).toHaveProperty(
      "message",
      "Your account has been deleted successfully"
    );
  });

  it("failed to delete the user's account because there's no token", async () => {
    const response = await request(app)
      .delete("/users/profile")
      .set("authorization", ``)
      .expect(401);

    expect(response.body).toHaveProperty( "message", "Invalid token");
  });

  it("failed to delete the user's account because token is invalid", async () => {
    const response = await request(app)
      .delete("/users/profile")
      .set("authorization", `Bearer ${invalidToken}`)
      .expect(401);

    expect(response.body).toHaveProperty( "message", "Invalid token");
  });
});