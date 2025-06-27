document.addEventListener('DOMContentLoaded', function() {
  const slides = document.querySelectorAll('.slide');
  const dotsContainer = document.querySelector('.slider-dots');
  let currentIndex = 0;
  
  // Create dots
  slides.forEach((_, index) => {
    const dot = document.createElement('div');
    dot.classList.add('dot');
    if (index === 0) dot.classList.add('active');
    dot.addEventListener('click', () => goToSlide(index));
    dotsContainer.appendChild(dot);
  });
  
  const dots = document.querySelectorAll('.dot');
  
  // Auto slide
  const slideInterval = setInterval(nextSlide, 5000);
  
  function nextSlide() {
    goToSlide((currentIndex + 1) % slides.length);
  }
  
  function goToSlide(index) {
    slides[currentIndex].classList.remove('active');
    dots[currentIndex].classList.remove('active');
    
    currentIndex = index;
    
    slides[currentIndex].classList.add('active');
    dots[currentIndex].classList.add('active');
  }
  
  // Pause on hover
  const slider = document.querySelector('.slider-frame');
  slider.addEventListener('mouseenter', () => clearInterval(slideInterval));
  slider.addEventListener('mouseleave', () => {
    clearInterval(slideInterval);
    slideInterval = setInterval(nextSlide, 10000);
  });
});
// modal.js - Handles both About and Aide modals

// Wait for DOM to load
document.addEventListener('DOMContentLoaded', function() {
  // About modal functionality
  const aboutLink = document.getElementById('about-link');
  const aboutModal = document.getElementById('about-modal');
  
  if (aboutLink && aboutModal) {
    aboutLink.addEventListener('click', function(e) {
      e.preventDefault();
      aboutModal.style.display = 'block';
    });
  }

  // Aide modal functionality
  const aideLink = document.getElementById('aide-link');
  const aideModal = document.getElementById('aide-modal');
  
  if (aideLink && aideModal) {
    aideLink.addEventListener('click', function(e) {
      e.preventDefault();
      aideModal.style.display = 'block';
    });
  }

  // Close modal functionality for all modals
  document.querySelectorAll('.close-modal').forEach(btn => {
    btn.addEventListener('click', function() {
      this.closest('.modal').style.display = 'none';
    });
  });

  // Close when clicking outside modal content
  window.addEventListener('click', function(e) {
    if (e.target.classList.contains('modal')) {
      e.target.style.display = 'none';
    }
  });
});

document.getElementById('joinBtn1').addEventListener('click', () => {
    window.location.href = '/sign_in.html';
  });

  document.getElementById('bookBtn').addEventListener('click', () => {
    window.location.href = '/sign_in.html';
  });

  document.getElementById('joinBtn2').addEventListener('click', () => {
    window.location.href = '/sign_in.html';
  });

  document.getElementById('betStartedBtn').addEventListener('click', () => {
    window.location.href = '/sign_in.html';
  });



