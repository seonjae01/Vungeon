import * as THREE from 'three';
import { loadRoomObject } from './loader.js';
import { roomTypes } from './room.js';
import { registerTemplate, hasTemplate, acquire, release } from './objectPool.js';

const roomColliders = new Map();

const ROOM_SIZE = 5;
const MAX_DISTANCE = 2;
const MAX_REMOVE_PER_FRAME = 5;
const MAX_LOAD_PER_FRAME = 3;
const INITIAL_ROOM_TYPE = 'Thirsty Corridor';

const loadedRooms = new Map();
const roomPositions = new Map();
const roomData = new Map();
const loadingRooms = new Set();
const removeQueue = [];
const removeQueueSet = new Set();
const roomQueue = [];

let lastPlayerRoomX = Infinity;
let lastPlayerRoomZ = Infinity;
let lastTransparentRooms = new Set();
let forceTransparencyUpdate = false;

let cachedRoomQueueKeys = new Set();
let roomQueueKeysDirty = true;

const roomTypeNames = Object.keys(roomTypes);
const weights = roomTypeNames.map(name => roomTypes[name].weight);
const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);

function getRandomRoomType() {
    let random = Math.random() * totalWeight;
    
    for (let i = 0; i < roomTypeNames.length; i++) {
        random -= weights[i];
        if (random <= 0) return roomTypeNames[i];
    }
    
    return roomTypeNames[roomTypeNames.length - 1];
}

function updateMaterialOpacity(material, opacity, materials, index) {
    if (opacity < 1.0) {
        if (!material.userData.isCloned) {
            materials[index] = material.clone();
            materials[index].userData.isCloned = true;
            material = materials[index];
        }
        
        if (!material.transparent || material.opacity !== opacity) {
            material.transparent = true;
            material.opacity = opacity;
            material.depthWrite = false;
            material.needsUpdate = true;
        }
        return true;
    }
    
    if (material.transparent || material.opacity !== 1.0) {
        material.transparent = false;
        material.opacity = 1.0;
        material.depthWrite = true;
        material.needsUpdate = true;
    }
    return false;
}

function setRoomOpacity(room, opacity) {
    if (!room) return;
    
    room.traverse((child) => {
        if (!child.isMesh || !child.material) return;
        
        const isArray = Array.isArray(child.material);
        const materials = isArray ? [...child.material] : [child.material];
        let materialChanged = false;
        
        for (let i = 0; i < materials.length; i++) {
            if (!materials[i]) continue;
            if (updateMaterialOpacity(materials[i], opacity, materials, i)) {
                materialChanged = true;
            }
        }
        
        if (!materialChanged) return;
        
        child.material = isArray ? materials : materials[0];
        if (child.material) {
            if (Array.isArray(child.material)) {
                child.material.forEach(m => m.needsUpdate = true);
            } else {
                child.material.needsUpdate = true;
            }
        }
    });
}

function updateRoomTransparency(playerRoomX, playerRoomZ) {
    const playerRoomChanged = lastPlayerRoomX !== playerRoomX || lastPlayerRoomZ !== playerRoomZ;
    const lastWasUninitialized = lastPlayerRoomX === Infinity || lastPlayerRoomZ === Infinity;
    
    if (lastWasUninitialized) {
        lastPlayerRoomX = playerRoomX;
        lastPlayerRoomZ = playerRoomZ;
    }
    
    const southKey = `${playerRoomX},${playerRoomZ + 1}`;
    const westKey = `${playerRoomX - 1},${playerRoomZ}`;
    const southwestKey = `${playerRoomX - 1},${playerRoomZ + 1}`;
    const transparentRoomKeys = new Set([southKey, westKey, southwestKey]);
    
    if (!forceTransparencyUpdate && !playerRoomChanged && !lastWasUninitialized) {
        let transparencyChanged = lastTransparentRooms.size !== transparentRoomKeys.size;
        if (!transparencyChanged) {
            for (const key of transparentRoomKeys) {
                if (!lastTransparentRooms.has(key)) {
                    transparencyChanged = true;
                    break;
                }
            }
        }
        if (!transparencyChanged) return;
    }
    
    forceTransparencyUpdate = false;
    
    if (playerRoomChanged || lastWasUninitialized) {
        lastPlayerRoomX = playerRoomX;
        lastPlayerRoomZ = playerRoomZ;
    }
    
    for (const [roomKey, room] of loadedRooms) {
        if (!room) continue;
        setRoomOpacity(room, transparentRoomKeys.has(roomKey) ? 0.1 : 1.0);
    }
    
    lastTransparentRooms = transparentRoomKeys;
}

function processRemoveQueue(world) {
    let processed = 0;
    
    while (removeQueue.length > 0 && processed < MAX_REMOVE_PER_FRAME) {
        const roomKey = removeQueue.shift();
        removeQueueSet.delete(roomKey);
        const room = loadedRooms.get(roomKey);
        
        if (!room) {
            processed++;
            continue;
        }
        
        const roomType = roomData.get(roomKey);
        
        if (room.parent === world) world.remove(room);
        if (roomType) release(roomType, room);
        
        loadedRooms.delete(roomKey);
        roomPositions.delete(roomKey);
        processed++;
    }
}

function createWorldColliders(roomType, roomX, roomZ) {
    const colliders = roomTypes[roomType]?.colliders || [];
    return colliders.map(collider => ({
        position: {
            x: collider.position.x + roomX * ROOM_SIZE,
            y: collider.position.y,
            z: collider.position.z + roomZ * ROOM_SIZE
        },
        size: collider.size
    }));
}

function setupRoomFromPool(room, roomX, roomZ, roomKey, world, roomType) {
    if (room.parent) room.parent.remove(room);
    
    room.position.set(roomX * ROOM_SIZE, 0, roomZ * ROOM_SIZE);
    room.visible = true;
    
    roomColliders.set(roomKey, createWorldColliders(roomType, roomX, roomZ));
    world.add(room);
    loadedRooms.set(roomKey, room);
    roomPositions.set(roomKey, { x: roomX, z: roomZ });
    forceTransparencyUpdate = true;
}

function processRoomQueue(world) {
    let processed = 0;
    
    while (roomQueue.length > 0 && processed < MAX_LOAD_PER_FRAME) {
        const { roomKey, roomX, roomZ, roomType } = roomQueue.shift();
        cachedRoomQueueKeys.delete(roomKey);
        roomQueueKeysDirty = false;
        
        if (loadedRooms.has(roomKey) || loadingRooms.has(roomKey)) {
            processed++;
            continue;
        }
        
        if (hasTemplate(roomType)) {
            const room = acquire(roomType);
            if (room) {
                setupRoomFromPool(room, roomX, roomZ, roomKey, world, roomType);
                processed++;
                continue;
            }
        }
        
        loadingRooms.add(roomKey);
        
        const onError = () => {
            loadingRooms.delete(roomKey);
            if (roomType !== INITIAL_ROOM_TYPE) {
                roomQueue.push({ roomKey, roomX, roomZ, roomType: INITIAL_ROOM_TYPE });
                cachedRoomQueueKeys.add(roomKey);
            }
        };
        
        loadRoomObject(roomType).then((object) => {
            if (!hasTemplate(roomType)) {
                registerTemplate(roomType, object.clone(true));
            }
            
            const room = acquire(roomType) || object;
            if (room.parent) room.parent.remove(room);
            
            room.position.set(roomX * ROOM_SIZE, 0, roomZ * ROOM_SIZE);
            room.visible = true;
            
            roomColliders.set(roomKey, createWorldColliders(roomType, roomX, roomZ));
            world.add(room);
            loadedRooms.set(roomKey, room);
            roomPositions.set(roomKey, { x: roomX, z: roomZ });
            forceTransparencyUpdate = true;
            loadingRooms.delete(roomKey);
        }).catch(onError);
        
        processed++;
    }
}

export function createWorld() {
    return new Promise((resolve) => {
        const world = new THREE.Group();
        
        loadRoomObject(INITIAL_ROOM_TYPE).then((object) => {
            object.position.set(0, 0, 0);
            object.visible = true;
            
            roomColliders.set('0,0', createWorldColliders(INITIAL_ROOM_TYPE, 0, 0));
            world.add(object);
            loadedRooms.set('0,0', object);
            roomPositions.set('0,0', { x: 0, z: 0 });
            
            lastPlayerRoomX = 0;
            lastPlayerRoomZ = 0;
            lastTransparentRooms = new Set();
            forceTransparencyUpdate = true;
            
            resolve(world);
        });
    });
}

function getRoomQueueKeys() {
    if (!roomQueueKeysDirty) return cachedRoomQueueKeys;
    
    cachedRoomQueueKeys = new Set(roomQueue.map(item => item.roomKey));
    roomQueueKeysDirty = false;
    return cachedRoomQueueKeys;
}

export function getRoomColliders() {
    return roomColliders;
}

export function generateRoomsAroundPlayer(world, playerRoomX, playerRoomZ) {
    const roomChanged = playerRoomX !== lastPlayerRoomX || playerRoomZ !== lastPlayerRoomZ;
    
    if (roomChanged || lastPlayerRoomX === Infinity) {
        lastPlayerRoomX = playerRoomX;
        lastPlayerRoomZ = playerRoomZ;
        
        for (const [roomKey, pos] of roomPositions) {
            const distance = Math.max(Math.abs(pos.x - playerRoomX), Math.abs(pos.z - playerRoomZ));
            
            if (distance > MAX_DISTANCE && !removeQueueSet.has(roomKey)) {
                removeQueue.push(roomKey);
                removeQueueSet.add(roomKey);
            }
        }
        
        roomQueueKeysDirty = true;
    }
    
    updateRoomTransparency(playerRoomX, playerRoomZ);
    
    const roomQueueKeys = getRoomQueueKeys();
    
    for (let x = playerRoomX - MAX_DISTANCE; x <= playerRoomX + MAX_DISTANCE; x++) {
        for (let z = playerRoomZ - MAX_DISTANCE; z <= playerRoomZ + MAX_DISTANCE; z++) {
            const roomKey = `${x},${z}`;
            
            if (loadedRooms.has(roomKey)) continue;
            if (loadingRooms.has(roomKey) || roomQueueKeys.has(roomKey)) continue;
            
            const roomType = roomData.get(roomKey) || getRandomRoomType();
            if (!roomData.has(roomKey)) roomData.set(roomKey, roomType);
            
            roomQueue.push({ roomKey, roomX: x, roomZ: z, roomType });
            cachedRoomQueueKeys.add(roomKey);
        }
    }
    
    processRemoveQueue(world);
    processRoomQueue(world);
}
