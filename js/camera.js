import * as THREE from 'three';

const FRUSTUM_SIZE = 25;
const CAMERA_HEIGHT = 15;
const CAMERA_OFFSET = 10;

export function createCamera() {
    const aspect = window.innerWidth / window.innerHeight;
    
    const camera = new THREE.OrthographicCamera(
        FRUSTUM_SIZE * aspect / -2,
        FRUSTUM_SIZE * aspect / 2,
        FRUSTUM_SIZE / 2,
        FRUSTUM_SIZE / -2,
        0.1,
        1000
    );
    
    camera.position.set(-CAMERA_OFFSET, CAMERA_HEIGHT, CAMERA_OFFSET);
    camera.lookAt(0, 2, 0);
    
    return camera;
}

export function updateCameraPosition(camera, player) {
    const { x, z } = player.position;
    
    camera.position.set(x - CAMERA_OFFSET, CAMERA_HEIGHT, z + CAMERA_OFFSET);
    camera.lookAt(x, 2, z);
}
