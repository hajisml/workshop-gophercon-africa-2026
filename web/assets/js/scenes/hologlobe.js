// The holographic earth both globes share: a dark core, a rim of light,
// a lat/long grid and coastlines, built into a group for a scene to add.

export const R = 1.6;

export function hologlobe({ THREE, colour }) {
	const colours = {
		primary: colour('--three-primary', '#3df5ff'),
		accent: colour('--three-accent', '#ffb347'),
		line: colour('--three-line', '#1b6f7a'),
		core: colour('--three-core', '#06121c'),
	};

	const toVec = function (lat, lng, r) {
		const la = (lat * Math.PI) / 180;
		const lo = (lng * Math.PI) / 180;
		return new THREE.Vector3(r * Math.cos(la) * Math.sin(lo), r * Math.sin(la), r * Math.cos(la) * Math.cos(lo));
	};

	const group = new THREE.Group();

	// The solid core hides whatever is on the far side.
	group.add(new THREE.Mesh(new THREE.SphereGeometry(R, 64, 48), new THREE.MeshBasicMaterial({ color: colours.core })));

	// A rim of light around the edge, brighter where the surface turns away.
	group.add(
		new THREE.Mesh(
			new THREE.SphereGeometry(R * 1.12, 64, 48),
			new THREE.ShaderMaterial({
				uniforms: { glow: { value: colours.primary } },
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
	group.add(
		new THREE.LineSegments(
			new THREE.BufferGeometry().setFromPoints(grid),
			new THREE.LineBasicMaterial({ color: colours.line, transparent: true, opacity: 0.45 }),
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
			group.add(
				new THREE.LineSegments(
					new THREE.BufferGeometry().setFromPoints(coast),
					new THREE.LineBasicMaterial({ color: colours.primary, transparent: true, opacity: 0.8 }),
				),
			);
		})
		.catch(function (err) {
			console.warn('globe: coastlines not shown', err);
		});

	return { group, toVec, colours };
}

// A soft round dot, for point sprites.
export function dotTexture(THREE) {
	const dot = document.createElement('canvas');
	dot.width = dot.height = 64;
	const g = dot.getContext('2d');
	const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
	grad.addColorStop(0, 'rgba(255,255,255,1)');
	grad.addColorStop(0.25, 'rgba(255,255,255,0.85)');
	grad.addColorStop(1, 'rgba(255,255,255,0)');
	g.fillStyle = grad;
	g.fillRect(0, 0, 64, 64);
	return new THREE.CanvasTexture(dot);
}
