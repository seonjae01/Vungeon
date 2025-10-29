import * as THREE from 'three';

const pools = new Map();
const templates = new Map();

export function registerTemplate(type, template, hidePosition = { x: 0, y: -1000, z: 0 }) {
    if (!(template instanceof THREE.Object3D)) {
        templates.set(type, template);
        return;
    }
    
    if (template.parent) template.parent.remove(template);
    
    template.visible = false;
    template.position.set(hidePosition.x, hidePosition.y, hidePosition.z);
    templates.set(type, template);
}

export function hasTemplate(type) {
    return templates.has(type);
}

export function getTemplate(type) {
    return templates.get(type);
}

export function acquire(type, onCreate = null) {
    if (!pools.has(type)) pools.set(type, []);
    
    const pool = pools.get(type);
    
    if (pool.length > 0) {
        const obj = pool.pop();
        if (obj instanceof THREE.Object3D) {
            if (obj.parent) obj.parent.remove(obj);
            obj.visible = true;
        }
        return obj;
    }
    
    const template = templates.get(type);
    if (!template) {
        if (onCreate && typeof onCreate === 'function') return onCreate();
        return null;
    }
    
    if (template instanceof THREE.Object3D) {
        const cloned = template.clone(true);
        if (cloned.parent) cloned.parent.remove(cloned);
        return cloned;
    }
    
    if (typeof template.clone === 'function') return template.clone(true);
    if (typeof template === 'function') return template();
    
    return null;
}

export function release(type, obj, hidePosition = { x: 0, y: -1000, z: 0 }) {
    if (!obj) return;
    
    if (obj instanceof THREE.Object3D) {
        if (obj.parent) obj.parent.remove(obj);
        obj.visible = false;
        obj.position.set(hidePosition.x, hidePosition.y, hidePosition.z);
    }
    
    if (!pools.has(type)) pools.set(type, []);
    
    pools.get(type).push(obj);
}

export function clearPool(type) {
    if (type) {
        pools.delete(type);
        templates.delete(type);
    } else {
        pools.clear();
        templates.clear();
    }
}

export function getPoolSize(type) {
    if (!pools.has(type)) return 0;
    return pools.get(type).length;
}
