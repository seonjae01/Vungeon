import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { MTLLoader } from 'three/addons/loaders/MTLLoader.js';

const sharedObjLoader = new OBJLoader();
const sharedMtlLoader = new MTLLoader();

export function loadRoomObject(roomType) {
    return new Promise((resolve, reject) => {
        sharedMtlLoader.load(`assets/models/${roomType}/${roomType}.mtl`, (materials) => {
            materials.preload();
            sharedObjLoader.setMaterials(materials);
            sharedObjLoader.load(`assets/models/${roomType}/${roomType}.obj`, (object) => {
                resolve(object);
            }, undefined, reject);
        }, undefined, reject);
    });
}


