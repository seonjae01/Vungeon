import * as THREE from 'three';
import { createScene } from './scene.js';
import { setupInput, handlePlayerMovement } from './input.js';
import { generateRoomsAroundPlayer } from './world.js';

const FRUSTUM_SIZE = 5;
const ROOM_SIZE = 5;

let scene, camera, renderer, player, world, updateCameraPosition;
let isLoading = true;
let blurAmount = 10;
const BLUR_LERP_SPEED = 0.05;

function updateBlur() {
    if (isLoading && renderer && renderer.domElement) {
        blurAmount = Math.max(0, blurAmount - BLUR_LERP_SPEED * blurAmount);
        
        if (blurAmount <= 0.1) {
            isLoading = false;
            renderer.domElement.style.filter = '';
        } else {
            renderer.domElement.style.filter = `blur(${blurAmount}px)`;
        }
    }
}

async function init() {
    try {
        const sceneData = await createScene();
        ({ scene, camera, player, world, updateCameraPosition } = sceneData);
        
        setupInput(player);
        
        renderer = new THREE.WebGLRenderer({ 
            antialias: false,
            powerPreference: 'high-performance'
        });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
        renderer.sortObjects = false;
        document.body.appendChild(renderer.domElement);
        
        renderer.domElement.style.filter = `blur(${blurAmount}px)`;
        renderer.domElement.style.transition = 'none';
        
        window.addEventListener('resize', handleResize);
        
        animate();
    } catch (error) {
        console.error('초기화 실패:', error);
        isLoading = false;
    }
}

function handleResize() {
    const aspect = window.innerWidth / window.innerHeight;
    
    camera.left = FRUSTUM_SIZE * aspect / -2;
    camera.right = FRUSTUM_SIZE * aspect / 2;
    camera.top = FRUSTUM_SIZE / 2;
    camera.bottom = FRUSTUM_SIZE / -2;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);
    
    if (!isLoading) {
        handlePlayerMovement(player);
    }
    
    const { x: playerX, z: playerZ } = player.position;
    const playerRoomX = Math.round(playerX / ROOM_SIZE);
    const playerRoomZ = Math.round(playerZ / ROOM_SIZE);
    
    updateCameraPosition(camera, player, playerRoomX, playerRoomZ);
    generateRoomsAroundPlayer(player, world, playerRoomX, playerRoomZ);
    
    renderer.render(scene, camera);
    
    updateBlur();
}

init();
