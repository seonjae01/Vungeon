import * as THREE from 'three';
import { createScene } from './scene.js';
import { setupInput, handlePlayerMovement } from './input.js';
import { generateRoomsAroundPlayer } from './world.js';

const FRUSTUM_SIZE = 5;

let scene, camera, renderer, player, world, updateCameraPosition;

function init() {
    const sceneData = createScene();
    ({ scene, camera, player, world, updateCameraPosition } = sceneData);
    
    setupInput(player);
    
    renderer = new THREE.WebGLRenderer({ 
        antialias: false, // 성능 향상을 위해 안티앨리어싱 비활성화
        powerPreference: 'high-performance' // 고성능 모드
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5)); // 픽셀 비율 제한
    renderer.sortObjects = false; // 객체 정렬 비활성화로 성능 향상
    document.body.appendChild(renderer.domElement);
    
    window.addEventListener('resize', handleResize);
    
    animate();
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
    
    handlePlayerMovement(player);
    
    // 플레이어 룸 위치를 한 번만 계산하여 재사용
    const { x: playerX, z: playerZ } = player.position;
    const ROOM_SIZE = 5;
    const playerRoomX = Math.round(playerX / ROOM_SIZE);
    const playerRoomZ = Math.round(playerZ / ROOM_SIZE);
    
    updateCameraPosition(camera, player, playerRoomX, playerRoomZ);
    generateRoomsAroundPlayer(player, world, playerRoomX, playerRoomZ);
    
    renderer.render(scene, camera);
}

init();
