import * as THREE from 'three';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { MTLLoader } from 'three/addons/loaders/MTLLoader.js';
import { roomTypes } from './room.js';

const ROOM_SIZE = 5;
const loadedRooms = new Map();
const roomData = new Map();
const loadingRooms = new Set();
const removeQueue = [];
const roomQueue = [];

function getRandomRoomType() {
    const roomTypeNames = Object.keys(roomTypes);
    const weights = roomTypeNames.map(name => roomTypes[name].weight);
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    
    let random = Math.random() * totalWeight;
    
    for (let i = 0; i < roomTypeNames.length; i++) {
        random -= weights[i];
        if (random <= 0) {
            return roomTypeNames[i];
        }
    }
    
    return roomTypeNames[roomTypeNames.length - 1];
}

function processRemoveQueue(world) {
    const maxProcessPerFrame = 2;
    let processed = 0;
    
    while (removeQueue.length > 0 && processed < maxProcessPerFrame) {
        const roomKey = removeQueue.shift();
        const room = loadedRooms.get(roomKey);
        
        if (room) {
            room.traverse((child) => {
                if (child.geometry) child.geometry.dispose();
                if (child.material) {
                    if (Array.isArray(child.material)) {
                        child.material.forEach(material => material.dispose());
                    } else {
                        child.material.dispose();
                    }
                }
            });
            
            world.remove(room);
            loadedRooms.delete(roomKey);
        }
        processed++;
    }
}

function processRoomQueue(world) {
    const maxProcessPerFrame = 1;
    let processed = 0;
    
    while (roomQueue.length > 0 && processed < maxProcessPerFrame) {
        const roomInfo = roomQueue.shift();
        const { roomKey, roomX, roomZ, roomType } = roomInfo;
        
        if (loadedRooms.has(roomKey) || loadingRooms.has(roomKey)) continue;
        
        loadingRooms.add(roomKey);
        
        const loader = new OBJLoader();
        const mtlLoader = new MTLLoader();
        
        mtlLoader.load(`assets/models/${roomType}/${roomType}.mtl`, (materials) => {
            materials.preload();
            
            loader.setMaterials(materials);
            loader.load(`assets/models/${roomType}/${roomType}.obj`, (object) => {
                object.position.set(roomX * ROOM_SIZE, 0, roomZ * ROOM_SIZE);
                world.add(object);
                loadedRooms.set(roomKey, object);
                loadingRooms.delete(roomKey);
            }, undefined, (error) => {
                console.error('Failed to load room:', error);
                loadingRooms.delete(roomKey);
                
                if (roomType !== 'Thirsty Corridor') {
                    roomQueue.push({ roomKey, roomX, roomZ, roomType: 'Thirsty Corridor' });
                }
            });
        }, undefined, (error) => {
            console.error('Failed to load material:', error);
            loadingRooms.delete(roomKey);
            
            if (roomType !== 'Thirsty Corridor') {
                roomQueue.push({ roomKey, roomX, roomZ, roomType: 'Thirsty Corridor' });
            }
        });
        
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
            object.position.set(0, 0, 0);
            world.add(object);
            loadedRooms.set('0,0', object);
        });
    });
    
    return world;
}

export function generateRoomsAroundPlayer(player, world) {
    const playerX = player.position.x;
    const playerZ = player.position.z;
    
    const playerRoomX = Math.round(playerX / ROOM_SIZE);
    const playerRoomZ = Math.round(playerZ / ROOM_SIZE);
    
    for (const [roomKey, room] of loadedRooms) {
        const [x, z] = roomKey.split(',').map(Number);
        const distance = Math.max(Math.abs(x - playerRoomX), Math.abs(z - playerRoomZ));
        
        if (distance > 1 && !removeQueue.includes(roomKey)) {
            removeQueue.push(roomKey);
        }
    }
    
    for (let x = playerRoomX - 1; x <= playerRoomX + 1; x++) {
        for (let z = playerRoomZ - 1; z <= playerRoomZ + 1; z++) {
            const roomKey = `${x},${z}`;
            
            if (!loadedRooms.has(roomKey) && !loadingRooms.has(roomKey)) {
                let roomType = roomData.get(roomKey) || getRandomRoomType();
                if (!roomData.has(roomKey)) {
                    roomData.set(roomKey, roomType);
                }
                
                if (!roomQueue.some(item => item.roomKey === roomKey)) {
                    roomQueue.push({ roomKey, roomX: x, roomZ: z, roomType });
                }
            }
        }
    }
    
    processRemoveQueue(world);
    processRoomQueue(world);
}
