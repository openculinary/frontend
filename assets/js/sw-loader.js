function registerServiceWorker() {
  if (!navigator.serviceWorker) return;
  navigator.serviceWorker.register('{{ .RelPermalink }}', {scope: '/'});
}
