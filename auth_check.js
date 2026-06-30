if (!localStorage.getItem('px_username')) window.location.href = 'login.html';
function logout() { localStorage.clear(); window.location.href = 'login.html'; }
