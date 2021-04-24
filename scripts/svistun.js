import * as THREE from '../modules/three/three.module.js';
import { OBJLoader } from '../modules/three/loaders/OBJLoader.js';


let camera, scene, renderer;

let windowHalfX = window.innerWidth / 2;
let windowHalfY = window.innerHeight / 2;

let object;
let mouseX = 0,
    mouseY = 0;

let plane, plane2, pivot;

init();
animate();


function init() {
    // container
    const container = document.createElement('div');
    document.body.appendChild(container);

    // camera
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 3000);
    camera.position.z = 250;

    // scene
    scene = new THREE.Scene();

    const ambientLight = new THREE.AmbientLight(0xcccccc, 0.9);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0xffffff, 0.05);
    camera.add(pointLight);

    scene.add(camera);

    // manager
    function loadModel() {
        object.children[0].material.side = THREE.DoubleSide;
        object.scale.y = -1;
        var box = new THREE.Box3().setFromObject(object);
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

    var planeGeometry = new THREE.PlaneGeometry(3000, 3000, 20, 20);
    var planeMaterial = new THREE.MeshLambertMaterial({
        color: 0x6904ce,
        side: THREE.DoubleSide,
        wireframe: true
    });

    plane = new THREE.Mesh(planeGeometry, planeMaterial);
    plane.rotation.x = -0.5 * Math.PI;
    plane.position.set(0, 300, 0);
    scene.add(plane);

    plane2 = new THREE.Mesh(planeGeometry, planeMaterial);
    plane2.rotation.x = -0.5 * Math.PI;
    plane2.position.set(0, -300, 0);
    scene.add(plane2);


    // renderer

    renderer = new THREE.WebGLRenderer({ alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);

    document.addEventListener('mousemove', onDocumentMouseMove);

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

function onDocumentMouseMove(event) {
    mouseX = (event.clientX - windowHalfX) / windowHalfX;
    mouseY = (event.clientY - windowHalfY) / windowHalfY;

}

//

function animate() {

    requestAnimationFrame(animate);
    render();

}

function render() {

    plane.rotation.z += 0.002;
    plane2.rotation.z += 0.002;
    if (pivot) {
        pivot.rotation.y = mouseX * 0.5;
        pivot.rotation.x = mouseY * 0.5;
    }
    renderer.render(scene, camera);

}