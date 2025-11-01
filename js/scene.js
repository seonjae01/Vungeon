import * as THREE from 'three';
import { createPlayer } from './player.js';
import { createCamera, updateCameraPosition } from './camera.js';
import { createWorld, getStartCell, getCellWorldPosition } from './world.js';

export async function createScene() {
    const scene = new THREE.Scene();
    
    scene.background = new THREE.Color(0x2a2a3e);
    
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 20, 10);
    directionalLight.castShadow = false;
    scene.add(directionalLight);
    
    const pointLight = new THREE.PointLight(0xffaa00, 0.5, 50);
    pointLight.position.set(0, 10, 0);
    scene.add(pointLight);
    
    const player = createPlayer();
    const world = await createWorld();
    const camera = createCamera();
    
    const startCell = getStartCell();
    const startX = startCell.x * 5;
    const startZ = startCell.y * 5;
    
    player.position.set(startX, 1.8, startZ);
    
    const playerRoomX = Math.round(startX / 5);
    const playerRoomZ = Math.round(startZ / 5);
    updateCameraPosition(camera, playerRoomX, playerRoomZ, true);
    
    scene.add(player, world);
    
    return { scene, camera, player, world, updateCameraPosition };
}
