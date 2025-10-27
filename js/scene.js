import * as THREE from 'three';

// 씬 생성
export function createScene() {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a1a);
    return scene;
}

// 조명 추가
export function addLights(scene) {
    // 환경 조명
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    // 방향 조명
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 5);
    directionalLight.castShadow = true;
    scene.add(directionalLight);
}

// 바닥 생성
export function createFloor(scene) {
    // 바닥
    const floorGeometry = new THREE.PlaneGeometry(100, 100);
    const floorMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x404040,
        roughness: 0.8,
        metalness: 0.2
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -1;
    floor.receiveShadow = true;
    scene.add(floor);
    
    // 그리드 헬퍼 (디버깅용)
    const gridHelper = new THREE.GridHelper(100, 50, 0x666666, 0x444444);
    gridHelper.position.y = -0.99;
    scene.add(gridHelper);
}

