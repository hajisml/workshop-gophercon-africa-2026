// The tracker globe: the tracked animal's sightings as points, joined in
// date order by an arcing trail that draws itself up to the current signal.

import { mount } from '/assets/js/threejs.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { R, hologlobe, dotTexture } from '/assets/js/scenes/hologlobe.js';
import { subscribe } from '/assets/js/tracker.js';

const ARC = 32;

mount('tracker', function ({ THREE, scene, camera, canvas, colour, still }) {
	const { group: globe, toVec, colours } = hologlobe({ THREE, colour });
	scene.add(globe);

	const trailMaterial = new THREE.LineBasicMaterial({ color: colours.accent, transparent: true, opacity: 0.9 });
	const pointMaterial = new THREE.PointsMaterial({
		size: 0.12,
		map: dotTexture(THREE),
		vertexColors: true,
		transparent: true,
		blending: THREE.AdditiveBlending,
		depthWrite: false,
	});
	let trail = null;
	let points = null;
	let normals = [];
	let drawn = 1;
	let target = 1;
	let animal = '';
	let step = 0;

	const marker = new THREE.Mesh(
		new THREE.RingGeometry(0.07, 0.095, 32),
		new THREE.MeshBasicMaterial({ color: colours.accent, side: THREE.DoubleSide, transparent: true, depthWrite: false }),
	);
	marker.visible = false;
	globe.add(marker);

	function rebuild(list) {
		[trail, points].forEach(function (obj) {
			if (!obj) return;
			globe.remove(obj);
			obj.geometry.dispose();
		});
		normals = list.map((s) => toVec(s.lat, s.lng, 1).normalize());

		// One continuous line: ARC points per hop, lifted off the surface by how far it goes.
		const path = normals.length ? [normals[0].clone().multiplyScalar(R * 1.01)] : [];
		for (let i = 1; i < normals.length; i++) {
			const a = normals[i - 1];
			const b = normals[i];
			const angle = a.angleTo(b);
			for (let j = 1; j <= ARC; j++) {
				const t = j / ARC;
				const v = new THREE.Vector3().copy(a).lerp(b, t).normalize();
				if (angle > Math.PI - 0.01) v.copy(a).applyAxisAngle(new THREE.Vector3(0, 1, 0), angle * t);
				path.push(v.multiplyScalar(R * (1.01 + Math.sin(Math.PI * t) * 0.25 * (angle / Math.PI))));
			}
		}
		trail = new THREE.Line(new THREE.BufferGeometry().setFromPoints(path), trailMaterial);
		globe.add(trail);

		const geometry = new THREE.BufferGeometry().setFromPoints(normals.map((n) => n.clone().multiplyScalar(R * 1.012)));
		geometry.setAttribute('color', new THREE.BufferAttribute(new Float32Array(normals.length * 3), 3));
		points = new THREE.Points(geometry, pointMaterial);
		globe.add(points);
		drawn = 1;
	}

	function paint() {
		if (!points) return;
		const attr = points.geometry.attributes.color;
		normals.forEach(function (_, i) {
			const c = i <= step ? colours.primary : colours.line;
			attr.setXYZ(i, c.r, c.g, c.b);
		});
		attr.needsUpdate = true;
	}

	camera.position.set(0, 0, 5.2);
	const controls = new OrbitControls(camera, canvas);
	controls.enableZoom = false;
	controls.enablePan = false;
	controls.enableDamping = true;
	let follow = true;
	controls.addEventListener('start', () => (follow = false));

	subscribe(function (s) {
		if (s.animal !== animal) {
			animal = s.animal;
			rebuild(s.trail);
		}
		step = s.step;
		target = 1 + ARC * step;
		if (still) drawn = target;
		follow = true;
		paint();
		const n = normals[step];
		marker.visible = Boolean(n);
		if (n) {
			marker.position.copy(n).multiplyScalar(R * 1.015);
			marker.lookAt(n.clone().multiplyScalar(R * 2));
			if (still) camera.position.copy(n).multiplyScalar(5.2);
		}
	});

	return function (time) {
		const n = normals[step];
		if (follow && n && !still) {
			camera.position.lerp(n.clone().multiplyScalar(5.2), 0.05).setLength(5.2);
			camera.lookAt(0, 0, 0);
		}
		controls.update();
		drawn += (target - drawn) * (still ? 1 : 0.08);
		if (trail) trail.geometry.setDrawRange(0, Math.max(1, Math.round(drawn)));
		if (marker.visible && !still) marker.scale.setScalar(1 + (Math.sin(time * 4) + 1) * 0.3);
	};
});
