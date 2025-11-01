import * as THREE from 'three';
import { createPlayer } from './player.js';
import { createCamera, updateCameraPosition } from './camera.js';
import { createWorld, getStartCell } from './world.js';

export async function createScene() {
    const scene = new THREE.Scene();
    
    scene.background = new THREE.Color(0x2a2a3e);
    
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
    directionalLight.position.set(10, 20, 10);
    directionalLight.castShadow = false;
    scene.add(directionalLight);
    
    const pointLight = new THREE.PointLight(0xffaa00, 0.8, 50);
    pointLight.position.set(0, 10, 0);
    scene.add(pointLight);
    
    const player = createPlayer();
    const world = await createWorld();
    const camera = createCamera();
    
    const startCell = getStartCell();
    const ROOM_SIZE = 5;
    const startX = startCell.x * ROOM_SIZE;
    const startZ = startCell.y * ROOM_SIZE;
    
    player.position.set(startX, 1.8, startZ);
    
    const playerRoomX = Math.round(startX / ROOM_SIZE);
    const playerRoomZ = Math.round(startZ / ROOM_SIZE);
    updateCameraPosition(camera, playerRoomX, playerRoomZ, true);
    
    scene.add(player, world);
    
    return { scene, camera, player, world, updateCameraPosition };
}
