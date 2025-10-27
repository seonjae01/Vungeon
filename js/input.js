// 키보드 입력 관리
export const keys = {};

export function setupKeyboardInput() {
    document.addEventListener('keydown', (event) => {
        keys[event.code] = true;
    });

    document.addEventListener('keyup', (event) => {
        keys[event.code] = false;
    });
}

export function isKeyPressed(keyCode) {
    return keys[keyCode] || false;
}

