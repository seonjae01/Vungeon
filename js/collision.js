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

// 플레이어 이동 가능 여부 충돌 감지 (AABB)
export function canMove(player, playerPosition, moveVector, roomColliders) {
    if (moveVector.lengthSq() === 0) return true;
    
    const radius = player?.userData?.collider?.radius ?? 0.5;
    const height = player?.userData?.collider?.height ?? 1;
    const halfHeight = height * 0.5;
    const playerFootY = playerPosition.y - halfHeight;
    
    const nextX = playerPosition.x + moveVector.x;
    const nextZ = playerPosition.z + moveVector.z;
    
    const playerMinX = nextX - radius;
    const playerMaxX = nextX + radius;
    const playerMinZ = nextZ - radius;
    const playerMaxZ = nextZ + radius;
    const playerMinY = playerFootY;
    const playerMaxY = playerFootY + height;
    
    const playerBox = {
        position: { x: nextX, y: playerFootY, z: nextZ },
        size: { x: radius * 2, y: height, z: radius * 2 }
    };
    
    // 맵 경계 충돌 체크 (우선 처리)
    const boundaryKey = 'boundary';
    const boundaryColliders = roomColliders.get(boundaryKey);
    
    if (boundaryColliders && Array.isArray(boundaryColliders)) {
        for (let i = 0; i < boundaryColliders.length; i++) {
            const collider = boundaryColliders[i];
            if (!collider?.position || !collider?.size) continue;
            
            const colliderHalfX = collider.size.x * 0.5;
            const colliderHalfZ = collider.size.z * 0.5;
            const colliderMinX = collider.position.x - colliderHalfX;
            const colliderMaxX = collider.position.x + colliderHalfX;
            const colliderMinZ = collider.position.z - colliderHalfZ;
            const colliderMaxZ = collider.position.z + colliderHalfZ;
            
            if (playerMinX <= colliderMaxX && playerMaxX >= colliderMinX &&
                playerMinZ <= colliderMaxZ && playerMaxZ >= colliderMinZ) {
                const colliderHalfY = collider.size.y * 0.5;
                const colliderMinY = collider.position.y - colliderHalfY;
                const colliderMaxY = collider.position.y + colliderHalfY;
                
                if (playerMinY <= colliderMaxY && playerMaxY >= colliderMinY) {
                    return false;
                }
            }
        }
    }
    
    // 방 내부 오브젝트 충돌 체크
    for (const [key, colliders] of roomColliders) {
        if (key === boundaryKey || !Array.isArray(colliders)) continue;
        
        for (let i = 0; i < colliders.length; i++) {
            const collider = colliders[i];
            if (!collider?.position || !collider?.size) continue;
            
            if (checkBoxCollision(playerBox, collider)) {
                return false;
            }
        }
    }
    
    return true;
}
