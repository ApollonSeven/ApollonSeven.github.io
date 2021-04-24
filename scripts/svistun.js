import * as THREE from '../modules/three/three.module.js';
import { OBJLoader } from '../modules/three/loaders/OBJLoader.js';

let camera, scene, renderer;

let windowHalfX = window.innerWidth / 2;
let windowHalfY = window.innerHeight / 2;

let object, plane, plane2, pivot, ball, group;

//initialise simplex noise instance
let noise = new SimplexNoise();
let audio = document.getElementById("audio");
let analyser, dataArray;

init();
animate();


function init() {
    // container
    const container = document.createElement('div');
    document.body.appendChild(container);

    // audio analyser
    let context = new AudioContext();
    let src = context.createMediaElementSource(audio);
    analyser = context.createAnalyser();
    src.connect(analyser);
    analyser.connect(context.destination);
    analyser.fftSize = 512;
    let bufferLength = analyser.frequencyBinCount;
    dataArray = new Uint8Array(bufferLength);

    // camera
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 3000);
    camera.position.z = 250;

    // scene
    scene = new THREE.Scene();
    group = new THREE.Group();

    const ambientLight = new THREE.AmbientLight(0xcccccc, 0.9);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0xffffff, 0.05);
    camera.add(pointLight);

    scene.add(camera);

    // manager
    function loadModel() {
        object.children[0].material.side = THREE.DoubleSide;
        object.scale.y = -1;
        let box = new THREE.Box3().setFromObject(object);
        box.center(object.position); // this re-sets the mesh position
        object.position.multiplyScalar(-1);
        pivot = new THREE.Group();
        scene.add(pivot);
        pivot.add(object);
    }

    const manager = new THREE.LoadingManager(loadModel);

    // model
    const loader = new OBJLoader(manager);
    loader.load('media/models/svistun.obj', function(obj) {
        object = obj;
    });

    let planeGeometry = new THREE.PlaneGeometry(3000, 3000, 20, 20);
    let planeMaterial = new THREE.MeshLambertMaterial({
        color: 0x6904ce,
        side: THREE.DoubleSide,
        wireframe: true
    });

    plane = new THREE.Mesh(planeGeometry, planeMaterial);
    plane.rotation.x = -0.5 * Math.PI;
    plane.position.set(0, 300, 0);
    group.add(plane);

    plane2 = new THREE.Mesh(planeGeometry, planeMaterial);
    plane2.rotation.x = -0.5 * Math.PI;
    plane2.position.set(0, -300, 0);
    group.add(plane2);

    let icosahedronGeometry = new THREE.IcosahedronGeometry(200, 4);
    let lambertMaterial = new THREE.MeshLambertMaterial({
        color: 0xff00ee,
        wireframe: true
    });

    ball = new THREE.Mesh(icosahedronGeometry, lambertMaterial);
    ball.position.set(0, 0, -300);
    group.add(ball);

    scene.add(group);
    // renderer

    renderer = new THREE.WebGLRenderer({ alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);

    //

    window.addEventListener('resize', onWindowResize);

}

function onWindowResize() {
    windowHalfX = window.innerWidth / 2;
    windowHalfY = window.innerHeight / 2;

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);
    render();
}

function render() {
    analyser.getByteFrequencyData(dataArray);

    let lowerHalfArray = dataArray.slice(0, (dataArray.length / 2) - 1);
    let upperHalfArray = dataArray.slice((dataArray.length / 2) - 1, dataArray.length - 1);

    let lowerMax = max(lowerHalfArray);
    let lowerAvg = avg(lowerHalfArray);
    let upperMax = max(upperHalfArray);
    let upperAvg = avg(upperHalfArray);

    let lowerMaxFr = lowerMax / lowerHalfArray.length;
    let lowerAvgFr = lowerAvg / lowerHalfArray.length;
    let upperMaxFr = upperMax / upperHalfArray.length;
    let upperAvgFr = upperAvg / upperHalfArray.length;

    makeRoughGround(plane, modulate(upperAvgFr, 0, 1, 0.5, 4));
    makeRoughGround(plane2, modulate(lowerMaxFr, 0, 1, 0.5, 4));
    makeRoughObject(pivot, modulate(lowerAvgFr, 0, 1, 0.5, 4))
    makeRoughBall(ball, modulate(upperMaxFr, 0, 1, 0.5, 4))
    plane.rotation.z += 0.002;
    plane2.rotation.z += 0.002;

    renderer.render(scene, camera);

}

function makeRoughObject(mesh, distortionFr) {
    if (mesh) {
        let time = Date.now();
        let noiseValueX = noise.noise2D(-2 + time * 0.0003, 2 + time * 0.0003) * distortionFr * 0.05
        let noiseValueY = noise.noise2D(-90 + time * 0.0001, 90 + time * 0.0003) * 0.2
        mesh.rotation.x = noiseValueX
        mesh.rotation.y = noiseValueY
    }
}

function makeRoughGround(mesh, distortionFr) {
    mesh.geometry.attributes.position.needsUpdate = true;
    const positions = mesh.geometry.attributes.position.array
    for (let i = 0, l = positions.length; i < l; i = i + 3) {
        let amp = 8;
        let time = Date.now();
        let distance = (noise.noise2D(positions[i] + time * 0.0003, positions[i + 1] + time * 0.0001) + 0) * distortionFr * amp;
        positions[i + 2] = distance
    }
}

function makeRoughBall(mesh, distortionFr) {
    mesh.geometry.attributes.position.needsUpdate = true;
    const positions = mesh.geometry.attributes.position.array
    for (let i = 0, l = positions.length; i < l; i = i + 3) {
        let amp = 80;
        let time = Date.now();
        let distance = (noise.noise2D(positions[i] + time * 0.0003, positions[i + 1] + time * 0.0001) + 0) * distortionFr * amp;
        positions[i + 2] = distance
    }
}

//some helper functions here
function fractionate(val, minVal, maxVal) {
    return (val - minVal) / (maxVal - minVal);
}

function modulate(val, minVal, maxVal, outMin, outMax) {
    let fr = fractionate(val, minVal, maxVal);
    let delta = outMax - outMin;
    return outMin + (fr * delta);
}

function avg(arr) {
    let total = arr.reduce(function(sum, b) { return sum + b; });
    return (total / arr.length);
}

function max(arr) {
    return arr.reduce(function(a, b) { return Math.max(a, b); })
}