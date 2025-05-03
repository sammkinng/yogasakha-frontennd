// src/serviceWorkerRegistration.js

export function register() {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        const swUrl = `${import.meta.env.BASE_URL}service-worker.js`;
  
        navigator.serviceWorker.register(swUrl)
          .then(registration => {
            console.log('Service worker registered:', registration);
          })
          .catch(error => {
            console.error('Service worker registration failed:', error);
          });
      });
    }
  }
  