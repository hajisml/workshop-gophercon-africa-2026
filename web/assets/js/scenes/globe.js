// The holographic globe: a wireframe earth with a point of light per sighting.
// Points come from the page as [lat, lng] pairs, in the same order as the
// specimen cards, so point i is card i. Selecting one scrolls to its card.

import { mount } from '/assets/js/threejs.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { R, hologlobe, dotTexture } from '/assets/js/scenes/hologlobe.js';

mount('globe', function ({ THREE, scene, camera, canvas, colour, still }) {
	const { group: globe, toVec, colours: palette } = hologlobe({ THREE, colour });
	const { primary, accent, core } = palette;
	scene.add(globe);

	// One point of light per sighting.
	const data = JSON.parse(document.getElementById('globe-points')?.textContent || '[]');
	const cards = Array.from(document.querySelectorAll('#specimen-list > li'));
	const positions = new Float32Array(data.length * 3);
	const colours = new Float32Array(data.length * 3);
	const normals = [];
	let visible = data.map(() => true);

	data.forEach(function ([lat, lng], i) {
		const v = toVec(lat, lng, R * 1.012);
		positions.set([v.x, v.y, v.z], i * 3);
		normals.push(v.clone().normalize());
	});

	function paint() {
		data.forEach(function (_, i) {
			const c = visible[i] ? primary : core;
			colours.set([c.r, c.g, c.b], i * 3);
		});
		points.geometry.attributes.color.needsUpdate = true;
	}

	const geometry = new THREE.BufferGeometry();
	geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
	geometry.setAttribute('color', new THREE.BufferAttribute(colours, 3));
	const material = new THREE.PointsMaterial({
		size: 0.09,
		map: dotTexture(THREE),
		vertexColors: true,
		transparent: true,
		blending: THREE.AdditiveBlending,
		depthWrite: false,
	});
	const points = new THREE.Points(geometry, material);
	globe.add(points);
	paint();

	document.addEventListener('filter:change', function (e) {
		if (e.detail.length === data.length) {
			visible = e.detail;
			paint();
		}
	});

	// A ring that marks the selected signal.
	const marker = new THREE.Mesh(
		new THREE.RingGeometry(0.06, 0.08, 32),
		new THREE.MeshBasicMaterial({ color: accent, side: THREE.DoubleSide, transparent: true, depthWrite: false }),
	);
	marker.visible = false;
	globe.add(marker);

	// An orbiting scan ring, tilted, for the hologram feel.
	const orbit = new THREE.Mesh(
		new THREE.TorusGeometry(R * 1.3, 0.004, 8, 160),
		new THREE.MeshBasicMaterial({ color: primary, transparent: true, opacity: 0.5 }),
	);
	orbit.rotation.x = Math.PI / 2.4;
	scene.add(orbit);

	// Start over Africa.
	camera.position.copy(toVec(4, 20, 5.2));
	camera.lookAt(0, 0, 0);

	const controls = new OrbitControls(camera, canvas);
	controls.enableZoom = false;
	controls.enablePan = false;
	controls.enableDamping = true;
	controls.autoRotate = !still;
	controls.autoRotateSpeed = 0.5;

	// Picking: the nearest visible point on the side facing the camera.
	const raycaster = new THREE.Raycaster();
	raycaster.params.Points.threshold = 0.05;
	const ndc = new THREE.Vector2();
	const readout = canvas.parentElement.querySelector('.globe__readout');

	function pick(e) {
		const rect = canvas.getBoundingClientRect();
		ndc.set(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
		raycaster.setFromCamera(ndc, camera);
		const toCamera = camera.position.clone().normalize();
		const hit = raycaster
			.intersectObject(points)
			.find((h) => visible[h.index] && normals[h.index].dot(toCamera) > 0.15);
		return hit ? hit.index : -1;
	}

	function describe(i) {
		const card = cards[i];
		if (!card) return '';
		return '▸ ' + (card.dataset.animal || 'Unknown') + (card.dataset.country ? ' · ' + card.dataset.country : '');
	}

	let hovered = -1;
	let selected = -1;
	let down = null;

	canvas.addEventListener('pointermove', function (e) {
		hovered = pick(e);
		canvas.style.cursor = hovered >= 0 ? 'pointer' : 'grab';
		if (readout) readout.textContent = hovered >= 0 ? describe(hovered) : selected >= 0 ? describe(selected) : '';
		controls.autoRotate = !still && hovered < 0 && selected < 0;
	});

	canvas.addEventListener('pointerdown', function (e) {
		down = { x: e.clientX, y: e.clientY };
	});

	canvas.addEventListener('pointerup', function (e) {
		if (!down || Math.hypot(e.clientX - down.x, e.clientY - down.y) > 5) return;
		const i = pick(e);
		if (i < 0) return;
		selected = i;
		marker.position.copy(normals[i]).multiplyScalar(R * 1.015);
		marker.lookAt(normals[i].clone().multiplyScalar(R * 2));
		marker.visible = true;
		controls.autoRotate = false;
		if (readout) readout.textContent = describe(i);

		const card = cards[i];
		if (!card) return;
		document.querySelectorAll('.specimen.is-targeted').forEach((el) => el.classList.remove('is-targeted'));
		const article = card.querySelector('.specimen');
		article.classList.add('is-targeted');
		article.scrollIntoView({ behavior: still ? 'auto' : 'smooth', block: 'center' });
	});

	return function (time) {
		controls.update();
		orbit.rotation.z = time * 0.15;
		material.size = 0.085 + Math.sin(time * 2.2) * 0.012;
		if (marker.visible) marker.scale.setScalar(1 + (Math.sin(time * 4) + 1) * 0.35);
	};
});
