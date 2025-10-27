import * as THREE from 'three';

// 카메라 생성 (Isometric 뷰)
export function createCamera() {
    const camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );
    // Isometric 뷰: 비스듬한 각도로 고정
    camera.position.set(10, 10, 10);
    camera.lookAt(0, 0, 0); // 원점을 바라보도록
    return camera;
}

// 카메라가 플레이어를 따라가도록 설정
export function followPlayer(camera, player) {
    camera.position.x = player.position.x;
    camera.position.z = player.position.z + 4;
    camera.lookAt(player.position.x, player.position.y, player.position.z);
}

// 화면 크기 조정
export function onWindowResize(camera, renderer) {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

