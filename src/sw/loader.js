import { Workbox } from 'workbox-window';

window.addEventListener('DOMContentLoaded', () => {
  if ('serviceWorker' in navigator) {
    const wb = new Workbox('sw.js');
    wb.addEventListener('waiting', () => {
      var shouldUpdate = confirm('A new version of RecipeRadar is available.  Would you like to update to the latest version?');
      if (shouldUpdate) {
        wb.addEventListener('controlling', () => {
          window.location.reload();
        });
        wb.messageSkipWaiting();
      }
    });
    wb.register();
  }
});
