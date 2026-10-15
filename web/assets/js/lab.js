// The lab's small motions: headings that decode from noise, figures that
// count up, and the header's UTC clock. Under reduced motion only the clock runs.

(function () {
	const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	const glyphs = 'ΔΣΩ#%&/<>[]{}=+*01ABCDEFXYZ';

	function decode(el) {
		const text = el.textContent;
		el.setAttribute('aria-label', text);
		const start = performance.now();
		const length = 700;
		function frame(now) {
			const done = Math.min((now - start) / length, 1);
			const fixed = Math.floor(done * text.length);
			let out = text.slice(0, fixed);
			for (let i = fixed; i < text.length; i++) {
				out += text[i] === ' ' ? ' ' : glyphs[(Math.random() * glyphs.length) | 0];
			}
			el.textContent = out;
			if (done < 1) requestAnimationFrame(frame);
			else el.textContent = text;
		}
		requestAnimationFrame(frame);
	}

	function count(el) {
		const target = Number(el.textContent.replace(/[^0-9]/g, ''));
		if (!target) return;
		const start = performance.now();
		const length = 1100;
		function frame(now) {
			const done = Math.min((now - start) / length, 1);
			const eased = 1 - Math.pow(1 - done, 3);
			el.textContent = Math.round(target * eased).toLocaleString('en-GB');
			if (done < 1) requestAnimationFrame(frame);
		}
		requestAnimationFrame(frame);
	}

	if (!still && 'IntersectionObserver' in window) {
		const seen = new IntersectionObserver(function (entries) {
			entries.forEach(function (entry) {
				if (!entry.isIntersecting) return;
				seen.unobserve(entry.target);
				if (entry.target.hasAttribute('data-decode')) decode(entry.target);
				else count(entry.target);
			});
		});
		document.querySelectorAll('[data-decode], [data-count]').forEach((el) => seen.observe(el));
	}

	const clock = document.querySelector('[data-clock]');
	if (clock) {
		const tick = function () {
			clock.textContent = 'UTC ' + new Date().toISOString().slice(11, 19);
		};
		tick();
		setInterval(tick, 1000);
	}

	requestAnimationFrame(() => document.body.classList.add('is-booted'));
})();
