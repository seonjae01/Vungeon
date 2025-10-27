import * as THREE from 'three';

// 플레이어 설정
const MOVE_SPEED = 0.15;

// 플레이어 생성
export function createPlayer() {
    // 캡슐 형태 (CapsuleGeometry는 Three.js에 없으므로 CylinderGeometry 사용)
    const geometry = new THREE.CylinderGeometry(0.5, 0.5, 1, 32);
    const material = new THREE.MeshStandardMaterial({ 
        color: 0x4a90e2,
        metalness: 0.3,
        roughness: 0.4
    });
    const player = new THREE.Mesh(geometry, material);
    player.position.set(0, 0.5, 0); // 바닥에 닿도록 y=0.5에 배치
    player.castShadow = true;
    player.receiveShadow = true;
    
    return player;
}

