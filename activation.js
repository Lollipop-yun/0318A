// activation.js - 账号与激活系统核心逻辑

// 虚拟云端数据库名称 (实际开发中，这些函数应替换为后端的 fetch API)
const MOCK_CLOUD_DB = 'Aovein_Cloud_DB_Mock';

let currentAuthMode = 'login'; // 'login' 或 'activate'

// 页面加载时执行检查
window.addEventListener('DOMContentLoaded', () => {
    // 延迟检查，等待 Vue 初始化挂载
    setTimeout(checkAuthStatus, 500);
});

// 检查本机登录状态
function checkAuthStatus() {
    const isActivated = localStorage.getItem('onyunx_is_activated') === 'true';
    const currentUser = localStorage.getItem('onyunx_current_user');
    
    const appDom = document.getElementById('app');
    const authDom = document.getElementById('activation-screen');
    const loader = document.getElementById('loading-screen');

    // 每次启动，都要向"云端"二次校验该账号的激活码是否被注销了！
    if (isActivated && currentUser) {
        if (verifyAccountStatusFromCloud(currentUser)) {
            // 校验通过，直接进入系统
            if(appDom) appDom.style.display = 'flex';
            if(authDom) authDom.classList.add('hidden-screen');
        } else {
            // 激活码被注销，强制登出并清空本地状态
            forceLogout('您的激活码已被注销或账号异常，请重新激活！');
        }
    } else {
        // 未登录，展示登录界面
        if(appDom) appDom.style.display = 'none';
        if(authDom) authDom.classList.remove('hidden-screen');
    }
    
    // 关掉 Loading
    if (loader) {
        loader.style.opacity = '0';
        setTimeout(() => loader.style.display = 'none', 800);
    }
}

// 切换 登录/激活 选项卡
function switchAuthTab(mode) {
    currentAuthMode = mode;
    document.getElementById('tab-login').classList.toggle('active', mode === 'login');
    document.getElementById('tab-activate').classList.toggle('active', mode === 'activate');
    document.getElementById('auth-code').style.display = mode === 'activate' ? 'block' : 'none';
    document.getElementById('auth-submit-btn').innerText = mode === 'activate' ? '立即绑定并激活' : '登 录';
    document.getElementById('auth-error').innerText = '';
}

// 提交表单
function handleAuthSubmit() {
    const user = document.getElementById('auth-username').value.trim();
    const pass = document.getElementById('auth-password').value.trim();
    const code = document.getElementById('auth-code').value.trim();
    const agree = document.getElementById('agree-checkbox').checked;
    const errorDom = document.getElementById('auth-error');

    if (!user || !pass) return errorDom.innerText = '账号和密码不能为空';
    if (!agree) return errorDom.innerText = '请先阅读并勾选同意《免责声明》';

    if (currentAuthMode === 'activate') {
        if (!code) return errorDom.innerText = '请输入激活码';
        const result = cloudBindAccount(user, pass, code);
        if (result.success) {
            loginSuccess(user);
        } else {
            errorDom.innerText = result.msg;
        }
    } else {
        const result = cloudLoginAccount(user, pass);
        if (result.success) {
            loginSuccess(user);
        } else {
            errorDom.innerText = result.msg;
        }
    }
}

// 登录成功处理
function loginSuccess(user) {
    localStorage.setItem('onyunx_is_activated', 'true');
    localStorage.setItem('onyunx_current_user', user);
    
    // UI 切换
    document.getElementById('activation-screen').style.opacity = '0';
    setTimeout(() => {
        document.getElementById('activation-screen').classList.add('hidden-screen');
        document.getElementById('app').style.display = 'flex';
        // 通知 Vue 重新加载数据
        if(window.loadData) window.loadData();
    }, 400);
}

// 强制登出
function forceLogout(msg) {
    localStorage.removeItem('onyunx_is_activated');
    localStorage.removeItem('onyunx_current_user');
    const appDom = document.getElementById('app');
    const authDom = document.getElementById('activation-screen');
    if(appDom) appDom.style.display = 'none';
    if(authDom) {
        authDom.classList.remove('hidden-screen');
        authDom.style.opacity = '1';
    }
    document.getElementById('auth-error').innerText = msg;
}

// 免责声明弹窗控制
function showDisclaimer() { document.getElementById('disclaimer-modal').style.display = 'flex'; }
function closeDisclaimer() { 
    document.getElementById('disclaimer-modal').style.display = 'none'; 
    document.getElementById('agree-checkbox').checked = true; // 看完自动勾选
}


/* =========================================================
   以下为：模拟的云端数据库接口 
   (若接入真实后端，请将下方函数替换为 fetch/axios 请求)
========================================================= */

function getCloudDB() {
    return JSON.parse(localStorage.getItem(MOCK_CLOUD_DB) || '{"users":{}, "codes":{}}');
}
function setCloudDB(db) {
    localStorage.setItem(MOCK_CLOUD_DB, JSON.stringify(db));
}

// 模拟接口：绑定账号与激活码
function cloudBindAccount(user, pass, code) {
    let db = getCloudDB();
    // 检查激活码是否存在
    if (!db.codes[code]) return { success: false, msg: '激活码不存在或无效' };
    if (db.codes[code].status === 'revoked') return { success: false, msg: '该激活码已被注销作废' };
    if (db.codes[code].usedBy && db.codes[code].usedBy !== user) return { success: false, msg: '该激活码已被其他账号绑定' };
    
    // 检查账号是否已被其他密码注册
    if (db.users[user] && db.users[user].pass !== pass) return { success: false, msg: '该账号已存在且密码错误' };
    
    // 绑定逻辑
    db.users[user] = { pass: pass, code: code };
    db.codes[code].usedBy = user;
    db.codes[code].status = 'active';
    setCloudDB(db);
    return { success: true };
}

// 模拟接口：登录账号
function cloudLoginAccount(user, pass) {
    let db = getCloudDB();
    if (!db.users[user]) return { success: false, msg: '账号不存在，请先去右侧绑定激活码' };
    if (db.users[user].pass !== pass) return { success: false, msg: '密码错误' };
    
    // 校验其绑定的激活码状态
    const bindCode = db.users[user].code;
    if (db.codes[bindCode] && db.codes[bindCode].status === 'revoked') {
        return { success: false, msg: '您的账号因激活码注销已被封禁' };
    }
    
    return { success: true };
}

// 模拟接口：每次打开App校验状态
function verifyAccountStatusFromCloud(user) {
    let db = getCloudDB();
    if (!db.users[user]) return false;
    const bindCode = db.users[user].code;
    if (!db.codes[bindCode] || db.codes[bindCode].status === 'revoked') return false;
    return true;
}
