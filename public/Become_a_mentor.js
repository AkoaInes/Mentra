        // Initialisation des particules
        particlesJS('particles-js', {
            particles: {
                number: { value: 80, density: { enable: true, value_area: 800 } },
                color: { value: '#ffffff' },
                shape: { type: 'circle' },
                opacity: { value: 0.5, random: true },
                size: { value: 3, random: true },
                line_linked: { enable: true, distance: 150, color: '#ffffff', opacity: 0.4, width: 1 },
                move: { enable: true, speed: 2, direction: 'none', random: true }
            },
            interactivity: {
                detect_on: 'canvas',
                events: { onhover: { enable: true, mode: 'repulse' }, onclick: { enable: true, mode: 'push' } },
                modes: { repulse: { distance: 100 }, push: { particles_nb: 4 } }
            },
            retina_detect: true
        });

        // Animations GSAP
        gsap.from('.section-title', { opacity: 0, y: -50, duration: 1, delay: 0.2 });
        gsap.from('.form-group', {
            opacity: 0,
            x: (index) => index % 2 === 0 ? -50 : 50,
            duration: 0.8,
            stagger: 0.2,
            delay: 0.5
        });
        gsap.from('.btn', { opacity: 0, scale: 0.8, duration: 0.8, delay: 1 });

        // Afficher le champ "Autres matières" si "Autre" est coché
        document.getElementById('subject-other').addEventListener('change', (e) => {
            const otherSubjectGroup = document.getElementById('other-subject-group');
            if (e.target.checked) {
                gsap.to(otherSubjectGroup, { height: 'auto', opacity: 1, duration: 0.5 });
                otherSubjectGroup.style.display = 'block';
            } else {
                gsap.to(otherSubjectGroup, { height: 0, opacity: 0, duration: 0.5, onComplete: () => {
                    otherSubjectGroup.style.display = 'none';
                }});
            }
        });

        // Gestion du formulaire
        document.getElementById('mentor-application-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const name = document.getElementById('full-name').value.trim();
  const surname = document.getElementById('surname').value.trim();
  const password = document.getElementById('student-id').value;
  const email = document.getElementById('email').value.trim();
  const level = document.getElementById('level').value;
  
  const selectedSubjects = Array.from(document.querySelectorAll('input[name="subjects"]:checked')).map(input => input.value);
  const otherSubject = document.getElementById('other-subject').value.trim();
  if (otherSubject) selectedSubjects.push(otherSubject);
  
  const course = selectedSubjects.join(', ');

  if (!name || !surname || !password || !email || !level || selectedSubjects.length === 0) {
    alert('Please fill in all required fields.');
    return;
  }

  try {
    const res = await fetch('/api/register-mentor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, surname, password, email, level, course })
    });

    const data = await res.json();
    if (res.ok) {
      alert('Mentor registered successfully!');
      document.getElementById('mentor-application-form').reset();
      document.getElementById('other-subject-group').style.display = 'none';
      window.location.href = '/login.html';
    } else {
      alert(data.error || 'Registration failed');
    }
  } catch (error) {
    alert('Server error. Try again later.');
  }
});