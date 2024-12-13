require("dotenv").config();
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const app = express();
const pool = require("../API/config/database");
const cors = require("cors");

app.use(express.json());
app.use(cors());

// Registration API
app.post("/api/registration", async (req, res) => {
  // Validate the incoming JSON data
  const { username, password } = req.body;
  console.log(req.body);
  if (!username.trim() || !password.trim()) {
    return res.status(400).send("Please enter valid credentials.");
  }

  try {
    // Check if the username already exists (case-insensitive comparison)
    const checkQuery = `
      SELECT * FROM weather_user
      WHERE LOWER(username) = LOWER($1);
    `;
    const checkResult = await pool.query(checkQuery, [username]);

    // If username already exists, send a message indicating that
    if (checkResult.rows.length > 0) {
      return res
        .status(409)
        .send({ message: "Username already exists, Try with different name." });
    }

    // Encrypt the user's password
    const encryptedPassword = await bcrypt.hash(password, 10);
    const values = [username, encryptedPassword];

    // If username doesn't exist, proceed with creating the new user
    const insertQuery = `
        INSERT INTO weather_user (username,password_hash)
        VALUES ($1, $2)
        RETURNING id;
      `;

    // Query Execute
    const result = await pool.query(insertQuery, values);

    // Generate JWT token
    const token = jwt.sign(
      { userId: result.rows[0].id },
      process.env.JWT_SECRET
    );

    res
      .status(201)
      .send({ message: "New user created", userId: result.rows[0].id, token });
  } catch (err) {
    console.error(err);
    res.status(500).send("Some error has occurred");
  }
});

// Login API
app.post("/api/login", async (req, res) => {
  // Extract username and password from request body
  const { username, password } = req.body;

  try {
    // Query the database to find the user with the provided username
    const query = `
        SELECT * FROM weather_user
        WHERE LOWER(username) = LOWER($1);
      `;
    const { rows } = await pool.query(query, [username]);

    // Check if user with provided username exists
    if (rows.length === 0) {
      return res.status(401).send({ message: "Invalid username or password" });
    }

    // Verify the password
    const user = rows[0];
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      return res.status(401).send({ message: "Invalid username or password" });
    }

    // If username and password are valid, generate a JWT token
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET);

    // Send the token in the response
    res.status(200).send({ message: "Authorized", token });
  } catch (error) {
    console.error(error);
    res.status(500).send("Some error has occurred");
  }
});

// Logout
app.post("/api/logout", async (req, res) => {
  res.status(200).send({ message: "Logout successful" });
});

module.exports = app;
