import * as THREE from 'three';

const FRUSTUM_SIZE = 7;
const CAMERA_HEIGHT = 15;
const CAMERA_OFFSET = 10;
const LERP_SPEED = 0.05;
const ROOM_SIZE = 5;

let currentRoomX = 0;
let currentRoomZ = 0;
let targetPosition = new THREE.Vector3();

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

export function updateCameraPosition(camera, player, playerRoomX, playerRoomZ) {
    if (playerRoomX !== currentRoomX || playerRoomZ !== currentRoomZ) {
        currentRoomX = playerRoomX;
        currentRoomZ = playerRoomZ;
        
        const roomCenterX = currentRoomX * ROOM_SIZE;
        const roomCenterZ = currentRoomZ * ROOM_SIZE;
        
        targetPosition.set(roomCenterX - CAMERA_OFFSET, CAMERA_HEIGHT, roomCenterZ + CAMERA_OFFSET);
    }
    
    camera.position.lerp(targetPosition, LERP_SPEED);
}
