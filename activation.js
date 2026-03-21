// activation.js - 模拟云端验证系统与设备指纹

// 获取设备唯一指纹 (通过 Canvas 渲染差异获取跨浏览器弱指纹)
function getDeviceFingerprint() {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx.textBaseline = "top"; ctx.font = "14px 'Arial'"; ctx.fillText("Aovein-Device-Lock", 2, 2);
    const hw = navigator.hardwareConcurrency || 1;
    const res = `${screen.width}x${screen.height}-${hw}-${canvas.toDataURL()}`;
    let hash = 0;
    for (let i = 0; i < res.length; i++) hash = ((hash << 5) - hash) + res.charCodeAt(i);
    return `DEV-${Math.abs(hash)}`;
}

// 模拟云端数据库 (对接真实后端时，将下方逻辑替换为 fetch 请求即可)
const DB_KEY = 'Aovein_Cloud_MockDB';
function getCloudDB() { return JSON.parse(localStorage.getItem(DB_KEY) || '{"codes":{}, "users":{}}'); }
function saveCloudDB(db) { localStorage.setItem(DB_KEY, JSON.stringify(db)); }

// 验证登录逻辑
window.verifyActivation = function(account, pwd, codeInput) {
    return new Promise((resolve, reject) => {
        setTimeout(() => { // 模拟网络延迟
            const db = getCloudDB();
            const currentDevice = getDeviceFingerprint();

            // 1. 如果输入了激活码
            if (codeInput) {
                const codeRecord = db.codes[codeInput];
                if (!codeRecord) return reject("激活码不存在");
                if (codeRecord.status === 'revoked') return reject("该激活码已被注销封禁");
                
                // 首次绑定
                if (codeRecord.status === 'unused') {
                    if (db.users[account]) return reject("该账号已被注册，请直接登录");
                    // 绑定信息
                    db.codes[codeInput] = { status: 'used', account: account };
                    db.users[account] = { pwd: pwd, code: codeInput, deviceId: currentDevice };
                    saveCloudDB(db);
                    return resolve("激活并绑定成功");
                }
                
                // 已绑定的激活码
                if (codeRecord.status === 'used') {
                    if (codeRecord.account !== account) return reject("激活码绑定的账号不匹配");
                    if (db.users[account].pwd !== pwd) return reject("密码错误");
                    // 更新设备记录（换设备重新绑定的情况）
                    db.users[account].deviceId = currentDevice;
                    saveCloudDB(db);
                    return resolve("新设备验证成功");
                }
            } 
            // 2. 没有输入激活码，尝试账号密码直登
            else {
                const user = db.users[account];
                if (!user) return reject("账号不存在，新用户请输入激活码");
                if (user.pwd !== pwd) return reject("密码错误");
                
                // 检查该账号绑定的激活码是否被注销
                const boundCode = db.codes[user.code];
                if (boundCode && boundCode.status === 'revoked') return reject("您的激活权限已被注销");

                // 检查设备指纹
                if (user.deviceId !== currentDevice) {
                    return reject("检测到更换设备或浏览器，为了安全，请重新填写您的激活码进行验证");
                }
                return resolve("身份验证成功，欢迎回来");
            }
        }, 500);
    });
};
