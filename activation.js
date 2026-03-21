// activation.js - 账号与激活码验证系统

document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('act-btn');
    const agreeCheck = document.getElementById('act-agree-check');
    const agreeLink = document.getElementById('act-disclaimer-link');
    const modal = document.getElementById('disclaimer-modal');
    const modalBtn = document.getElementById('disclaimer-agree-btn');

    // 初始化本地模拟数据库
    if(!localStorage.getItem('aovein_valid_codes')) localStorage.setItem('aovein_valid_codes', JSON.stringify([]));
    if(!localStorage.getItem('aovein_revoked_codes')) localStorage.setItem('aovein_revoked_codes', JSON.stringify([]));
    if(!localStorage.getItem('aovein_users')) localStorage.setItem('aovein_users', JSON.stringify({}));

    // 免责声明弹窗逻辑
    let timer = null;
    agreeLink.addEventListener('click', () => {
        modal.style.display = 'flex';
        modalBtn.disabled = true;
        let timeLeft = 5;
        modalBtn.innerText = `我已阅读并同意 (${timeLeft}s)`;
        
        timer = setInterval(() => {
            timeLeft--;
            if(timeLeft > 0) {
                modalBtn.innerText = `我已阅读并同意 (${timeLeft}s)`;
            } else {
                clearInterval(timer);
                modalBtn.disabled = false;
                modalBtn.innerText = `我已阅读并同意`;
            }
        }, 1000);
    });

    modalBtn.addEventListener('click', () => {
        modal.style.display = 'none';
        agreeCheck.checked = true;
    });

    // 登录与激活逻辑
    btn.addEventListener('click', () => {
        if(!agreeCheck.checked) return alert('请先阅读并勾选免责声明！');

        const user = document.getElementById('act-user').value.trim();
        const pass = document.getElementById('act-pass').value.trim();
        const code = document.getElementById('act-code').value.trim();

        if(!user || !pass) return alert('请输入账号和密码！');

        // 获取数据库
        const validCodes = JSON.parse(localStorage.getItem('aovein_valid_codes'));
        const revokedCodes = JSON.parse(localStorage.getItem('aovein_revoked_codes'));
        const usersDB = JSON.parse(localStorage.getItem('aovein_users'));

        // 1. 如果是老账号登录
        if (usersDB[user]) {
            if (usersDB[user].password !== pass) return alert('密码错误！');
            
            const boundCode = usersDB[user].code;
            if (revokedCodes.includes(boundCode)) {
                return alert('登录失败：该账号绑定的激活码已被注销！');
            }
            
            // 登录成功
            successLogin();
            return;
        }

        // 2. 如果是新账号注册绑定
        if(!code) return alert('新账号首次登录，请输入激活码进行绑定！');
        
        if(!validCodes.includes(code)) return alert('激活码无效，请联系原作者获取！');
        if(revokedCodes.includes(code)) return alert('该激活码已被注销，无法使用！');

        // 检查激活码是否被别人绑定过
        for(let u in usersDB) {
            if(usersDB[u].code === code) return alert('该激活码已被其他账号绑定！');
        }

        // 绑定成功
        usersDB[user] = { password: pass, code: code };
        localStorage.setItem('aovein_users', JSON.stringify(usersDB));
        alert('激活并绑定成功！此后仅凭账号密码即可登入。');
        successLogin();
    });

    function successLogin() {
        // 通知主 Vue 应用
        localStorage.setItem('onyunx_is_activated', 'true');
        document.getElementById('activation-screen').style.opacity = '0';
        setTimeout(() => {
            document.getElementById('activation-screen').style.display = 'none';
            document.getElementById('app').style.display = 'flex';
            if (window.vueApp) window.vueApp.isActivated = true;
        }, 500);
    }
});
