/**
 * 奇门遁甲排盘主程序
 */

// 全局状态
let currentPan = null;
let currentLocation = { longitude: 116.4074, latitude: 39.9042, city: '北京' };

/**
 * 初始化
 */
function init() {
    // 设置默认时间为当前时间
    setCurrentTime();
    
    // 初始化城市选择器
    initCitySelector();
    
    // 尝试获取地理位置
    tryGetLocation();
    
    // 绑定事件
    bindEvents();
    
    // 自动排盘
    doPaiPan();
}

/**
 * 设置当前时间
 */
function setCurrentTime() {
    const now = new Date();
    document.getElementById('dateInput').value = formatDateForInput(now);
    document.getElementById('timeInput').value = formatTimeForInput(now);
}

/**
 * 初始化城市选择器
 */
function initCitySelector() {
    const select = document.getElementById('citySelect');
    for (const city in CITY_COORDS) {
        const option = document.createElement('option');
        option.value = city;
        option.textContent = city;
        if (city === '北京') option.selected = true;
        select.appendChild(option);
    }
}

/**
 * 尝试获取地理位置
 */
async function tryGetLocation() {
    try {
        const pos = await getGeolocation();
        currentLocation.longitude = pos.longitude;
        currentLocation.latitude = pos.latitude;
        currentLocation.city = '当前位置';
        
        document.getElementById('longitudeInput').value = pos.longitude.toFixed(4);
        document.getElementById('latitudeInput').value = pos.latitude.toFixed(4);
        
        // 添加当前位置选项
        const select = document.getElementById('citySelect');
        const option = document.createElement('option');
        option.value = '当前位置';
        option.textContent = `当前位置 (${pos.longitude.toFixed(2)}°E, ${pos.latitude.toFixed(2)}°N)`;
        option.selected = true;
        select.insertBefore(option, select.firstChild);
        
        doPaiPan();
    } catch (e) {
        console.log('无法获取地理位置，使用默认北京');
    }
}

/**
 * 绑定事件
 */
function bindEvents() {
    document.getElementById('citySelect').addEventListener('change', onCityChange);
    document.getElementById('longitudeInput').addEventListener('change', onCoordsChange);
    document.getElementById('latitudeInput').addEventListener('change', onCoordsChange);
    document.getElementById('dateInput').addEventListener('change', doPaiPan);
    document.getElementById('timeInput').addEventListener('change', doPaiPan);
    document.getElementById('methodSelect').addEventListener('change', doPaiPan);
    document.getElementById('solarTimeSelect').addEventListener('change', doPaiPan);
    document.getElementById('nowBtn').addEventListener('click', onNowClick);
}

/**
 * 城市选择变化
 */
function onCityChange() {
    const city = document.getElementById('citySelect').value;
    if (CITY_COORDS[city]) {
        currentLocation = { ...CITY_COORDS[city], city };
        document.getElementById('longitudeInput').value = CITY_COORDS[city].longitude.toFixed(4);
        document.getElementById('latitudeInput').value = CITY_COORDS[city].latitude.toFixed(4);
        doPaiPan();
    }
}

/**
 * 经纬度变化
 */
function onCoordsChange() {
    currentLocation.longitude = parseFloat(document.getElementById('longitudeInput').value) || 116.4;
    currentLocation.latitude = parseFloat(document.getElementById('latitudeInput').value) || 39.9;
    currentLocation.city = '自定义';
    doPaiPan();
}

/**
 * 点击现在按钮
 */
function onNowClick() {
    setCurrentTime();
    doPaiPan();
}

/**
 * 执行排盘
 */
function doPaiPan() {
    const dateStr = document.getElementById('dateInput').value;
    const timeStr = document.getElementById('timeInput').value;
    const method = document.getElementById('methodSelect').value;
    const useSolarTime = document.getElementById('solarTimeSelect').value === 'true';
    
    const [year, month, day] = dateStr.split('-').map(Number);
    const [hour, minute] = timeStr.split(':').map(Number);
    
    const date = new Date(year, month - 1, day, hour, minute);
    
    try {
        const pan = new QimenPan(date, currentLocation.longitude, currentLocation.latitude, method, useSolarTime);
        currentPan = pan.getResult();
        
        // 分析格局
        currentPan.patterns = analyzePatterns(currentPan);
        currentPan.patternSummary = summarizePatterns(currentPan.patterns);
        
        renderPan();
    } catch (e) {
        console.error('排盘错误:', e);
        alert('排盘计算出错，请检查输入');
    }
}

/**
 * 渲染排盘结果
 */
function renderPan() {
    if (!currentPan) return;
    
    // 渲染基本信息
    renderBasicInfo();
    
    // 渲染九宫格
    renderGongGrid();
    
    // 渲染格局信息
    renderPatterns();
}

/**
 * 渲染基本信息
 */
function renderBasicInfo() {
    const info = currentPan;
    const date = info.originalTime;
    
    // 公元：2026年2月15日21时36分49秒 阳2局
    const timeStr = `公元：${date.getFullYear()}年${date.getMonth()+1}月${date.getDate()}日${date.getHours()}时${date.getMinutes()}分 ${info.dunType}${info.juNum}局`;
    document.getElementById('displayTime').textContent = timeStr;
    
    // 农历：2026年12月28日21时36分
    const lunarStr = `农历：${date.getFullYear()}年${info.lunarMonth || ''}${info.lunarDay || ''}${date.getHours()}时${String(date.getMinutes()).padStart(2,'0')}分`;
    document.getElementById('displayLunar').textContent = lunarStr;
    
    // 干支：丙午年　庚寅月　庚申日　丁亥时
    const ganzhiStr = `干支：${info.siZhu.year}年　${info.siZhu.month}月　${info.siZhu.day}日　${info.siZhu.hour}时`;
    document.getElementById('displayGanZhi').textContent = ganzhiStr;
    
    // 旬空：寅卯空　午未空　子丑空　午未空
    const kongStr = `旬空：${info.kongWangDisplay}`;
    document.getElementById('displayKongWang').textContent = kongStr;
    
    // 节气信息：立春：2026/2/4 4:02:00　惊蛰：2026/3/5 21:58:00
    let jieqiLine = '';
    if (info.currentJie) {
        jieqiLine = `${info.currentJie.name}：${info.currentJie.time}`;
    }
    if (info.nextJie) {
        jieqiLine += `　${info.nextJie.name}：${info.nextJie.time}`;
    }
    document.getElementById('displayPrevJieQi').textContent = jieqiLine;
    document.getElementById('displayNextJieQi').textContent = '';
    
    // 本节气上元第一天为
    if (info.yuanFirstDay) {
        document.getElementById('displayYuanFirst').textContent = `本节气上元第一天为：${info.yuanFirstDay}`;
    }
    
    // 直符：天辅　直使：杜门　旬首：甲申庚
    const zhiFuLine = `直符：${info.zhiFuXing}　直使：${info.zhiShiMen}　旬首：${info.xunShouDisplay}`;
    document.getElementById('displayYuanDay').textContent = zhiFuLine;
    
    // 阳遁二局　值符天辅落八宫　值使杜门落七宫
    const juInfoStr = `${info.dunType}遁${numToChinese(info.juNum)}局　值符${info.zhiFuXing}落${numToChinese(info.zhiFuLuoGong)}宫　值使${info.zhiShiMen}落${numToChinese(info.zhiShiLuoGong)}宫`;
    document.getElementById('displayJuInfo').innerHTML = `<span style="color: var(--accent-color);">${juInfoStr}</span>`;
    
    // 真太阳时信息
    const useSolarTime = document.getElementById('solarTimeSelect').value === 'true';
    if (useSolarTime) {
        document.getElementById('trueSolarTime').textContent = 
            `真太阳时：${formatDateTime(info.trueSolarTime)} (${formatTimeDiff(info.timeDiff)})`;
    } else {
        document.getElementById('trueSolarTime').textContent = '';
    }
}

/**
 * 数字转中文
 */
function numToChinese(num) {
    const chars = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
    return chars[num] || num;
}

/**
 * 渲染九宫格
 */
function renderGongGrid() {
    // 九宫格位置映射（按照后天八卦方位）
    // 4巽 | 9离 | 2坤
    // 3震 | 5中 | 7兑
    // 8艮 | 1坎 | 6乾
    const positions = {
        4: 'gong-4', 9: 'gong-9', 2: 'gong-2',
        3: 'gong-3', 5: 'gong-5', 7: 'gong-7',
        8: 'gong-8', 1: 'gong-1', 6: 'gong-6'
    };
    
    for (let i = 1; i <= 9; i++) {
        const gong = currentPan.gong[i];
        const element = document.getElementById(positions[i]);
        
        if (!element) continue;
        
        // 八神简写映射（地盘八神）
        const shenShort = {
            '值符': '符', '腾蛇': '蛇', '太阴': '阴', '六合': '六',
            '白虎': '白', '玄武': '玄', '九地': '地', '九天': '天'
        };
        
        // 构建宫位内容 - 按参考图布局
        let html = '';
        
        // 第一行：天盘干 + 天盘八神 + 马/空标记
        html += `<div class="gong-row1">`;
        html += `<span class="gong-tian">${gong.tianPan || ''}</span>`;
        // 天盘八神（从值符落宫开始）
        html += `<span class="gong-shen">${gong.tianShen || ''}</span>`;
        if (gong.maStar) html += `<span class="mark-ma">马</span>`;
        if (gong.kongWang) html += `<span class="mark-kong">○</span>`;
        html += `</div>`;
        
        // 第二行：(天禽带干) + 九星 + 九星带干
        html += `<div class="gong-row2">`;
        if (gong.qinDaiGan) {
            html += `<span class="gong-daigan">${gong.qinDaiGan}</span>`;
        } else {
            html += `<span class="gong-daigan"></span>`;
        }
        html += `<span class="gong-xing ${getXingClass(gong.jiuXing)}">${gong.jiuXing || ''}</span>`;
        html += `<span class="gong-daigan2">${gong.xingDaiGan || ''}</span>`;
        html += `</div>`;
        
        // 第三行：地盘八神简写 + 八门 + 地盘干
        html += `<div class="gong-row3">`;
        const shortShen = shenShort[gong.baShen] || '';
        html += `<span class="gong-shen-short">${shortShen}</span>`;
        html += `<span class="gong-men ${getMenClass(gong.baMen)}">${gong.baMen || ''}</span>`;
        html += `<span class="gong-di">${gong.diPan || ''}</span>`;
        html += `</div>`;
        
        element.innerHTML = html;
        
        // 添加特殊样式
        element.classList.remove('kong-wang', 'ma-xing', 'zhi-fu');
        if (gong.kongWang) element.classList.add('kong-wang');
        if (gong.maStar) element.classList.add('ma-xing');
        if (currentPan.zhiFuLuoGong === i) element.classList.add('zhi-fu');
    }
}

/**
 * 获取九星样式类
 */
function getXingClass(xing) {
    const jiXiong = JIU_XING_JIXIONG[xing];
    if (jiXiong === '吉') return 'type-ji';
    if (jiXiong === '凶') return 'type-xiong';
    return '';
}

/**
 * 获取八门样式类
 */
function getMenClass(men) {
    const jiXiong = BA_MEN_JIXIONG[men];
    if (jiXiong === '吉') return 'type-ji';
    if (jiXiong === '凶') return 'type-xiong';
    return '';
}

/**
 * 获取类型样式类
 */
function getTypeClass(name, type) {
    if (name === '值符') return 'type-zhi';
    return '';
}

/**
 * 渲染格局信息
 */
function renderPatterns() {
    const container = document.getElementById('patternsContainer');
    const patterns = currentPan.patterns;
    
    if (patterns.length === 0) {
        container.innerHTML = '<div class="pattern-item">无特殊格局</div>';
        return;
    }
    
    let html = '';
    
    // 按吉凶分组显示
    const summary = currentPan.patternSummary;
    
    if (summary['大吉'].length > 0) {
        html += '<div class="pattern-group pattern-daji">';
        html += '<div class="pattern-title">【大吉】</div>';
        for (const p of summary['大吉']) {
            html += `<div class="pattern-item">${p.pattern}：${p.desc}</div>`;
        }
        html += '</div>';
    }
    
    if (summary['吉'].length > 0) {
        html += '<div class="pattern-group pattern-ji">';
        html += '<div class="pattern-title">【吉】</div>';
        for (const p of summary['吉']) {
            html += `<div class="pattern-item">${p.pattern}：${p.desc}</div>`;
        }
        html += '</div>';
    }
    
    if (summary['中'].length > 0) {
        html += '<div class="pattern-group pattern-zhong">';
        html += '<div class="pattern-title">【中】</div>';
        for (const p of summary['中']) {
            html += `<div class="pattern-item">${p.pattern}：${p.desc}</div>`;
        }
        html += '</div>';
    }
    
    if (summary['凶'].length > 0) {
        html += '<div class="pattern-group pattern-xiong">';
        html += '<div class="pattern-title">【凶】</div>';
        for (const p of summary['凶']) {
            html += `<div class="pattern-item">${p.pattern}：${p.desc}</div>`;
        }
        html += '</div>';
    }
    
    if (summary['大凶'].length > 0) {
        html += '<div class="pattern-group pattern-daxiong">';
        html += '<div class="pattern-title">【大凶】</div>';
        for (const p of summary['大凶']) {
            html += `<div class="pattern-item">${p.pattern}：${p.desc}</div>`;
        }
        html += '</div>';
    }
    
    container.innerHTML = html;
}

/**
 * 格式化日期用于输入框
 */
function formatDateForInput(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

/**
 * 格式化时间用于输入框
 */
function formatTimeForInput(date) {
    const h = String(date.getHours()).padStart(2, '0');
    const m = String(date.getMinutes()).padStart(2, '0');
    return `${h}:${m}`;
}

/**
 * 格式化日期时间
 */
function formatDateTime(date) {
    const y = date.getFullYear();
    const mo = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const h = String(date.getHours()).padStart(2, '0');
    const mi = String(date.getMinutes()).padStart(2, '0');
    return `${y}-${mo}-${d} ${h}:${mi}`;
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', init);
