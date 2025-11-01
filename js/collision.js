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
    
    const nextX = playerPosition.x + moveVector.x;
    const nextZ = playerPosition.z + moveVector.z;
    
    const playerBox = {
        position: {
            x: nextX,
            y: playerFootY,
            z: nextZ
        },
        size: {
            x: radius * 2,
            y: height,
            z: radius * 2
        }
    };
    
    const boundaryKey = 'boundary';
    const boundaryColliders = roomColliders.get(boundaryKey);
    
    if (boundaryColliders && Array.isArray(boundaryColliders)) {
        for (const collider of boundaryColliders) {
            if (!collider || !collider.position || !collider.size) continue;
            
            const playerMinX = nextX - radius;
            const playerMaxX = nextX + radius;
            const playerMinZ = nextZ - radius;
            const playerMaxZ = nextZ + radius;
            
            const colliderMinX = collider.position.x - collider.size.x / 2;
            const colliderMaxX = collider.position.x + collider.size.x / 2;
            const colliderMinZ = collider.position.z - collider.size.z / 2;
            const colliderMaxZ = collider.position.z + collider.size.z / 2;
            
            const xOverlap = playerMinX <= colliderMaxX && playerMaxX >= colliderMinX;
            const zOverlap = playerMinZ <= colliderMaxZ && playerMaxZ >= colliderMinZ;
            
            if (xOverlap && zOverlap) {
                const playerMinY = playerFootY;
                const playerMaxY = playerFootY + height;
                const colliderMinY = collider.position.y - collider.size.y / 2;
                const colliderMaxY = collider.position.y + collider.size.y / 2;
                
                const yOverlap = playerMinY <= colliderMaxY && playerMaxY >= colliderMinY;
                
                if (yOverlap) {
                    return false;
                }
            }
        }
    }
    
    for (const [key, colliders] of roomColliders) {
        if (key === boundaryKey) continue;
        if (!Array.isArray(colliders)) continue;
        
        for (const collider of colliders) {
            if (!collider || !collider.position || !collider.size) continue;
            
            if (checkBoxCollision(playerBox, collider)) {
                return false;
            }
        }
    }
    
    return true;
}
