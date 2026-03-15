// Simple test for backend auth route
const axios = require("axios");

async function testLogin() {
  try {
    const res = await axios.post("http://localhost:5001/api/auth/login", {
      email: "test@example.com",
      password: "wrongpassword",
    });
    console.log("Unexpected success:", res.data);
  } catch (err) {
    if (err.response) {
      console.log("Expected error:", err.response.data.message);
    } else {
      console.error("Network or other error:", err.message);
    }
  }
}

testLogin();
