/**
 * Aovein OS 独立设备激活码生成与验证逻辑
 * 该文件外置管理，接管激活验证功能
 */

(function() {
    // 全局挂载激活码，以供比对
    window.__VALID_ACTIVATION_CODE__ = '';

    function initDeviceActivation() {
        // 1. 获取或生成设备 ID
        let did = localStorage.getItem('onyunx_device_id');
        if(!did) {
            const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
            const rand = (l) => Array.from({length:l}, ()=>chars[Math.floor(Math.random()*chars.length)]).join('');
            did = `${rand(3)}-${rand(4)}-${rand(4)}`;
            localStorage.setItem('onyunx_device_id', did);
        }
        
        // 2. 将设备 ID 显示在 UI 上
        const didDisplay = document.getElementById('device-id-display');
        if(didDisplay) {
            didDisplay.innerText = did;
        }
        
        // 3. 基于当前设备 ID 生成激活码的算法
        const clean = did.replace(/-/g, '').toUpperCase();
        const map = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'; 
        let res = '';
        for(let i = 0; i < clean.length; i++) {
            let code = clean.charCodeAt(i);
            let mixed = (code * 7 + i * 13 + 99) % 36;
            res += map[mixed];
        }
        
        const validCode = `${res.substring(0,3)}-${res.substring(3,7)}-${res.substring(7,11)}`;
        window.__VALID_ACTIVATION_CODE__ = validCode;

        // 4. 控制台隐式输出激活码 (F12可见)
        console.log(
            `%c 🔑 [外部 JS 控制台] 当前设备激活码: ${validCode} `, 
            'background: #222; color: #ffeb3b; font-size: 14px; padding: 8px; border-radius: 4px;'
        );
    }

    // 5. 绑定全局激活验证事件 (接管 index.html 中的 attemptActivate 函数)
    window.attemptActivate = function() {
        // 如果已经激活过，阻止重复执行
        if (localStorage.getItem('onyunx_is_activated') === 'true') {
            return;
        }

        const input = document.getElementById('activation-code');
        const err = document.getElementById('activation-error');
        
        if(!input || !err) return;
        
        const val = input.value.trim().toUpperCase();
        
        // 比对激活码
        if(val === window.__VALID_ACTIVATION_CODE__) {
            // 写入激活记录
            localStorage.setItem('onyunx_is_activated', 'true');
            
            // 激活成功过场动画
            const screen = document.getElementById('activation-screen');
            if(screen) {
                screen.style.transform = 'scale(1.1)'; 
                screen.style.opacity = '0';
                
                setTimeout(() => { 
                    screen.classList.add('hidden-screen'); 
                    // 显示主 APP
                    const app = document.getElementById('app');
                    if(app) {
                        app.style.display = 'flex'; 
                    }
                }, 600);
            }
        } else {
            // 激活失败：输入框边框变红并播放抖动动画
            input.classList.add('error'); 
            err.classList.add('show');
            
            // 移除错误态，以备下次验证
            setTimeout(() => { 
                input.classList.remove('error'); 
                err.classList.remove('show'); 
            }, 1000);
        }
    };

    // DOM 加载完成后立即执行设备初始化
    document.addEventListener('DOMContentLoaded', () => {
        initDeviceActivation();
    });
})();
