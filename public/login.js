document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = document.getElementById("name").value; // ✅ fixed: was "surname"
  const password = document.getElementById("password").value;
  const status = document.getElementById("status").value;

  try {
    const res = await fetch("/login", { // ✅ fixed: was "/api/login"
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, password, status }),
    });

    // If login fails (non-2xx), don't try to parse JSON
    if (!res.ok) {
      const error = await res.text();
      alert(error || "Login failed");
      return;
    }

    const data = await res.json();
    localStorage.setItem("user_id", data.user_id);
    localStorage.setItem("status", data.status);
    localStorage.setItem("name", data.name);

    window.location.href = data.status === "mentor" ? "/main.html" : "/main_mentee.html";
  } catch (err) {
    alert("Network error. Please try again.");
  }
});