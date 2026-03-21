// activation.js - 核心账号鉴权与激活逻辑

const SECRET_SALT = "AOVEIN_ULTIMATE_2026"; // 混淆密钥

// 监听勾选框状态
document.addEventListener('DOMContentLoaded', () => {
    const checkbox = document.getElementById('agree-check');
    const btn = document.getElementById('act-submit-btn');
    if(checkbox && btn) {
        checkbox.addEventListener('change', (e) => {
            if(e.target.checked) btn.classList.remove('disabled');
            else btn.classList.add('disabled');
        });
    }
});

// 弹窗控制
function openDisclaimerModal() { document.getElementById('disclaimer-modal').style.display = 'flex'; }
function closeDisclaimerModal() { document.getElementById('disclaimer-modal').style.display = 'none'; }

// 核心：处理登录与激活
async function handleAoveinAuth() {
    const user = document.getElementById('act-username').value.trim();
    const pass = document.getElementById('act-password').value.trim();
    const code = document.getElementById('act-code').value.trim();
    const errBox = document.getElementById('act-error-msg');
    
    if(!user || !pass) {
        errBox.innerText = "账号和密码不能为空！";
        return;
    }

    /* 
     * [预留 API 接口位置]
     * 如果你有后端，在这里把 user, pass, code 通过 fetch 发给后端验证。
     * 例如: const res = await fetch('/api/login', { method: 'POST', body: JSON.stringify({user, pass, code}) });
     * 即可实现真正的多端同步和封号。这里使用纯前端算法模拟：
     */

    // 1. 如果没有填激活码，尝试本地登录验证
    if(!code) {
        const localAccounts = JSON.parse(localStorage.getItem('aovein_local_accounts') || '{}');
        if(localAccounts[user] && localAccounts[user] === pass) {
            loginSuccess();
        } else {
            errBox.innerText = "该设备未绑定此账号，或密码错误。新设备请填写激活码！";
        }
        return;
    }

    // 2. 如果填写了激活码，执行算法解密与设备绑定
    try {
        // 解码激活码 (Base64)
        const decoded = atob(code);
        // 校验格式是否匹配: 用户名|密码|盐值
        const expected = `${user}|${pass}|${SECRET_SALT}`;
        
        if(decoded === expected) {
            // 校验通过：保存账号密码到本设备
            const localAccounts = JSON.parse(localStorage.getItem('aovein_local_accounts') || '{}');
            localAccounts[user] = pass;
            localStorage.setItem('aovein_local_accounts', JSON.stringify(localAccounts));
            loginSuccess();
        } else {
            errBox.innerText = "激活码无效或与该账号密码不匹配！";
        }
    } catch(e) {
        errBox.innerText = "激活码格式错误！";
    }
}

function loginSuccess() {
    localStorage.setItem('aovein_is_logged_in', 'true');
    document.getElementById('act-error-msg').style.color = '#07c160';
    document.getElementById('act-error-msg').innerText = "验证成功，正在进入系统...";
    
    // UI 动画跳转
    const screen = document.getElementById('activation-screen');
    screen.style.transform = 'scale(1.1)';
    screen.style.opacity = '0';
    screen.style.transition = 'all 0.6s';
    
    setTimeout(() => { 
        screen.style.display = 'none'; 
        document.getElementById('app').style.display = 'flex'; 
    }, 600);
}
