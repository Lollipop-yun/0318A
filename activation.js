/**
 * Aovein OS Activation Manager
 * 负责设备ID生成、激活码混淆计算及验证逻辑
 */
window.ActivationManager = {
    // 获取或创建设备 UUID
    getOrCreateDeviceId: function() {
        let did = localStorage.getItem('onyunx_device_id');
        if(!did) {
            const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
            const rand = (l) => Array.from({length:l}, ()=>chars[Math.floor(Math.random()*chars.length)]).join('');
            did = `${rand(3)}-${rand(4)}-${rand(4)}`;
            localStorage.setItem('onyunx_device_id', did);
        }
        return did;
    },

    // 根据设备ID计算激活码（混淆算法）
    calculateValidCode: function(deviceId) {
        const clean = deviceId.replace(/-/g, '').toUpperCase();
        const map = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'; 
        let res = '';
        
        for(let i = 0; i < clean.length; i++) {
            let code = clean.charCodeAt(i);
            let mixed = (code * 7 + i * 13 + 99) % 36;
            res += map[mixed];
        }
        
        return `${res.substring(0,3)}-${res.substring(3,7)}-${res.substring(7,11)}`;
    },

    // 验证用户输入的激活码
    verify: function(inputCode, validCode) {
        return inputCode === validCode;
    }
};