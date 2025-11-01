import * as THREE from 'three';

const PLAYER_WIDTH = 0.4;
const PLAYER_HEIGHT = 1;
const PLAYER_DEPTH = 0.4;
const PLAYER_COLOR = 0xffffff;
const PLAYER_Y = 1.8;
const MOVE_SPEED = 0.05;
export function createPlayer() {
    const geometry = new THREE.BoxGeometry(PLAYER_WIDTH, PLAYER_HEIGHT, PLAYER_DEPTH);
    const material = new THREE.MeshBasicMaterial({ color: PLAYER_COLOR });
    const player = new THREE.Mesh(geometry, material);
    
    const edgesGeometry = new THREE.EdgesGeometry(geometry);
    const outlineMaterial = new THREE.LineBasicMaterial({ 
        color: 0x000000,
        linewidth: 2
    });
    const outline = new THREE.LineSegments(edgesGeometry, outlineMaterial);
    player.add(outline);
    
    player.position.set(0, PLAYER_Y, 0);
    player.moveSpeed = MOVE_SPEED;
    player.userData.collider = { radius: PLAYER_WIDTH / 2, height: PLAYER_HEIGHT };
    
    return player;
}
