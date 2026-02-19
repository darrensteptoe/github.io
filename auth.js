const AUTH_USERNAME = "admin";
const AUTH_PASSWORD = "password";

function login() {
  const user = document.getElementById("username").value;
  const pass = document.getElementById("password").value;

  if (user === AUTH_USERNAME && pass === AUTH_PASSWORD) {
    document.getElementById("loginSection").style.display = "none";
    document.getElementById("app").style.display = "block";
  } else {
    document.getElementById("loginError").innerText = "Invalid credentials.";
  }
}
