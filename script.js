document.addEventListener('DOMContentLoaded', () => {
    const mentorContainer = document.getElementById('mentorContainer');
    const searchInput = document.getElementById('searchInput');

    // Fetch data from server
    fetch('/mentors')
        .then(response => response.json())
        .then(mentors => {
            renderMentors(mentors);

            // Search functionality
            searchInput.addEventListener('input', () => {
                const searchTerm = searchInput.value.toLowerCase();
                const filtered = mentors.filter(mentor =>
                    mentor.name.toLowerCase().includes(searchTerm) ||
                    mentor.title.toLowerCase().includes(searchTerm)
                );
                renderMentors(filtered);
            });
        })
        .catch(err => console.error('Error fetching data:', err));

    function renderMentors(mentors) {
        mentorContainer.innerHTML = ''; // Clear previous results
        mentors.forEach(mentor => {
            const card = document.createElement('div');
            card.classList.add('mentor-card');

            const img = document.createElement('img');
            img.src = mentor.image; // Ensure these images are accessible
            img.alt = mentor.name;

            const name = document.createElement('h2');
            name.textContent = mentor.name;

            const title = document.createElement('p');
            title.textContent = mentor.title;

            const button = document.createElement('button');
            button.textContent = 'View more'

            card.appendChild(img);
            card.appendChild(name);
            card.appendChild(title);
            card.appendChild(button);

            mentorContainer.appendChild(card);
        });
    }
});
