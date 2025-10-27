import * as THREE from 'three';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { MTLLoader } from 'three/addons/loaders/MTLLoader.js';

// 맵 로드 함수
export function loadMap(scene, onComplete) {
    const mtlLoader = new MTLLoader();
    const objLoader = new OBJLoader();

    // MTL 파일 경로 설정
    mtlLoader.setPath('assets/models/Dragon Room/');
    
    // MTL 파일 로드
    mtlLoader.load('Dragon Room.mtl', (materials) => {
        materials.preload();
        
        // 텍스처 품질 개선
        materials.materials.palette = materials.materials.palette || new THREE.MeshStandardMaterial();
        
        // 모든 텍스처에 고품질 필터링 적용
        if (materials.materials.palette.map) {
            materials.materials.palette.map.minFilter = THREE.LinearFilter;
            materials.materials.palette.map.magFilter = THREE.LinearFilter;
            materials.materials.palette.map.generateMipmaps = true;
        }
        
        // OBJ 로더에 재질 적용 및 경로 설정
        objLoader.setMaterials(materials);
        objLoader.setPath('assets/models/Dragon Room/');
        
        // OBJ 파일 로드
        objLoader.load('Dragon Room.obj', (object) => {
            // 반시계방향으로 90도 회전 (Y축 기준)
            object.rotation.y = Math.PI / 2;
            
            // 모든 메쉬의 텍스처 품질 개선
            object.traverse((child) => {
                if (child.isMesh && child.material) {
                    if (child.material.map) {
                        child.material.map.minFilter = THREE.LinearFilter;
                        child.material.map.magFilter = THREE.LinearFilter;
                        child.material.map.generateMipmaps = true;
                    }
                }
            });
            
            scene.add(object);
            console.log('맵 로드 완료:', object);
            if (onComplete) onComplete();
        }, (progress) => {
            console.log('맵 로딩 진행:', (progress.loaded / progress.total * 100) + '%');
        }, (error) => {
            console.error('맵 로드 실패:', error);
        });
    });
}

