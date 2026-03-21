// activation.js - 账号与激活码管理逻辑

// ====== 模拟云端数据库 (实际跨设备应用需替换为 Fetch 请求后端) ======
function getCloudDB() {
    let db = localStorage.getItem('Aovein_CloudDB');
    if (!db) {
        db = { validCodes: [], revokedCodes:[], users: {} };
        localStorage.setItem('Aovein_CloudDB', JSON.stringify(db));
    } else {
        db = JSON.parse(db);
    }
    return db;
}
function saveCloudDB(db) { localStorage.setItem('Aovein_CloudDB', JSON.stringify(db)); }

// 检查本地登录态
window.isUserLoggedIn = function() {
    return localStorage.getItem('aovein_logged_in_user') !== null;
};

// UI 交互
let countdownTimer = null;
let secondsLeft = 5;

function openDisclaimer() {
    document.getElementById('disclaimer-modal').classList.remove('hidden-screen');
    const btn = document.getElementById('disclaimer-agree-btn');
    secondsLeft = 5;
    btn.classList.add('disabled');
    btn.innerText = `请认真阅读 (${secondsLeft}s)`;
    
    clearInterval(countdownTimer);
    countdownTimer = setInterval(() => {
        secondsLeft--;
        if (secondsLeft <= 0) {
            clearInterval(countdownTimer);
            btn.classList.remove('disabled');
            btn.innerText = "我已认真阅读并同意";
        } else {
            btn.innerText = `请认真阅读 (${secondsLeft}s)`;
        }
    }, 1000);
}

function acceptDisclaimer() {
    if (secondsLeft > 0) return;
    document.getElementById('disclaimer-modal').classList.add('hidden-screen');
    document.getElementById('act-agree').checked = true;
    checkAgree();
}

function checkAgree() {
    const btn = document.getElementById('act-btn');
    if (document.getElementById('act-agree').checked) {
        btn.classList.remove('disabled');
    } else {
        btn.classList.add('disabled');
    }
}

function showError(msg) {
    const err = document.getElementById('act-error');
    err.innerText = msg;
    setTimeout(() => { err.innerText = ''; }, 3000);
}

// 核心登录/激活逻辑
window.attemptLogin = function() {
    if (!document.getElementById('act-agree').checked) return;
    
    const user = document.getElementById('act-username').value.trim();
    const pass = document.getElementById('act-password').value.trim();
    const code = document.getElementById('act-code').value.trim().toUpperCase();

    if (!user || !pass) return showError('账号和密码不能为空');

    const db = getCloudDB();
    
    // 1. 如果账号已存在 (老用户登录)
    if (db.users[user]) {
        if (db.users[user].password !== pass) {
            return showError('密码错误');
        }
        // 检查该账号绑定的激活码是否已被管理员注销
        const boundCode = db.users[user].code;
        if (db.revokedCodes.includes(boundCode)) {
            return showError('登录失败：该账号绑定的激活码已被注销！');
        }
        // 登录成功
        localStorage.setItem('aovein_logged_in_user', user);
        if(window.unlockApp) window.unlockApp();
        return;
    }

    // 2. 账号不存在 (新用户注册绑定)
    if (!code) return showError('新用户绑定设备请输入激活码');
    
    if (db.revokedCodes.includes(code)) return showError('该激活码已被注销作废');
    if (!db.validCodes.includes(code)) return showError('无效的激活码');
    
    // 检查激活码是否已经被别的账号绑定
    let isBound = false;
    for (let k in db.users) {
        if (db.users[k].code === code) isBound = true;
    }
    if (isBound) return showError('该激活码已被其他账号绑定');

    // 绑定成功
    db.users[user] = { password: pass, code: code };
    saveCloudDB(db);
    
    localStorage.setItem('aovein_logged_in_user', user);
    if(window.unlockApp) window.unlockApp();
};
