// script.js

// Récupérer le bouton et le champ de mot de passe
const togglePasswordButton = document.getElementById('togglePassword');
const passwordInput = document.getElementById('password');

// Ajouter un écouteur d'événements sur le bouton
togglePasswordButton.addEventListener('click', () => {
  // Vérifier le type actuel du champ
  const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
  passwordInput.setAttribute('type', type);

  // Changer le texte du bouton
  togglePasswordButton.textContent = type === 'password' ? 'Show' : 'Hide';
});
