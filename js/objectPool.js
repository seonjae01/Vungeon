import * as THREE from 'three';

const pools = new Map();
const templates = new Map();

export function registerTemplate(type, template) {
    if (template instanceof THREE.Object3D) {
        if (template.parent) template.parent.remove(template);
        template.visible = false;
        template.position.set(0, -1000, 0);
    }
    templates.set(type, template);
}

export function hasTemplate(type) {
    return templates.has(type);
}

export function acquire(type) {
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
    if (!template) return null;
    
    if (template instanceof THREE.Object3D) {
        const cloned = template.clone(true);
        if (cloned.parent) cloned.parent.remove(cloned);
        return cloned;
    }
    
    return typeof template.clone === 'function' ? template.clone(true) : null;
}

export function release(type, obj) {
    if (!obj) return;
    
    if (obj instanceof THREE.Object3D) {
        if (obj.parent) obj.parent.remove(obj);
        obj.visible = false;
        obj.position.set(0, -1000, 0);
    }
    
    if (!pools.has(type)) pools.set(type, []);
    pools.get(type).push(obj);
}