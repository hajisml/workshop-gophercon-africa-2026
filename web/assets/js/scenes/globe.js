// The holographic globe: a wireframe earth with a point of light per sighting.
// Points come from the page as [lat, lng] pairs, in the same order as the
// specimen cards, so point i is card i. Selecting one scrolls to its card.

import { mount } from '/assets/js/threejs.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const R = 1.6;

mount('globe', function ({ THREE, scene, camera, canvas, colour, still }) {
	const primary = colour('--three-primary', '#3df5ff');
	const accent = colour('--three-accent', '#ffb347');
	const line = colour('--three-line', '#1b6f7a');
	const core = colour('--three-core', '#06121c');

	const toVec = function (lat, lng, r) {
		const la = (lat * Math.PI) / 180;
		const lo = (lng * Math.PI) / 180;
		return new THREE.Vector3(r * Math.cos(la) * Math.sin(lo), r * Math.sin(la), r * Math.cos(la) * Math.cos(lo));
	};

	const globe = new THREE.Group();
	scene.add(globe);

	// The solid core hides the points on the far side.
	globe.add(new THREE.Mesh(new THREE.SphereGeometry(R, 64, 48), new THREE.MeshBasicMaterial({ color: core })));

	// A rim of light around the edge, brighter where the surface turns away.
	globe.add(
		new THREE.Mesh(
			new THREE.SphereGeometry(R * 1.12, 64, 48),
			new THREE.ShaderMaterial({
				uniforms: { glow: { value: primary } },
				vertexShader:
					'varying vec3 vN; varying vec3 vV; void main() { vec4 mv = modelViewMatrix * vec4(position, 1.0); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }',
				fragmentShader:
					'uniform vec3 glow; varying vec3 vN; varying vec3 vV; void main() { float f = pow(1.0 - abs(dot(vN, vV)), 3.0); gl_FragColor = vec4(glow, f * 0.55); }',
				side: THREE.BackSide,
				transparent: true,
				blending: THREE.AdditiveBlending,
				depthWrite: false,
			}),
		),
	);

	// Lines of latitude and longitude every 20°.
	const grid = [];
	for (let lat = -80; lat <= 80; lat += 20) {
		for (let lng = -180; lng < 180; lng += 4) grid.push(toVec(lat, lng, R * 1.002), toVec(lat, lng + 4, R * 1.002));
	}
	for (let lng = -180; lng < 180; lng += 20) {
		for (let lat = -88; lat < 88; lat += 4) grid.push(toVec(lat, lng, R * 1.002), toVec(lat + 4, lng, R * 1.002));
	}
	globe.add(
		new THREE.LineSegments(
			new THREE.BufferGeometry().setFromPoints(grid),
			new THREE.LineBasicMaterial({ color: line, transparent: true, opacity: 0.45 }),
		),
	);

	// Coastlines, if the outline data loads; the grid alone still reads as a globe.
	Promise.all([
		import('https://cdn.jsdelivr.net/npm/topojson-client@3/+esm'),
		fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/land-110m.json').then((r) => r.json()),
	])
		.then(function ([topojson, world]) {
			const mesh = topojson.mesh(world, world.objects.land);
			const coast = [];
			mesh.coordinates.forEach(function (ring) {
				for (let i = 1; i < ring.length; i++) {
					coast.push(toVec(ring[i - 1][1], ring[i - 1][0], R * 1.004), toVec(ring[i][1], ring[i][0], R * 1.004));
				}
			});
			globe.add(
				new THREE.LineSegments(
					new THREE.BufferGeometry().setFromPoints(coast),
					new THREE.LineBasicMaterial({ color: primary, transparent: true, opacity: 0.8 }),
				),
			);
		})
		.catch(function (err) {
			console.warn('globe: coastlines not shown', err);
		});

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

	const dot = document.createElement('canvas');
	dot.width = dot.height = 64;
	const g = dot.getContext('2d');
	const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
	grad.addColorStop(0, 'rgba(255,255,255,1)');
	grad.addColorStop(0.25, 'rgba(255,255,255,0.85)');
	grad.addColorStop(1, 'rgba(255,255,255,0)');
	g.fillStyle = grad;
	g.fillRect(0, 0, 64, 64);

	const geometry = new THREE.BufferGeometry();
	geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
	geometry.setAttribute('color', new THREE.BufferAttribute(colours, 3));
	const material = new THREE.PointsMaterial({
		size: 0.09,
		map: new THREE.CanvasTexture(dot),
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
