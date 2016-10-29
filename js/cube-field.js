let canvas = document.getElementById('canvas');

// CONSTANTS
const HEIGHT = window.innerHeight;
const WIDTH = window.innerWidth;
const FOV = 45; /* Camera frustum vertical field of view (degrees) */
const ASPECT_RATIO = WIDTH/HEIGHT; 
const NEAR = 0.1; /* Camera frustum near plane (degrees)*/
const FAR = 1000; /* Camera frustum far plane (degrees)*/

// CAMERA CONSTANTS
const CAMERA_X = -380;
const CAMERA_Y = 120;
const CAMERA_Z = 375;

// PLANE CONSTANTS
const PLANE_WIDTH = 600;
const PLANE_HEIGHT = 400;

// PARTICLE CONTANTS
const MAX_PARTICLES = 100;

let cubes = [];

class Particle {
	constructor(width, height, depth) {
		this.w = width || Math.random() * 10;
		this.h = height || Math.random() * 10;
		this.d = depth || Math.random() * 10;
		this.color = 0xffffff * Math.random();
	}

	setMaxPosX(maxWidth) {
		return -maxWidth/2 + (Math.random() * maxWidth);
	}

	setMaxPosY(maxHeight) {
		return maxHeight;
	}

	setMaxPosZ(maxDepth) {
		return -maxDepth/2 + (Math.random() * maxDepth);
	}
}

let scene = new THREE.Scene();

let camera = new THREE.PerspectiveCamera(FOV, ASPECT_RATIO, NEAR, FAR);
camera.position.x = CAMERA_X;
camera.position.y = CAMERA_Y;
camera.position.z = CAMERA_Z;

let ambiColor = "#0c0c0c";
let ambientLight = new THREE.AmbientLight(ambiColor);
scene.add(ambientLight);

// Create a point light for each quadrant of the plane
for (let i = 0; i < 4; i++) {
	const colors = [0x0000ff, 0xFF0000, 0xFFFF00, 0xFF00FF];
	const posMap = [[-1, -1], [1, -1], [-1, 1],[1, 1]];
	const posWidth = posMap[i][0] * (PLANE_WIDTH/4);
	const posHeight = posMap[i][1] * (PLANE_HEIGHT/4);

	let pointLight = new THREE.PointLight(colors[i], 100, 100);
	pointLight.position.set(posWidth, 5, posHeight);
	scene.add(pointLight);
}

let spotLightColor = "#ffffff";
let spotLight = new THREE.SpotLight(spotLightColor);
spotLight.position.set(-80, 120, -10);
spotLight.castShadow = true;
scene.add(spotLight);

const planeGeometry = new THREE.PlaneGeometry(PLANE_WIDTH,PLANE_HEIGHT,1,1);
const planeMaterial = new THREE.MeshLambertMaterial({color: 0x4b964b});
let plane = new THREE.Mesh(planeGeometry, planeMaterial);
plane.receiveShadow = true;
plane.rotation.x = -Math.PI / 2; 
plane.name = 'plane';

let renderer = new THREE.WebGLRenderer();
renderer.setClearColor(new THREE.Color(0x0a0a21));
renderer.setSize(WIDTH, HEIGHT);
renderer.shadowMap.enabled = true;
canvas.appendChild(renderer.domElement);

const OrbitControls = new THREE.OrbitControls(camera);
const axisHelper = new THREE.AxisHelper(300);
const cameraHelper = new THREE.CameraHelper(spotLight.shadow.camera);

// CONTROLS ====================================================================

let controls = new function() {
	this.cubeRotSpd = 0.00;
	this.expandWidth = 1;
	this.expandHeight = 1;
	this.ambientLightON = true;
	this.spotLightON = false;
	this.ambientColor = ambiColor;
	this.spotLightColor = spotLightColor;
	this.particleCount = cubes.length;
	this.sinWaveFreq = 0.025;
	this.showAxes = false;
	this.showPlane = true;
	this.showSpotLight = false;
	this.rotateCamera = true;
	this.exploding = false;
	this.lastWidthInc = 0;
	this.lastHeightInc = 0;

	this.addCubes = function () {	
		for (let i = 0; i < MAX_PARTICLES; i++) {
			const particle = new Particle();
			const cubeGeometry = new THREE.CubeGeometry(particle.w, particle.h, particle.d);
			const cubeMaterial = new THREE.MeshLambertMaterial({color: particle.color });
			let cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
			cube.castShadow = true;
			cube.name = `cube-${scene.children.length - 3}`;
			cube.position.x = particle.setMaxPosX(PLANE_WIDTH); 
			cube.position.y = particle.setMaxPosY(particle.h/2);
			cube.position.z = particle.setMaxPosZ(PLANE_HEIGHT);
			cubes.push(cube);
			scene.add(cube);
		}
		this.particleCount = scene.children.length;
	};

	this.outputObjects = function () {
		console.log('scene children', scene.children);
	}

	this.resetCamera = function () {
		camera.position.x = CAMERA_X;
		camera.position.y = CAMERA_Y;
		camera.position.z = CAMERA_Z;
	}

	 this.resetAll = function () { 
		this.cubeRotSpd = 0.01;
		this.sinWaveFreq = 0;
		this.showAxes = false;
		this.showPlane = false;
	 	this.resetCamera();

		for (let i = 0; i < cubes.length; i++) {
			scene.remove(cubes[i]);
		}

		cubes.length = 0;
		this.particleCount = cubes.length;
	};
};

let gui = new dat.GUI;

let cubesFolder = gui.addFolder('Cubes');
cubesFolder.add(controls, 'addCubes');
cubesFolder.add(controls, 'particleCount').listen();
cubesFolder.add(controls, 'cubeRotSpd', 0, 0.5);
cubesFolder.add(controls, 'sinWaveFreq', 0.00, 0.05);
cubesFolder.add(controls, 'expandWidth').min(1).step(0.01).onChange(val => {
	scene.traverse(obj => {
       if (obj instanceof THREE.Mesh && obj != plane ) {
            if (this.lastWidthInc < val) {
                obj.position.x *= val;
                obj.position.z *= val;
            } else {
                obj.position.x /= val;
                obj.position.z /= val;
            }
		} 
	});
	this.lastWidthInc = val;
});
cubesFolder.add(controls, 'expandHeight').min(1).step(0.01).onChange(val => {
	scene.traverse(obj => {
       if (obj instanceof THREE.Mesh && obj != plane ) {
            if (this.lastHeightInc < val) {
                obj.position.y *= val;
            } else {
                obj.position.y /= val;
            }
		} 
	});
	this.lastHeightInc = val;
});
cubesFolder.add(controls, 'exploding').listen();
cubesFolder.open();

let lightsFolder = gui.addFolder('Lights');
lightsFolder.add(controls, 'ambientLightON').listen();
lightsFolder.add(controls, 'spotLightON').listen();
lightsFolder.addColor(controls, 'ambientColor').onChange(e => ambientLight.color = new THREE.Color(e));
lightsFolder.addColor(controls, 'spotLightColor').onChange(e => spotLight.color = new THREE.Color(e));
lightsFolder.open();

let helpersFolder = gui.addFolder('Helpers');
helpersFolder.add(controls, 'showAxes').listen();
helpersFolder.add(controls, 'showPlane').listen();
helpersFolder.add(controls, 'showSpotLight').listen();

gui.add(controls, 'rotateCamera').listen();
gui.add(controls, 'outputObjects');
gui.add(controls, 'resetCamera');
gui.add(controls, 'resetAll');

// END CONTROLS ================================================================

let step = 0;
let stats = initStats();
window.addEventListener('resize', onResize, false);
render();

function render(timestamp) {
	stats.begin();
	stats.end();

    updateToggles();
	animate();	
	OrbitControls.update();
	renderer.render(scene, camera);
	requestAnimationFrame(render);
}

function initStats() {
    let stats = new Stats();
    let statsContainer = document.getElementById('stats');
    stats.showPanel(0);
    statsContainer.appendChild(stats.domElement);
    return stats;
}

function updateToggles() {
	// toggle explosion 
	if (controls.exploding) explodeParticles();

	// toggle camera rotate
	OrbitControls.autoRotate = (controls.rotateCamera) ? true : false;

	// toggle lights
	controls.ambientLightON ? scene.add(ambientLight) : scene.remove(ambientLight);
	controls.spotLightON ? scene.add(spotLight) : scene.remove(spotLight);

	// toggle helpers
	controls.showAxes ? scene.add(axisHelper) : scene.remove(axisHelper);
    controls.showPlane ? scene.add(plane) : scene.remove(plane);
    controls.showSpotLight ? scene.add(cameraHelper) : scene.remove(cameraHelper);
}

function animate() {
	while (cubes.length < 1000) controls.addCubes();
    step += controls.sinWaveFreq;
    scene.traverse(obj => {
        if (obj instanceof THREE.Mesh && obj != plane) {
            obj.rotation.x += controls.cubeRotSpd;
            obj.rotation.y += controls.cubeRotSpd;
            if (controls.sinWaveFreq > 0) {
            	obj.position.y += Math.random() * Math.sin(step);
            }
        }
    });
}

function explodeParticles() {
    scene.traverse(obj => {
        if (obj instanceof THREE.Mesh && obj != plane) {
            obj.rotation.x += 1;
            obj.rotation.y += 1;
            obj.rotation.z += 1;
            obj.position.x *= 1.01;
            obj.position.y *= 1.01;
            obj.position.z *= 1.01;
        }
    });
}

function onResize() {
	camera.aspect = window.innerWidth/window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize(window.innerWidth, window.innerHeight);
}