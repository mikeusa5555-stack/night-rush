const canvas = document.querySelector('#game-canvas');
const parkingCanvas = document.querySelector('#parking-canvas');
const ctx = canvas.getContext('2d', { alpha: false });
const stage = document.querySelector('.game-stage');
const hud = document.querySelector('#race-hud');
const parkingHud = document.querySelector('#parking-hud');
const startScreen = document.querySelector('#start-screen');
const resultScreen = document.querySelector('#result-screen');
const pauseScreen = document.querySelector('#pause-screen');
const touchControls = document.querySelector('#touch-controls');
const parkingControls = document.querySelector('#parking-controls');
const homeButton = document.querySelector('#home-button');
const carCatalog = [
	{ id: 'nova-gt', name: 'NOVA GT', category: 'TRACK COUPE · AWD', sprite: 'car-m3-inspired.svg', color: '#d4dad2', body: 'coupe', speed: 84, grip: 76 },
	{ id: 'apex-r', name: 'APEX R', category: 'STREET SPORT · RWD', sprite: 'car-apex.svg', color: '#ed795c', body: 'sport', speed: 92, grip: 72 },
	{ id: 'vanta-rs', name: 'VANTA RS', category: 'RALLY SEDAN · AWD', sprite: 'car-vanta.svg', color: '#628bc0', body: 'rally', speed: 79, grip: 91 },
	{ id: 'pulse-xt', name: 'PULSE XT', category: 'NEON GT · AWD', sprite: 'car-pulse.svg', color: '#69f0c3', body: 'hyper', speed: 96, grip: 82 },
	{ id: 'ember-s', name: 'EMBER S', category: 'DRIFT SPEC · RWD', sprite: 'car-ember.svg', color: '#ff8c5a', body: 'drift', speed: 88, grip: 94 },
	{ id: 'kestrel-x', name: 'KESTREL X', category: 'AERO GT · AWD', sprite: 'car-kestrel.svg', color: '#9bb7ff', body: 'aero', speed: 95, grip: 88 },
	{ id: 'rift-gt', name: 'RIFT GT', category: 'EXOTIC · AWD', sprite: 'car-rift.svg', color: '#ff91d9', body: 'exotic', speed: 99, grip: 86 },
	{ id: 'omega-z', name: 'OMEGA Z', category: 'GRAND TOURER · RWD', sprite: 'car-omega.svg', color: '#dfe6d8', body: 'tourer', speed: 90, grip: 93 },
];
const playerCarModel = new Image();
const introFlash = document.querySelector('#intro-flash');
let selectedCarIndex = Math.max(0, carCatalog.findIndex(car => car.id === localStorage.getItem('nightrun-car')));
let graphicsQuality = localStorage.getItem('nightrun-graphics') === 'high' ? 'high' : 'low';
playerCarModel.src = carCatalog[selectedCarIndex].sprite;
const input = { left: false, right: false, nitro: false, accelerate: false, brake: false };
const state = {
	mode: 'menu', time: 0, distance: 0, speed: 0, maxSpeed: 0, playerX: 0,
	nitro: 1, nitroActive: false, roadScroll: 0, spawnTimer: 0, shake: 0,
	traffic: [], particles: [], lastFrame: 0, width: 0, height: 0, dpr: 1,
};

const lanes = [-0.29, -0.1, 0.1, 0.29];
const colors = ['#e86a54', '#60b3a5', '#d7d9ce', '#d7b851', '#6874bd'];
const bestNode = document.querySelector('#best-score');
const menuBestNode = document.querySelector('#menu-best');
let best = Number(localStorage.getItem('nightrun-best') || 0);
let soundEnabled = false;
let audioContext;
let selectedMode = 'street';
let parkingGame;

function formatScore(value) { return Math.floor(value).toString().padStart(6, '0'); }

function updateBest() {
	const formatted = formatScore(best);
	bestNode.textContent = formatted;
	menuBestNode.textContent = formatted;
}

function triggerIntroFlash() {
	if (!introFlash) return;
	introFlash.classList.remove('is-visible');
	void introFlash.offsetWidth;
	introFlash.classList.add('is-visible');
}

function updateGarage() {
	const car = carCatalog[selectedCarIndex];
	playerCarModel.src = car.sprite;
	document.querySelector('#car-preview').src = car.sprite;
	document.querySelector('#showcase-car').src = car.sprite;
	document.querySelector('#car-preview').alt = `${car.name} avtomobili yuqoridan ko'rinishi`;
	document.querySelector('#showcase-car').alt = `${car.name} showcase`;
	document.querySelector('#car-index').textContent = `GARAGE / ${String(selectedCarIndex + 1).padStart(2, '0')}`;
	document.querySelector('#car-name').textContent = car.name;
	document.querySelector('#car-category').textContent = car.category;
	document.querySelector('#car-speed-stat').style.setProperty('--stat', car.speed / 100);
	document.querySelector('#car-grip-stat').style.setProperty('--stat', car.grip / 100);
	document.querySelector('.cinematic-showcase').style.setProperty('--accent', car.color);
	const garage = document.querySelector('.garage-readout');
	garage.querySelector('small').textContent = car.category;
	garage.querySelector('strong').textContent = car.name;
}

function selectCar(change) {
	selectedCarIndex = (selectedCarIndex + change + carCatalog.length) % carCatalog.length;
	localStorage.setItem('nightrun-car', carCatalog[selectedCarIndex].id);
	updateGarage();
}

function setGraphicsQuality(quality) {
	graphicsQuality = quality === 'high' ? 'high' : 'low';
	localStorage.setItem('nightrun-graphics', graphicsQuality);
	for (const button of document.querySelectorAll('[data-quality]')) {
		button.setAttribute('aria-pressed', String(button.dataset.quality === graphicsQuality));
	}
	resize();
	parkingGame?.setQuality(graphicsQuality);
}

function resize() {
	const bounds = stage.getBoundingClientRect();
	state.width = bounds.width;
	state.height = bounds.height;
	state.dpr = graphicsQuality === 'high'
		? Math.min(window.devicePixelRatio || 1, 1.7)
		: Math.min(window.devicePixelRatio || 1, 1);
	canvas.width = Math.round(bounds.width * state.dpr);
	canvas.height = Math.round(bounds.height * state.dpr);
	canvas.style.width = `${bounds.width}px`;
	canvas.style.height = `${bounds.height}px`;
	ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
}

function roadGeometry(y) {
	const progress = Math.max(0, Math.min(1, y / state.height));
	const horizon = state.height * 0.26;
	const perspective = Math.pow(progress, 1.45);
	const roadWidth = state.width * (0.11 + perspective * 0.74);
	const center = state.width * 0.54 + Math.sin(state.time * 0.12 + progress * 2.8) * state.width * 0.025 * perspective;
	return { center, roadWidth, horizon, perspective };
}

function polygon(points, fill) {
	ctx.fillStyle = fill;
	ctx.beginPath();
	ctx.moveTo(points[0][0], points[0][1]);
	for (let i = 1; i < points.length; i++) ctx.lineTo(points[i][0], points[i][1]);
	ctx.closePath();
	ctx.fill();
}

function drawBuilding(x, baseY, width, height, index) {
	const colorsForBlocks = ['#182321', '#1b2222', '#202421', '#1b2020', '#1f2529'];
	const roof = index % 3 === 0 ? '#d6fb4e' : '#89e7d2';
	ctx.fillStyle = colorsForBlocks[index % colorsForBlocks.length];
	ctx.fillRect(x, baseY - height, width, height);
	ctx.fillStyle = 'rgba(255,255,255,.06)';
	ctx.fillRect(x + 4, baseY - height + 8, Math.max(8, width - 10), 5);
	ctx.fillStyle = index % 3 === 0 ? 'rgba(214,251,78,.35)' : 'rgba(129,197,183,.27)';
	const cols = Math.max(1, Math.floor(width / 13));
	const rows = Math.max(1, Math.floor(height / 15));
	for (let col = 0; col < cols; col++) {
		for (let row = 0; row < rows; row++) {
			if ((col * 3 + row * 5 + index) % 4 === 0) continue;
			ctx.fillRect(x + 5 + col * 13, baseY - height + 8 + row * 15, 3, 5);
		}
	}
	ctx.fillStyle = roof;
	ctx.fillRect(x + width * 0.18, baseY - height - 4, Math.max(10, width * 0.64), 3);
}

function drawBackground() {
	const { width, height } = state;
	const horizon = height * 0.28;
	const sky = ctx.createLinearGradient(0, 0, 0, horizon + 70);
	sky.addColorStop(0, '#111b20');
	sky.addColorStop(1, '#35403b');
	ctx.fillStyle = sky;
	ctx.fillRect(0, 0, width, height);
	ctx.fillStyle = '#d6fb4e';
	ctx.globalAlpha = 0.72;
	ctx.beginPath();
	ctx.arc(width * 0.73, height * 0.15, Math.min(width, height) * 0.027, 0, Math.PI * 2);
	ctx.fill();
	ctx.globalAlpha = 1;

	const blockScroll = (state.roadScroll * 0.12) % 90;
	const detail = graphicsQuality === 'high' ? 25 : 15;
	for (let i = 0; i < detail; i++) {
		const y = horizon - 3 + i * (graphicsQuality === 'high' ? 7 : 10) + blockScroll;
		if (y < -10 || y > height * 0.56) continue;
		const scale = Math.max(0.16, (y - horizon + 65) / 180);
		const leftW = (30 + (i * 17) % 50) * scale;
		const rightW = (27 + (i * 23) % 57) * scale;
		drawBuilding(width * 0.5 - width * 0.13 - leftW, y, leftW, (40 + (i * 31) % 75) * scale, i);
		drawBuilding(width * 0.5 + width * 0.13, y, rightW, (36 + (i * 19) % 88) * scale, i + 3);
	}
}

function drawRoad() {
	const { width, height } = state;
	const top = height * 0.26;
	const topGeo = roadGeometry(top);
	const bottomGeo = roadGeometry(height);
	polygon([[topGeo.center - topGeo.roadWidth / 2, top], [topGeo.center + topGeo.roadWidth / 2, top], [bottomGeo.center + bottomGeo.roadWidth / 2, height], [bottomGeo.center - bottomGeo.roadWidth / 2, height]], '#353b3a');
	polygon([[0, top], [topGeo.center - topGeo.roadWidth / 2, top], [bottomGeo.center - bottomGeo.roadWidth / 2, height], [0, height]], '#202b27');
	polygon([[topGeo.center + topGeo.roadWidth / 2, top], [width, top], [width, height], [bottomGeo.center + bottomGeo.roadWidth / 2, height]], '#202b27');

	const stripeStep = 42;
	const stripeOffset = state.roadScroll % stripeStep;
	for (let y = top; y < height; y += stripeStep) {
		const yy = y + stripeOffset;
		if (yy > height) continue;
		const geo = roadGeometry(yy);
		const stripeH = 2 + geo.perspective * 7;
		const curbW = 4 + geo.perspective * 10;
		const tone = Math.floor((y + state.roadScroll) / stripeStep) % 2 ? '#e8efdb' : '#ef6855';
		ctx.fillStyle = tone;
		ctx.fillRect(geo.center - geo.roadWidth / 2 - curbW, yy, curbW, stripeH);
		ctx.fillRect(geo.center + geo.roadWidth / 2, yy, curbW, stripeH);
	}

	for (let lane = 1; lane < 4; lane++) {
		for (let y = top; y < height; y += 76) {
			const yy = y + (state.roadScroll % 76);
			if (yy > height) continue;
			const geo = roadGeometry(yy);
			const dashHeight = 2 + geo.perspective * 13;
			ctx.globalAlpha = 0.23 + geo.perspective * 0.45;
			ctx.fillStyle = '#edf0dd';
			ctx.fillRect(geo.center - geo.roadWidth / 2 + geo.roadWidth * lane / 4 - 1, yy, 2 + geo.perspective * 2, dashHeight);
		}
	}
	ctx.globalAlpha = 1;
	const glow = ctx.createLinearGradient(0, top, 0, height);
	glow.addColorStop(0, 'rgba(214,251,78,.01)');
	glow.addColorStop(1, 'rgba(214,251,78,.045)');
	ctx.fillStyle = glow;
	ctx.fillRect(0, top, width, height - top);
}

function drawCar(x, y, width, height, color, player = false) {
	ctx.save();
	ctx.translate(x, y);
	ctx.fillStyle = 'rgba(0,0,0,.4)';
	ctx.beginPath();
	ctx.ellipse(0, height * 0.42, width * 0.57, height * 0.58, 0, 0, Math.PI * 2);
	ctx.fill();
	if (player && state.nitroActive) {
		const flame = ctx.createLinearGradient(0, height * .4, 0, height * .95);
		flame.addColorStop(0, 'rgba(214,251,78,.85)');
		flame.addColorStop(1, 'rgba(255,115,89,0)');
		polygon([[-width * .2, height * .36], [width * .2, height * .36], [0, height * 1.15]], flame);
	}
	ctx.fillStyle = '#101313';
	ctx.fillRect(-width * .51, -height * .24, width * .15, height * .35);
	ctx.fillRect(width * .36, -height * .24, width * .15, height * .35);
	ctx.fillRect(-width * .51, height * .2, width * .15, height * .31);
	ctx.fillRect(width * .36, height * .2, width * .15, height * .31);
	ctx.fillStyle = color;
	ctx.beginPath();
	ctx.moveTo(-width * .42, height * .32);
	ctx.lineTo(-width * .48, -height * .1);
	ctx.lineTo(-width * .34, -height * .41);
	ctx.lineTo(-width * .22, -height * .49);
	ctx.lineTo(width * .22, -height * .49);
	ctx.lineTo(width * .34, -height * .41);
	ctx.lineTo(width * .48, -height * .1);
	ctx.lineTo(width * .42, height * .32);
	ctx.closePath();
	ctx.fill();
	ctx.fillStyle = player ? '#293336' : '#273035';
	ctx.beginPath();
	ctx.moveTo(-width * .28, -height * .12);
	ctx.lineTo(-width * .18, -height * .38);
	ctx.lineTo(width * .18, -height * .38);
	ctx.lineTo(width * .28, -height * .12);
	ctx.closePath();
	ctx.fill();
	ctx.fillStyle = player ? '#e5ff8b' : '#ff6457';
	ctx.fillRect(-width * .35, height * .19, width * .18, height * .07);
	ctx.fillRect(width * .17, height * .19, width * .18, height * .07);
	ctx.restore();
}

function drawPlayerCar(x, y, width, height) {
	if (!playerCarModel.complete || !playerCarModel.naturalWidth) {
		drawCar(x, y, width, height, '#d6fb4e', true);
		return;
	}

	ctx.save();
	ctx.translate(x, y);
	if (state.nitroActive) {
		const flame = ctx.createLinearGradient(0, height * .36, 0, height * .82);
		flame.addColorStop(0, 'rgba(214,251,78,.9)');
		flame.addColorStop(1, 'rgba(255,115,89,0)');
		polygon([[-width * .2, height * .34], [width * .2, height * .34], [0, height * .9]], flame);
	}
	ctx.drawImage(playerCarModel, -width * .62, -height * .55, width * 1.24, height * 1.1);
	ctx.restore();
}

function drawWorld() {
	drawBackground();
	drawRoad();
	for (const car of state.traffic) {
		const geo = roadGeometry(car.y);
		const x = geo.center + car.lane * geo.roadWidth;
		const scale = 0.28 + geo.perspective * 0.72;
		drawCar(x, car.y, 30 * scale, 55 * scale, car.color);
	}
	const carGeo = roadGeometry(state.height * 0.82);
	const playerWidth = Math.min(state.width * 0.15, 74);
	drawPlayerCar(carGeo.center + state.playerX * carGeo.roadWidth * 0.38, state.height * 0.82, playerWidth, playerWidth * 1.7);
	for (const particle of state.particles) {
		ctx.globalAlpha = Math.max(0, particle.life);
		ctx.fillStyle = particle.color;
		ctx.fillRect(particle.x, particle.y, particle.size, particle.size);
	}
	ctx.globalAlpha = 1;
}

function spawnTraffic() {
	const lane = lanes[Math.floor(Math.random() * lanes.length)];
	const hasLane = state.traffic.some(car => car.lane === lane && car.y < state.height * 0.43);
	if (!hasLane) state.traffic.push({ lane, y: state.height * 0.27, color: colors[Math.floor(Math.random() * colors.length)], speed: 35 + Math.random() * 36 });
}

function updateHud() {
	document.querySelector('#speed').textContent = String(Math.round(state.speed)).padStart(3, '0');
	document.querySelector('#distance').innerHTML = `${(state.distance / 1000).toFixed(2)} <small>KM</small>`;
	document.querySelector('#gear').textContent = String(Math.max(1, Math.min(6, Math.floor(state.speed / 37) + 1)));
	document.querySelector('#nitro-fill').style.transform = `scaleX(${state.nitro})`;
}

function makeCrashParticles(x, y) {
	for (let i = 0; i < 18; i++) state.particles.push({ x, y, vx: (Math.random() - .5) * 220, vy: (Math.random() - .65) * 200, life: .6 + Math.random() * .6, size: 2 + Math.random() * 4, color: i % 2 ? '#d6fb4e' : '#ff7359' });
}

function endRun() {
	state.mode = 'over';
	state.nitroActive = false;
	const score = Math.floor(state.distance / 4 + state.maxSpeed * 8);
	if (score > best) {
		best = score;
		localStorage.setItem('nightrun-best', String(best));
		updateBest();
		document.querySelector('#result-title').innerHTML = 'YANGI<br /><em>REKORD!</em>';
	} else {
		document.querySelector('#result-title').innerHTML = 'YAXSHI<br /><em>URINISH.</em>';
	}
	document.querySelector('#result-copy').innerHTML = `Masofa <strong>${(state.distance / 1000).toFixed(2)} km</strong> · Eng yuqori tezlik <strong>${Math.round(state.maxSpeed)} km/h</strong>`;
	setTimeout(() => {
		if (state.mode === 'over') resultScreen.hidden = false;
	}, 450);
}

function finishParking(result) {
	state.mode = 'over';
	parkingHud.hidden = true;
	parkingControls.hidden = true;
	document.querySelector('#result-title').innerHTML = 'JOYGA<br /><em>QO\'YILDI!</em>';
	document.querySelector('#result-copy').innerHTML = `Parkovka vaqti <strong>${result.elapsed.toFixed(1)} soniya</strong> · To\'qnashuv <strong>${result.hits} ta</strong>`;
	resultScreen.hidden = false;
}

function update(delta) {
	if (state.mode !== 'running') return;
	state.time += delta;
	const acceleration = input.accelerate ? 1 : 0.72;
	state.nitroActive = input.nitro && state.nitro > 0;
	const targetSpeed = state.nitroActive ? 196 : 118 + acceleration * 35;
	state.speed += (targetSpeed - state.speed) * Math.min(1, delta * 1.7);
	if (state.nitroActive) state.nitro = Math.max(0, state.nitro - delta * .24);
	else state.nitro = Math.min(1, state.nitro + delta * .035);
	const steer = (input.right ? 1 : 0) - (input.left ? 1 : 0);
	state.playerX += steer * delta * (state.nitroActive ? 1.03 : .8);
	state.playerX = Math.max(-.91, Math.min(.91, state.playerX));
	state.distance += state.speed * delta / 3.6;
	state.roadScroll += state.speed * delta * 1.75;
	state.spawnTimer -= delta;
	if (state.spawnTimer <= 0) {
		spawnTraffic();
		state.spawnTimer = Math.max(.42, 1.05 - state.speed / 320) * (.65 + Math.random() * .7);
	}

	const carGeo = roadGeometry(state.height * .82);
	const playerPosition = carGeo.center + state.playerX * carGeo.roadWidth * .38;
	for (const car of state.traffic) {
		car.y += (state.speed - car.speed) * delta * (0.42 + car.y / state.height * .6);
		const geo = roadGeometry(car.y);
		const carX = geo.center + car.lane * geo.roadWidth;
		const scale = 0.28 + geo.perspective * 0.72;
		if (Math.abs(car.y - state.height * .82) < 38 * scale && Math.abs(carX - playerPosition) < (state.width * .045 + 15 * scale)) {
			makeCrashParticles(playerPosition, state.height * .82);
			state.shake = .42;
			endRun();
			break;
		}
	}
	state.traffic = state.traffic.filter(car => car.y < state.height + 100);
	for (const particle of state.particles) {
		particle.x += particle.vx * delta;
		particle.y += particle.vy * delta;
		particle.life -= delta * 1.6;
	}
	state.particles = state.particles.filter(particle => particle.life > 0);
	state.maxSpeed = Math.max(state.maxSpeed, state.speed);
	state.shake = Math.max(0, state.shake - delta);
	updateHud();
}

function frame(timestamp) {
	const delta = Math.min(.04, (timestamp - (state.lastFrame || timestamp)) / 1000);
	state.lastFrame = timestamp;
	if (state.mode !== 'parking') {
		update(delta);
		ctx.save();
		if (state.shake > 0) ctx.translate((Math.random() - .5) * 8 * state.shake, (Math.random() - .5) * 5 * state.shake);
		drawWorld();
		ctx.restore();
	}
	requestAnimationFrame(frame);
}

function startRun() {
	parkingGame?.stop();
	canvas.hidden = false;
	parkingCanvas.hidden = true;
	parkingHud.hidden = true;
	parkingControls.hidden = true;
	homeButton.hidden = false;
	Object.assign(state, { mode: 'running', time: 0, distance: 0, speed: 70, maxSpeed: 0, playerX: 0, nitro: 1, nitroActive: false, roadScroll: 0, spawnTimer: .8, shake: 0, traffic: [], particles: [] });
	Object.keys(input).forEach(key => { input[key] = false; });
	startScreen.hidden = true;
	resultScreen.hidden = true;
	pauseScreen.hidden = true;
	hud.hidden = false;
	touchControls.hidden = false;
	updateHud();
}

function updateParkingHud(data) {
	document.querySelector('#parking-speed').textContent = String(Math.round(data.speed)).padStart(2, '0');
	const gearButton = document.querySelector('#parking-gear');
	gearButton.textContent = data.gear;
	gearButton.setAttribute('aria-label', data.gear === 'D' ? "Orqaga uzatmaga o'tish" : "Oldinga uzatmaga o'tish");
	const objective = document.querySelector('#parking-objective');
	objective.textContent = data.progress > 0
		? `JOYGA TO'G'IRLANG · ${Math.min(100, Math.round(data.progress * 50))}%`
		: `PARKOVKA JOYIGACHA ${Math.round(data.distance)} M`;
}

async function startParking() {
	if (!parkingGame) {
		const { createParkingGame } = await import('./parking.js?v=5');
		parkingGame = createParkingGame({
			canvas: parkingCanvas,
			input,
			car: carCatalog[selectedCarIndex],
			graphicsQuality,
			onUpdate: updateParkingHud,
			onComplete: finishParking,
			onCollision: () => {
				const objective = document.querySelector('#parking-objective');
				objective.classList.add('is-warning');
				setTimeout(() => objective.classList.remove('is-warning'), 650);
			},
		});
	} else if (parkingGame.carId !== carCatalog[selectedCarIndex].id) {
		parkingGame.dispose();
		parkingGame = undefined;
		return startParking();
	}
	parkingGame.setQuality(graphicsQuality);
	canvas.hidden = true;
	parkingCanvas.hidden = false;
	hud.hidden = true;
	parkingHud.hidden = false;
	startScreen.hidden = true;
	resultScreen.hidden = true;
	pauseScreen.hidden = true;
	touchControls.hidden = true;
	parkingControls.hidden = false;
	homeButton.hidden = false;
	Object.keys(input).forEach(key => { input[key] = false; });
	state.mode = 'parking';
	parkingGame.start();
}

function returnHome() {
	parkingGame?.stop();
	Object.keys(input).forEach(key => { input[key] = false; });
	state.mode = 'menu';
	canvas.hidden = false;
	parkingCanvas.hidden = true;
	hud.hidden = true;
	parkingHud.hidden = true;
	touchControls.hidden = true;
	parkingControls.hidden = true;
	homeButton.hidden = true;
	pauseScreen.hidden = true;
	resultScreen.hidden = true;
	startScreen.hidden = false;
	document.querySelector('#start-button').focus({ preventScroll: true });
}

function startSelectedMode() {
	triggerIntroFlash();
	if (selectedMode === 'parking') {
		startParking().catch(error => {
			console.error('Parkovka rejimi yuklanmadi', error);
		document.querySelector('#start-copy').textContent = '3D rejim bu qurilmada ishga tushmadi. STREET RUN rejimini tanlang.';
		});
		return;
	}
	startRun();
}

function selectGameMode(mode) {
	selectedMode = mode;
	for (const button of document.querySelectorAll('[data-game-mode]')) {
		const selected = button.dataset.gameMode === mode;
		button.classList.toggle('is-selected', selected);
		button.setAttribute('aria-pressed', String(selected));
	}
	const parking = mode === 'parking';
	document.querySelector('#start-title').innerHTML = parking ? 'PARK IT<br /><em>CLEAN.</em>' : 'OWN THE<br /><em>NIGHT.</em>';
	document.querySelector('#start-copy').textContent = parking
		? 'Avtoturargoh tor. Tezlikni pasaytir, rulni to\'g\'rila va yashil joyga ehtiyotkorlik bilan kir.'
		: 'Shahar uyg\'oq. Trassa seniki. Trafik orasidan o\'t va nitroni vaqtida bos.';
	document.querySelector('#start-button span').textContent = parking ? 'PARKOVKANI BOSHLASH' : 'POYGANI BOSHLASH';
}

function togglePause() {
	if (state.mode === 'running' || state.mode === 'parking') {
		if (state.mode === 'parking') parkingGame?.setPaused(true);
		state.mode = 'paused';
		pauseScreen.hidden = false;
		Object.keys(input).forEach(key => { input[key] = false; });
	} else if (state.mode === 'paused') {
		state.mode = selectedMode === 'parking' ? 'parking' : 'running';
		if (state.mode === 'parking') parkingGame?.setPaused(false);
		pauseScreen.hidden = true;
	}
}

function keyInput(event, pressed) {
	const map = { ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right', Space: 'nitro', ArrowUp: 'accelerate', KeyW: 'accelerate', ArrowDown: 'brake', KeyS: 'brake' };
	const control = map[event.code];
	if (!control) return;
	event.preventDefault();
	input[control] = pressed;
}

document.addEventListener('keydown', event => {
	if (event.code === 'Escape' || event.code === 'KeyP') { togglePause(); return; }
	keyInput(event, true);
});
document.addEventListener('keyup', event => keyInput(event, false));
document.querySelectorAll('[data-control]').forEach(button => {
	const control = button.dataset.control;
	const release = event => { event.preventDefault(); input[control] = false; button.classList.remove('is-active'); };
	button.addEventListener('pointerdown', event => {
		event.preventDefault();
		button.setPointerCapture(event.pointerId);
		input[control] = true;
		button.classList.add('is-active');
	});
	button.addEventListener('pointerup', release);
	button.addEventListener('pointercancel', release);
	button.addEventListener('lostpointercapture', release);
});

document.querySelectorAll('[data-game-mode]').forEach(button => {
	button.addEventListener('click', () => selectGameMode(button.dataset.gameMode));
});
document.querySelector('#start-button').addEventListener('click', startSelectedMode);
document.querySelector('#retry-button').addEventListener('click', startSelectedMode);
document.querySelector('#car-previous').addEventListener('click', () => selectCar(-1));
document.querySelector('#car-next').addEventListener('click', () => selectCar(1));
document.querySelectorAll('[data-quality]').forEach(button => {
	button.addEventListener('click', () => setGraphicsQuality(button.dataset.quality));
});
homeButton.addEventListener('click', returnHome);
document.querySelector('#pause-button').addEventListener('click', togglePause);
document.querySelector('#parking-pause').addEventListener('click', togglePause);
document.querySelector('#resume-button').addEventListener('click', togglePause);
document.querySelector('#parking-camera').addEventListener('click', () => parkingGame?.toggleCamera());
document.querySelector('#parking-gear').addEventListener('click', () => parkingGame?.toggleGear());
document.querySelector('#sound-toggle').addEventListener('click', event => {
	soundEnabled = !soundEnabled;
	event.currentTarget.classList.toggle('is-muted', !soundEnabled);
	if (soundEnabled) {
		audioContext ||= new AudioContext();
		const oscillator = audioContext.createOscillator();
		const gain = audioContext.createGain();
		oscillator.type = 'sawtooth';
		oscillator.frequency.value = 62;
		gain.gain.value = .018;
		oscillator.connect(gain).connect(audioContext.destination);
		oscillator.start();
		oscillator.stop(audioContext.currentTime + .12);
	}
});

window.addEventListener('resize', resize);
document.addEventListener('visibilitychange', () => {
	if (document.hidden && (state.mode === 'running' || state.mode === 'parking')) togglePause();
});
if ('serviceWorker' in navigator && location.protocol !== 'file:') {
	window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js?v=15').catch(() => {}));
}

updateBest();
updateGarage();
for (const button of document.querySelectorAll('[data-quality]')) {
	button.setAttribute('aria-pressed', String(button.dataset.quality === graphicsQuality));
}
resize();
touchControls.hidden = true;
parkingControls.hidden = true;
requestAnimationFrame(frame);
