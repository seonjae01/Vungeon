import * as THREE from 'three';
import { createScene } from './scene.js';
import { setupInput, handlePlayerMovement } from './input.js';
import { generateRoomsAroundPlayer, isEndCell, resetWorld } from './world.js';

const FRUSTUM_SIZE = 5;
const ROOM_SIZE = 5;
const BLUR_LERP_SPEED = 0.05;

let scene, camera, renderer, player, world, updateCameraPosition;
let isLoading = true;
let blurAmount = 10;
let gameStarted = false;
let gameCompleted = false;
let restartTimer = null;
let isFirstGame = true;
let animationId = null;
let gameStartTime = null;
let timerInterval = null;

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

let autoStartTimer = null;

function showStartUI() {
    if (!isFirstGame) return;
    
    const startUI = document.getElementById('startUI');
    
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
    const timerElement = document.getElementById('timer');
    if (timerElement) {
        timerElement.textContent = formatTime(elapsed);
    }
}

function startTimer() {
    gameStartTime = Date.now();
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(updateTimer, 100);
    updateTimer();
}

function stopTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}

function showSuccessUI() {
    const successUI = document.getElementById('successUI');
    if (successUI) {
        stopTimer();
        
        const elapsed = gameStartTime ? (Date.now() - gameStartTime) / 1000 : 0;
        const finalTimeElement = document.getElementById('finalTime');
        if (finalTimeElement) {
            finalTimeElement.textContent = formatTime(elapsed);
        }
        
        successUI.classList.remove('hidden');
        gameCompleted = true;
        
        if (restartTimer) clearTimeout(restartTimer);
        restartTimer = setTimeout(() => {
            restartGame();
        }, 3000);
    }
}

function restartGame() {
    gameCompleted = false;
    gameStarted = false;
    
    stopTimer();
    gameStartTime = null;
    
    const timerElement = document.getElementById('timer');
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
    
    const successUI = document.getElementById('successUI');
    if (successUI) {
        successUI.classList.add('hidden');
    }
    
    if (renderer && renderer.domElement && renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
    }
    
    if (world && world.parent) {
        world.parent.remove(world);
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

async function startGame() {
    gameStarted = true;
    
    try {
        const sceneData = await createScene();
        ({ scene, camera, player, world, updateCameraPosition } = sceneData);
        
        setupInput();
        
        renderer = new THREE.WebGLRenderer({ 
            antialias: false,
            powerPreference: 'high-performance'
        });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
        renderer.sortObjects = false;
        document.body.appendChild(renderer.domElement);
        
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
    const aspect = window.innerWidth / window.innerHeight;
    
    camera.left = FRUSTUM_SIZE * aspect / -2;
    camera.right = FRUSTUM_SIZE * aspect / 2;
    camera.top = FRUSTUM_SIZE / 2;
    camera.bottom = FRUSTUM_SIZE / -2;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    if (!gameStarted || gameCompleted) {
        animationId = requestAnimationFrame(animate);
        return;
    }
    
    animationId = requestAnimationFrame(animate);
    
    if (!isLoading && player) handlePlayerMovement(player);
    
    if (player && camera && world && renderer) {
        const { x: playerX, z: playerZ } = player.position;
        const playerRoomX = Math.round(playerX / ROOM_SIZE);
        const playerRoomZ = Math.round(playerZ / ROOM_SIZE);
        
        if (!gameCompleted && isEndCell(playerRoomX, playerRoomZ)) {
            showSuccessUI();
        }
        
        updateCameraPosition(camera, playerRoomX, playerRoomZ);
        generateRoomsAroundPlayer(world, playerRoomX, playerRoomZ);
        
        renderer.render(scene, camera);
    }
    
    updateBlur();
}

init();
