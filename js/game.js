import * as THREE from 'three';
import { createScene, addLights, createFloor } from './scene.js';
import { createCamera, onWindowResize } from './camera.js';
import { createPlayer } from './player.js';
import { loadMap } from './map.js';

// 전역 변수
let scene, camera, renderer, player;
const keys = {};
const MOVE_SPEED = 0.15;

// 게임 초기화
function init() {
    console.log('Vungeon 게임 시작');
    
    // 씬 설정
    scene = createScene();
    camera = createCamera();
    
    // 조명 및 바닥 추가
    addLights(scene);
    createFloor(scene);
    
    // 맵 로드
    loadMap(scene, () => {
        console.log('맵 로드 완료');
    });
    
    // 플레이어 생성
    player = createPlayer();
    scene.add(player);
    
    // 렌더러 생성
    renderer = new THREE.WebGLRenderer({ 
        antialias: true,
        powerPreference: "high-performance"
    });
    
    // 화질 개선 설정
    renderer.setPixelRatio(window.devicePixelRatio); // 고해상도 화면 지원
    renderer.setSize(window.innerWidth, window.innerHeight);
    
    // 렌더링 품질 향상
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap; // 부드러운 그림자
    renderer.toneMapping = THREE.ACESFilmicToneMapping; // 개선된 톤매핑
    renderer.toneMappingExposure = 1;
    
    document.getElementById('gameContainer').appendChild(renderer.domElement);
    
    // 이벤트 리스너
    window.addEventListener('resize', () => onWindowResize(camera, renderer));
    
    // 키보드 입력 설정
    document.addEventListener('keydown', (event) => {
        keys[event.code] = true;
    });
    
    document.addEventListener('keyup', (event) => {
        keys[event.code] = false;
    });
    
    // 애니메이션 시작
    animate();
}

// 플레이어 이동 처리
function handlePlayerMovement() {
    const moveVector = new THREE.Vector3();

    // 카메라의 앞쪽 방향 (원점으로)
    const forward = new THREE.Vector3(0, 0, 0).sub(camera.position).normalize();
    const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();
    
    // 수평면에서만 이동 (Y는 0으로)
    forward.y = 0;
    forward.normalize();
    right.y = 0;
    right.normalize();
    
    // 카메라 기준 WASD 입력
    if (keys['KeyW']) moveVector.add(forward);
    if (keys['KeyS']) moveVector.sub(forward);
    if (keys['KeyD']) moveVector.add(right);
    if (keys['KeyA']) moveVector.sub(right);

    // 정규화 및 속도 적용
    if (moveVector.length() > 0) {
        moveVector.normalize().multiplyScalar(MOVE_SPEED);
    }

    // 플레이어 이동
    player.position.add(moveVector);
}

// 애니메이션 루프
function animate() {
    requestAnimationFrame(animate);
    
    // 플레이어 이동 처리
    handlePlayerMovement();
    
    // 렌더링 (카메라는 고정)
    renderer.render(scene, camera);
}

// 게임 시작
init();

