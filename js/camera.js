import * as THREE from 'three';

const FRUSTUM_SIZE = 7;
const CAMERA_HEIGHT = 15;
const CAMERA_OFFSET = 10;
const LERP_SPEED = 0.05;
const ROOM_SIZE = 5;

let currentRoomX = 0;
let currentRoomZ = 0;
const targetPosition = new THREE.Vector3();

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
    
    targetPosition.copy(camera.position);
    
    return camera;
}

export function updateCameraPosition(camera, playerRoomX, playerRoomZ, immediate = false) {
    if (playerRoomX === currentRoomX && playerRoomZ === currentRoomZ && !immediate) {
        camera.position.lerp(targetPosition, LERP_SPEED);
        return;
    }
    
    currentRoomX = playerRoomX;
    currentRoomZ = playerRoomZ;
    
    targetPosition.set(
        currentRoomX * ROOM_SIZE - CAMERA_OFFSET,
        CAMERA_HEIGHT,
        currentRoomZ * ROOM_SIZE + CAMERA_OFFSET
    );
    
    if (immediate) {
        camera.position.copy(targetPosition);
    } else {
        camera.position.lerp(targetPosition, LERP_SPEED);
    }
}
