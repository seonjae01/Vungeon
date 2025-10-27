import * as THREE from 'three';

// 게임 설정
let scene, camera, renderer;

// 초기화
function init() {
    console.log('Vungeon 게임 시작');
    
    // 씬 생성
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a1a);

    // 카메라 생성
    camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );
    camera.position.set(0, 5, 10);
    camera.lookAt(0, 0, 0);

    // 조명
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 5);
    scene.add(directionalLight);

    // Renderer 생성
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    document.getElementById('gameContainer').appendChild(renderer.domElement);

    // 이벤트 리스너
    window.addEventListener('resize', onWindowResize);

    // 애니메이션 시작
    animate();

    // UI 업데이트
    document.getElementById('ui').innerHTML = '<h1>Vungeon</h1><div>게임 준비 완료</div>';
}

// 애니메이션 루프
function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}

// 화면 크기 조정
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// 게임 시작
init();
