// The wildlife tracker: follows one animal through its sightings, oldest
// first. It reads the sightings the page wrote out and drives the console; the
// tracker globe subscribes to the same state, so the console works without it.

const listeners = [];
const state = { animal: '', trail: [], step: 0 };

export function subscribe(fn) {
	listeners.push(fn);
	if (state.trail.length) fn(state);
}

const root = document.querySelector('[data-tracker]');

if (root) {
	const sightings = JSON.parse(document.getElementById('tracker-data')?.textContent || '[]').map(function (s) {
		return Object.assign({}, s, { time: s.time * 1000 });
	});

	const select = root.querySelector('select[name="animal"]');
	const range = root.querySelector('input[name="step"]');
	const play = root.querySelector('[data-action="play"]');
	const prev = root.querySelector('[data-action="prev"]');
	const next = root.querySelector('[data-action="next"]');
	const out = {
		step: root.querySelector('.tracker__step'),
		when: root.querySelector('.tracker__when'),
		where: root.querySelector('.tracker__where'),
		who: root.querySelector('.tracker__who'),
		open: root.querySelector('.tracker__open'),
		lock: document.querySelector('.tracker__lock'),
	};
	const stat = function (name) {
		return root.querySelector('[data-stat="' + name + '"]');
	};
	const date = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
	let timer = 0;

	function km(a, b) {
		const rad = Math.PI / 180;
		const dLat = (b.lat - a.lat) * rad;
		const dLng = (b.lng - a.lng) * rad;
		const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2;
		return 2 * 6371 * Math.asin(Math.sqrt(h));
	}

	function emit() {
		listeners.forEach((fn) => fn(state));
	}

	function show() {
		const s = state.trail[state.step];
		if (!s) return;
		range.value = state.step;
		out.step.textContent = 'Signal ' + (state.step + 1) + ' of ' + state.trail.length;
		out.when.textContent = date.format(s.time);
		out.where.textContent = s.place || 'Location unknown';
		out.who.textContent = 'Observer · ' + (s.observer || 'Unknown observer');
		out.open.setAttribute('href', '/specimens/' + encodeURIComponent(s.id));
		if (out.lock) out.lock.textContent = '◎ Lock · ' + state.animal + ' · ' + (state.step + 1) + '/' + state.trail.length;
		prev.disabled = state.step === 0;
		next.disabled = state.step === state.trail.length - 1;
		emit();
	}

	function track(animal) {
		stop();
		state.animal = animal;
		state.trail = sightings.filter((s) => s.animal === animal).sort((a, b) => a.time - b.time);
		state.step = 0;
		range.max = Math.max(state.trail.length - 1, 0);

		const t = state.trail;
		let distance = 0;
		for (let i = 1; i < t.length; i++) distance += km(t[i - 1], t[i]);
		stat('signals').textContent = t.length;
		stat('regions').textContent = new Set(t.map((s) => s.country).filter(Boolean)).size;
		stat('first').textContent = t.length ? date.format(t[0].time) : '–';
		stat('last').textContent = t.length ? date.format(t[t.length - 1].time) : '–';
		stat('distance').textContent = Math.round(distance).toLocaleString('en-GB') + ' km between signals';
		show();
	}

	function go(step) {
		state.step = Math.min(Math.max(step, 0), state.trail.length - 1);
		show();
	}

	function stop() {
		clearInterval(timer);
		timer = 0;
		play.setAttribute('aria-pressed', 'false');
		play.textContent = 'Play trail';
	}

	function start() {
		if (state.step >= state.trail.length - 1) go(0);
		play.setAttribute('aria-pressed', 'true');
		play.textContent = 'Pause';
		timer = setInterval(function () {
			if (state.step >= state.trail.length - 1) return stop();
			go(state.step + 1);
		}, 1600);
	}

	select.addEventListener('change', function () {
		track(select.value);
		history.replaceState(null, '', '?animal=' + encodeURIComponent(select.value));
	});
	range.addEventListener('input', function () {
		stop();
		go(Number(range.value));
	});
	prev.addEventListener('click', function () {
		stop();
		go(state.step - 1);
	});
	next.addEventListener('click', function () {
		stop();
		go(state.step + 1);
	});
	play.addEventListener('click', () => (timer ? stop() : start()));

	if (select.value) track(select.value);
}
