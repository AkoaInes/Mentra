const form = document.getElementById('registerForm');

form.addEventListener('submit', async function(event) {
  event.preventDefault();

  const name = document.getElementById('name').value;
  const surname = document.getElementById('surname').value;
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const confirmPassword = document.getElementById('confirm_password').value;

  if (password !== confirmPassword) {
    alert("Passwords do not match.");
    return;
  }

  try {
    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, surname, email, password })
    });

    const data = await res.json();

    if (res.ok) {
      alert("Registration successful! Please log in.");
      window.location.href = "/login.html";
    } else {
      alert(data.error || "An error occurred.");
    }
  } catch (err) {
    alert("Network error. Try again later.");
  }
});