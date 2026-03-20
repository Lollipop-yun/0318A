// persist-storage.js - 数据深层防丢失保护机制

const DB_NAME = 'AoveinOS_SafeDB';
const DB_VERSION = 1;
const STORE_NAME = 'AppBackupStore';

// 1. 向浏览器申请永久存储权限（防浏览器自动清理）
async function requestPersistence() {
    if (navigator.storage && navigator.storage.persist) {
        const isPersisted = await navigator.storage.persist();
        console.log(isPersisted ? "✅ 永久存储权限已获得，数据受保护" : "⚠️ 未获得永久存储权限，仍有被清理风险");
    }
}

// 2. 初始化 IndexedDB 数据库
function initDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onerror = (e) => reject(e.target.error);
        request.onsuccess = (e) => resolve(e.target.result);
        request.onupgradeneeded = (e) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME);
            }
        };
    });
}

// 3. 将数据深层备份到 IndexedDB
window.saveToSafeStorage = async function(key, value) {
    try {
        const db = await initDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readwrite');
            const store = tx.objectStore(STORE_NAME);
            const req = store.put(value, key);
            req.onsuccess = () => resolve(true);
            req.onerror = () => reject(req.error);
        });
    } catch(e) {
        console.error("深层备份失败:", e);
    }
};

// 4. 当 localStorage 被清空时，从 IndexedDB 恢复数据
window.loadFromSafeStorage = async function(key) {
    try {
        const db = await initDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readonly');
            const store = tx.objectStore(STORE_NAME);
            const req = store.get(key);
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
        });
    } catch(e) {
        console.error("深层恢复失败:", e);
        return null;
    }
};

// 执行防清理申请
requestPersistence();
