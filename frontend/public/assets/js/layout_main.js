(function () {
    const replacement = '/assets/js/layout-loader.js';
    const existing = document.querySelector(`script[src="${replacement}"]`);

    if (existing) return;

    const script = document.createElement('script');
    script.src = replacement;
    document.head.appendChild(script);
})();
