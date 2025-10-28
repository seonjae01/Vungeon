import * as THREE from 'three';
import { createScene } from './scene.js';
import { setupInput, handlePlayerMovement } from './input.js';
import { generateRoomsAroundPlayer } from './world.js';

let scene, camera, renderer, player, world, updateCameraPosition;

function init() {
    const sceneData = createScene();
    ({ scene, camera, player, world, updateCameraPosition } = sceneData);
    
    setupInput(player);
    
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);
    
    window.addEventListener('resize', handleResize);
    
    animate();
}

function handleResize() {
    const aspect = window.innerWidth / window.innerHeight;
    const frustumSize = 5;
    
    camera.left = frustumSize * aspect / -2;
    camera.right = frustumSize * aspect / 2;
    camera.top = frustumSize / 2;
    camera.bottom = frustumSize / -2;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);
    
    handlePlayerMovement(player);
    updateCameraPosition(camera, player);
    generateRoomsAroundPlayer(player, world);
    
    renderer.render(scene, camera);
}

init();
