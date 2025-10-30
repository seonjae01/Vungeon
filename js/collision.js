import * as THREE from 'three';

const COLLIDER_TYPES = {
    BOX: 'box'
};

let showColliders = false;
const colliderVisualizations = new Map();

export function toggleColliderVisualization() {
    showColliders = !showColliders;
    return showColliders;
}

export function isColliderVisualizationEnabled() {
    return showColliders;
}

function createColliderVisualization(colliderData) {
    if (!colliderData || !colliderData.size || !colliderData.position) {
        return null;
    }
    
    const geometry = new THREE.BoxGeometry(
        colliderData.size.x,
        colliderData.size.y,
        colliderData.size.z
    );
    const material = new THREE.MeshBasicMaterial({ 
        color: 0x00ff00, 
        wireframe: true,
        transparent: true,
        opacity: 0.8
    });
    const wireframe = new THREE.Mesh(geometry, material);
    
    wireframe.position.set(
        colliderData.position.x,
        colliderData.position.y + colliderData.size.y / 2,
        colliderData.position.z
    );
    
    wireframe.userData.isColliderVisualization = true;
    wireframe.userData.colliderData = colliderData;
    
    return wireframe;
}

function removeColliderVisualization(key) {
    const visualization = colliderVisualizations.get(key);
    if (visualization && visualization.parent) {
        visualization.parent.remove(visualization);
        visualization.geometry.dispose();
        visualization.material.dispose();
    }
    colliderVisualizations.delete(key);
}

export function updateColliderVisualization(key, colliderData, room) {
    if (!colliderData || !room) {
        removeColliderVisualization(key);
        return;
    }
    
    if (!showColliders) {
        removeColliderVisualization(key);
        return;
    }
    
    let visualization = colliderVisualizations.get(key);
    
    if (!visualization) {
        visualization = createColliderVisualization(colliderData);
        if (visualization) {
            room.add(visualization);
            colliderVisualizations.set(key, visualization);
        }
    } else {
        visualization.position.set(
            colliderData.position.x,
            colliderData.position.y + colliderData.size.y / 2,
            colliderData.position.z
        );
        const params = visualization.geometry.parameters;
        visualization.scale.set(
            colliderData.size.x / params.width,
            colliderData.size.y / params.height,
            colliderData.size.z / params.depth
        );
        visualization.visible = true;
    }
}

export function updateAllColliderVisualizations(world, roomCollidersMap, loadedRoomsMap) {
    for (const [key, visualization] of colliderVisualizations.entries()) {
        if (visualization && visualization.parent) {
            visualization.visible = showColliders;
        }
    }
    
    if (world && showColliders && roomCollidersMap && loadedRoomsMap) {
        for (const [roomKey, colliders] of roomCollidersMap.entries()) {
            const room = loadedRoomsMap.get(roomKey);
            if (!room) continue;
            
            for (let i = 0; i < colliders.length; i++) {
                const colliderKey = `${roomKey}_${i}`;
                if (!colliderVisualizations.has(colliderKey)) {
                    updateColliderVisualization(colliderKey, colliders[i], room);
                } else {
                    const visualization = colliderVisualizations.get(colliderKey);
                    if (visualization) {
                        visualization.visible = true;
                    }
                }
            }
        }
    } else if (!showColliders) {
        for (const [key, visualization] of colliderVisualizations.entries()) {
            if (visualization) {
                visualization.visible = false;
            }
        }
    }
}

export function checkBoxCollision(box1, box2) {
    const b1Min = new THREE.Vector3(
        box1.position.x - box1.size.x / 2,
        box1.position.y,
        box1.position.z - box1.size.z / 2
    );
    const b1Max = new THREE.Vector3(
        box1.position.x + box1.size.x / 2,
        box1.position.y + box1.size.y,
        box1.position.z + box1.size.z / 2
    );
    
    const b2Min = new THREE.Vector3(
        box2.position.x - box2.size.x / 2,
        box2.position.y,
        box2.position.z - box2.size.z / 2
    );
    const b2Max = new THREE.Vector3(
        box2.position.x + box2.size.x / 2,
        box2.position.y + box2.size.y,
        box2.position.z + box2.size.z / 2
    );
    
    return b1Min.x <= b2Max.x && b1Max.x >= b2Min.x &&
           b1Min.y <= b2Max.y && b1Max.y >= b2Min.y &&
           b1Min.z <= b2Max.z && b1Max.z >= b2Min.z;
}

export function canMove(player, playerPosition, world, moveVector, roomColliders) {
    if (moveVector.length() === 0) return true;
    
    const radius = player?.userData?.collider?.radius ?? 0.5;
    const height = player?.userData?.collider?.height ?? 1;
    const playerCenterY = playerPosition.y;
    const playerFootY = playerCenterY - height / 2;
    
    const newPos = new THREE.Vector3(
        playerPosition.x + moveVector.x,
        playerFootY,
        playerPosition.z + moveVector.z
    );
    
    const playerBox = {
        position: {
            x: newPos.x,
            y: playerFootY,
            z: newPos.z
        },
        size: {
            x: radius * 2,
            y: height,
            z: radius * 2
        }
    };
    
    for (const [roomKey, colliders] of roomColliders.entries()) {
        for (const collider of colliders) {
            if (checkBoxCollision(playerBox, collider)) {
                return false;
            }
        }
    }
    
    return true;
}

// removed duplicate export

