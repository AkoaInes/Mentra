document.addEventListener('DOMContentLoaded', async () => {
  const status = localStorage.getItem("status");
  if (status !== 'mentee') {
    alert("Only mentees can access this page.");
    window.location.href = '/main.html'; // Or redirect appropriately
    return;
  }

  // existing mentor card loading logic...
});

document.addEventListener('DOMContentLoaded', async () => {
  const mentorsGrid = document.getElementById('mentorsGrid');

  try {
    const res = await fetch('/api/available-mentors');
    const mentors = await res.json();

    mentors.forEach(mentor => {
      const card = document.createElement('div');
      card.className = 'mentor-card';

      const img = document.createElement('img');
      img.className = 'mentor-image';
      img.src = mentor.profile_img ? `/images/${mentor.profile_img}` : '/images/default_profile.jpg';
      img.alt = `${mentor.name} ${mentor.surname}`;

      const name = document.createElement('div');
      name.className = 'mentor-name';
      name.textContent = `${mentor.name} ${mentor.surname}`;

      const course = document.createElement('div');
      course.className = 'mentor-course';
      course.textContent = `Course: ${mentor.course}`;

      const level = document.createElement('div');
      level.className = 'mentor-level';
      level.textContent = `Level: ${mentor.level}`;

      const button = document.createElement('button');
      button.className = 'request-btn';
      button.textContent = 'Request mentor';
      button.addEventListener('click', () => {
        sendMentorshipRequest(mentor.id);
      });

      card.appendChild(img);
      card.appendChild(name);
      card.appendChild(course);
      card.appendChild(level);
      card.appendChild(button);

      mentorsGrid.appendChild(card);
    });
  } catch (err) {
    console.error('Error loading mentors:', err);
    mentorsGrid.textContent = 'Failed to load mentors. Try again later.';
  }
});

async function sendMentorshipRequest(mentorId) {
  const menteeId = localStorage.getItem("user_id");

  try {
    const res = await fetch('/api/send-request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mentor_id: mentorId, mentee_id: menteeId })
    });

    const result = await res.json();

    if (res.ok) {
      alert(result.message);
    } else {
      alert(result.error || 'Request failed');
    }
  } catch (err) {
    alert('Network error. Please try again.');
  }
}