import * as THREE from 'three';
import { createPlayer } from './player.js';
import { createCamera, updateCameraPosition } from './camera.js';
import { createWorld } from './world.js';

export function createScene() {
    const scene = new THREE.Scene();
    
    scene.background = new THREE.Color(0xD2B48C);
    
    scene.add(new THREE.AmbientLight(0xffffff, 1));
    
    const player = createPlayer();
    const world = createWorld();
    const camera = createCamera();
    
    scene.add(player, world);
    
    return { scene, camera, player, world, updateCameraPosition };
}
