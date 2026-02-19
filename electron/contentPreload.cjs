const { ipcRenderer, contextBridge } = require('electron');

contextBridge.exposeInMainWorld('orbitInternal', {
  sendScroll: (y) => ipcRenderer.send('viewport:scroll', y)
});

document.addEventListener('DOMContentLoaded', () => {
  const forms = document.querySelectorAll('form');
  forms.forEach(form => {
    form.addEventListener('submit', (e) => {
      const passwordField = form.querySelector('input[type="password"]');
      if (passwordField && passwordField.value) {
        // Simple heuristic to find username: look for text/email input before the password field
        const inputs = Array.from(form.querySelectorAll('input'));
        const passIndex = inputs.indexOf(passwordField);
        let username = '';
        
        // Look backwards from password field
        for (let i = passIndex - 1; i >= 0; i--) {
          const input = inputs[i];
          const type = input.type.toLowerCase();
          if ((type === 'text' || type === 'email') && input.value) {
            username = input.value;
            break;
          }
        }

        if (username && passwordField.value) {
          ipcRenderer.send('password-submitted', {
            url: window.location.href,
            username,
            password: passwordField.value
          });
        }
      }
    });
  });
});
