// ===== 使用者認證系統 =====

// 取得所有使用者
function getUsers() {
    let users = localStorage.getItem('kidsWebUsers');
    users = users ? JSON.parse(users) : [];

    // 自動創建 admin 帳號（如果不存在）
    if (!users.find(u => u.username === 'admin')) {
        users.push({
            username: 'admin',
            password: 'admin123',
            createdAt: new Date().toISOString()
        });
        saveUsers(users);
        console.log('✅ admin 帳號已自動創建');
    }

    return users;
}

// 儲存使用者
function saveUsers(users) {
    localStorage.setItem('kidsWebUsers', JSON.stringify(users));
}

// 註冊新使用者
function registerUser(username, password) {
    const users = getUsers();

    // 檢查帳號是否已存在
    if (users.find(u => u.username === username)) {
        showAuthMessage('⚠️ 這個帳號已經有人用了，換一個吧！', 'error');
        return false;
    }

    // 建立新使用者
    const newUser = {
        username: username,
        password: password, // 簡單儲存（小朋友用，不需要加密）
        createdAt: new Date().toISOString()
    };
    users.push(newUser);
    saveUsers(users);

    // 自動登入
    setCurrentUser(newUser);
    showAuthMessage('🎉 註冊成功！歡迎加入開心小天地！', 'success');

    // 2秒後跳轉到首頁
    setTimeout(() => {
        window.location.href = 'index.html';
    }, 2000);

    return true;
}

// 執行登入（從表單獲取值）
function doLogin() {
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;

    if (!username || !password) {
        showAuthMessage('📝 請輸入帳號和密碼！', 'error');
        return false;
    }

    const users = getUsers();
    const user = users.find(u => u.username === username && u.password === password);

    if (user) {
        setCurrentUser(user);
        showAuthMessage('✨ 登入成功！歡迎回來～', 'success');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1500);
        return true;
    } else {
        showAuthMessage('😕 帳號或密碼錯了，再試試看！', 'error');
        return false;
    }
}

// 設定當前使用者
function setCurrentUser(user) {
    sessionStorage.setItem('currentUser', JSON.stringify(user));
}

// 取得當前使用者
function getCurrentUser() {
    const user = sessionStorage.getItem('currentUser');
    return user ? JSON.parse(user) : null;
}

// 登出
function logout() {
    sessionStorage.removeItem('currentUser');
    window.location.href = 'index.html';
}

// 顯示認證訊息
function showAuthMessage(message, type) {
    const msgEl = document.getElementById('authMessage');
    if (msgEl) {
        msgEl.textContent = message;
        msgEl.className = `auth-message ${type}`;
        msgEl.style.display = 'block';
    } else {
        alert(message);
    }
}

// 顯示註冊表單
function showRegister() {
    document.getElementById('loginSection').style.display = 'none';
    document.getElementById('registerSection').style.display = 'flex';
}

// 顯示登入表單
function showLogin() {
    document.getElementById('registerSection').style.display = 'none';
    document.getElementById('loginSection').style.display = 'flex';
}

// ===== 記帳功能 =====

// 從 localStorage 讀取記錄（僅限當前使用者）
function getRecords() {
    const currentUser = getCurrentUser();
    if (!currentUser) return [];

    const key = `kidsLedgerRecords_${currentUser.username}`;
    const records = localStorage.getItem(key);
    return records ? JSON.parse(records) : [];
}

// 儲存記錄到 localStorage
function saveRecords(records) {
    const currentUser = getCurrentUser();
    if (!currentUser) return;

    const key = `kidsLedgerRecords_${currentUser.username}`;
    localStorage.setItem(key, JSON.stringify(records));
}

// 計算總餘額
function calculateBalance() {
    const records = getRecords();
    return records.reduce((total, record) => {
        return record.type === 'income'
            ? total + record.amount
            : total - record.amount;
    }, 0);
}

// 更新顯示的餘額
function updateBalanceDisplay() {
    const balance = calculateBalance();
    const balanceEl = document.getElementById('totalBalance');
    if (balanceEl) {
        balanceEl.textContent = `$${balance.toLocaleString()}`;

        // 根據餘額顯示不同顏色
        if (balance > 0) {
            balanceEl.style.color = '#6BCB77';
        } else if (balance < 0) {
            balanceEl.style.color = '#FF8B5A';
        } else {
            balanceEl.style.color = '#5D4E0B';
        }
    }
}

// 渲染記錄列表
function renderRecords() {
    const container = document.getElementById('recordsContainer');
    const records = getRecords();

    if (!container) return;

    if (records.length === 0) {
        container.innerHTML = '<p class="empty-message">還沒有記錄喔！加一筆吧～ 🎈</p>';
        return;
    }

    // 按日期排序（新的在上面）
    const sortedRecords = [...records].sort((a, b) => new Date(b.date) - new Date(a.date));

    container.innerHTML = sortedRecords.map((record, index) => `
        <div class="record-item ${record.type}" data-index="${index}">
            <span class="record-date">${formatDate(record.date)}</span>
            <span class="record-type">${record.type === 'income' ? '💰' : '💸'}</span>
            <span class="record-amount">${record.type === 'income' ? '+' : '-'}$${record.amount.toLocaleString()}</span>
            <button class="record-delete" onclick="deleteRecord(${index})">🗑️</button>
        </div>
    `).join('');
}

// 格式化日期
function formatDate(dateStr) {
    const date = new Date(dateStr);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${month}月${day}日`;
}

// 刪除記錄
function deleteRecord(originalIndex) {
    if (!confirm('🗑️ 確定要刪除這筆記錄嗎？')) return;

    const records = getRecords();
    const sortedRecords = [...records].sort((a, b) => new Date(b.date) - new Date(a.date));
    sortedRecords.splice(originalIndex, 1);

    // 重新對應並儲存
    const key = `kidsLedgerRecords_${getCurrentUser().username}`;
    localStorage.setItem(key, JSON.stringify(sortedRecords));

    renderRecords();
    updateBalanceDisplay();
}

// 新增記錄
function addRecord() {
    const currentUser = getCurrentUser();
    if (!currentUser) {
        alert('🔐 請先登入才能記帳喔！');
        return;
    }

    const dateEl = document.getElementById('date');
    const amountEl = document.getElementById('amount');
    const typeBtns = document.querySelectorAll('.type-btn');
    const activeBtn = document.querySelector('.type-btn.active');

    const date = dateEl.value;
    const amount = parseInt(amountEl.value);
    const type = activeBtn ? activeBtn.dataset.type : 'income';

    // 驗證輸入
    if (!date) {
        alert('📅 請選擇日期喔！');
        return;
    }

    if (!amount || amount <= 0) {
        alert('💵 請輸入金額！');
        return;
    }

    // 建立新記錄
    const records = getRecords();
    records.push({ date, amount, type });
    saveRecords(records);

    // 清空表單
    amountEl.value = '';

    // 更新顯示
    renderRecords();
    updateBalanceDisplay();

    // 顯示成功提示
    const message = type === 'income'
        ? '💰 收入記錄成功！'
        : '💸 支出記錄成功！';
    showToast(message);
}

// 顯示提示訊息
function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast-message';
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 20px 40px;
        border-radius: 15px;
        font-size: 1.2rem;
        z-index: 1000;
        animation: fadeInOut 2s ease forwards;
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
}

// ===== 頁面狀態檢查 =====

// 檢查登入狀態（首頁用）
function checkLoginStatus() {
    const user = getCurrentUser();
    const loggedOut = document.getElementById('loggedOut');
    const loggedIn = document.getElementById('loggedIn');
    const headerUserName = document.getElementById('headerUserName');

    if (user) {
        // 已登入
        if (loggedOut) loggedOut.style.display = 'none';
        if (loggedIn) {
            loggedIn.style.display = 'flex';
            if (headerUserName) headerUserName.textContent = `👋 ${user.username}`;
        }
    } else {
        // 未登入
        if (loggedOut) loggedOut.style.display = 'flex';
        if (loggedIn) loggedIn.style.display = 'none';
    }
}

// 檢查登入狀態（記帳頁用）
function checkLoginForLedger() {
    const user = getCurrentUser();
    const notLoggedIn = document.getElementById('notLoggedIn');
    const ledgerContent = document.getElementById('ledgerContent');
    const userInfo = document.getElementById('userInfo');
    const userDisplayName = document.getElementById('userDisplayName');
    const userDisplayName2 = document.getElementById('userDisplayName2');

    if (user) {
        // 已登入
        if (notLoggedIn) notLoggedIn.style.display = 'none';
        if (ledgerContent) ledgerContent.style.display = 'block';
        if (userInfo) {
            userInfo.style.display = 'flex';
            const userNameEl = document.getElementById('userName');
            if (userNameEl) userNameEl.textContent = `👋 ${user.username}`;
        }
        if (userDisplayName) userDisplayName.textContent = user.username;
        if (userDisplayName2) userDisplayName2.textContent = user.username;

        // 初始化記帳功能
        initLedger();
    } else {
        // 未登入
        if (notLoggedIn) notLoggedIn.style.display = 'block';
        if (ledgerContent) ledgerContent.style.display = 'none';
        if (userInfo) userInfo.style.display = 'none';
    }
}

// 初始化記帳功能
function initLedger() {
    const dateInput = document.getElementById('date');
    if (dateInput) {
        const today = new Date().toISOString().split('T')[0];
        dateInput.value = today;
    }

    // 收入/支出按鈕切換
    const typeBtns = document.querySelectorAll('.type-btn');
    typeBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            typeBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
        });
    });

    // 加入按鈕
    const addBtn = document.getElementById('addBtn');
    if (addBtn) {
        addBtn.addEventListener('click', addRecord);
    }

    // 初始化顯示
    renderRecords();
    updateBalanceDisplay();
}

// ===== 本週表現功能（支援兩個小朋友）=====

// 小朋友列表
const KIDS = ['evelyn', 'howie'];

// 當前查看的週次偏移（0 = 本週，1 = 下週，-1 = 上週）
let currentWeekOffset = 0;

// 取得當前週次的開始和結束日期
function getCurrentWeekDates(weekOffset = 0) {
    const dates = [];
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = 週日
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // 調整到週一

    // 找到本週一
    const monday = new Date(now);
    monday.setDate(now.getDate() + mondayOffset + (weekOffset * 7));

    // 生成一週的日期
    for (let i = 0; i < 7; i++) {
        const date = new Date(monday);
        date.setDate(monday.getDate() + i);
        dates.push(date);
    }

    return dates;
}

// 格式化日期為 YYYY-MM-DD
function formatDateISO(date) {
    return date.toISOString().split('T')[0];
}

// 取得某小朋友的表現記錄
function getPerformanceRecords(kid) {
    const key = `kidsPerformance_${kid}`;
    const records = localStorage.getItem(key);
    return records ? JSON.parse(records) : {};
}

// 儲存某小朋友的表現記錄
function savePerformanceRecords(kid, records) {
    const key = `kidsPerformance_${kid}`;
    localStorage.setItem(key, JSON.stringify(records));
}

// 切換某小朋友的勾選狀態
function toggleCheck(kid, date, category) {
    const records = getPerformanceRecords(kid);
    const key = `${date}_${category}`;

    if (records[key]) {
        delete records[key];
    } else {
        records[key] = true;
    }

    savePerformanceRecords(kid, records);
    renderBothTables();
}

// 計算某小朋友某日期的勾勾數
function getCheckCountForDate(kid, date) {
    const records = getPerformanceRecords(kid);
    const categories = ['school', 'care', 'study', 'sleep'];
    let count = 0;

    categories.forEach(cat => {
        if (records[`${date}_${cat}`]) count++;
    });

    return count;
}

// 計算某小朋友某分類的總勾勾數
function getTotalForCategory(kid, category) {
    const dates = getCurrentWeekDates(currentWeekOffset);
    const records = getPerformanceRecords(kid);
    let total = 0;

    dates.forEach(date => {
        const dateStr = formatDateISO(date);
        if (records[`${dateStr}_${category}`]) total++;
    });

    return total;
}

// 計算某小朋友本週總勾勾數
function getGrandTotal(kid) {
    const dates = getCurrentWeekDates(currentWeekOffset);
    let total = 0;

    dates.forEach(date => {
        total += getCheckCountForDate(kid, formatDateISO(date));
    });

    return total;
}

// 渲染單個小朋友的表格
function renderKidTable(kid, isEditable) {
    const tbody = document.getElementById(`${kid}Body`);
    if (!tbody) return null;

    const dates = getCurrentWeekDates(currentWeekOffset);
    const records = getPerformanceRecords(kid);
    const today = formatDateISO(new Date());
    const categories = [
        { key: 'school', label: '🏫' },
        { key: 'care', label: '🛁' },
        { key: 'study', label: '📚' },
        { key: 'sleep', label: '😴' }
    ];

    tbody.innerHTML = dates.map(date => {
        const dateStr = formatDateISO(date);
        const isToday = dateStr === today;
        const dayName = ['週日', '週一', '週二', '週三', '週四', '週五', '週六'][date.getDay()];
        const displayDate = `${date.getMonth() + 1}/${date.getDate()}`;
        const dayCheckCount = getCheckCountForDate(kid, dateStr);

        const checkCells = categories.map(cat => {
            const isChecked = records[`${dateStr}_${cat.key}`];
            const onclick = isEditable ? `onclick="toggleCheck('${kid}', '${dateStr}', '${cat.key}')"` : '';
            const cellClass = isEditable ? 'checkbox-cell' : 'checkbox-cell readonly';
            const checkboxClass = isChecked ? 'checkbox checked' : 'checkbox';

            return `
                <td class="${cellClass}" ${onclick}>
                    <div class="${checkboxClass}"></div>
                </td>
            `;
        }).join('');

        return `
            <tr class="${isToday ? 'today' : ''}">
                <td>${displayDate} ${dayName}${isToday ? ' 🔥' : ''}</td>
                ${checkCells}
                <td class="count-cell">${dayCheckCount}⭐</td>
            </tr>
        `;
    }).join('');

    // 更新總計
    document.getElementById(`${kid}School`).textContent = getTotalForCategory(kid, 'school');
    document.getElementById(`${kid}Care`).textContent = getTotalForCategory(kid, 'care');
    document.getElementById(`${kid}Study`).textContent = getTotalForCategory(kid, 'study');
    document.getElementById(`${kid}Sleep`).textContent = getTotalForCategory(kid, 'sleep');
    document.getElementById(`${kid}Total`).textContent = getGrandTotal(kid) + '⭐';
}

// 渲染兩個表格
function renderBothTables() {
    const isEditable = isAdmin();
    KIDS.forEach(kid => {
        renderKidTable(kid, isEditable);
    });
}

// 切換週次
function changeWeek(offset) {
    currentWeekOffset += offset;
    renderBothTables();
    renderWeekTitle();
}

// 渲染週次標題
function renderWeekTitle() {
    const dates = getCurrentWeekDates(currentWeekOffset);
    const startDate = `${dates[0].getMonth() + 1}月${dates[0].getDate()}日`;
    const endDate = `${dates[6].getMonth() + 1}月${dates[6].getDate()}日`;
    const year = dates[0].getFullYear();

    const titleEl = document.getElementById('weekTitle');
    if (titleEl) {
        titleEl.textContent = `${year}年 ${startDate} - ${endDate}`;
    }
}

// 渲染成就（顯示兩個人的成就）
function renderAchievements() {
    const container = document.getElementById('achievementsContainer');
    if (!container) return;

    const isEditable = isAdmin();
    const achievements = [];

    KIDS.forEach(kid => {
        const kidName = kid === 'evelyn' ? 'Evelyn' : 'Howie';
        achievements.push(
            { id: `${kid}_perfect`, icon: '🏆', name: `${kidName} 完美一週`, condition: () => getGrandTotal(kid) >= 28 },
            { id: `${kid}_early`, icon: '🌅', name: `${kidName} 早起`, condition: () => getTotalForCategory(kid, 'school') >= 5 },
            { id: `${kid}_clean`, icon: '✨', name: `${kidName} 愛乾淨`, condition: () => getTotalForCategory(kid, 'care') >= 5 },
            { id: `${kid}_study`, icon: '🧠', name: `${kidName} 认真学习`, condition: () => getTotalForCategory(kid, 'study') >= 5 },
            { id: `${kid}_sleep`, icon: '😴', name: `${kidName} 睡飽飽`, condition: () => getTotalForCategory(kid, 'sleep') >= 5 }
        );
    });

    // 總成就
    const evelynTotal = getGrandTotal('evelyn');
    const howieTotal = getGrandTotal('howie');
    achievements.push(
        { id: 'combined_star', icon: '⭐', name: '雙寶貝星星', condition: () => (evelynTotal + howieTotal) >= 20 }
    );

    container.innerHTML = achievements.map(ach => {
        const unlocked = ach.condition();
        return `
            <div class="achievement-badge ${unlocked ? 'unlocked' : ''}">
                <span class="achievement-icon">${ach.icon}</span>
                <span>${ach.name}</span>
            </div>
        `;
    }).join('');
}

// 管理員帳號（預設）
const ADMIN_USER = {
    username: 'admin',
    password: 'admin123'
};

// 檢查是否為管理員
function isAdmin() {
    const user = getCurrentUser();
    return user && user.username === ADMIN_USER.username;
}

// 檢查登入狀態（表現頁用）
function checkLoginForPerformance() {
    const user = getCurrentUser();
    const loading = document.getElementById('loading');
    const performanceContent = document.getElementById('performanceContent');
    const adminSection = document.getElementById('adminSection');
    const editPrompt = document.getElementById('editPrompt');

    // 隱藏載入中，顯示內容
    if (loading) loading.style.display = 'none';
    if (performanceContent) performanceContent.style.display = 'block';

    // 檢查是否為管理員
    if (isAdmin()) {
        // 管理員登入中
        if (adminSection) {
            adminSection.style.display = 'flex';
            const adminNameEl = document.getElementById('adminName');
            if (adminNameEl) adminNameEl.textContent = `🔧 管理員模式`;
        }
        if (editPrompt) editPrompt.style.display = 'block';
    } else {
        // 一般使用者或未登入
        if (adminSection) adminSection.style.display = 'none';
        if (editPrompt) {
            editPrompt.style.display = 'none';
            // 顯示提示
            const publicMsg = document.getElementById('publicMessage');
            if (publicMsg) {
                publicMsg.innerHTML = `
                    <p>👀 大家都可以看到本週表現喔！</p>
                    <p>🔐 只有管理員可以編輯勾選</p>
                `;
            }
        }
    }

    // 初始化表格
    renderWeekTitle();
    renderBothTables();
    renderAchievements();
}

// ===== DOM Ready =====

document.addEventListener('DOMContentLoaded', function() {
    // 通用：收入/支出按鈕切換
    const typeBtns = document.querySelectorAll('.type-btn');
    typeBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            typeBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
        });
    });

    // 登入頁：綁定按鈕
    const loginBtn = document.querySelector('.login-auth-btn');
    if (loginBtn) {
        loginBtn.addEventListener('click', doLogin);
    }

    const registerBtn = document.querySelector('.register-auth-btn');
    if (registerBtn) {
        registerBtn.addEventListener('click', function() {
            const username = document.getElementById('regUsername').value.trim();
            const password = document.getElementById('regPassword').value;
            const passwordConfirm = document.getElementById('regPasswordConfirm').value;

            if (!username || !password) {
                showAuthMessage('📝 請填寫所有欄位！', 'error');
                return;
            }

            if (password !== passwordConfirm) {
                showAuthMessage('🔑 兩次密碼不一樣，請檢查！', 'error');
                return;
            }

            if (password.length < 4) {
                showAuthMessage('🔑 密碼至少要4個字元！', 'error');
                return;
            }

            registerUser(username, password);
        });
    }

    // 記帳頁：綁定加入按鈕
    const addBtn = document.getElementById('addBtn');
    if (addBtn) {
        addBtn.addEventListener('click', addRecord);
    }
});

// ===== 規矩功能 =====

// 取得規矩列表
function getRules() {
    const rules = localStorage.getItem('kidsRules');
    return rules ? JSON.parse(rules) : [];
}

// 儲存規矩列表
function saveRules(rules) {
    localStorage.setItem('kidsRules', JSON.stringify(rules));
}

// 新增規矩
function addRule() {
    const textEl = document.getElementById('newRuleText');
    if (!textEl) return;

    const text = textEl.value.trim();
    if (!text) {
        alert('📝 請輸入規矩內容！');
        return;
    }

    const rules = getRules();
    rules.push({
        id: Date.now(),
        text: text,
        createdAt: new Date().toISOString()
    });

    saveRules(rules);
    textEl.value = '';
    renderRules();
}

// 刪除規矩
function deleteRule(id) {
    if (!confirm('🗑️ 確定要刪除這個規矩嗎？')) return;

    const rules = getRules().filter(r => r.id !== id);
    saveRules(rules);
    renderRules();
}

// 渲染規矩列表
function renderRules() {
    const container = document.getElementById('rulesDisplay');
    const rules = getRules();
    const isAdminUser = isAdmin();

    if (!container) return;

    if (rules.length === 0) {
        container.innerHTML = `
            <div class="rules-template">
                <h2>📜 這裡是規矩區</h2>
                <p class="placeholder-text">敬請期待...</p>
                <div class="construction">🚧 施工中 🚧</div>
            </div>
        `;
        return;
    }

    container.innerHTML = `
        <div class="rules-list">
            ${rules.map((rule, index) => `
                <div class="rule-item">
                    <div class="rule-number">${index + 1}</div>
                    <div class="rule-text">${escapeHtml(rule.text)}</div>
                    ${isAdminUser ? `
                        <button class="rule-delete-btn" onclick="deleteRule(${rule.id})">🗑️</button>
                    ` : ''}
                </div>
            `).join('')}
        </div>
    `;
}

// 初始化規矩頁面
function initRulesPage() {
    const loading = document.getElementById('loading');
    const content = document.getElementById('rulesContent');
    const adminSection = document.getElementById('adminSection');
    const adminEditSection = document.getElementById('adminEditSection');

    // 隱藏載入中，顯示內容
    if (loading) loading.style.display = 'none';
    if (content) content.style.display = 'block';

    // 檢查是否為管理員
    if (isAdmin()) {
        if (adminSection) {
            adminSection.style.display = 'flex';
            const adminNameEl = document.getElementById('adminName');
            if (adminNameEl) adminNameEl.textContent = `🔧 管理員模式`;
        }
        if (adminEditSection) adminEditSection.style.display = 'block';
    } else {
        if (adminSection) adminSection.style.display = 'none';
        if (adminEditSection) adminEditSection.style.display = 'none';
    }

    // 渲染規矩
    renderRules();
}

// HTML 跳脫
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ===== 打地鼠遊戲 =====

let gameTimer = null;
let moleTimer = null;
let score = 0;
let timeLeft = 60;
let isPlaying = false;

// 初始化打地鼠遊戲
function initWhackMole() {
    const holes = document.querySelectorAll('.mole-hole');
    holes.forEach(hole => {
        hole.addEventListener('click', () => whackMole(hole));
    });
}

// 開始遊戲
function startWhackMole() {
    if (isPlaying) return;

    // 重置遊戲
    score = 0;
    timeLeft = 60;
    isPlaying = true;

    // 更新顯示
    updateTimer();
    updateScore();
    document.getElementById('gameOver').style.display = 'none';
    document.getElementById('startBtn').disabled = true;
    document.getElementById('startBtn').textContent = '🎮 遊戲進行中...';

    // 清除舊的地鼠
    document.querySelectorAll('.mole').forEach(m => m.remove());
    document.querySelectorAll('.mole-hole').forEach(h => h.classList.remove('active', 'hit'));

    // 開始計時
    gameTimer = setInterval(() => {
        timeLeft--;
        updateTimer();

        if (timeLeft <= 0) {
            endGame();
        }
    }, 1000);

    // 開始出現地鼠（小朋友適合的速度）
    showMole();
}

// 顯示地鼠
function showMole() {
    if (!isPlaying) return;

    const holes = document.querySelectorAll('.mole-hole');
    const randomHole = holes[Math.floor(Math.random() * holes.length)];

    // 確保這個洞沒有地鼠
    if (randomHole.classList.contains('active')) {
        showMole();
        return;
    }

    // 添加地鼠
    const mole = document.createElement('div');
    mole.className = 'mole';
    randomHole.appendChild(mole);
    randomHole.classList.add('active');

    // 小朋友適合的速度：800ms-1200ms
    const stayTime = Math.random() * 400 + 800;

    setTimeout(() => {
        if (randomHole.classList.contains('active')) {
            randomHole.classList.remove('active');
            randomHole.removeChild(mole);
        }

        // 繼續出現地鼠
        if (isPlaying) {
            showMole();
        }
    }, stayTime);
}

// 打地鼠
function whackMole(hole) {
    if (!isPlaying) return;

    if (hole.classList.contains('active') && !hole.classList.contains('hit')) {
        hole.classList.add('hit');
        score++;
        updateScore();

        // 被打到後馬上縮回去
        setTimeout(() => {
            hole.classList.remove('active');
            hole.classList.remove('hit');
            const mole = hole.querySelector('.mole');
            if (mole) mole.remove();
        }, 150);
    }
}

// 更新計時器顯示
function updateTimer() {
    document.getElementById('timer').textContent = timeLeft;
}

// 更新分數顯示
function updateScore() {
    document.getElementById('score').textContent = score;
}

// 結束遊戲
function endGame() {
    isPlaying = false;
    clearInterval(gameTimer);

    document.getElementById('startBtn').disabled = false;
    document.getElementById('startBtn').textContent = '🎮 再玩一次';

    // 顯示結束畫面
    document.getElementById('finalScore').textContent = score;

    // 鼓勵訊息
    const encouragements = [
        { min: 30, text: '🌟 太厲害了！你是打地鼠高手！' },
        { min: 20, text: '👏 表現很棒！繼續加油！' },
        { min: 10, text: '😊 不錯喔！多練習會更好！' },
        { min: 0, text: '💪 再接再厲！下一次會更好！' }
    ];

    const msg = encouragements.find(e => score >= e.min);
    document.getElementById('encouragement').textContent = msg ? msg.text : '';

    document.getElementById('gameOver').style.display = 'flex';
}
