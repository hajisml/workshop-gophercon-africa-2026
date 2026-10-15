// Narrows a list in place: a chip ticked or a word typed hides the items
// that don't match and counts those that do. Nothing is removed or
// re-rendered, so the page stays the page that was served.

(function () {
	document.querySelectorAll('form[data-filter]').forEach(function (form) {
		const list = document.getElementById(form.dataset.filter);
		if (!list) return;

		// Read every item once: thousands of dataset reads per keystroke drag.
		const items = Array.from(list.children, function (el) {
			return { el: el, data: Object.assign({}, el.dataset) };
		});
		const search = form.querySelector('input[type="search"]');
		const count = form.querySelector('.filter__count');
		const empty = list.parentElement.querySelector('.no-match');
		let frame = 0;

		function selected() {
			const groups = {};
			form.querySelectorAll('input:checked').forEach(function (box) {
				(groups[box.name] = groups[box.name] || []).push(box.value);
			});
			return groups;
		}

		function matches(data, groups, query) {
			for (const key in groups) {
				if (!groups[key].includes(data[key])) return false;
			}
			return !query || (data.search || '').includes(query);
		}

		function apply() {
			frame = 0;
			const groups = selected();
			const query = search ? search.value.trim().toLowerCase() : '';
			let shown = 0;
			const visible = items.map(function (item) {
				const show = matches(item.data, groups, query);
				item.el.hidden = !show;
				if (show) shown++;
				return show;
			});
			if (count) count.textContent = shown === items.length ? items.length + ' specimens' : shown + ' of ' + items.length + ' specimens';
			if (empty) empty.hidden = shown !== 0;
			// The globe listens, to dim the points that are filtered out.
			document.dispatchEvent(new CustomEvent('filter:change', { detail: visible }));
		}

		// One pass per frame, however fast they type or tick.
		function schedule() {
			if (!frame) frame = requestAnimationFrame(apply);
		}

		form.addEventListener('input', schedule);
		// The fields clear after this event fires, so the pass waits for the frame.
		form.addEventListener('reset', schedule);
		form.addEventListener('submit', function (e) {
			e.preventDefault();
		});
		form.hidden = false;
		apply();
	});
})();
