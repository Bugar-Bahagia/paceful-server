const { describe, it, beforeAll, afterAll, expect } = require("@jest/globals");
const app = require("../app");
const request = require("supertest");


let token;

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

  it("failed updates the user's profile", async () => {
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

  it("failed to delete the user's account", async () => {
    const response = await request(app)
      .delete("/users/profile")
      .set("authorization", ``)
      .expect(401);

    expect(response.body).toHaveProperty( "message", "Invalid token");
  });
});
