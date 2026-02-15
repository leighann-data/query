/**
 * 历法计算模块
 * 包含干支计算、节气计算等
 */

// 节气数据（基于2000年的节气时刻，精确到分钟）
// 使用定气法，每年微调
const JQ_BASE_YEAR = 2000;

// 2000年各节气的儒略日（近似值）
const JQ_2000 = [
    2451550.259, // 小寒 1月6日
    2451565.520, // 大寒 1月21日
    2451581.063, // 立春 2月4日
    2451596.865, // 雨水 2月19日
    2451612.906, // 惊蛰 3月5日
    2451629.162, // 春分 3月20日
    2451645.607, // 清明 4月4日
    2451662.213, // 谷雨 4月20日
    2451678.956, // 立夏 5月5日
    2451695.817, // 小满 5月21日
    2451712.778, // 芒种 6月5日
    2451729.821, // 夏至 6月21日
    2451746.931, // 小暑 7月7日
    2451764.085, // 大暑 7月22日
    2451781.261, // 立秋 8月7日
    2451798.431, // 处暑 8月23日
    2451815.570, // 白露 9月7日
    2451832.656, // 秋分 9月22日
    2451849.672, // 寒露 10月8日
    2451866.610, // 霜降 10月23日
    2451883.467, // 立冬 11月7日
    2451900.252, // 小雪 11月22日
    2451916.973, // 大雪 12月7日
    2451933.642  // 冬至 12月21日
];

// 精确节气数据（北京时间）：年份 -> {节气名: {month, day, hour, minute}}
const EXACT_JIEQI = {
    2026: {
        '小寒': {month: 1, day: 5, hour: 16, minute: 23},
        '大寒': {month: 1, day: 20, hour: 9, minute: 45},
        '立春': {month: 2, day: 4, hour: 4, minute: 2},
        '雨水': {month: 2, day: 18, hour: 23, minute: 51},
        '惊蛰': {month: 3, day: 5, hour: 21, minute: 58},
        '春分': {month: 3, day: 20, hour: 22, minute: 45},
        '清明': {month: 4, day: 5, hour: 2, minute: 39},
        '谷雨': {month: 4, day: 20, hour: 9, minute: 38},
        '立夏': {month: 5, day: 5, hour: 19, minute: 48},
        '小满': {month: 5, day: 21, hour: 8, minute: 36},
        '芒种': {month: 6, day: 5, hour: 23, minute: 47},
        '夏至': {month: 6, day: 21, hour: 16, minute: 24},
        '小暑': {month: 7, day: 7, hour: 9, minute: 56},
        '大暑': {month: 7, day: 22, hour: 3, minute: 12},
        '立秋': {month: 8, day: 7, hour: 15, minute: 42},
        '处暑': {month: 8, day: 23, hour: 6, minute: 4},
        '白露': {month: 9, day: 7, hour: 17, minute: 40},
        '秋分': {month: 9, day: 23, hour: 3, minute: 4},
        '寒露': {month: 10, day: 8, hour: 10, minute: 28},
        '霜降': {month: 10, day: 23, hour: 13, minute: 12},
        '立冬': {month: 11, day: 7, hour: 12, minute: 51},
        '小雪': {month: 11, day: 22, hour: 10, minute: 3},
        '大雪': {month: 12, day: 7, hour: 5, minute: 52},
        '冬至': {month: 12, day: 21, hour: 23, minute: 49}
    },
    2025: {
        '小寒': {month: 1, day: 5, hour: 10, minute: 33},
        '大寒': {month: 1, day: 20, hour: 4, minute: 0},
        '立春': {month: 2, day: 3, hour: 22, minute: 10},
        '雨水': {month: 2, day: 18, hour: 18, minute: 6},
        '惊蛰': {month: 3, day: 5, hour: 16, minute: 7},
        '春分': {month: 3, day: 20, hour: 17, minute: 1},
        '清明': {month: 4, day: 4, hour: 21, minute: 2},
        '谷雨': {month: 4, day: 20, hour: 4, minute: 0},
        '立夏': {month: 5, day: 5, hour: 14, minute: 12},
        '小满': {month: 5, day: 21, hour: 2, minute: 54},
        '芒种': {month: 6, day: 5, hour: 18, minute: 3},
        '夏至': {month: 6, day: 21, hour: 10, minute: 42},
        '小暑': {month: 7, day: 7, hour: 4, minute: 5},
        '大暑': {month: 7, day: 22, hour: 21, minute: 29},
        '立秋': {month: 8, day: 7, hour: 9, minute: 51},
        '处暑': {month: 8, day: 23, hour: 0, minute: 6},
        '白露': {month: 9, day: 7, hour: 11, minute: 34},
        '秋分': {month: 9, day: 22, hour: 21, minute: 20},
        '寒露': {month: 10, day: 8, hour: 4, minute: 41},
        '霜降': {month: 10, day: 23, hour: 7, minute: 20},
        '立冬': {month: 11, day: 7, hour: 6, minute: 54},
        '小雪': {month: 11, day: 22, hour: 4, minute: 4},
        '大雪': {month: 12, day: 6, hour: 23, minute: 53},
        '冬至': {month: 12, day: 21, hour: 17, minute: 43}
    }
};

// 每个节气的平均周期（约15.22天）
const JQ_PERIOD = 365.2422 / 24;

/**
 * 计算儒略日
 * @param {number} year 年
 * @param {number} month 月
 * @param {number} day 日
 * @param {number} hour 时（小数）
 * @returns {number} 儒略日
 */
function toJulianDay(year, month, day, hour = 12) {
    if (month <= 2) {
        year -= 1;
        month += 12;
    }
    const A = Math.floor(year / 100);
    const B = 2 - A + Math.floor(A / 4);
    return Math.floor(365.25 * (year + 4716)) + Math.floor(30.6001 * (month + 1)) + day + hour / 24 + B - 1524.5;
}

/**
 * 从儒略日转换为公历日期
 * @param {number} jd 儒略日
 * @returns {Object} {year, month, day, hour, minute}
 */
function fromJulianDay(jd) {
    const Z = Math.floor(jd + 0.5);
    const F = jd + 0.5 - Z;
    let A;
    if (Z < 2299161) {
        A = Z;
    } else {
        const alpha = Math.floor((Z - 1867216.25) / 36524.25);
        A = Z + 1 + alpha - Math.floor(alpha / 4);
    }
    const B = A + 1524;
    const C = Math.floor((B - 122.1) / 365.25);
    const D = Math.floor(365.25 * C);
    const E = Math.floor((B - D) / 30.6001);
    
    const day = B - D - Math.floor(30.6001 * E);
    const month = E < 14 ? E - 1 : E - 13;
    const year = month > 2 ? C - 4716 : C - 4715;
    
    const hourDecimal = F * 24;
    const hour = Math.floor(hourDecimal);
    const minute = Math.round((hourDecimal - hour) * 60);
    
    return { year, month, day, hour, minute };
}

/**
 * 计算指定年份的所有节气时刻
 * @param {number} year 年份
 * @returns {Array} 节气数组，每个元素为 {name, jd, date}
 */
function getYearJieQi(year) {
    const result = [];
    
    // 优先使用精确数据
    if (EXACT_JIEQI[year]) {
        const exactData = EXACT_JIEQI[year];
        for (let i = 0; i < 24; i++) {
            const name = JIE_QI[i];
            const data = exactData[name];
            if (data) {
                const jd = toJulianDay(year, data.month, data.day, data.hour + data.minute / 60);
                result.push({
                    name: name,
                    jd: jd,
                    date: { year, month: data.month, day: data.day, hour: data.hour, minute: data.minute }
                });
            }
        }
        return result;
    }
    
    // 回退到近似计算
    const yearDiff = year - JQ_BASE_YEAR;
    for (let i = 0; i < 24; i++) {
        const jd = JQ_2000[i] + yearDiff * 365.2422;
        const date = fromJulianDay(jd);
        result.push({
            name: JIE_QI[i],
            jd: jd,
            date: date
        });
    }
    
    return result;
}

/**
 * 获取指定日期时间所在的节气
 * @param {Date} date 日期对象
 * @returns {Object} {name, startJd, index, year}
 */
function getCurrentJieQi(date) {
    const year = date.getFullYear();
    const jd = toJulianDay(
        year,
        date.getMonth() + 1,
        date.getDate(),
        date.getHours() + date.getMinutes() / 60
    );
    
    // 获取前一年、当年、后一年的节气
    const jieqiPrev = getYearJieQi(year - 1);
    const jieqiCurr = getYearJieQi(year);
    const jieqiNext = getYearJieQi(year + 1);
    const allJieqi = [...jieqiPrev, ...jieqiCurr, ...jieqiNext];
    
    // 12节（用于奇门定局）：立春、惊蛰、清明、立夏、芒种、小暑、立秋、白露、寒露、立冬、大雪、小寒
    const jieNames = ['立春', '惊蛰', '清明', '立夏', '芒种', '小暑', '立秋', '白露', '寒露', '立冬', '大雪', '小寒'];
    
    // 找到当前所在的节气及下一个"节"
    for (let i = allJieqi.length - 1; i >= 0; i--) {
        if (jd >= allJieqi[i].jd) {
            const result = {
                name: allJieqi[i].name,
                startJd: allJieqi[i].jd,
                startDate: allJieqi[i].date,
                index: JIE_QI.indexOf(allJieqi[i].name),
                year: allJieqi[i].date.year
            };
            
            // 找到下一个"节"（不是气）
            for (let j = i + 1; j < allJieqi.length; j++) {
                if (jieNames.includes(allJieqi[j].name)) {
                    result.nextJie = {
                        name: allJieqi[j].name,
                        startJd: allJieqi[j].jd,
                        startDate: allJieqi[j].date
                    };
                    break;
                }
            }
            
            // 找到当前所在的"节"
            for (let j = i; j >= 0; j--) {
                if (jieNames.includes(allJieqi[j].name)) {
                    result.currentJie = {
                        name: allJieqi[j].name,
                        startJd: allJieqi[j].jd,
                        startDate: allJieqi[j].date
                    };
                    break;
                }
            }
            
            return result;
        }
    }
    
    return null;
}

/**
 * 计算年干支
 * @param {number} year 年份
 * @returns {string} 干支
 */
function getYearGanZhi(year) {
    // 以立春为界
    const ganIndex = (year - 4) % 10;
    const zhiIndex = (year - 4) % 12;
    return TIAN_GAN[ganIndex] + DI_ZHI[zhiIndex];
}

/**
 * 计算月干支
 * @param {number} year 年份
 * @param {number} month 月份（农历月，1-12）
 * @returns {string} 干支
 */
function getMonthGanZhi(year, month) {
    // 年干决定月干起点
    const yearGan = (year - 4) % 10;
    // 月干 = (年干 * 2 + 月) % 10
    const monthGan = (yearGan * 2 + month) % 10;
    // 月支固定：正月寅，二月卯...
    const monthZhi = (month + 1) % 12;
    return TIAN_GAN[monthGan] + DI_ZHI[monthZhi];
}

/**
 * 根据节气计算月干支
 * @param {number} year 年份
 * @param {string} jieqiName 节气名称
 * @returns {string} 干支
 */
function getMonthGanZhiByJieQi(year, jieqiName) {
    // 节气对应的月份（以节气划分）
    const jieqiMonth = {
        '立春': 1, '惊蛰': 2, '清明': 3, '立夏': 4,
        '芒种': 5, '小暑': 6, '立秋': 7, '白露': 8,
        '寒露': 9, '立冬': 10, '大雪': 11, '小寒': 12,
        '雨水': 1, '春分': 2, '谷雨': 3, '小满': 4,
        '夏至': 5, '大暑': 6, '处暑': 7, '秋分': 8,
        '霜降': 9, '小雪': 10, '冬至': 11, '大寒': 12
    };
    
    const month = jieqiMonth[jieqiName] || 1;
    
    // 小寒、大寒属于上一年（立春前）
    let actualYear = year;
    if (jieqiName === '小寒' || jieqiName === '大寒') {
        actualYear = year - 1;
    }
    
    // 年干索引
    const yearGan = (actualYear - 4) % 10;
    
    // 五虎遁计算月干：
    // 甲己年起丙寅(2), 乙庚年起戊寅(4), 丙辛年起庚寅(6), 丁壬年起壬寅(8), 戊癸年起甲寅(0)
    // 规律: 正月干索引 = ((yearGan % 5) * 2 + 2) % 10
    const startGan = ((yearGan % 5) * 2 + 2) % 10;
    const monthGan = (startGan + month - 1) % 10;
    
    // 月支：正月寅(2)开始
    const monthZhi = (month + 1) % 12;
    
    return TIAN_GAN[monthGan] + DI_ZHI[monthZhi];
}

/**
 * 计算日干支
 * @param {number} year 年
 * @param {number} month 月
 * @param {number} day 日
 * @returns {string} 干支
 */
function getDayGanZhi(year, month, day) {
    // 使用儒略日计算
    const jd = toJulianDay(year, month, day, 12);
    // 以甲子日为基准
    const dayNum = Math.floor(jd + 0.5) + 49;
    const index = dayNum % 60;
    return JIA_ZI_60[(index + 60) % 60];
}

/**
 * 计算时干支
 * @param {string} dayGan 日干
 * @param {number} hour 小时（0-23）
 * @returns {string} 干支
 */
function getHourGanZhi(dayGan, hour) {
    // 确定时支
    let zhiIndex;
    if (hour === 23 || hour === 0) {
        zhiIndex = 0; // 子时
    } else {
        zhiIndex = Math.floor((hour + 1) / 2);
    }
    
    // 根据日干确定时干起点（五鼠遁）
    const dayGanIndex = TIAN_GAN.indexOf(dayGan);
    const startGan = [0, 2, 4, 6, 8, 0, 2, 4, 6, 8][dayGanIndex]; // 甲己起甲子
    const hourGanIndex = (startGan + zhiIndex) % 10;
    
    return TIAN_GAN[hourGanIndex] + DI_ZHI[zhiIndex];
}

/**
 * 获取时辰序号（0-11）
 * @param {number} hour 小时
 * @returns {number} 时辰序号
 */
function getShiChenIndex(hour) {
    if (hour === 23 || hour === 0) return 0;
    return Math.floor((hour + 1) / 2);
}

/**
 * 获取完整的四柱信息
 * @param {Date} date 日期对象
 * @returns {Object} 四柱信息
 */
function getSiZhu(date) {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hour = date.getHours();
    
    // 获取当前节气判断年月
    const jieqi = getCurrentJieQi(date);
    
    // 立春前算上一年
    let actualYear = year;
    if (jieqi && (jieqi.name === '小寒' || jieqi.name === '大寒')) {
        actualYear = year - 1;
    }
    
    const yearGZ = getYearGanZhi(actualYear);
    const monthGZ = jieqi ? getMonthGanZhiByJieQi(year, jieqi.name) : getMonthGanZhi(year, month);
    const dayGZ = getDayGanZhi(year, month, day);
    
    // 23点后算次日
    let hourDate = new Date(date);
    if (hour === 23) {
        hourDate.setDate(hourDate.getDate() + 1);
    }
    const hourDayGZ = hour === 23 ? getDayGanZhi(hourDate.getFullYear(), hourDate.getMonth() + 1, hourDate.getDate()) : dayGZ;
    const hourGZ = getHourGanZhi(hourDayGZ[0], hour);
    
    return {
        year: yearGZ,
        month: monthGZ,
        day: dayGZ,
        hour: hourGZ,
        jieqi: jieqi
    };
}

/**
 * 获取旬首
 * @param {string} ganZhi 干支
 * @returns {string} 旬首（六甲之一）
 */
function getXunShou(ganZhi) {
    const index = JIA_ZI_60.indexOf(ganZhi);
    if (index === -1) return null;
    
    // 每旬10个，找到所在旬的甲
    const xunIndex = Math.floor(index / 10) * 10;
    return JIA_ZI_60[xunIndex];
}

/**
 * 获取空亡
 * @param {string} ganZhi 干支
 * @returns {Array} 空亡的两个地支
 */
function getKongWang(ganZhi) {
    const xunShou = getXunShou(ganZhi);
    return XUN_KONG[xunShou] || [];
}
