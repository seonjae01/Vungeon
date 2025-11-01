import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { createScene } from './scene.js';
import { setupInput, handlePlayerMovement } from './input.js';
import { generateRoomsAroundPlayer, isEndCell, resetWorld, setMazeDifficulty } from './world.js';

const FRUSTUM_SIZE = 5;
const ROOM_SIZE = 5;
const BLUR_LERP_SPEED = 0.05;

let scene, camera, renderer, player, world, updateCameraPosition;
let composer = null;
let isLoading = true;
let blurAmount = 10;
let gameStarted = false;
let gameCompleted = false;
let restartTimer = null;
let isFirstGame = true;
let animationId = null;
let gameStartTime = null;
let timerInterval = null;
let difficultyLevel = 1;

let timerElement = null;
let successUI = null;
let finalTimeElement = null;
let levelUI = null;
let levelNumber = null;
let startUI = null;
let autoStartTimer = null;

function updateBlur() {
    if (!isLoading || !renderer?.domElement) return;
    
    blurAmount = Math.max(0, blurAmount - BLUR_LERP_SPEED * blurAmount);
    
    if (blurAmount <= 0.1) {
        isLoading = false;
        renderer.domElement.style.filter = '';
        return;
    }
    
    renderer.domElement.style.filter = `blur(${blurAmount}px)`;
}

function showStartUI() {
    if (!isFirstGame) return;
    
    if (!startUI) startUI = document.getElementById('startUI');
    
    if (startUI) {
        startUI.classList.remove('hidden');
        
        if (autoStartTimer) {
            clearTimeout(autoStartTimer);
        }
        
        autoStartTimer = setTimeout(() => {
            startUI.classList.add('hidden');
            isFirstGame = false;
            startGame();
        }, 5000);
    }
}

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function updateTimer() {
    if (!gameStartTime || gameCompleted) return;
    
    const elapsed = (Date.now() - gameStartTime) / 1000;
    if (timerElement) {
        timerElement.textContent = formatTime(elapsed);
    }
}

function startTimer() {
    if (!timerElement) timerElement = document.getElementById('timer');
    gameStartTime = Date.now();
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(updateTimer, 250);
    updateTimer();
}

function stopTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}

function showSuccessUI() {
    if (!successUI) successUI = document.getElementById('successUI');
    if (!successUI) return;
    
    stopTimer();
    
    const elapsed = gameStartTime ? (Date.now() - gameStartTime) / 1000 : 0;
    if (!finalTimeElement) finalTimeElement = document.getElementById('finalTime');
    if (finalTimeElement) {
        finalTimeElement.textContent = formatTime(elapsed);
    }
    
    difficultyLevel++;
    
    successUI.classList.remove('hidden');
    gameCompleted = true;
    
    if (restartTimer) clearTimeout(restartTimer);
    restartTimer = setTimeout(() => {
        restartGame();
    }, 3000);
}

function restartGame() {
    gameCompleted = false;
    gameStarted = false;
    
    stopTimer();
    gameStartTime = null;
    
    if (timerElement) {
        timerElement.textContent = '00:00';
    }
    
    if (animationId !== null) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }
    
    if (autoStartTimer) {
        clearTimeout(autoStartTimer);
        autoStartTimer = null;
    }
    
    if (restartTimer) {
        clearTimeout(restartTimer);
        restartTimer = null;
    }
    
    if (successUI) {
        successUI.classList.add('hidden');
    }
    
    if (renderer && renderer.domElement && renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
    }
    
    if (world && world.parent) {
        world.parent.remove(world);
    }
    
    if (composer) {
        composer.dispose();
        composer = null;
    }
    
    resetWorld();
    
    scene = null;
    camera = null;
    renderer = null;
    player = null;
    world = null;
    isLoading = true;
    blurAmount = 10;
    
    setTimeout(() => {
        startGame();
    }, 500);
}

function showLevelUI() {
    if (!levelUI) levelUI = document.getElementById('levelUI');
    if (!levelNumber) levelNumber = document.getElementById('levelNumber');
    
    if (levelUI && levelNumber) {
        levelNumber.textContent = difficultyLevel;
        levelUI.classList.remove('hidden');
        
        setTimeout(() => {
            levelUI.classList.add('hidden');
        }, 2000);
    }
}

async function startGame() {
    gameStarted = true;
    
    setMazeDifficulty(difficultyLevel);
    showLevelUI();
    
    try {
        const sceneData = await createScene();
        ({ scene, camera, player, world, updateCameraPosition } = sceneData);
        
        setupInput();
        
        // 렌더러 초기화 (성능 최적화: antialias 비활성화)
        renderer = new THREE.WebGLRenderer({ 
            antialias: false,
            powerPreference: 'high-performance'
        });
        renderer.setSize(window.innerWidth, window.innerHeight);
        const pixelRatio = Math.min(window.devicePixelRatio, 1.5);
        renderer.setPixelRatio(pixelRatio);
        renderer.sortObjects = false;
        document.body.appendChild(renderer.domElement);
        
        // 포스트 프로세싱 설정 (Bloom 효과: 50% 해상도로 성능 최적화)
        const bloomResolution = new THREE.Vector2(
            Math.floor(window.innerWidth * 0.5),
            Math.floor(window.innerHeight * 0.5)
        );
        
        composer = new EffectComposer(renderer);
        composer.setPixelRatio(pixelRatio);
        composer.setSize(window.innerWidth, window.innerHeight);
        
        const renderPass = new RenderPass(scene, camera);
        composer.addPass(renderPass);
        
        const bloomPass = new UnrealBloomPass(
            bloomResolution,
            1.0,
            0.4,
            0.75
        );
        composer.addPass(bloomPass);
        
        const outputPass = new OutputPass();
        composer.addPass(outputPass);
        
        renderer.domElement.style.filter = `blur(${blurAmount}px)`;
        renderer.domElement.style.transition = 'none';
        
        window.addEventListener('resize', handleResize);
        
        startTimer();
        
        animate();
    } catch (error) {
        console.error('초기화 실패:', error);
        isLoading = false;
    }
}

async function init() {
    showStartUI();
}

function handleResize() {
    if (!camera || !renderer) return;
    
    const aspect = window.innerWidth / window.innerHeight;
    
    camera.left = FRUSTUM_SIZE * aspect / -2;
    camera.right = FRUSTUM_SIZE * aspect / 2;
    camera.top = FRUSTUM_SIZE / 2;
    camera.bottom = FRUSTUM_SIZE / -2;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    
    if (composer) {
        const pixelRatio = Math.min(window.devicePixelRatio, 1.5);
        composer.setPixelRatio(pixelRatio);
        composer.setSize(window.innerWidth, window.innerHeight);
        
        const bloomPass = composer.passes[1];
        if (bloomPass && bloomPass.setSize) {
            bloomPass.setSize(
                Math.floor(window.innerWidth * 0.5),
                Math.floor(window.innerHeight * 0.5)
            );
        }
    }
}

function animate() {
    animationId = requestAnimationFrame(animate);
    
    if (!gameStarted || gameCompleted) return;
    
    // 플레이어 이동 처리
    if (!isLoading && player) handlePlayerMovement(player);
    
    if (!player || !camera || !world || !renderer) return;
    
    // 플레이어가 있는 방 좌표 계산
    const { x: playerX, z: playerZ } = player.position;
    const playerRoomX = Math.round(playerX / ROOM_SIZE);
    const playerRoomZ = Math.round(playerZ / ROOM_SIZE);
    
    // 보물 방 도달 체크
    if (!gameCompleted && isEndCell(playerRoomX, playerRoomZ)) {
        showSuccessUI();
        return;
    }
    
    // 카메라 위치 업데이트 및 주변 방 생성
    updateCameraPosition(camera, playerRoomX, playerRoomZ);
    generateRoomsAroundPlayer(world, playerRoomX, playerRoomZ);
    
    // 렌더링 (포스트 프로세싱 적용)
    if (composer) {
        composer.render();
    } else {
        renderer.render(scene, camera);
    }
    
    updateBlur();
}

init();
