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

    // 1. 如果没有填激活码，判断该设备是否存有该账号的记录
    if(!code) {
        const localAccounts = JSON.parse(localStorage.getItem('aovein_local_accounts') || '{}');
        if(localAccounts[user] && localAccounts[user] === pass) {
            loginSuccess();
        } else {
            errBox.innerText = "未找到该账号记录，或密码错误。新设备/新账号请填写激活码！";
        }
        return;
    }

    // 2. 如果填写了激活码，执行前端离线算法校验
    try {
        const cleanCode = code.replace(/-/g, '').toUpperCase();
        if(cleanCode.length !== 12) {
            errBox.innerText = "激活码格式错误！应为12位字符。";
            return;
        }

        const basePart = cleanCode.substring(0, 8);
        const providedChecksum = cleanCode.substring(8, 12);

        // 使用同样的盐值重新计算校验和
        let strToHash = basePart + SECRET_SALT;
        let hash = 0;
        for (let i = 0; i < strToHash.length; i++) {
            hash = ((hash << 5) - hash) + strToHash.charCodeAt(i);
            hash |= 0; 
        }
        let expectedChecksum = Math.abs(hash).toString(36).substring(0, 4).toUpperCase().padStart(4, '0');

        if(providedChecksum === expectedChecksum) {
            // 校验通过：激活码合法！
            // 把用户自己设置的账号密码，与当前设备绑定保存起来
            const localAccounts = JSON.parse(localStorage.getItem('aovein_local_accounts') || '{}');
            localAccounts[user] = pass;
            localStorage.setItem('aovein_local_accounts', JSON.stringify(localAccounts));
            loginSuccess();
        } else {
            errBox.innerText = "无效的激活码，请联系管理员购买！";
        }
    } catch(e) {
        errBox.innerText = "激活时发生错误！";
    }
}
