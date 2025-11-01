export const roomTypes = {
    'Boss Room': {
        north: false,
        south: true,
        east: false,
        west: true,
        colliders: [
            { position: { x: 2.5, y: 0, z: 0 }, size: { x: 0.3, y: 5, z: 5 } },
            { position: { x: 0, y: 0, z: -2.5 }, size: { x: 5, y: 5, z: 0.3 } },
            { position: { x: 1.5, y: 0, z: -2 }, size: { x: 0.3, y: 5, z: 0.2 } },
            { position: { x: -1.5, y: 0, z: -2 }, size: { x: 0.3, y: 5, z: 0.2 } },
            { position: { x: 2, y: 0, z: 1.5 }, size: { x: 0.3, y: 5, z: 0.2 } },
            { position: { x: 2, y: 0, z: -1.5 }, size: { x: 0.3, y: 5, z: 0.2 } }
        ]
    },
    'Dragon Room': {
        north: false,
        south: true,
        east: false,
        west: true,
        colliders: [
            { position: { x: 2.5, y: 0, z: 0 }, size: { x: 0.3, y: 5, z: 5 } },
            { position: { x: 0, y: 0, z: -2.5 }, size: { x: 5, y: 5, z: 0.3 } },
            { position: { x: 1.2, y: 0, z: -1.8 }, size: { x: 0.8, y: 2, z: 0.5 } },
            { position: { x: -1.2, y: 0, z: -1.8 }, size: { x: 0.8, y: 2, z: 0.5 } }
        ]
    },
    'Garden': {
        north: true,
        south: true,
        east: true,
        west: true,
        colliders: [
            { position: { x: 2.5, y: 0, z: -1.5 }, size: { x: 0.3, y: 5, z: 1.8 } },
            { position: { x: 2.5, y: 0, z: 1.5 }, size: { x: 0.3, y: 5, z: 1.8 } },
            { position: { x: 1.5, y: 0, z: -2.5 }, size: { x: 1.8, y: 5, z: 0.3 } },
            { position: { x: -1.5, y: 0, z: -2.5 }, size: { x: 1.8, y: 5, z: 0.3 } },
            { position: { x: 0, y: 0, z: 0 }, size: { x: 1.4, y: 4, z: 1.4 } }
        ]
    },
    'King Throne': {
        north: false,
        south: true,
        east: true,
        west: true,
        colliders: [
            { position: { x: 2.5, y: 0, z: -1.5 }, size: { x: 0.3, y: 5, z: 1.8 } },
            { position: { x: 2.5, y: 0, z: 1.5 }, size: { x: 0.3, y: 5, z: 1.8 } },
            { position: { x: 0, y: 0, z: -2.5 }, size: { x: 5, y: 5, z: 0.3 } },
            { position: { x: 2, y: 0, z: -1.5 }, size: { x: 0.5, y: 5, z: 0.5 } },
            { position: { x: 2, y: 0, z: 1.5 }, size: { x: 0.5, y: 5, z: 0.5 } },
            { position: { x: 0, y: 0, z: -1 }, size: { x: 2, y: 4, z: 1.4 } }
        ]
    },
    'Princess Chamber': {
        north: false,
        south: true,
        east: false,
        west: true,
        colliders: [
            { position: { x: 2.5, y: 0, z: 0 }, size: { x: 0.3, y: 5, z: 5 } },
            { position: { x: 0, y: 0, z: -2.5 }, size: { x: 5, y: 5, z: 0.3 } },
            { position: { x: 0, y: 0, z: -1 }, size: { x: 1.4, y: 4, z: 1.6 } },
            { position: { x: 2, y: 0, z: 2 }, size: { x: 0.6, y: 2, z: 0.6 } },
            { position: { x: -2, y: 0, z: 2 }, size: { x: 0.6, y: 2, z: 0.6 } }
        ]
    },
    'Thirsty Corridor': {
        north: true,
        south: true,
        east: true,
        west: true,
        colliders: [
            { position: { x: 2.5, y: 0, z: -1.5 }, size: { x: 0.3, y: 5, z: 1.8 } },
            { position: { x: 2.5, y: 0, z: 1.5 }, size: { x: 0.3, y: 5, z: 1.8 } },
            { position: { x: 1.5, y: 0, z: -2.5 }, size: { x: 1.8, y: 5, z: 0.3 } },
            { position: { x: -1.5, y: 0, z: -2.5 }, size: { x: 1.8, y: 5, z: 0.3 } },
            { position: { x: 1.65, y: 0, z: -1.8 }, size: { x: 1, y: 5, z: 0.5 } },
            { position: { x: -1.65, y: 0, z: -1.8 }, size: { x: 1, y: 5, z: 0.5 } }
        ]
    },
    'Trapped Room': {
        north: false,
        south: true,
        east: true,
        west: true,
        colliders: [
            { position: { x: 2.5, y: 0, z: -1.5 }, size: { x: 0.3, y: 5, z: 1.8 } },
            { position: { x: 2.5, y: 0, z: 1.5 }, size: { x: 0.3, y: 5, z: 1.8 } },
            { position: { x: 0, y: 0, z: -2.5 }, size: { x: 5, y: 5, z: 0.3 } },
            { position: { x: 0, y: 0, z: 0 }, size: { x: 0.6, y: 2, z: 0.6 } },
            { position: { x: -1, y: 0, z: 1 }, size: { x: 0.6, y: 2, z: 0.6 } },
            { position: { x: -1, y: 0, z: -1 }, size: { x: 0.6, y: 2, z: 0.6 } }
        ]
    },
    'Treasure': {
        north: true,
        south: true,
        east: false,
        west: true,
        colliders: [
            { position: { x: 2.5, y: 0, z: 0 }, size: { x: 0.3, y: 5, z: 5 } },
            { position: { x: 1.5, y: 0, z: -2.5 }, size: { x: 1.8, y: 5, z: 0.3 } },
            { position: { x: -1.5, y: 0, z: -2.5 }, size: { x: 1.8, y: 5, z: 0.3 } },
            { position: { x: 0.2, y: 0, z: 0.3 }, size: { x: 1.6, y: 3, z: 2.4 } },
            { position: { x: -1.6, y: 0, z: 1.9 }, size: { x: 0.8, y: 3, z: 0.8 } },
            { position: { x: -1.6, y: 0, z: -1.5 }, size: { x: 0.8, y: 3, z: 0.8 } }
        ]
    }
};
