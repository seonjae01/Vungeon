import * as THREE from 'three';
import { canMove } from './collision.js';
import { getRoomColliders } from './world.js';

const keys = {};
const moveVector = new THREE.Vector3();

export function setupInput() {
    document.addEventListener('keydown', (event) => {
        keys[event.code] = true;
    });
    
    document.addEventListener('keyup', (event) => {
        keys[event.code] = false;
    });
}

export function handlePlayerMovement(player) {
    const speed = player.moveSpeed;
    moveVector.set(0, 0, 0);
    
    if (keys['KeyW']) {
        moveVector.x += speed;
        moveVector.z -= speed;
    }
    if (keys['KeyS']) {
        moveVector.x -= speed;
        moveVector.z += speed;
    }
    if (keys['KeyD']) {
        moveVector.x += speed;
        moveVector.z += speed;
    }
    if (keys['KeyA']) {
        moveVector.x -= speed;
        moveVector.z -= speed;
    }
    
    if (moveVector.lengthSq() > 0) {
        const roomColliders = getRoomColliders();
        if (canMove(player, player.position, moveVector, roomColliders)) {
            player.position.add(moveVector);
        }
    }
}
