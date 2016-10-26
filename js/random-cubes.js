let canvas = document.getElementById('canvas');

// SETUP CONSTANTS
const HEIGHT = window.innerHeight;
const WIDTH = window.innerWidth;
const FOV = 45; /* Camera frustum vertical field of view (degrees) */
const ASPECT_RATIO = WIDTH/HEIGHT; 
const NEAR = 0.1; /* Camera frustum near plane (degrees)*/
const FAR = 1000; /* Camera frustum far plane (degrees)*/

// CAMERA CONSTANTS
const CAMERA_X = -90;
const CAMERA_Y = 50;
const CAMERA_Z = 100;

// PLANE CONSTANTS
const PLANE_WIDTH = 60;
const PLANE_HEIGHT = 40;

// PARTICLE CONTANTS
const MAX_PARTICLES = 100;

let cubes = [];

class Particle {
	constructor(width, height, depth) {
		this.w = width || Math.random() * 10;
		this.h = height || Math.random() * 10;
		this.d = depth || Math.random() * 10;
		this.color = Math.random() * 0xffffff;
	}

	setPosX(maxWidth) {
		return -maxWidth/2 + (Math.random() * maxWidth);
	}

	setPosY(maxHeight) {
		return Math.random() * maxHeight;
	}

	setPosZ(maxDepth) {
		return -maxDepth/2 + (Math.random() * maxDepth);
	}
}

let scene = new THREE.Scene();
//scene.fog = new THREE.Fog( 0xeeeeee, 60, 100);
let camera = new THREE.PerspectiveCamera(FOV, ASPECT_RATIO, NEAR, FAR);
camera.position.x = CAMERA_X;
camera.position.y = CAMERA_Y;
camera.position.z = CAMERA_Z;

const OrbitControls = new THREE.OrbitControls(camera);
const axisHelpers = new THREE.AxisHelper(30);

let planeGeometry = new THREE.PlaneGeometry(PLANE_WIDTH,PLANE_HEIGHT,1,1);
let planeMaterial = new THREE.MeshLambertMaterial({color: 0x4b964b});
let plane = new THREE.Mesh(planeGeometry, planeMaterial);
plane.receiveShadow = true;
plane.rotation.x = -Math.PI / 2; 
plane.position.x = 0;
plane.position.y = 0;
plane.position.z = 0;
plane.name = 'plane';

let ambientLight = new THREE.AmbientLight(0xeeeeee);
scene.add(ambientLight);

let spotLight = new THREE.SpotLight(0xffffff);
spotLight.position.set(-40, 60, -10);
spotLight.castShadow = true;
scene.add(spotLight);

let renderer = new THREE.WebGLRenderer();
renderer.setClearColor(new THREE.Color(0x0a0a21));
renderer.setSize(WIDTH, HEIGHT);
renderer.shadowMap.enabled = true;
canvas.appendChild(renderer.domElement);

let controls = new function() {

	this.cubeRotSpd = 0.01;
	this.expWidth = 1;
	this.particleCount = cubes.length;
	this.sinWaveFreq = 0.0;
	this.showAxes = false;
	this.showPlane = false;

	this.addCubes = function () {	
		for (let i = 0; i < MAX_PARTICLES; i++) {
			const particle = new Particle();
			let cubeGeometry = new THREE.CubeGeometry(particle.w, particle.h, particle.d);
			let cubeMaterial = new THREE.MeshLambertMaterial({color: particle.color });
			let cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
			cube.castShadow = true;
			cube.name = `cube-${scene.children.length - 3}`;
			cube.position.x = particle.setPosX(PLANE_WIDTH); 
			cube.position.y = particle.setPosY(10);
			cube.position.z = particle.setPosZ(PLANE_HEIGHT);
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

	this.explode = function () {
		let multiple = 1;
		while (multiple < 1.05) {

			scene.traverse(obj => {
			if (obj instanceof THREE.Mesh && obj != plane ) {
			if (lastWidthIncr < multiple) {
			obj.position.x *= multiple;
			obj.position.y *= multiple*1.01;
			obj.position.z *= multiple;
			} else {
			obj.position.x /= multiple;
			obj.position.y /= multiple*1.01;
			obj.position.z /= multiple;
			}
			} 
			});


			multiple += 0.001;
		}
	}
};

let gui = new dat.GUI;
gui.add(controls, 'addCubes');
let expWidth = gui.add(controls, 'expWidth').min(1).step(0.001);
gui.add(controls, 'cubeRotSpd', 0, 0.5).listen();
gui.add(controls, 'sinWaveFreq', 0.0, 0.1).listen();
gui.add(controls, 'particleCount').listen();
gui.add(controls, 'showAxes').listen();
gui.add(controls, 'showPlane').listen();
gui.add(controls, 'explode');
gui.add(controls, 'outputObjects');
gui.add(controls, 'resetCamera');
gui.add(controls, 'resetAll');

let lastWidthIncr = 0;
expWidth.onChange(val => {
	console.log('val', val);
	scene.traverse(obj => {
       if (obj instanceof THREE.Mesh && obj != plane ) {
            if (lastWidthIncr < val) {
                obj.position.x *= val;
                obj.position.y *= val*1.01;
                obj.position.z *= val;
            } else {
                obj.position.x /= val;
                obj.position.y /= val*1.01;
                obj.position.z /= val;
            }
		} 
	});
	lastWidthIncr = val;
});

let step = 0;
let stats = initStats();
window.addEventListener('resize', onResize, false);

render();

function initStats() {
    let stats = new Stats();
    let statsContainer = document.getElementById('stats');
    stats.showPanel(0);
    statsContainer.appendChild(stats.domElement);
    return stats;
}

function render() {
	step += controls.sinWaveFreq;
	OrbitControls.update();
	renderer.render(scene, camera);

	if (controls.showAxes) {
		scene.add(axisHelpers);
	} else {
		scene.remove(axisHelpers);
	}

	if (controls.showPlane) {
		scene.add(plane);
	} else {
		scene.remove(plane);
	}

	scene.traverse(obj => {
       if (obj instanceof THREE.Mesh && obj != plane ) {
       	obj.rotation.x+=controls.cubeRotSpd;
         obj.rotation.y+=controls.cubeRotSpd;
         if (controls.sinWaveFreq > 0) obj.position.y+=Math.sin(step);
		} 
	});

	stats.begin();
	stats.end();
	requestAnimationFrame(render);
}

function onResize() {
	camera.aspect = window.innerWidth/window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize(window.innerWidth, window.innerHeight);
}
