// 全局变量
let workTimer = null;
let startTime = null;
let totalWorkTime = 0;
let pauseCount = 0;
let isWorking = false;
let isPaused = false;
let monthlyTimer = null; // 本月累计金额独立定时器
let currentCalendarDate = new Date(); // 当前日历显示的日期
let settings = {
    monthlySalary: 8000,
    workDays: 22,
    workHours: 8,
    overtimeRate: 1,
    enableEffects: true,
    enableSounds: true,
    autoLunchBreak: true,
    autoPauseOnHidden: false,  // 默认关闭页面切换暂停
    autoCleanHistory: false,   // 默认关闭年度数据自动清理
    lunchStart: '12:00',
    lunchEnd: '13:00'
};

// 梦想基金配置
let dreamConfig = {
    icon: '🏖️',
    name: '海南冲浪之旅',
    target: 3000
};

// 物品价格库
// 默认物品价格（可自定义）
let itemPrices = {
    coffee: 25,    // 生椰拿铁
    game: 300,     // Switch游戏
    meal: 35,      // 麦当劳套餐
    subway: 3      // 地铁票
};

// 物品信息（包含图标、名称、单位）
let itemsConfig = {
    coffee: { icon: '☕', name: '生椰拿铁', unit: '杯', price: 25 },
    game: { icon: '🎮', name: 'Switch游戏', unit: '个', price: 300 },
    meal: { icon: '🍔', name: '麦当劳套餐', unit: '份', price: 35 },
    subway: { icon: '🚇', name: '地铁票', unit: '张', price: 3 }
};

// 成就系统
const achievements = {
    coffee: { unlocked: false, threshold: 25, name: '奶茶自由', desc: '赚够一杯奶茶钱' },
    survivor: { unlocked: false, threshold: 12 * 3600, name: '996幸存者', desc: '连续工作12小时' },
    manager: { unlocked: false, threshold: 3, name: '时间管理大师', desc: '单日暂停3次以上' },
    hundred: { unlocked: false, threshold: 100, name: '百元大关', desc: '单日收益破百' }
};

// 图表数据
let earningsHistory = [];
let timeAllocation = {
    work: 0,
    break: 0,
    meeting: 0
};

// DOM元素
const elements = {
    dailyEarnings: document.getElementById('daily-earnings'),
    monthlyEarnings: document.getElementById('monthly-earnings'),
    yearlyEarnings: document.getElementById('yearly-earnings'),
    hourlyRate: document.getElementById('hourly-rate'),
    workStatus: document.getElementById('work-status'),
    startBtn: document.getElementById('start-work'),
    pauseBtn: document.getElementById('pause-work'),
    endBtn: document.getElementById('end-work'),
    calendarBtn: document.getElementById('calendar-btn'),
    settingsBtn: document.getElementById('settings-btn'),
    privacyBtn: document.getElementById('privacy-btn'),
    settingsModal: document.getElementById('settings-modal'),
    calendarModal: document.getElementById('calendar-modal'),
    disguiseMode: document.getElementById('disguise-mode'),
    mainApp: document.getElementById('main-app'),
    particlesContainer: document.getElementById('particles-container'),
    confettiContainer: document.getElementById('confetti-container')
};

// 初始化
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing app...'); // 调试日志
    
    // 强制隐藏免责声明模态框
    const disclaimerModal = document.getElementById('disclaimer-modal');
    if (disclaimerModal) {
        disclaimerModal.style.display = 'none';
        disclaimerModal.style.visibility = 'hidden';
        disclaimerModal.style.opacity = '0';
        disclaimerModal.style.zIndex = '-1';
        console.log('强制隐藏免责声明模态框');
    }
    
    loadSettings();
    updateItemsDisplay();  // 初始化物品显示
    updateDreamDisplay();  // 初始化梦想基金显示
    updateDisplay();
    setupEventListeners();
    showDisclaimer();
    

    
    // 检查是否是新的一天
    checkNewDay();
    
    // 每秒更新显示
    setInterval(updateDisplay, 1000);
    
    // 检查午休时间
    setInterval(checkLunchBreak, 60000); // 每分钟检查一次
    
    // 启动本月累计金额独立更新定时器
    startMonthlyTimer();
    
    // 页面卸载时清理定时器
    window.addEventListener('beforeunload', () => {
        stopMonthlyTimer();
    });
    
    // 页面可见性变化时处理定时器
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            // 页面隐藏时不停止本月累计定时器，保持独立运行
        } else {
            // 页面显示时确保定时器正常运行
            if (!monthlyTimer) {
                startMonthlyTimer();
            }
        }
    });
    

});

// 显示免责声明
function showDisclaimer() {
    console.log('showDisclaimer called - 跳过显示'); // 调试日志
    // 暂时跳过免责声明显示，直接播放欢迎音效
    localStorage.setItem('disclaimerShown', 'true');
    playWelcomeSound();
}

// 播放欢迎音效
function playWelcomeSound() {
    if (settings.enableSounds) {
        // 创建音频上下文播放金币音效
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.3);
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
    }
}

// 设置事件监听器
function setupEventListeners() {
    console.log('设置事件监听器开始');
    
    // 工作控制按钮
    if (elements.startBtn) elements.startBtn.addEventListener('click', startWork);
    if (elements.pauseBtn) elements.pauseBtn.addEventListener('click', pauseWork);
    if (elements.endBtn) elements.endBtn.addEventListener('click', endWork);
    
    // 设置按钮
    if (elements.settingsBtn) elements.settingsBtn.addEventListener('click', openSettings);
    const closeSettings = document.getElementById('close-settings');
    if (closeSettings) closeSettings.addEventListener('click', closeSettings);
    const saveSettings = document.getElementById('save-settings');
    if (saveSettings) saveSettings.addEventListener('click', saveSettings);
    
    // 日历按钮
    const calendarBtn = document.getElementById('calendar-btn');
    if (calendarBtn) {
        calendarBtn.addEventListener('click', function(event) {
            event.preventDefault();
            event.stopPropagation();
            openCalendar();
        });
    }
    
    // 其他按钮
    const closeCalendar = document.getElementById('close-calendar');
    if (closeCalendar) closeCalendar.addEventListener('click', closeCalendar);
    const prevMonth = document.getElementById('prev-month');
    if (prevMonth) prevMonth.addEventListener('click', () => changeMonth(-1));
    const nextMonth = document.getElementById('next-month');
    if (nextMonth) nextMonth.addEventListener('click', () => changeMonth(1));
    
    // 隐私模式按钮
    elements.privacyBtn.addEventListener('click', togglePrivacyMode);
    
    // 伪装界面返回按钮
    document.getElementById('disguise-return-btn').addEventListener('click', togglePrivacyMode);
    
    // 键盘快捷键
    document.addEventListener('keydown', function(e) {
        if (e.ctrlKey && e.key === 'h') {
            e.preventDefault();
            togglePrivacyMode();
        }
    });
    
    // 图表切换
    document.querySelectorAll('.chart-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            switchChart(this.dataset.chart);
        });
    });
    
    // 成就通知关闭
    document.querySelector('.notification-close')?.addEventListener('click', function() {
        document.getElementById('achievement-notification').classList.remove('show');
    });
    
    // 日报关闭
    document.getElementById('close-report')?.addEventListener('click', closeReport);
    document.getElementById('close-report-btn')?.addEventListener('click', closeReport);
    
    // 新物品按钮
    document.getElementById('add-item')?.addEventListener('click', addNewItem);
    
    // 模糊模式悬停
    setupBlurMode();
}

// 设置模糊模式
function setupBlurMode() {
    const blurElements = document.querySelectorAll('[data-blur]');
    blurElements.forEach(element => {
        element.addEventListener('mouseenter', function() {
            if (this.dataset.blur === 'true') {
                this.style.filter = 'blur(0)';
            }
        });
        
        element.addEventListener('mouseleave', function() {
            if (this.dataset.blur === 'true') {
                this.style.filter = 'blur(8px)';
            }
        });
    });
}

// 切换隐私模式
function togglePrivacyMode() {
    const isDisguised = elements.disguiseMode.style.display !== 'none';
    
    if (isDisguised) {
        elements.disguiseMode.style.display = 'none';
        elements.mainApp.style.display = 'block';
        elements.privacyBtn.querySelector('#privacy-icon').textContent = '👁️';
    } else {
        elements.disguiseMode.style.display = 'flex';
        elements.mainApp.style.display = 'none';
        elements.privacyBtn.querySelector('#privacy-icon').textContent = '🔒';
    }
}

// 切换模糊模式
function toggleBlurMode() {
    const blurElements = document.querySelectorAll('[data-blur]');
    const isBlurred = blurElements[0]?.dataset.blur === 'true';
    
    blurElements.forEach(element => {
        element.dataset.blur = isBlurred ? 'false' : 'true';
        if (!isBlurred) {
            element.style.filter = 'blur(8px)';
        } else {
            element.style.filter = 'blur(0)';
        }
    });
}

// 开始工作
function startWork() {
    if (!isWorking) {
        isWorking = true;
        isPaused = false;
        startTime = new Date();
        
        // 重置会话时间记录
        localStorage.setItem('lastSessionTime', '0');
        
        // 更新按钮状态
        elements.startBtn.disabled = true;
        elements.pauseBtn.disabled = false;
        elements.endBtn.disabled = false;
        
        // 更新状态显示
        elements.workStatus.textContent = '工作中';
        elements.workStatus.className = 'stat-value status-working';
        
        // 开始计时器
        workTimer = setInterval(updateWorkTime, 1000);
        
        // 播放开始音效
        playSound('start');
        
        // 显示开始特效
        if (settings.enableEffects) {
            createParticles(10);
        }
    }
}

// 暂停工作
function pauseWork() {
    if (isWorking && !isPaused) {
        isPaused = true;
        pauseCount++;
        
        // 更新状态显示
        elements.workStatus.textContent = '暂停中';
        elements.workStatus.className = 'stat-value status-paused';
        
        // 更新按钮文字
        elements.pauseBtn.innerHTML = '▶️ 继续工作';
        
        // 暂停计时器
        clearInterval(workTimer);
        
        // 播放暂停音效
        playSound('pause');
        
        // 检查时间管理大师成就
        checkAchievement('manager', pauseCount);
    } else if (isWorking && isPaused) {
        // 恢复工作
        isPaused = false;
        
        // 重新设置开始时间和重置会话时间记录
        startTime = new Date();
        localStorage.setItem('lastSessionTime', '0');
        
        // 更新状态显示
        elements.workStatus.textContent = '工作中';
        elements.workStatus.className = 'stat-value status-working';
        
        // 更新按钮文字
        elements.pauseBtn.innerHTML = '⏸️ 暂停';
        
        // 恢复计时器
        workTimer = setInterval(updateWorkTime, 1000);
        
        // 播放恢复音效
        playSound('resume');
    }
}

// 结束工作
function endWork() {
    if (isWorking) {
        isWorking = false;
        isPaused = false;
        
        // 清除计时器
        clearInterval(workTimer);
        
        // 清理会话时间记录
        localStorage.removeItem('lastSessionTime');
        
        // 更新按钮状态
        elements.startBtn.disabled = false;
        elements.pauseBtn.disabled = true;
        elements.pauseBtn.innerHTML = '⏸️ 暂停';  // 重置按钮文字
        elements.endBtn.disabled = true;
        
        // 更新状态显示
        elements.workStatus.textContent = '已结束';
        elements.workStatus.className = 'stat-value status-off';
        
        // 保存今日数据
        saveDailyData();
        
        // 显示日报
        showDailyReport();
        
        // 播放结束音效
        playSound('end');
        
        // 重置计时
        totalWorkTime = 0;
        pauseCount = 0;
    }
}

// 更新工作时间
function updateWorkTime() {
    if (isWorking && !isPaused && startTime) {
        const now = new Date();
        const sessionTime = Math.floor((now - startTime) / 1000);
        
        // 使用实际的会话时间，而不是简单地每秒加1
        // 获取上次记录的会话时间
        const lastSessionTime = parseInt(localStorage.getItem('lastSessionTime') || '0');
        
        // 如果当前会话时间大于上次记录的时间，更新总工作时间
        if (sessionTime > lastSessionTime) {
            const timeDiff = sessionTime - lastSessionTime;
            totalWorkTime += timeDiff;
            localStorage.setItem('lastSessionTime', sessionTime.toString());
            // 新增：每次有变化时自动保存数据，防止丢失
            saveDailyData();
        }
        
        // 检查996幸存者成就
        checkAchievement('survivor', totalWorkTime);
    }
}

// 更新显示
function updateDisplay() {
    const { hourlyRate, minuteRate, secondRate } = calculateRates();
    
    // 计算今日收益
    const dailyEarnings = (totalWorkTime * secondRate).toFixed(2);
    
    // 更新显示
    animateNumber(elements.dailyEarnings, parseFloat(dailyEarnings), '¥');
    elements.hourlyRate.textContent = `¥${hourlyRate.toFixed(2)}/小时`;
    
    // 更新虚拟消费
    updateAffordableItems(parseFloat(dailyEarnings));
    
    // 更新梦想基金
    updateDreamFund(parseFloat(dailyEarnings));
    
    // 检查成就
    checkAchievement('coffee', parseFloat(dailyEarnings));
    checkAchievement('hundred', parseFloat(dailyEarnings));
    
    // 创建收益粒子效果
    if (isWorking && !isPaused && settings.enableEffects && Math.random() < 0.3) {
        createEarningsParticle();
    }
    
    // 检查百元彩带
    checkConfetti(parseFloat(dailyEarnings));
}

// 计算薪资费率
function calculateRates() {
    const hourlyRate = (settings.monthlySalary / (settings.workDays * settings.workHours)) * settings.overtimeRate;
    const minuteRate = hourlyRate / 60;
    const secondRate = hourlyRate / 3600;
    
    return { hourlyRate, minuteRate, secondRate };
}

// 更新可购买物品
function updateAffordableItems(earnings) {
    // 动态更新所有物品的可购买数量
    Object.keys(itemsConfig).forEach(itemKey => {
        const countElement = document.getElementById(`${itemKey}-count`);
        if (countElement) {
            countElement.textContent = Math.floor(earnings / itemsConfig[itemKey].price);
        }
    });
}

// 更新梦想基金显示
function updateDreamDisplay() {
    // 更新梦想基金的标题、名称和目标金额
    const dreamFundTitle = document.querySelector('.dream-fund h3');
    if (dreamFundTitle) {
        dreamFundTitle.textContent = `${dreamConfig.icon} 梦想基金进度`;
    }
    
    const dreamNameElement = document.querySelector('.dream-name');
    if (dreamNameElement) {
        dreamNameElement.textContent = dreamConfig.name;
    }
    
    const dreamTargetElement = document.querySelector('.dream-target');
    if (dreamTargetElement) {
        dreamTargetElement.textContent = `¥${dreamConfig.target}`;
    }
}

// 更新梦想基金
function updateDreamFund(earnings) {
    const target = dreamConfig.target;
    const progress = Math.min((earnings / target) * 100, 100);
    const remainingDays = Math.max(Math.ceil((target - earnings) / (earnings || 1)), 0);
    
    document.getElementById('dream-progress').style.width = `${progress}%`;
    document.getElementById('dream-percentage').textContent = `${progress.toFixed(1)}%`;
    
    if (remainingDays === 0) {
        document.getElementById('dream-days').textContent = '目标达成！';
    } else if (earnings === 0) {
        document.getElementById('dream-days').textContent = '还需 ∞ 天';
    } else {
        document.getElementById('dream-days').textContent = `还需 ${remainingDays} 天`;
    }
}

// 检查成就
function checkAchievement(type, value) {
    const achievement = achievements[type];
    if (!achievement.unlocked && value >= achievement.threshold) {
        achievement.unlocked = true;
        unlockAchievement(type, achievement);
    }
}

// 解锁成就
function unlockAchievement(type, achievement) {
    // 更新UI
    const achievementElement = document.querySelector(`[data-achievement="${type}"]`);
    if (achievementElement) {
        achievementElement.classList.remove('locked');
        achievementElement.classList.add('unlocked');
    }
    
    // 显示通知
    showAchievementNotification(achievement.name, achievement.desc);
    
    // 播放成就音效
    playSound('achievement');
    
    // 创建庆祝特效
    if (settings.enableEffects) {
        createCelebrationEffect();
    }
}

// 显示成就通知
function showAchievementNotification(title, message) {
    const notification = document.getElementById('achievement-notification');
    const messageElement = document.getElementById('notification-message');
    
    messageElement.textContent = `${title} - ${message}`;
    notification.classList.add('show');
    
    // 3秒后自动隐藏
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// 创建粒子效果
function createParticles(count) {
    for (let i = 0; i < count; i++) {
        setTimeout(() => {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.left = Math.random() * 100 + '%';
            particle.style.background = `hsl(${Math.random() * 60 + 30}, 70%, 60%)`;
            
            elements.particlesContainer.appendChild(particle);
            
            // 2秒后移除
            setTimeout(() => {
                particle.remove();
            }, 2000);
        }, i * 100);
    }
}

// 创建收益粒子
function createEarningsParticle() {
    const particle = document.createElement('div');
    particle.className = 'coin-particle';
    particle.style.left = Math.random() * 80 + 10 + '%';
    particle.textContent = '¥';
    particle.style.color = '#fff';
    particle.style.display = 'flex';
    particle.style.alignItems = 'center';
    particle.style.justifyContent = 'center';
    particle.style.fontSize = '12px';
    particle.style.fontWeight = 'bold';
    
    elements.particlesContainer.appendChild(particle);
    
    setTimeout(() => {
        particle.remove();
    }, 1500);
}

// 创建庆祝特效
function createCelebrationEffect() {
    for (let i = 0; i < 20; i++) {
        setTimeout(() => {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            confetti.style.left = Math.random() * 100 + '%';
            confetti.style.background = `hsl(${Math.random() * 360}, 70%, 60%)`;
            confetti.style.animationDelay = Math.random() * 2 + 's';
            
            elements.confettiContainer.appendChild(confetti);
            
            setTimeout(() => {
                confetti.remove();
            }, 3000);
        }, i * 50);
    }
}

// 检查彩带动画
function checkConfetti(earnings) {
    const threshold = 100;
    const lastConfetti = localStorage.getItem('lastConfetti') || 0;
    
    if (earnings >= threshold && earnings - lastConfetti >= threshold) {
        localStorage.setItem('lastConfetti', Math.floor(earnings / threshold) * threshold);
        if (settings.enableEffects) {
            createCelebrationEffect();
        }
        playSound('confetti');
    }
}

// 播放音效
function playSound(type) {
    if (!settings.enableSounds) return;
    
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    let frequency, duration;
    
    switch (type) {
        case 'start':
            frequency = [400, 600, 800];
            duration = 0.5;
            break;
        case 'pause':
            frequency = [600, 400];
            duration = 0.3;
            break;
        case 'resume':
            frequency = [400, 600];
            duration = 0.3;
            break;
        case 'end':
            frequency = [800, 600, 400, 200];
            duration = 0.8;
            break;
        case 'achievement':
            frequency = [523, 659, 784, 1047];
            duration = 1.0;
            break;
        case 'confetti':
            frequency = [1047, 1319, 1568, 2093];
            duration = 1.2;
            break;
        default:
            frequency = [440];
            duration = 0.2;
    }
    
    if (Array.isArray(frequency)) {
        frequency.forEach((freq, index) => {
            setTimeout(() => {
                const osc = audioContext.createOscillator();
                const gain = audioContext.createGain();
                
                osc.connect(gain);
                gain.connect(audioContext.destination);
                
                osc.frequency.setValueAtTime(freq, audioContext.currentTime);
                gain.gain.setValueAtTime(0.1, audioContext.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
                
                osc.start(audioContext.currentTime);
                osc.stop(audioContext.currentTime + 0.2);
            }, index * 150);
        });
    } else {
        oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + duration);
    }
}

// 检查午休时间
function checkLunchBreak() {
    if (!settings.autoLunchBreak || !isWorking || isPaused) return;
    
    const now = new Date();
    const currentTime = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
    
    if (currentTime >= settings.lunchStart && currentTime <= settings.lunchEnd) {
        pauseWork();
        showNotification('午休时间', '自动暂停计时，享受午餐时光！');
    }
}

// 显示通知
function showNotification(title, message) {
    const notification = document.getElementById('achievement-notification');
    const titleElement = notification.querySelector('.notification-title');
    const messageElement = document.getElementById('notification-message');
    
    titleElement.textContent = title;
    messageElement.textContent = message;
    notification.classList.add('show');
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// 检查新的一天
function checkNewDay() {
    const today = new Date().toDateString();
    const lastDate = localStorage.getItem('lastWorkDate');
    
    if (lastDate !== today) {
        // 重置每日数据
        totalWorkTime = 0;
        pauseCount = 0;
        localStorage.setItem('lastWorkDate', today);
        
        // 重置成就状态（每日成就）
        achievements.coffee.unlocked = false;
        achievements.manager.unlocked = false;
        achievements.hundred.unlocked = false;
        
        // 更新成就UI
        document.querySelectorAll('.achievement').forEach(el => {
            const type = el.dataset.achievement;
            if (type !== 'survivor') { // 996幸存者是累计成就
                el.classList.remove('unlocked');
                el.classList.add('locked');
            }
        });
    }
}

// 保存每日数据
function saveDailyData() {
    const today = new Date().toDateString();
    const { secondRate } = calculateRates();
    const earnings = (totalWorkTime * secondRate).toFixed(2);
    
    // 保存到历史记录
    let history = JSON.parse(localStorage.getItem('earningsHistory') || '[]');
    history.push({
        date: today,
        earnings: parseFloat(earnings),
        workTime: totalWorkTime,
        pauseCount: pauseCount
    });
    
    // 只保留最近30天的数据
    if (history.length > 30) {
        history = history.slice(-30);
    }
    
    localStorage.setItem('earningsHistory', JSON.stringify(history));
    
    // 更新图表
    updateCharts();
}

// 显示日报
function showDailyReport() {
    const { secondRate } = calculateRates();
    const earnings = (totalWorkTime * secondRate).toFixed(2);
    const hours = Math.floor(totalWorkTime / 3600);
    const minutes = Math.floor((totalWorkTime % 3600) / 60);
    
    // 计算摸鱼指数
    const fishingIndex = Math.min(Math.floor(Math.random() * 50) + pauseCount * 10 + hours * 5, 99);
    
    // 更新日报内容
    document.getElementById('report-earnings').textContent = `¥${earnings}`;
    document.getElementById('report-hours').textContent = `${hours}小时${minutes}分钟`;
    document.getElementById('report-index').textContent = `击败了全国${fishingIndex}%的摸鱼选手`;
    document.getElementById('report-pauses').textContent = `${pauseCount}次`;
    
    // 生成励志消息
    const messages = [
        '恭喜你完成了今天的工作！记得劳逸结合，明天继续加油！',
        '今天的努力为明天的成功奠定了基础！',
        '时间就是金钱，你今天又变富了一点点！',
        '每一分钟的努力都在为梦想积累能量！',
        '工作虽然辛苦，但收获满满的成就感！'
    ];
    
    document.getElementById('daily-message').textContent = messages[Math.floor(Math.random() * messages.length)];
    
    // 显示日报
    const modal = document.getElementById('daily-report');
    modal.classList.add('show');
    modal.style.display = 'flex';
}

// 关闭日报
function closeReport() {
    const modal = document.getElementById('daily-report');
    modal.classList.remove('show');
    setTimeout(() => {
        modal.style.display = 'none';
    }, 300);
}

// 打开设置
// 物品管理相关函数
function renderItemsList() {
    const itemsList = document.getElementById('items-list');
    itemsList.innerHTML = '';
    
    Object.keys(itemsConfig).forEach(itemKey => {
        const item = itemsConfig[itemKey];
        const itemEditor = document.createElement('div');
        itemEditor.className = 'item-editor';
        itemEditor.innerHTML = `
            <input type="text" class="emoji-input" value="${item.icon}" data-field="icon" data-key="${itemKey}" placeholder="🎯">
            <input type="text" value="${item.name}" data-field="name" data-key="${itemKey}" placeholder="物品名称">
            <input type="number" value="${item.price}" data-field="price" data-key="${itemKey}" placeholder="价格" min="0.01" step="0.01">
            <input type="text" value="${item.unit}" data-field="unit" data-key="${itemKey}" placeholder="单位">
            <button type="button" class="btn-remove" onclick="removeItem('${itemKey}')">删除</button>
        `;
        itemsList.appendChild(itemEditor);
    });
    
    // 添加事件监听器
    itemsList.querySelectorAll('input').forEach(input => {
        input.addEventListener('input', updateItemConfig);
    });
}

function updateItemConfig(event) {
    const { field, key } = event.target.dataset;
    const value = event.target.value;
    
    if (itemsConfig[key]) {
        if (field === 'price') {
            itemsConfig[key][field] = parseFloat(value) || 0;
            itemPrices[key] = itemsConfig[key][field];
        } else {
            itemsConfig[key][field] = value;
        }
    }
}

function addNewItem() {
    const newKey = `item_${Date.now()}`;
    itemsConfig[newKey] = {
        icon: '🎯',
        name: '新物品',
        unit: '个',
        price: 10
    };
    itemPrices[newKey] = 10;
    renderItemsList();
    updateItemsDisplay();
}

function removeItem(itemKey) {
    if (confirm('确定要删除这个物品吗？')) {
        delete itemsConfig[itemKey];
        delete itemPrices[itemKey];
        renderItemsList();
        updateItemsDisplay();
    }
}

function updateItemsDisplay() {
    // 更新主界面的物品显示
    const itemsContainer = document.querySelector('.items-grid');
    if (itemsContainer) {
        itemsContainer.innerHTML = '';
        Object.keys(itemsConfig).forEach(itemKey => {
            const item = itemsConfig[itemKey];
            const itemDiv = document.createElement('div');
            itemDiv.className = 'item';
            itemDiv.innerHTML = `
                <span class="item-icon">${item.icon}</span>
                <span class="item-name">${item.name}</span>
                <span class="item-count" id="${itemKey}-count">0</span>${item.unit}
            `;
            itemsContainer.appendChild(itemDiv);
        });
    }
}

function saveItemsConfig() {
    localStorage.setItem('itemsConfig', JSON.stringify(itemsConfig));
}

function openSettings() {
    // 填充当前设置
    document.getElementById('monthly-salary').value = settings.monthlySalary;
    document.getElementById('work-days').value = settings.workDays;
    document.getElementById('work-hours').value = settings.workHours;
    document.getElementById('overtime-rate').value = settings.overtimeRate;
    document.getElementById('lunch-start').value = settings.lunchStart;
    document.getElementById('lunch-end').value = settings.lunchEnd;
    document.getElementById('enable-effects').checked = settings.enableEffects;
    document.getElementById('enable-sounds').checked = settings.enableSounds;
    document.getElementById('auto-lunch-break').checked = settings.autoLunchBreak;
    document.getElementById('auto-pause-hidden').checked = settings.autoPauseOnHidden;
    document.getElementById('auto-clean-history').checked = settings.autoCleanHistory || false;
    
    // 填充梦想基金设置
    document.getElementById('dream-icon').value = dreamConfig.icon;
    document.getElementById('dream-name').value = dreamConfig.name;
    document.getElementById('dream-target').value = dreamConfig.target;
    
    // 显示模态框
    elements.settingsModal.classList.add('show');
    elements.settingsModal.style.display = 'flex';
    
    // 渲染物品管理列表
    renderItemsList();
}

// 关闭设置
function closeSettings() {
    elements.settingsModal.classList.remove('show');
    setTimeout(() => {
        elements.settingsModal.style.display = 'none';
    }, 300);
}

// 保存设置
function saveSettings() {
    settings.monthlySalary = parseFloat(document.getElementById('monthly-salary').value) || 8000;
    settings.workDays = parseInt(document.getElementById('work-days').value) || 22;
    settings.workHours = parseFloat(document.getElementById('work-hours').value) || 8;
    settings.overtimeRate = parseFloat(document.getElementById('overtime-rate').value) || 1;
    settings.lunchStart = document.getElementById('lunch-start').value || '12:00';
    settings.lunchEnd = document.getElementById('lunch-end').value || '13:00';
    settings.enableEffects = document.getElementById('enable-effects').checked;
    settings.enableSounds = document.getElementById('enable-sounds').checked;
    settings.autoLunchBreak = document.getElementById('auto-lunch-break').checked;
    settings.autoPauseOnHidden = document.getElementById('auto-pause-hidden').checked;
    settings.autoCleanHistory = document.getElementById('auto-clean-history').checked;
    
    // 保存梦想基金配置
    dreamConfig.icon = document.getElementById('dream-icon').value || '🏖️';
    dreamConfig.name = document.getElementById('dream-name').value || '海南冲浪之旅';
    dreamConfig.target = parseInt(document.getElementById('dream-target').value) || 3000;
    
    // 保存到本地存储
    localStorage.setItem('workSettings', JSON.stringify(settings));
    localStorage.setItem('dreamConfig', JSON.stringify(dreamConfig));
    
    // 保存物品配置
    saveItemsConfig();
    
    // 更新主界面物品显示
    updateItemsDisplay();
    
    // 更新梦想基金显示
    updateDreamDisplay();
    
    // 更新显示
    updateDisplay();
    
    // 关闭设置
    closeSettings();
    
    // 显示保存成功提示
    showNotification('设置已保存', '新的设置已生效！');
}

// 加载设置
function loadSettings() {
    const saved = localStorage.getItem('workSettings');
    if (saved) {
        settings = { ...settings, ...JSON.parse(saved) };
    }
    
    // 加载自定义物品配置
    const savedItems = localStorage.getItem('itemsConfig');
    if (savedItems) {
        itemsConfig = { ...itemsConfig, ...JSON.parse(savedItems) };
        // 同步更新itemPrices
        Object.keys(itemsConfig).forEach(key => {
            itemPrices[key] = itemsConfig[key].price;
        });
    }
    
    // 加载梦想基金配置
    const savedDream = localStorage.getItem('dreamConfig');
    if (savedDream) {
        dreamConfig = { ...dreamConfig, ...JSON.parse(savedDream) };
    }
}

// 切换图表
function switchChart(chartType) {
    // 更新标签状态
    document.querySelectorAll('.chart-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelector(`[data-chart="${chartType}"]`).classList.add('active');
    
    // 切换图表显示
    document.getElementById('earnings-chart').style.display = chartType === 'earnings' ? 'block' : 'none';
    document.getElementById('time-chart').style.display = chartType === 'time' ? 'block' : 'none';
    
    // 更新图表
    updateCharts();
}

// 更新图表
function updateCharts() {
    updateEarningsChart();
    updateTimeChart();
}

// 更新收益图表
function updateEarningsChart() {
    const canvas = document.getElementById('earnings-chart');
    const ctx = canvas.getContext('2d');
    const history = JSON.parse(localStorage.getItem('earningsHistory') || '[]');
    
    // 清除画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (history.length === 0) {
        // 显示无数据提示
        ctx.fillStyle = '#666';
        ctx.font = '16px Inter';
        ctx.textAlign = 'center';
        ctx.fillText('暂无数据', canvas.width / 2, canvas.height / 2);
        return;
    }
    
    // 获取最近7天的数据
    const recentData = history.slice(-7);
    const maxEarnings = Math.max(...recentData.map(d => d.earnings), 100);
    
    // 绘制网格
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 1;
    
    // 垂直网格线
    for (let i = 0; i <= 6; i++) {
        const x = (canvas.width / 6) * i;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height - 30);
        ctx.stroke();
    }
    
    // 水平网格线
    for (let i = 0; i <= 5; i++) {
        const y = ((canvas.height - 30) / 5) * i;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }
    
    // 绘制折线
    if (recentData.length > 1) {
        ctx.strokeStyle = '#667eea';
        ctx.lineWidth = 3;
        ctx.beginPath();
        
        recentData.forEach((data, index) => {
            const x = (canvas.width / (recentData.length - 1)) * index;
            const y = canvas.height - 30 - (data.earnings / maxEarnings) * (canvas.height - 30);
            
            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        
        ctx.stroke();
        
        // 绘制数据点
        ctx.fillStyle = '#667eea';
        recentData.forEach((data, index) => {
            const x = (canvas.width / (recentData.length - 1)) * index;
            const y = canvas.height - 30 - (data.earnings / maxEarnings) * (canvas.height - 30);
            
            ctx.beginPath();
            ctx.arc(x, y, 4, 0, 2 * Math.PI);
            ctx.fill();
        });
    }
    
    // 绘制标签
    ctx.fillStyle = '#666';
    ctx.font = '12px Inter';
    ctx.textAlign = 'center';
    
    recentData.forEach((data, index) => {
        const x = (canvas.width / (recentData.length - 1)) * index;
        const date = new Date(data.date);
        const label = `${date.getMonth() + 1}/${date.getDate()}`;
        ctx.fillText(label, x, canvas.height - 10);
    });
}

// 更新时间分配图表
function updateTimeChart() {
    const canvas = document.getElementById('time-chart');
    const ctx = canvas.getContext('2d');
    
    // 清除画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 模拟时间分配数据
    const totalTime = totalWorkTime || 28800; // 8小时
    const workTime = totalWorkTime || Math.floor(totalTime * 0.6);
    const breakTime = Math.floor(totalTime * 0.2);
    const meetingTime = totalTime - workTime - breakTime;
    
    const data = [
        { label: '有效工作', value: workTime, color: '#4CAF50' },
        { label: '休息时间', value: breakTime, color: '#FF9800' },
        { label: '会议时间', value: meetingTime, color: '#2196F3' }
    ];
    
    // 绘制饼图
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2 - 20;
    const radius = Math.min(centerX, centerY) - 50;
    
    let currentAngle = -Math.PI / 2;
    
    data.forEach((item, index) => {
        const sliceAngle = (item.value / totalTime) * 2 * Math.PI;
        
        // 绘制扇形
        ctx.fillStyle = item.color;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
        ctx.closePath();
        ctx.fill();
        
        // 绘制标签
        const labelAngle = currentAngle + sliceAngle / 2;
        const labelX = centerX + Math.cos(labelAngle) * (radius + 30);
        const labelY = centerY + Math.sin(labelAngle) * (radius + 30);
        
        ctx.fillStyle = '#333';
        ctx.font = '12px Inter';
        ctx.textAlign = 'center';
        ctx.fillText(item.label, labelX, labelY);
        
        // 绘制百分比
        const percentage = ((item.value / totalTime) * 100).toFixed(1);
        ctx.fillText(`${percentage}%`, labelX, labelY + 15);
        
        currentAngle += sliceAngle;
    });
    
    // 绘制图例
    const legendY = canvas.height - 40;
    let legendX = 50;
    
    data.forEach((item, index) => {
        // 绘制颜色块
        ctx.fillStyle = item.color;
        ctx.fillRect(legendX, legendY, 15, 15);
        
        // 绘制文字
        ctx.fillStyle = '#333';
        ctx.font = '12px Inter';
        ctx.textAlign = 'left';
        ctx.fillText(item.label, legendX + 20, legendY + 12);
        
        legendX += 120;
    });
}

// 页面可见性变化处理（可选功能）
document.addEventListener('visibilitychange', function() {
    // 检查设置中是否启用了页面切换暂停功能
    if (settings.autoPauseOnHidden && document.hidden && isWorking && !isPaused) {
        // 页面隐藏时暂停计时（防止后台运行消耗资源）
        pauseWork();
        showNotification('自动暂停', '检测到页面切换，已自动暂停计时');
    }
});

// 页面卸载前保存数据
window.addEventListener('beforeunload', function() {
    if (isWorking) {
        saveDailyData();
    }
});

// 初始化图表
setTimeout(() => {
    updateCharts();
}, 1000);

// 启动本月累计金额独立更新定时器
function startMonthlyTimer() {
    // 如果已有定时器，先清除
    if (monthlyTimer) {
        clearInterval(monthlyTimer);
    }
    
    // 立即执行一次
    updateMonthlyEarnings();
    
    // 每分钟更新一次本月累计金额
    monthlyTimer = setInterval(updateMonthlyEarnings, 60000);
}

// 停止本月累计金额定时器
function stopMonthlyTimer() {
    if (monthlyTimer) {
        clearInterval(monthlyTimer);
        monthlyTimer = null;
    }
}

// 更新本月累计金额
function updateMonthlyEarnings() {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    // 获取历史数据
    const history = JSON.parse(localStorage.getItem('earningsHistory') || '[]');
    
    // 计算本月累计
    const monthlyTotal = history
        .filter(record => {
            const recordDate = new Date(record.date);
            return recordDate.getMonth() === currentMonth && recordDate.getFullYear() === currentYear;
        })
        .reduce((sum, record) => sum + record.earnings, 0);
    
    // 计算本年累计
    const yearlyTotal = history
        .filter(record => {
            const recordDate = new Date(record.date);
            return recordDate.getFullYear() === currentYear;
        })
        .reduce((sum, record) => sum + record.earnings, 0);
    
    // 加上今日收益
    const { secondRate } = calculateRates();
    const todayEarnings = totalWorkTime * secondRate;
    const totalMonthly = monthlyTotal + todayEarnings;
    const totalYearly = yearlyTotal + todayEarnings;
    
    // 使用数字滚动动画更新显示
    animateNumber(elements.monthlyEarnings, totalMonthly, '¥');
    animateNumber(elements.yearlyEarnings, totalYearly, '¥');
}

// 数字滚动动画函数
function animateNumber(element, targetValue, prefix = '', suffix = '', duration = 1000) {
    if (!element) return;
    
    // 获取当前值
    const currentText = element.textContent.replace(/[^\d.]/g, '');
    const currentValue = parseFloat(currentText) || 0;
    
    // 如果目标值和当前值相同，不执行动画
    if (Math.abs(targetValue - currentValue) < 0.01) return;
    
    // 添加滚动类名
    element.classList.add('rolling');
    
    const startTime = performance.now();
    const valueChange = targetValue - currentValue;
    const isIncreasing = valueChange > 0;
    
    function updateValue(timestamp) {
        const elapsed = timestamp - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // 使用更平滑的缓动函数
        const easeProgress = progress < 0.5 
            ? 4 * progress * progress * progress 
            : 1 - Math.pow(-2 * progress + 2, 3) / 2;
        
        const currentAnimatedValue = currentValue + (valueChange * easeProgress);
        
        // 更新显示
        element.textContent = `${prefix}${currentAnimatedValue.toFixed(2)}${suffix}`;
        
        // 添加动态视觉效果
        if (progress < 1) {
            // 缩放效果
            const scale = 1 + Math.sin(progress * Math.PI * 2) * 0.02;
            element.style.transform = `scale(${scale})`;
            
            // 颜色渐变效果
            if (isIncreasing) {
                const intensity = Math.sin(progress * Math.PI) * 0.3;
                element.style.color = `rgba(76, 175, 80, ${intensity + 0.7})`;
            }
            
            requestAnimationFrame(updateValue);
        } else {
            // 动画完成
            element.textContent = `${prefix}${targetValue.toFixed(2)}${suffix}`;
            element.style.transform = 'scale(1)';
            element.classList.remove('rolling');
            
            // 完成时的闪烁效果
            if (isIncreasing) {
                element.style.color = '#4CAF50';
                element.style.textShadow = '0 0 10px rgba(76, 175, 80, 0.5)';
                
                setTimeout(() => {
                    element.style.color = '';
                    element.style.textShadow = '';
                }, 500);
            } else {
                element.style.color = '';
            }
        }
    }
    
    requestAnimationFrame(updateValue);
}

// ==================== 日历功能 ====================

// 测试函数


// 打开日历
function openCalendar() {
    const modal = document.getElementById('calendar-modal');
    if (!modal) {
        alert('找不到日历模态框!');
        return;
    }
    
    modal.style.display = 'flex';
    modal.style.visibility = 'visible';
    modal.style.opacity = '1';
    modal.style.zIndex = '10001';
    
    currentCalendarDate = new Date();
    
    try {
        renderCalendar();
        updateCalendarStats();
    } catch (error) {
        console.error('日历功能出错:', error);
        alert('日历功能出错: ' + error.message);
    }
}

// 关闭日历
function closeCalendar() {
    elements.calendarModal.style.display = 'none';
}

// 切换月份
function changeMonth(direction) {
    currentCalendarDate.setMonth(currentCalendarDate.getMonth() + direction);
    renderCalendar();
    updateCalendarStats();
}

// 渲染日历
function renderCalendar() {
    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth();
    
    // 更新标题
    document.getElementById('calendar-year').textContent = year;
    document.getElementById('calendar-month').textContent = month + 1;
    
    // 获取月份信息
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    // 获取历史收益数据
    const history = JSON.parse(localStorage.getItem('earningsHistory') || '[]');
    const earningsMap = new Map();
    history.forEach(record => {
        const date = new Date(record.date);
        if (date.getFullYear() === year && date.getMonth() === month) {
            earningsMap.set(date.getDate(), record.earnings);
        }
    });
    
    // 添加今日收益（如果是当前月份）
    const today = new Date();
    if (year === today.getFullYear() && month === today.getMonth()) {
        const { secondRate } = calculateRates();
        const todayEarnings = totalWorkTime * secondRate;
        earningsMap.set(today.getDate(), todayEarnings);
    }
    
    // 清空日历容器
    const calendarDays = document.getElementById('calendar-days');
    calendarDays.innerHTML = '';
    
    // 添加上个月的尾部日期
    const prevMonth = new Date(year, month - 1, 0);
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
        const day = prevMonth.getDate() - i;
        const dayElement = createCalendarDay(day, 0, true, false);
        calendarDays.appendChild(dayElement);
    }
    
    // 添加当前月份的日期
    for (let day = 1; day <= daysInMonth; day++) {
        const earnings = earningsMap.get(day) || 0;
        const isToday = year === today.getFullYear() && 
                       month === today.getMonth() && 
                       day === today.getDate();
        const dayElement = createCalendarDay(day, earnings, false, isToday);
        calendarDays.appendChild(dayElement);
    }
    
    // 添加下个月的开头日期
    const totalCells = calendarDays.children.length;
    const remainingCells = 42 - totalCells; // 6行 × 7列
    for (let day = 1; day <= remainingCells; day++) {
        const dayElement = createCalendarDay(day, 0, true, false);
        calendarDays.appendChild(dayElement);
    }
}

// 创建日历日期元素
function createCalendarDay(day, earnings, isOtherMonth, isToday) {
    const dayElement = document.createElement('div');
    dayElement.className = 'calendar-day';
    
    if (isOtherMonth) {
        dayElement.classList.add('other-month');
    } else if (isToday) {
        dayElement.classList.add('today');
    }
    
    // 根据收益添加颜色类
    if (!isOtherMonth && earnings > 0) {
        if (earnings >= 100) {
            dayElement.classList.add('high-earnings');
        } else if (earnings >= 50) {
            dayElement.classList.add('medium-earnings');
        } else {
            dayElement.classList.add('low-earnings');
        }
    } else if (!isOtherMonth) {
        dayElement.classList.add('no-work');
    }
    
    // 创建日期数字
    const dayNumber = document.createElement('div');
    dayNumber.className = 'day-number';
    dayNumber.textContent = day;
    dayElement.appendChild(dayNumber);
    
    // 创建收益显示
    if (!isOtherMonth && earnings > 0) {
        const dayEarnings = document.createElement('div');
        dayEarnings.className = 'day-earnings';
        dayEarnings.textContent = `¥${earnings.toFixed(0)}`;
        dayElement.appendChild(dayEarnings);
    }
    
    // 添加点击事件（可以扩展为显示详细信息）
    if (!isOtherMonth) {
        dayElement.addEventListener('click', () => {
            showDayDetails(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth(), day, earnings);
        });
    }
    
    return dayElement;
}

// 显示日期详情（可扩展功能）
function showDayDetails(year, month, day, earnings) {
    const date = new Date(year, month, day);
    const dateStr = date.toLocaleDateString('zh-CN');
    
    if (earnings > 0) {
        alert(`${dateStr}\n收益：¥${earnings.toFixed(2)}`);
    } else {
        alert(`${dateStr}\n当日未工作`);
    }
}

// 更新日历统计信息
function updateCalendarStats() {
    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth();
    const history = JSON.parse(localStorage.getItem('earningsHistory') || '[]');
    
    // 计算本月累计
    let monthlyTotal = history
        .filter(record => {
            const recordDate = new Date(record.date);
            return recordDate.getMonth() === month && recordDate.getFullYear() === year;
        })
        .reduce((sum, record) => sum + record.earnings, 0);
    
    // 计算本年累计
    let yearlyTotal = history
        .filter(record => {
            const recordDate = new Date(record.date);
            return recordDate.getFullYear() === year;
        })
        .reduce((sum, record) => sum + record.earnings, 0);
    
    // 计算工作天数
    let workDays = history
        .filter(record => {
            const recordDate = new Date(record.date);
            return recordDate.getMonth() === month && 
                   recordDate.getFullYear() === year && 
                   record.earnings > 0;
        }).length;
    
    // 如果是当前月份，加上今日数据
    const today = new Date();
    if (year === today.getFullYear() && month === today.getMonth()) {
        const { secondRate } = calculateRates();
        const todayEarnings = totalWorkTime * secondRate;
        monthlyTotal += todayEarnings;
        yearlyTotal += todayEarnings;
        
        if (todayEarnings > 0) {
            workDays += 1;
        }
    }
    
    // 更新显示
    document.getElementById('calendar-monthly-total').textContent = `¥${monthlyTotal.toFixed(2)}`;
    document.getElementById('calendar-yearly-total').textContent = `¥${yearlyTotal.toFixed(2)}`;
    document.getElementById('calendar-work-days').textContent = `${workDays}天`;
}

// 重置月度数据（每月1号调用）
function resetMonthlyData() {
    const today = new Date();
    const lastReset = localStorage.getItem('lastMonthlyReset');
    const currentMonth = `${today.getFullYear()}-${today.getMonth()}`;
    
    if (lastReset !== currentMonth && today.getDate() === 1) {
        // 新月份开始，重置相关数据
        localStorage.setItem('lastMonthlyReset', currentMonth);
        
        // 可以在这里添加月度重置逻辑
        console.log('新月份开始，月度数据已重置');
        
        // 更新显示
        updateMonthlyEarnings();
    }
}

// 重置年度数据（每年1月1日调用）
function resetYearlyData() {
    const today = new Date();
    const lastYearlyReset = localStorage.getItem('lastYearlyReset');
    const currentYear = today.getFullYear().toString();
    
    if (lastYearlyReset !== currentYear && today.getMonth() === 0 && today.getDate() === 1) {
        // 新年开始，重置年度相关数据
        localStorage.setItem('lastYearlyReset', currentYear);
        
        // 年度重置逻辑
        console.log(`新年开始（${currentYear}年），年度数据已重置`);
        
        // 可选：清理上一年的收益历史记录（保留最近一年的数据）
        if (settings.autoCleanHistory) {
            cleanOldHistoryData(currentYear);
        }
        
        // 更新显示
        updateMonthlyEarnings();
        
        // 显示新年祝贺消息
        if (settings.enableEffects) {
            showNewYearMessage(currentYear);
        }
    }
}

// 清理旧的历史数据（保留当前年度数据）
function cleanOldHistoryData(currentYear) {
    const history = JSON.parse(localStorage.getItem('earningsHistory') || '[]');
    const currentYearHistory = history.filter(record => {
        const recordDate = new Date(record.date);
        return recordDate.getFullYear() === parseInt(currentYear);
    });
    
    localStorage.setItem('earningsHistory', JSON.stringify(currentYearHistory));
    console.log(`已清理${parseInt(currentYear) - 1}年及之前的历史数据`);
}

// 显示新年祝贺消息
function showNewYearMessage(year) {
    // 创建新年祝贺特效
    createConfetti();
    
    // 可以添加更多新年特效
    setTimeout(() => {
        if (confirm(`🎉 新年快乐！欢迎来到${year}年！\n\n是否要查看去年的收益总结？`)) {
            // 可以扩展为显示年度总结
            showYearSummary(parseInt(year) - 1);
        }
    }, 1000);
}

// 显示年度总结（可扩展功能）
function showYearSummary(year) {
    const history = JSON.parse(localStorage.getItem('earningsHistory') || '[]');
    const yearData = history.filter(record => {
        const recordDate = new Date(record.date);
        return recordDate.getFullYear() === year;
    });
    
    const totalEarnings = yearData.reduce((sum, record) => sum + record.earnings, 0);
    const workDays = yearData.filter(record => record.earnings > 0).length;
    const avgDaily = workDays > 0 ? totalEarnings / workDays : 0;
    
    alert(`📊 ${year}年收益总结\n\n` +
          `总收益：¥${totalEarnings.toFixed(2)}\n` +
          `工作天数：${workDays}天\n` +
          `日均收益：¥${avgDaily.toFixed(2)}\n\n` +
          `感谢您的努力工作！`);
}

// 在现有的checkNewDay函数中添加月度和年度重置检查
function checkNewDay() {
    const today = new Date().toDateString();
    const lastDate = localStorage.getItem('lastWorkDate');
    
    if (lastDate !== today) {
        // 新的一天，重置相关数据
        totalWorkTime = 0;
        pauseCount = 0;
        localStorage.setItem('lastWorkDate', today);
        
        // 清理会话时间记录，确保新的一天时间计算准确
        localStorage.removeItem('lastSessionTime');
        
        // 检查年度重置（优先检查，因为1月1日既是新年也是新月）
        resetYearlyData();
        
        // 检查月度重置
        resetMonthlyData();
        
        updateDisplay();
    }
}