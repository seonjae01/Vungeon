import * as THREE from 'three';

export function checkBoxCollision(box1, box2) {
    const b1HalfX = box1.size.x * 0.5;
    const b1HalfZ = box1.size.z * 0.5;
    const b2HalfX = box2.size.x * 0.5;
    const b2HalfZ = box2.size.z * 0.5;
    
    return box1.position.x - b1HalfX <= box2.position.x + b2HalfX &&
           box1.position.x + b1HalfX >= box2.position.x - b2HalfX &&
           box1.position.y <= box2.position.y + box2.size.y &&
           box1.position.y + box1.size.y >= box2.position.y &&
           box1.position.z - b1HalfZ <= box2.position.z + b2HalfZ &&
           box1.position.z + b1HalfZ >= box2.position.z - b2HalfZ;
}

export function canMove(player, playerPosition, moveVector, roomColliders) {
    if (moveVector.lengthSq() === 0) return true;
    
    const radius = player?.userData?.collider?.radius ?? 0.5;
    const height = player?.userData?.collider?.height ?? 1;
    const playerFootY = playerPosition.y - height * 0.5;
    
    const playerBox = {
        position: {
            x: playerPosition.x + moveVector.x,
            y: playerFootY,
            z: playerPosition.z + moveVector.z
        },
        size: {
            x: radius * 2,
            y: height,
            z: radius * 2
        }
    };
    
    for (const colliders of roomColliders.values()) {
        for (const collider of colliders) {
            if (checkBoxCollision(playerBox, collider)) {
                return false;
            }
        }
    }
    
    return true;
}
