// Runs before the app renders so a dark theme never flashes white.
// (Extension pages can't use inline scripts, so this lives in its own file.)
(function () {
  var t = localStorage.getItem('pagekit-theme');
  var dark = t === 'dark' || (t !== 'light' && matchMedia('(prefers-color-scheme: dark)').matches);
  if (dark) document.documentElement.classList.add('dark');
})();
