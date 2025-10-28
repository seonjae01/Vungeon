import * as THREE from 'three';

const PLAYER_RADIUS = 0.5;
const PLAYER_HEIGHT = 1;
const PLAYER_SEGMENTS = 32;
const PLAYER_COLOR = 0xffffff;
const PLAYER_Y = 2;
const MOVE_SPEED = 0.05;

export function createPlayer() {
    const geometry = new THREE.CylinderGeometry(PLAYER_RADIUS, PLAYER_RADIUS, PLAYER_HEIGHT, PLAYER_SEGMENTS);
    const material = new THREE.MeshBasicMaterial({ color: PLAYER_COLOR });
    const player = new THREE.Mesh(geometry, material);
    
    player.position.set(0, PLAYER_Y, 0);
    player.moveSpeed = MOVE_SPEED;
    
    return player;
}
