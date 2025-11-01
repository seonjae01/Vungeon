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

let MAZE_WIDTH = 10;
let MAZE_HEIGHT = 10;

export function setMazeDifficulty(level) {
    const baseSize = 10;
    const sizeIncrease = level - 1;
    const mazeSize = baseSize + sizeIncrease;
    
    MAZE_WIDTH = Math.min(mazeSize, 30);
    MAZE_HEIGHT = Math.min(mazeSize, 30);
}

export function getMazeSize() {
    return { width: MAZE_WIDTH, height: MAZE_HEIGHT };
}

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

let mazeData = null;
let mazeEndCell = { x: 0, y: 0 };
let mazeStartCell = { x: 0, y: 0 };

function getNeighbors(x, y, width, height) {
    const neighbors = [];
    if (x > 0) neighbors.push([x - 1, y, 'west']);
    if (x < width - 1) neighbors.push([x + 1, y, 'east']);
    if (y > 0) neighbors.push([x, y - 1, 'north']);
    if (y < height - 1) neighbors.push([x, y + 1, 'south']);
    return neighbors;
}

function generateMaze() {
    const width = MAZE_WIDTH;
    const height = MAZE_HEIGHT;
    const cells = Array(height).fill(null).map(() => 
        Array(width).fill(null).map(() => ({
            north: true,
            south: true,
            east: true,
            west: true,
            visited: false
        }))
    );
    
    const startX = Math.floor(Math.random() * width);
    const startY = Math.floor(Math.random() * height);
    
    const stack = [];
    let currentX = startX;
    let currentY = startY;
    cells[currentY][currentX].visited = true;
    let visitedCount = 1;
    
    while (visitedCount < width * height) {
        const neighbors = getNeighbors(currentX, currentY, width, height)
            .filter(([nx, ny]) => !cells[ny][nx].visited);
        
        if (neighbors.length > 0) {
            const [nextX, nextY, direction] = neighbors[Math.floor(Math.random() * neighbors.length)];
            
            cells[currentY][currentX][direction] = false;
            
            const opposite = {
                'north': 'south',
                'south': 'north',
                'east': 'west',
                'west': 'east'
            }[direction];
            
            cells[nextY][nextX][opposite] = false;
            cells[nextY][nextX].visited = true;
            visitedCount++;
            
            stack.push([currentX, currentY]);
            currentX = nextX;
            currentY = nextY;
        } else if (stack.length > 0) {
            [currentX, currentY] = stack.pop();
        } else {
            break;
        }
    }
    
    const maxDistance = Math.sqrt(width * width + height * height);
    const minDistance = Math.floor(maxDistance * 0.5);
    
    const endCandidates = [];
    let maxDist = 0;
    
    for (let x = 0; x < width; x++) {
        for (let z = 0; z < height; z++) {
            if (x === startX && z === startY) continue;
            const distance = Math.sqrt((x - startX) ** 2 + (z - startY) ** 2);
            if (distance >= minDistance) {
                endCandidates.push({ x, y: z, distance });
                maxDist = Math.max(maxDist, distance);
            }
        }
    }
    
    if (endCandidates.length === 0) {
        for (let x = 0; x < width; x++) {
            for (let z = 0; z < height; z++) {
                if (x === startX && z === startY) continue;
                const distance = Math.sqrt((x - startX) ** 2 + (z - startY) ** 2);
                endCandidates.push({ x, y: z, distance });
                maxDist = Math.max(maxDist, distance);
            }
        }
    }
    
    const farCandidates = endCandidates.filter(c => c.distance >= maxDist * 0.7);
    const candidatesToUse = farCandidates.length > 0 ? farCandidates : endCandidates;
    
    const endCell = candidatesToUse.length > 0 
        ? candidatesToUse[Math.floor(Math.random() * candidatesToUse.length)]
        : { x: width - 1, y: height - 1 };
    
    const startCell = cells[startY][startX];
    const hasOpening = !startCell.north || !startCell.south || !startCell.east || !startCell.west;
    
    if (!hasOpening) {
        const directions = [];
        if (startX > 0) directions.push('west');
        if (startX < width - 1) directions.push('east');
        if (startY > 0) directions.push('north');
        if (startY < height - 1) directions.push('south');
        
        if (directions.length > 0) {
            const randomDir = directions[Math.floor(Math.random() * directions.length)];
            startCell[randomDir] = false;
            
            if (randomDir === 'west') cells[startY][startX - 1].east = false;
            else if (randomDir === 'east') cells[startY][startX + 1].west = false;
            else if (randomDir === 'north') cells[startY - 1][startX].south = false;
            else if (randomDir === 'south') cells[startY + 1][startX].north = false;
        }
    }
    
    return { cells, endCell, startCell: { x: startX, y: startY } };
}

function getMazeCell(cellX, cellZ) {
    if (!mazeData) return null;
    if (cellX < 0 || cellX >= MAZE_WIDTH || cellZ < 0 || cellZ >= MAZE_HEIGHT) {
        return null;
    }
    return mazeData.cells[cellZ][cellX];
}

export function isEndCell(cellX, cellZ) {
    if (!mazeData || !mazeEndCell) return false;
    return mazeEndCell.x === cellX && mazeEndCell.y === cellZ;
}

function findMatchingRoomType(cell, cellX, cellZ) {
    if (!cell) return INITIAL_ROOM_TYPE;
    
    if (isEndCell(cellX, cellZ)) {
        return 'Treasure';
    }
    
    const cellOpenings = {
        north: !cell.north,
        south: !cell.south,
        east: !cell.east,
        west: !cell.west
    };
    
    const matchingRooms = [];
    
    for (const [roomTypeName, roomType] of Object.entries(roomTypes)) {
        if (roomTypeName === 'Treasure') continue;
        
        const roomOpenings = {
            north: roomType.north,
            south: roomType.south,
            east: roomType.east,
            west: roomType.west
        };
        
        let score = 0;
        let totalOpenings = 0;
        let perfectMatch = true;
        
        for (const dir of ['north', 'south', 'east', 'west']) {
            if (cellOpenings[dir] && roomOpenings[dir]) {
                score++;
            }
            if (cellOpenings[dir]) totalOpenings++;
            if (cellOpenings[dir] !== roomOpenings[dir]) {
                perfectMatch = false;
            }
        }
        
        if (totalOpenings > 0) {
            const matchRatio = score / totalOpenings;
            if (matchRatio >= 0.5) {
                matchingRooms.push({
                    name: roomTypeName,
                    score: matchRatio,
                    perfectMatch: perfectMatch
                });
            }
        }
    }
    
    if (matchingRooms.length === 0) {
        return 'Garden';
    }
    
    const perfectMatches = matchingRooms.filter(r => r.perfectMatch);
    if (perfectMatches.length > 0) {
        const candidates = perfectMatches;
        return candidates[Math.floor(Math.random() * candidates.length)].name;
    }
    
    matchingRooms.sort((a, b) => b.score - a.score);
    const topScore = matchingRooms[0].score;
    const topMatches = matchingRooms.filter(r => Math.abs(r.score - topScore) < 0.1);
    
    return topMatches[Math.floor(Math.random() * topMatches.length)].name;
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
        if (lastTransparentRooms.size === transparentRoomKeys.size) {
            let changed = false;
        for (const key of transparentRoomKeys) {
            if (!lastTransparentRooms.has(key)) {
                    changed = true;
                    break;
                }
            }
            if (!changed) return;
        }
    }
    
    forceTransparencyUpdate = false;
    
    if (playerRoomChanged || lastWasUninitialized) {
        lastPlayerRoomX = playerRoomX;
        lastPlayerRoomZ = playerRoomZ;
    }
    
    for (const [roomKey, room] of loadedRooms) {
        if (!room) continue;
        setRoomOpacity(room, transparentRoomKeys.has(roomKey) ? 0.3 : 1.0);
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

function createMapBoundaryColliders() {
    const wallThickness = 0.5;
    const wallHeight = 5;
    
    const halfRoomSize = ROOM_SIZE / 2;
    const mapWidth = MAZE_WIDTH * ROOM_SIZE;
    const mapHeight = MAZE_HEIGHT * ROOM_SIZE;
    
    const mapMinX = -halfRoomSize;
    const mapMaxX = mapWidth - halfRoomSize;
    const mapMinZ = -halfRoomSize;
    const mapMaxZ = mapHeight - halfRoomSize;
    
    const mapCenterX = (mapMinX + mapMaxX) / 2;
    const mapCenterZ = (mapMinZ + mapMaxZ) / 2;
    
    const boundaryColliders = [
        {
            position: { x: mapCenterX, y: wallHeight / 2, z: mapMinZ - wallThickness / 2 },
            size: { x: mapWidth + wallThickness * 2, y: wallHeight, z: wallThickness }
        },
        {
            position: { x: mapCenterX, y: wallHeight / 2, z: mapMaxZ + wallThickness / 2 },
            size: { x: mapWidth + wallThickness * 2, y: wallHeight, z: wallThickness }
        },
        {
            position: { x: mapMinX - wallThickness / 2, y: wallHeight / 2, z: mapCenterZ },
            size: { x: wallThickness, y: wallHeight, z: mapHeight + wallThickness * 2 }
        },
        {
            position: { x: mapMaxX + wallThickness / 2, y: wallHeight / 2, z: mapCenterZ },
            size: { x: wallThickness, y: wallHeight, z: mapHeight + wallThickness * 2 }
        }
    ];
    
    return boundaryColliders;
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

function loadAndSetupRoom(roomType, roomX, roomZ, roomKey, world, onError) {
    loadRoomObject(roomType).then((object) => {
        if (!hasTemplate(roomType)) {
            registerTemplate(roomType, object.clone(true));
        }
        
        const room = acquire(roomType) || object;
        setupRoomFromPool(room, roomX, roomZ, roomKey, world, roomType);
        roomData.set(roomKey, roomType);
        loadingRooms.delete(roomKey);
    }).catch(onError);
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
                roomData.set(roomKey, roomType);
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
        
        loadAndSetupRoom(roomType, roomX, roomZ, roomKey, world, onError);
        
        processed++;
    }
}

export function createWorld() {
    return new Promise((resolve) => {
        const world = new THREE.Group();
        
        const mazeResult = generateMaze();
        mazeData = mazeResult;
        mazeEndCell = mazeResult.endCell;
        mazeStartCell = mazeResult.startCell;
        
        const boundaryColliders = createMapBoundaryColliders();
        roomColliders.set('boundary', boundaryColliders);
        
        const startRoomType = INITIAL_ROOM_TYPE;
        const startX = mazeStartCell.x;
        const startZ = mazeStartCell.y;
        const startKey = `${startX},${startZ}`;
        
        loadRoomObject(startRoomType).then((object) => {
            setupRoomFromPool(object, startX, startZ, startKey, world, startRoomType);
            roomData.set(startKey, startRoomType);
                
                lastPlayerRoomX = startX;
                lastPlayerRoomZ = startZ;
                lastTransparentRooms = new Set();
                forceTransparencyUpdate = true;
                
                resolve(world);
            });
    });
}

function getRoomQueueKeys() {
    if (roomQueueKeysDirty) {
        cachedRoomQueueKeys.clear();
        for (const item of roomQueue) {
            cachedRoomQueueKeys.add(item.roomKey);
        }
    roomQueueKeysDirty = false;
    }
    return cachedRoomQueueKeys;
}

export function getRoomColliders() {
    return roomColliders;
}

export function getMazeData() {
    return mazeData;
}

export function getStartCell() {
    return mazeStartCell;
}

export function getCellWorldPosition(cellX, cellZ) {
    return {
        x: cellX * ROOM_SIZE,
        z: cellZ * ROOM_SIZE
    };
}

export function resetWorld() {
    loadedRooms.clear();
    roomPositions.clear();
    roomData.clear();
    loadingRooms.clear();
    roomColliders.clear();
    removeQueue.length = 0;
    removeQueueSet.clear();
    roomQueue.length = 0;
    cachedRoomQueueKeys.clear();
    roomQueueKeysDirty = true;
    lastPlayerRoomX = Infinity;
    lastPlayerRoomZ = Infinity;
    lastTransparentRooms = new Set();
    forceTransparencyUpdate = false;
    mazeData = null;
    mazeEndCell = { x: 0, y: 0 };
    mazeStartCell = { x: 0, y: 0 };
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
            
            const cellData = getMazeCell(x, z);
            if (!cellData) continue;
            
            let roomType = roomData.get(roomKey);
            if (!roomType) {
                roomType = findMatchingRoomType(cellData, x, z);
                roomData.set(roomKey, roomType);
            }
            
            roomQueue.push({ roomKey, roomX: x, roomZ: z, roomType });
            cachedRoomQueueKeys.add(roomKey);
        }
    }
    
    processRemoveQueue(world);
    processRoomQueue(world);
}
