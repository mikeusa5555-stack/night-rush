import * as THREE from './three.module.min.js';

const PARKING_SPOT = new THREE.Vector3(8, 0, -10);

export function createParkingGame({ canvas, input, car, graphicsQuality, onUpdate, onComplete, onCollision }) {
	const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'low-power' });
	renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.4));
	renderer.outputColorSpace = THREE.SRGBColorSpace;
	renderer.toneMapping = THREE.ACESFilmicToneMapping;
	renderer.toneMappingExposure = 1.12;

	const scene = new THREE.Scene();
	scene.background = new THREE.Color('#11191b');
	scene.fog = new THREE.Fog('#172123', 38, 94);
	const camera = new THREE.PerspectiveCamera(56, 1, 0.1, 150);
	const hemisphere = new THREE.HemisphereLight('#dce9e3', '#37403a', 1.7);
	const sun = new THREE.DirectionalLight('#fff2d4', 2.15);
	sun.position.set(-10, 22, 12);
	sun.castShadow = true;
	sun.shadow.mapSize.set(1024, 1024);
	sun.shadow.camera.left = -28;
	sun.shadow.camera.right = 28;
	sun.shadow.camera.top = 30;
	sun.shadow.camera.bottom = -30;
	scene.add(hemisphere, sun);

	const materials = new Map();
	function material(color, options = {}) {
		const key = `${color}:${options.roughness ?? 0.8}:${options.metalness ?? 0}:${options.emissive ?? ''}`;
		if (!materials.has(key)) {
			materials.set(key, new THREE.MeshStandardMaterial({ color, roughness: options.roughness ?? 0.8, metalness: options.metalness ?? 0, emissive: options.emissive ?? '#000000', emissiveIntensity: options.emissiveIntensity ?? 1 }));
		}
		return materials.get(key);
	}

	function addBox(parent, size, position, paint, rotation = 0) {
		const mesh = new THREE.Mesh(new THREE.BoxGeometry(size[0], size[1], size[2]), paint);
		mesh.position.set(position[0], position[1], position[2]);
		mesh.rotation.y = rotation;
		mesh.castShadow = true;
		mesh.receiveShadow = true;
		parent.add(mesh);
		return mesh;
	}

	const ground = new THREE.Mesh(new THREE.PlaneGeometry(58, 68), material('#333b3a', { roughness: 1 }));
	ground.rotation.x = -Math.PI / 2;
	ground.position.y = -0.06;
	ground.receiveShadow = true;
	scene.add(ground);
	const grid = new THREE.GridHelper(54, 54, '#55615a', '#414a46');
	grid.position.y = -0.035;
	grid.material.transparent = true;
	grid.material.opacity = 0.2;
	scene.add(grid);

	const whiteLine = material('#c3c9bb', { roughness: 1 });
	const yellowLine = material('#d7bd69', { roughness: 1 });
	const greenLine = material('#d6fb4e', { emissive: '#7b9928', emissiveIntensity: 0.6, roughness: 0.65 });
	for (const rowZ of [-20, -3, 14]) {
		for (let x = -15; x <= 15; x += 4) {
			addBox(scene, [0.065, 0.018, 8.2], [x, 0.015, rowZ], whiteLine);
		}
		addBox(scene, [32, 0.018, 0.07], [0, 0.015, rowZ - 4.1], whiteLine);
		addBox(scene, [32, 0.018, 0.07], [0, 0.015, rowZ + 4.1], whiteLine);
	}

	const bayFill = new THREE.Mesh(new THREE.PlaneGeometry(3.25, 7.5), new THREE.MeshBasicMaterial({ color: '#a9ce38', transparent: true, opacity: 0.17, side: THREE.DoubleSide }));
	bayFill.rotation.x = -Math.PI / 2;
	bayFill.position.set(PARKING_SPOT.x, 0.025, PARKING_SPOT.z);
	scene.add(bayFill);
	addBox(scene, [0.1, 0.03, 7.5], [PARKING_SPOT.x - 1.63, 0.045, PARKING_SPOT.z], greenLine);
	addBox(scene, [0.1, 0.03, 7.5], [PARKING_SPOT.x + 1.63, 0.045, PARKING_SPOT.z], greenLine);
	addBox(scene, [3.35, 0.03, 0.1], [PARKING_SPOT.x, 0.045, PARKING_SPOT.z - 3.72], greenLine);
	const beacon = new THREE.Mesh(new THREE.TorusGeometry(1.4, 0.045, 7, 32), greenLine);
	beacon.rotation.x = Math.PI / 2;
	beacon.position.set(PARKING_SPOT.x, 0.065, PARKING_SPOT.z + 2.4);
	scene.add(beacon);

	const wallPaint = material('#293332', { roughness: 0.9 });
	const wallEdge = material('#d6fb4e', { emissive: '#536d18', emissiveIntensity: 0.3 });
	for (const x of [-23, 23]) {
		addBox(scene, [0.8, 1.4, 54], [x, 0.7, 0], wallPaint);
		addBox(scene, [0.82, 0.09, 54], [x, 1.42, 0], wallEdge);
	}
	for (const z of [-27, 27]) {
		addBox(scene, [46, 1.4, 0.8], [0, 0.7, z], wallPaint);
		addBox(scene, [46, 0.09, 0.82], [0, 1.42, z], wallEdge);
	}

	const glassPaint = material('#213438', { roughness: 0.25, metalness: 0.25 });
	const tirePaint = material('#111617', { roughness: 0.92 });
	const wheelHub = material('#9ba9a2', { roughness: 0.35, metalness: 0.75 });
	const headlight = material('#e3e2c5', { emissive: '#b7b778', emissiveIntensity: 1.5 });
	const taillight = material('#ed685b', { emissive: '#9e211b', emissiveIntensity: 1.3 });
	const collisionObjects = [];

	function buildCar(color, profile = {}) {
		const car = new THREE.Group();
		const paint = material(color, { roughness: 0.31, metalness: 0.58 });
		const trim = material('#182123', { roughness: 0.64, metalness: 0.18 });
		const bodyWidth = profile.body === 'rally' ? 1.05 : profile.body === 'sport' ? 0.96 : 1;
		const bodyLength = profile.body === 'rally' ? 1.04 : 1;
		const bodyShape = new THREE.Shape();
		bodyShape.moveTo(-0.61 * bodyWidth, -2.2 * bodyLength);
		bodyShape.quadraticCurveTo(-0.89 * bodyWidth, -2.15 * bodyLength, -0.95 * bodyWidth, -1.48 * bodyLength);
		bodyShape.lineTo(-1.01 * bodyWidth, 1.32 * bodyLength);
		bodyShape.quadraticCurveTo(-0.98 * bodyWidth, 1.98 * bodyLength, -0.69 * bodyWidth, 2.17 * bodyLength);
		bodyShape.quadraticCurveTo(0, 2.3 * bodyLength, 0.69 * bodyWidth, 2.17 * bodyLength);
		bodyShape.quadraticCurveTo(0.98 * bodyWidth, 1.98 * bodyLength, 1.01 * bodyWidth, 1.32 * bodyLength);
		bodyShape.lineTo(0.95 * bodyWidth, -1.48 * bodyLength);
		bodyShape.quadraticCurveTo(0.89 * bodyWidth, -2.15 * bodyLength, 0.61 * bodyWidth, -2.2 * bodyLength);
		bodyShape.quadraticCurveTo(0, -2.34 * bodyLength, -0.61 * bodyWidth, -2.2 * bodyLength);
		const body = new THREE.Mesh(new THREE.ExtrudeGeometry(bodyShape, { depth: 0.49, bevelEnabled: true, bevelSegments: 3, bevelSize: 0.07, bevelThickness: 0.1, steps: 1 }), paint);
		body.geometry.rotateX(Math.PI / 2);
		body.position.y = 1.17;
		body.castShadow = true;
		body.receiveShadow = true;
		car.add(body);
		addBox(car, [1.84 * bodyWidth, 0.13, 1.13], [0, 1.04, -1.36], paint);
		addBox(car, [1.78 * bodyWidth, 0.16, 0.95], [0, 1.02, 1.47], paint);
		addBox(car, [1.64 * bodyWidth, 0.62, 2.03], [0, 1.34, 0.04], glassPaint);
		addBox(car, [1.48 * bodyWidth, 0.12, 1.35], [0, 1.68, 0.1], paint);
		addBox(car, [1.48, 0.045, 0.62], [0, 1.42, -0.76], glassPaint, -0.38);
		addBox(car, [1.48, 0.045, 0.55], [0, 1.4, 0.86], glassPaint, 0.34);
		const frontWheels = [];
		const wheels = [];
		for (const side of [-1, 1]) {
			addBox(car, [0.035, 0.34, 0.82], [side * 0.825, 1.23, -0.08], material('#334c4e', { roughness: 0.3 }));
			addBox(car, [0.12, 0.12, 3.25], [side * 0.99, 0.48, 0], trim);
			for (const z of [-1.36, 1.34]) {
				const wheelRadius = profile.body === 'rally' ? 0.405 : 0.375;
				const wheelAssembly = new THREE.Group();
				wheelAssembly.position.set(side * 1.02, 0.4, z);
				const wheel = new THREE.Mesh(new THREE.CylinderGeometry(wheelRadius, wheelRadius, 0.29, 18), tirePaint);
				wheel.rotation.z = Math.PI / 2;
				wheel.userData.roll = 0;
				wheelAssembly.add(wheel);
				const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.19, 0.305, 16), wheelHub);
				hub.rotation.z = Math.PI / 2;
				wheelAssembly.add(hub);
				car.add(wheelAssembly);
				wheels.push(wheel);
				if (z < 0) frontWheels.push(wheelAssembly);
			}
		}
		car.userData.frontWheels = frontWheels;
		car.userData.wheels = wheels;
		for (const side of [-1, 1]) {
			addBox(car, [0.55, 0.12, 0.12], [side * 0.56, 0.83, -2.13], headlight);
			addBox(car, [0.5, 0.13, 0.12], [side * 0.58, 0.82, 2.13], taillight);
		}
		const wingWidth = profile.body === 'rally' ? 2.3 : profile.body === 'sport' ? 1.8 : 2.08;
		addBox(car, [wingWidth, 0.13, 0.29], [0, 1.16, 2.13], trim);
		addBox(car, [0.13, 0.31, 0.13], [-0.67, 0.99, 1.91], trim);
		addBox(car, [0.13, 0.31, 0.13], [0.67, 0.99, 1.91], trim);
		addBox(car, [0.1, 0.1, 0.52], [0, 0.76, -2.19], trim);
		if (profile.body === 'rally') {
			addBox(car, [0.52, 0.1, 0.32], [0, 1.75, -0.02], trim);
			for (const side of [-1, 1]) addBox(car, [0.3, 0.1, 0.16], [side * 0.64, 0.91, -2.17], headlight);
		}
		car.userData.profile = profile.id ?? 'traffic';
		return car;
	}

	function addParkedCar(x, z, color, rotation = 0) {
		const car = buildCar(color);
		car.position.set(x, 0, z);
		car.rotation.y = rotation;
		scene.add(car);
		collisionObjects.push({ x, z, radius: 2.45 });
	}

	addParkedCar(-13, -10, '#cb7359');
	addParkedCar(-1, -10, '#618a80');
	addParkedCar(14, -10, '#d0b655');
	addParkedCar(-13, 7, '#697eb0', Math.PI);
	addParkedCar(1, 7, '#c7c9be');
	addParkedCar(14, 7, '#b76860', Math.PI);

	const conePaint = material('#ec7357', { roughness: 0.7 });
	const coneBase = material('#e2dacc', { roughness: 0.9 });
	for (const [x, z] of [[-19, -18], [-19, 0], [-19, 18], [19, -18], [19, 0], [19, 18]]) {
		const cone = new THREE.Group();
		const base = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.08, 12), coneBase);
		base.position.y = 0.05;
		cone.add(base);
		const top = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.24, 0.62, 10), conePaint);
		top.position.y = 0.38;
		cone.add(top);
		cone.position.set(x, 0, z);
		scene.add(cone);
		collisionObjects.push({ x, z, radius: 0.45 });
	}

	const player = buildCar(car.color, car);
	player.position.set(-8, 0, 13);
	scene.add(player);

	let velocity = 0;
	let gear = 'D';
	let steeringValue = 0;
	let elapsed = 0;
	let holdTime = 0;
	let collisionCount = 0;
	let hitCooldown = 0;
	let cameraMode = 0;
	let paused = false;
	let running = false;
	let finished = false;
	let lastTime = 0;
	let frameId = 0;
	let currentQuality = graphicsQuality;

	function setQuality(quality) {
		currentQuality = quality === 'high' ? 'high' : 'low';
		renderer.setPixelRatio(currentQuality === 'high' ? Math.min(window.devicePixelRatio || 1, 1.55) : Math.min(window.devicePixelRatio || 1, 1));
		renderer.shadowMap.enabled = currentQuality === 'high';
		renderer.shadowMap.type = THREE.PCFSoftShadowMap;
		renderer.toneMappingExposure = currentQuality === 'high' ? 1.18 : 1.06;
		scene.traverse(object => {
			if (object.isMesh) {
				object.castShadow = currentQuality === 'high';
				object.receiveShadow = currentQuality === 'high';
			}
		});
		resize();
	}

	function resize() {
		const bounds = canvas.getBoundingClientRect();
		if (!bounds.width || !bounds.height) return;
		renderer.setSize(bounds.width, bounds.height, false);
		camera.aspect = bounds.width / bounds.height;
		camera.updateProjectionMatrix();
	}

	const resizeObserver = new ResizeObserver(resize);
	resizeObserver.observe(canvas.parentElement);
	window.addEventListener('resize', resize);

	function updateCamera(delta) {
		const follow = new THREE.Vector3(0, 5.2, 8.3).applyQuaternion(player.quaternion).add(player.position);
		if (cameraMode === 1) {
			camera.up.set(0, 0, -1);
			follow.set(player.position.x, 21, player.position.z + 0.01);
		} else {
			camera.up.set(0, 1, 0);
		}
		camera.position.lerp(follow, Math.min(1, delta * 4.2));
		const forward = new THREE.Vector3(-Math.sin(player.rotation.y), 0, -Math.cos(player.rotation.y));
		const aim = player.position.clone().addScaledVector(forward, cameraMode === 1 ? 0 : 2.4);
		aim.y = cameraMode === 1 ? 0 : 0.85;
		camera.lookAt(aim);
	}

	function sendUpdate(distance, progress) {
		onUpdate({ speed: Math.abs(velocity) * 3.6, gear, distance, progress });
	}

	function update(delta) {
		elapsed += delta;
		hitCooldown = Math.max(0, hitCooldown - delta);
		const previousX = player.position.x;
		const previousZ = player.position.z;
		if (input.brake) {
			if (velocity > 0.04) velocity = Math.max(0, velocity - 9 * delta);
			else if (velocity < -0.04) velocity = Math.min(0, velocity + 9 * delta);
			else velocity = 0;
		} else if (input.accelerate) {
			const direction = gear === 'R' ? -1 : 1;
			velocity = Math.max(-7.6, Math.min(7.6, velocity + direction * 5.2 * delta));
		} else {
			velocity *= Math.exp(-1.25 * delta);
			if (Math.abs(velocity) < 0.035) velocity = 0;
		}

		const steeringInput = Number(input.right) - Number(input.left);
		steeringValue += (steeringInput - steeringValue) * Math.min(1, delta * 7);
		const speedRatio = Math.min(1, Math.abs(velocity) / 7.6);
		const steeringAngle = steeringValue * (0.5 - speedRatio * 0.25);
		const previousHeading = player.rotation.y;
		const yawRate = -velocity / 2.75 * Math.tan(steeringAngle);
		const movementHeading = previousHeading + yawRate * delta * 0.5;
		player.rotation.y = Math.atan2(Math.sin(previousHeading + yawRate * delta), Math.cos(previousHeading + yawRate * delta));
		player.position.x -= Math.sin(movementHeading) * velocity * delta;
		player.position.z -= Math.cos(movementHeading) * velocity * delta;
		for (const wheel of player.userData.frontWheels) wheel.rotation.y = -steeringAngle;
		for (const wheel of player.userData.wheels) {
			wheel.userData.roll += velocity * delta / 0.375;
			wheel.rotation.y = wheel.userData.roll;
		}

		let collided = Math.abs(player.position.x) > 21 || Math.abs(player.position.z) > 25;
		for (const obstacle of collisionObjects) {
			if (Math.hypot(player.position.x - obstacle.x, player.position.z - obstacle.z) < obstacle.radius + 1.12) {
				collided = true;
				break;
			}
		}
		if (collided) {
			player.position.x = previousX;
			player.position.z = previousZ;
			velocity = 0;
			holdTime = 0;
			if (hitCooldown === 0) {
				collisionCount++;
				hitCooldown = 0.9;
				onCollision(collisionCount);
			}
		}

		const distance = Math.hypot(player.position.x - PARKING_SPOT.x, player.position.z - PARKING_SPOT.z);
		const angle = Math.atan2(Math.sin(player.rotation.y), Math.cos(player.rotation.y));
		const aligned = distance < 0.85 && Math.abs(angle) < 0.2 && Math.abs(velocity) < 0.32;
		holdTime = aligned ? holdTime + delta : Math.max(0, holdTime - delta * 1.5);
		sendUpdate(distance, holdTime);
		if (holdTime >= 2 && !finished) {
			finished = true;
			running = false;
			onComplete({ elapsed, hits: collisionCount });
		}
	}

	function animate(time) {
		if (!running) return;
		const delta = Math.min(0.04, (time - (lastTime || time)) / 1000);
		lastTime = time;
		if (!paused && !finished) update(delta);
		updateCamera(delta);
		renderer.render(scene, camera);
		frameId = requestAnimationFrame(animate);
	}

	function start() {
		cancelAnimationFrame(frameId);
		player.position.set(-8, 0, 13);
		player.rotation.y = 0;
		for (const wheel of player.userData.wheels) {
			wheel.userData.roll = 0;
			wheel.rotation.y = 0;
		}
		for (const wheel of player.userData.frontWheels) wheel.rotation.y = 0;
		velocity = 0;
		gear = 'D';
		steeringValue = 0;
		elapsed = 0;
		holdTime = 0;
		collisionCount = 0;
		hitCooldown = 0;
		finished = false;
		paused = false;
		running = true;
		cameraMode = 0;
		setQuality(currentQuality);
		resize();
		sendUpdate(Math.hypot(player.position.x - PARKING_SPOT.x, player.position.z - PARKING_SPOT.z), 0);
		lastTime = 0;
		frameId = requestAnimationFrame(animate);
	}

	return {
		carId: car.id,
		start,
		stop() { running = false; cancelAnimationFrame(frameId); },
		dispose() { running = false; cancelAnimationFrame(frameId); resizeObserver.disconnect(); window.removeEventListener('resize', resize); renderer.dispose(); },
		setPaused(value) { paused = value; },
		setQuality,
		toggleGear() { gear = gear === 'D' ? 'R' : 'D'; },
		toggleCamera() { cameraMode = 1 - cameraMode; },
		resize,
	};
}