import * as THREE from 'three';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { MTLLoader } from 'three/addons/loaders/MTLLoader.js';
import { roomTypes } from './room.js';
import { registerTemplate, hasTemplate, acquire, release } from './objectPool.js';

const ROOM_SIZE = 5;
const MAX_DISTANCE = 2;
const MAX_REMOVE_PER_FRAME = 5;
const MAX_LOAD_PER_FRAME = 3;

const loadedRooms = new Map();
const roomPositions = new Map();
const roomData = new Map();
const loadingRooms = new Set();
const removeQueue = [];
const removeQueueSet = new Set();
const roomQueue = [];
let lastPlayerRoomX = Infinity;
let lastPlayerRoomZ = Infinity;


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


function processRemoveQueue(world) {
    let processed = 0;
    
    while (removeQueue.length > 0 && processed < MAX_REMOVE_PER_FRAME) {
        const roomKey = removeQueue.shift();
        removeQueueSet.delete(roomKey);
        const room = loadedRooms.get(roomKey);
        
        if (room) {
            const roomType = roomData.get(roomKey);
            
            if (room.parent === world) {
                world.remove(room);
            }
            
            if (roomType) {
                release(roomType, room);
            }
            
            loadedRooms.delete(roomKey);
            roomPositions.delete(roomKey);
        }
        processed++;
    }
}

function processRoomQueue(world) {
    let processed = 0;
    
    while (roomQueue.length > 0 && processed < MAX_LOAD_PER_FRAME) {
        const { roomKey, roomX, roomZ, roomType } = roomQueue.shift();
        cachedRoomQueueKeys.delete(roomKey);
        roomQueueKeysDirty = false;
        
        if (loadedRooms.has(roomKey) || loadingRooms.has(roomKey)) continue;
        
        if (hasTemplate(roomType)) {
            const room = acquire(roomType);
            
            if (room) {
                if (room.parent) {
                    room.parent.remove(room);
                }
                room.position.set(roomX * ROOM_SIZE, 0, roomZ * ROOM_SIZE);
                room.visible = true;
                world.add(room);
                loadedRooms.set(roomKey, room);
                roomPositions.set(roomKey, { x: roomX, z: roomZ });
                processed++;
                continue;
            }
        }
        
        loadingRooms.add(roomKey);
        
        const loader = new OBJLoader();
        const mtlLoader = new MTLLoader();
        
        const onError = () => {
            loadingRooms.delete(roomKey);
            if (roomType !== 'Thirsty Corridor') {
                roomQueue.push({ roomKey, roomX, roomZ, roomType: 'Thirsty Corridor' });
                cachedRoomQueueKeys.add(roomKey);
            }
        };
        
        mtlLoader.load(`assets/models/${roomType}/${roomType}.mtl`, (materials) => {
            materials.preload();
            loader.setMaterials(materials);
            loader.load(`assets/models/${roomType}/${roomType}.obj`, (object) => {
                if (!hasTemplate(roomType)) {
                    const template = object.clone(true);
                    registerTemplate(roomType, template);
                }
                
                let room = acquire(roomType);
                if (!room) {
                    room = object;
                }
                
                if (room.parent) {
                    room.parent.remove(room);
                }
                
                room.position.set(roomX * ROOM_SIZE, 0, roomZ * ROOM_SIZE);
                room.visible = true;
                world.add(room);
                loadedRooms.set(roomKey, room);
                roomPositions.set(roomKey, { x: roomX, z: roomZ });
                loadingRooms.delete(roomKey);
            }, undefined, onError);
        }, undefined, onError);
        
        processed++;
    }
}

export function createWorld() {
    const world = new THREE.Group();
    const loader = new OBJLoader();
    const mtlLoader = new MTLLoader();
    
    const initialRoomType = getRandomRoomType();
    roomData.set('0,0', initialRoomType);
    
    mtlLoader.load(`assets/models/${initialRoomType}/${initialRoomType}.mtl`, (materials) => {
        materials.preload();
        loader.setMaterials(materials);
        loader.load(`assets/models/${initialRoomType}/${initialRoomType}.obj`, (object) => {
            const template = object.clone(true);
            registerTemplate(initialRoomType, template);
            
            object.position.set(0, 0, 0);
            object.visible = true;
            world.add(object);
            loadedRooms.set('0,0', object);
            roomPositions.set('0,0', { x: 0, z: 0 });
        });
    });
    
    return world;
}

let cachedRoomQueueKeys = new Set();
let roomQueueKeysDirty = true;

function getRoomQueueKeys() {
    if (roomQueueKeysDirty) {
        cachedRoomQueueKeys = new Set(roomQueue.map(item => item.roomKey));
        roomQueueKeysDirty = false;
    }
    return cachedRoomQueueKeys;
}

export function generateRoomsAroundPlayer(player, world, playerRoomX, playerRoomZ) {
    const roomChanged = playerRoomX !== lastPlayerRoomX || playerRoomZ !== lastPlayerRoomZ;
    
    if (roomChanged) {
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
