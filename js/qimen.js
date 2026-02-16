/**
 * 奇门遁甲核心算法 - 时家奇门转盘（置闰法）
 */

class QimenPan {
    constructor(date, longitude = 116.4, latitude = 39.9, method = 'zhiRun', useSolarTime = false) {
        this.originalDate = date;
        this.longitude = longitude;
        this.latitude = latitude;
        this.method = method;
        this.useSolarTime = useSolarTime;
        
        // 计算真太阳时（或直接使用原始时间）
        if (useSolarTime) {
            const solarTime = getTrueSolarTime(date, longitude, latitude);
            this.trueSolarTime = solarTime.date;
            this.timeDiff = solarTime.diff;
        } else {
            this.trueSolarTime = date;
            this.timeDiff = 0;
        }
        
        // 获取四柱
        this.siZhu = getSiZhu(this.trueSolarTime);
        this.jieQi = this.siZhu.jieqi;
        
        // 九宫顺时针顺序
        this.gongOrder = [1, 8, 3, 4, 9, 2, 7, 6];
        
        this.initGong();
        this.calculate();
    }
    
    initGong() {
        this.gong = {};
        for (let i = 1; i <= 9; i++) {
            this.gong[i] = {
                num: i, diPan: '', tianPan: '',
                jiuXing: '', baMen: '', baShen: '',
                anGan: GONG_AN_GAN[i],
                kongWang: false, maStar: false
            };
        }
    }
    
    calculate() {
        this.determineDunJu();
        this.arrangeDiPan();
        this.determineZhiFuZhiShi();
        this.arrangeJiuXing();
        this.arrangeTianPan();
        this.arrangeBaMen();
        this.arrangeYinGan();  // 隐干需要在八门之后排列（需要zhiShiLuoGong）
        this.arrangeBaShen();
        this.calculateKongWang();
        this.calculateMaStar();
    }
    
    determineDunJu() {
        const jieqiInfo = JIE_QI_JU[this.jieQi.name];
        this.dunType = jieqiInfo.dun;
        this.isYangDun = this.dunType === '阳';
        
        if (this.method === 'chaiBu') {
            // 拆补法：根据日干支的旬首确定三元
            // 甲子(0)、甲午(30): 上元
            // 甲申(20)、甲寅(50): 中元
            // 甲戌(10)、甲辰(40): 下元
            const dayIndex = JIA_ZI_60.indexOf(this.siZhu.day);
            const xunStart = Math.floor(dayIndex / 10) * 10;
            
            if (xunStart === 0 || xunStart === 30) {
                this.yuan = 0; // 上元
            } else if (xunStart === 20 || xunStart === 50) {
                this.yuan = 1; // 中元
            } else {
                this.yuan = 2; // 下元
            }
            this.juNum = jieqiInfo.ju[this.yuan];
        } else {
            // 超接置闰法
            this.determineDunJuZhiRun();
        }
    }
    
    // 超接置闰法核心算法
    // 规则:
    // 1. 上元符头: 甲子(0)、己卯(15)、甲午(30)、己酉(45)
    // 2. 找当前日期所在的三元(从最近的上元符头起算15天)
    // 3. 如果上元符头在当前节气之前(超神),用当前节气
    // 4. 如果上元符头在当前节气之后(接气),用下一节气
    // 5. 超神超过9天时需要置闰(重复三元)
    determineDunJuZhiRun() {
        const currentJie = this.jieQi.currentJie;
        const nextJieQi = this.jieQi.nextJieQi || this.jieQi.nextJie;
        
        if (!currentJie) {
            // 无法获取节气信息时，使用简单方法
            const jieqiInfo = JIE_QI_JU[this.jieQi.name];
            this.yuan = this.getYuanSimple();
            this.juNum = jieqiInfo.ju[this.yuan];
            return;
        }
        
        // 获取当前日干支索引
        const dayGzIdx = JIA_ZI_60.indexOf(this.siZhu.day);
        
        // 找当前日期所属的上元符头
        // 上元符头: 甲子(0)、己卯(15)、甲午(30)、己酉(45)
        const shangYuanFuTou = [0, 15, 30, 45];
        
        // 往前找最近的上元符头
        let fuTouIdx = -1;
        let daysFromFuTou = 0;
        for (let i = 0; i < 60; i++) {
            const checkIdx = (dayGzIdx - i + 60) % 60;
            if (shangYuanFuTou.includes(checkIdx)) {
                fuTouIdx = checkIdx;
                daysFromFuTou = i;
                break;
            }
        }
        
        // 计算在三元中的位置
        // 上元: 0-4天, 中元: 5-9天, 下元: 10-14天
        let yuan;
        if (daysFromFuTou < 5) {
            yuan = 0; // 上元
        } else if (daysFromFuTou < 10) {
            yuan = 1; // 中元
        } else if (daysFromFuTou < 15) {
            yuan = 2; // 下元
        } else {
            // 超出15天,应该在下一个三元中
            // 这种情况不应该发生,因为我们找的是最近的上元符头
            yuan = Math.floor((daysFromFuTou % 15) / 5);
        }
        
        // 计算上元符头日的日期数(以天为单位,不含时间)
        const currentJd = this.getJulianDay(this.trueSolarTime);
        const currentDayNum = Math.floor(currentJd + 0.5);  // 当前日期的日数
        const fuTouDayNum = currentDayNum - daysFromFuTou;  // 符头日的日数
        
        // 获取当前节气交节的日期数
        const jieqiJd = currentJie.startJd;
        const jieqiDayNum = Math.floor(jieqiJd + 0.5);  // 节气交节的日数
        
        // 判断超神还是接气
        // 关键: 用日期来比,不考虑具体时刻
        // 正授: 符头日 == 节气日 (同一天)
        // 超神: 符头日 < 节气日 (符头在节气前)
        // 接气: 符头日 > 节气日 (符头在节气后)
        
        let useJieQi;  // 使用哪个节气的局数
        
        if (fuTouDayNum <= jieqiDayNum) {
            // 正授或超神: 符头在节气日或之前,用当前节气
            useJieQi = currentJie.name;
            
            // 检查是否需要置闰(超神超过9天)
            const chaoShenDays = jieqiDayNum - fuTouDayNum;
            if (chaoShenDays > 9) {
                this.isZhiRun = true;
                this.zhiRunInfo = `超神${chaoShenDays}天,需置闰`;
            } else if (chaoShenDays === 0) {
                this.zhiRunInfo = '正授';
            }
        } else {
            // 接气: 符头在节气后
            const jieQiDays = fuTouDayNum - jieqiDayNum;  // 接气天数
            
            if (jieQiDays > 9 && nextJieQi) {
                // 接气超过9天,用下一节气的局
                useJieQi = nextJieQi.name;
                this.isZhiRun = true;
                this.zhiRunInfo = `接气${jieQiDays}天,用${nextJieQi.name}`;
            } else {
                // 接气9天及以下,仍用当前节气的局
                useJieQi = currentJie.name;
                this.isZhiRun = true;
                this.zhiRunInfo = `置闰(接气${jieQiDays}天)`;
            }
        }
        
        // 获取对应节气的局数
        const jieqiInfo = JIE_QI_JU[useJieQi];
        if (!jieqiInfo) {
            // 如果找不到节气信息(可能是"气"而不是"节"),使用当前节
            const currentJieInfo = JIE_QI_JU[this.jieQi.name];
            this.dunType = currentJieInfo.dun;
            this.isYangDun = this.dunType === '阳';
            this.yuan = yuan;
            this.juNum = currentJieInfo.ju[yuan];
            return;
        }
        
        this.dunType = jieqiInfo.dun;
        this.isYangDun = this.dunType === '阳';
        this.yuan = yuan;
        this.juNum = jieqiInfo.ju[yuan];
    }
    
    // 简单三元计算（备用）
    getYuanSimple() {
        const dayIndex = JIA_ZI_60.indexOf(this.siZhu.day);
        const xunStart = Math.floor(dayIndex / 10) * 10;
        const dayInXun = dayIndex - xunStart;
        
        if (dayInXun <= 4) {
            if (xunStart === 0 || xunStart === 30) return 0;
            else if (xunStart === 10 || xunStart === 40) return 2;
            else return 1;
        } else {
            if (xunStart === 0 || xunStart === 30) return 1;
            else if (xunStart === 10 || xunStart === 40) return 0;
            else return 2;
        }
    }
    
    // 查找节气后第一个符头(甲或己日)
    findFirstFuTou(jieqiStartJd) {
        // 从节气开始日向后找第一个甲日或己日
        // JD以中午12:00为一天的分界，需要转换为以00:00为分界
        // JD + 0.5 然后 floor 可以得到正确的"天数"
        const dayNum = Math.floor(jieqiStartJd + 0.5);
        
        for (let i = 0; i < 10; i++) {
            const checkDayNum = dayNum + i;
            // 使用天数直接计算干支
            const dayGZ = this.getDayGanZhiByDayNum(checkDayNum);
            const gan = dayGZ[0];
            if (gan === '甲' || gan === '己') {
                // 返回这一天00:00的JD
                return checkDayNum - 0.5;
            }
        }
        return dayNum - 0.5;
    }
    
    // 根据天数(JD + 0.5的整数部分)获取日干支
    getDayGanZhiByDayNum(dayNum) {
        // 以1900年1月1日(甲戌日)为基准
        // 1900/1/1 00:00 的JD = 2415020.5
        // 对应的dayNum = floor(2415020.5 + 0.5) = 2415021
        const baseDayNum = 2415021; // 1900年1月1日
        const baseGzIdx = 10;       // 甲戌=10
        const dayDiff = dayNum - baseDayNum;
        const index = ((dayDiff + baseGzIdx) % 60 + 60) % 60;
        return JIA_ZI_60[index];
    }
    
    // 根据儒略日获取日干支
    getDayGanZhiByJd(jd) {
        // 儒略日转日干支：以1900年1月1日(甲戌日)为基准
        const baseJd = 2415020; // 1900年1月1日的儒略日整数部分
        const baseGzIdx = 10;   // 甲戌=10
        const dayDiff = Math.floor(jd) - baseJd;
        const index = ((dayDiff + baseGzIdx) % 60 + 60) % 60;
        return JIA_ZI_60[index];
    }
    
    // 旧方法备份(已弃用)
    getDayGanZhiByJd_old(jd) {
        const baseJd = 2451551;
        const dayDiff = Math.floor(jd) - baseJd;
        const index = ((dayDiff % 60) + 60) % 60;
        return JIA_ZI_60[index];
    }
    
    // 获取儒略日
    getJulianDay(date) {
        const y = date.getFullYear();
        const m = date.getMonth() + 1;
        const d = date.getDate();
        const h = date.getHours() + date.getMinutes() / 60;
        
        let jy = y;
        let jm = m;
        if (m <= 2) { jy--; jm += 12; }
        const a = Math.floor(jy / 100);
        const b = 2 - a + Math.floor(a / 4);
        return Math.floor(365.25 * (jy + 4716)) + Math.floor(30.6001 * (jm + 1)) + d + h / 24 + b - 1524.5;
    }
    
    // 获取上一个节气名称
    getPrevJieqiName(jieqiName) {
        const jieList = ['立春', '惊蛰', '清明', '立夏', '芒种', '小暑', '立秋', '白露', '寒露', '立冬', '大雪', '小寒'];
        const idx = jieList.indexOf(jieqiName);
        if (idx > 0) return jieList[idx - 1];
        return jieList[jieList.length - 1];
    }
    
    arrangeDiPan() {
        // 转盘奇门地盘：从局数宫开始，按1-9宫数字顺序布九仪
        // 九仪顺序: 六仪(戊己庚辛壬癸) + 三奇(丁丙乙)
        const jiuYi = ['戊', '己', '庚', '辛', '壬', '癸', '丁', '丙', '乙'];
        
        const start = this.juNum;
        
        for (let i = 0; i < 9; i++) {
            let gong;
            if (this.isYangDun) {
                // 阳遁顺数: start, start+1, ..., 9, 1, 2, ...
                gong = ((start - 1 + i) % 9) + 1;
            } else {
                // 阴遁逆数: start, start-1, ..., 1, 9, 8, ...
                gong = ((start - 1 - i + 9) % 9) + 1;
            }
            this.gong[gong].diPan = jiuYi[i];
        }
    }
    
    determineZhiFuZhiShi() {
        const hourGZ = this.siZhu.hour;
        const hourGan = hourGZ[0];
        
        this.xunShou = getXunShou(hourGZ);
        this.dunYi = JIA_DUN[this.xunShou];
        
        // 值符原宫 = 遁仪所在地盘宫
        let zhiFuYuanGong = this.findGanInDiPan(this.dunYi);
        if (zhiFuYuanGong === -1) zhiFuYuanGong = this.isYangDun ? 2 : 8;
        this.zhiFuYuanGong = zhiFuYuanGong;
        
        // 九星八门
        const xingOrder = ['天蓬', '天芮', '天冲', '天辅', '天禽', '天心', '天柱', '天任', '天英'];
        const menOrder = ['休门', '死门', '伤门', '杜门', '', '开门', '惊门', '生门', '景门'];
        this.zhiFuXing = xingOrder[zhiFuYuanGong - 1];
        this.zhiShiMen = menOrder[zhiFuYuanGong - 1] || '死门';
        
        // 计算时干在旬中的偏移（甲0、乙1、丙2、丁3...）
        const ganOffset = TIAN_GAN.indexOf(hourGan);
        this.hourGanOffset = ganOffset < 4 ? ganOffset : 0; // 甲乙丙丁偏移0-3，其他直接找地盘
        
        // 值符落宫 = 时干落宫（在地盘直接找）
        this.zhiFuLuoGong = this.findHourGanGong(hourGan);
        
        // 值使落宫 = 遁仪宫 + 偏移
        // 直接相加，超过9则循环
        let zhiShiGong = zhiFuYuanGong + this.hourGanOffset;
        if (zhiShiGong > 9) zhiShiGong -= 9;
        this.zhiShiLuoGong = zhiShiGong;
    }
    
    findGanInDiPan(gan) {
        for (let i = 1; i <= 9; i++) {
            if (this.gong[i].diPan === gan) return i;
        }
        return -1;
    }
    
    findHourGanGong(hourGan) {
        // 直接在地盘找
        let gong = this.findGanInDiPan(hourGan);
        if (gong !== -1) return gong;
        
        // 甲遁六仪
        if (hourGan === '甲') {
            return this.findGanInDiPan(this.dunYi);
        }
        
        // 乙丙丁三奇：根据遁仪位置推算
        const yiGong = this.findGanInDiPan(this.dunYi);
        const yiIdx = this.gongOrder.indexOf(yiGong);
        const offset = { '乙': 1, '丙': 2, '丁': 3 }[hourGan];
        
        if (offset && yiIdx !== -1) {
            const targetIdx = this.isYangDun ? (yiIdx + offset) % 8 : (yiIdx - offset + 8) % 8;
            return this.gongOrder[targetIdx];
        }
        
        return this.isYangDun ? 2 : 8;
    }
    
    arrangeJiuXing() {
        // 九星原宫位置
        const xingYuanPos = { '天蓬': 1, '天任': 8, '天冲': 3, '天辅': 4, '天英': 9, '天芮': 2, '天柱': 7, '天心': 6 };
        
        // 计算九星转动步数
        const fromIdx = this.gongOrder.indexOf(this.zhiFuYuanGong);
        const toIdx = this.gongOrder.indexOf(this.zhiFuLuoGong);
        const steps = (toIdx - fromIdx + 8) % 8;
        this.xingSteps = steps;
        
        // 清空
        for (let i = 1; i <= 9; i++) {
            this.gong[i].jiuXing = '';
            this.gong[i].xingDaiGan = '';  // 九星带干
            this.gong[i].qinDaiGan = '';
        }
        
        // 九星转动
        for (const [xing, yuanGong] of Object.entries(xingYuanPos)) {
            const idx = this.gongOrder.indexOf(yuanGong);
            const targetGong = this.gongOrder[(idx + steps) % 8];
            this.gong[targetGong].jiuXing = xing;
            // 九星带干 = 九星原宫的地盘干
            this.gong[targetGong].xingDaiGan = this.gong[yuanGong].diPan;
        }
        
        // 天禽随天芮转动，禽芮同宫
        const ruiYuanGong = 2;
        const ruiIdx = this.gongOrder.indexOf(ruiYuanGong);
        const ruiTargetGong = this.gongOrder[(ruiIdx + steps) % 8];
        
        // 禽芮同宫
        this.gong[ruiTargetGong].jiuXing = '禽芮';
        this.gong[ruiTargetGong].qinDaiGan = this.gong[5].diPan; // 天禽所带干 = 5宫地盘干
        
        // 5宫不显示九星
        this.gong[5].jiuXing = '';
        this.gong[5].xingDaiGan = '';
    }
    
    arrangeTianPan() {
        // 转盘奇门：天盘干随天盘整体转动
        // 转动步数 = 九星转动步数(gongOrder) * 2, 按数字顺序
        
        const steps = (this.xingSteps * 2) % 9;
        
        for (let gong = 1; gong <= 9; gong++) {
            // 天盘[g] = 地盘[(g + steps - 1) % 9 + 1]
            let srcGong = (gong - 1 + steps) % 9 + 1;
            this.gong[gong].tianPan = this.gong[srcGong].diPan;
        }
    }
    
    arrangeYinGan() {
        // 隐干排列规则：
        // 1. 六仪(戊己庚辛壬癸)从时干对应的仪开始，排入值使落宫起始的位置
        // 2. 三奇(乙丙丁)固定逆排入4、3、2宫
        // 3. 六仪排列时跳过2、3、4宫（留给三奇）
        
        // 清空所有隐干
        for (let i = 1; i <= 9; i++) {
            this.gong[i].yinGan = '';
        }
        
        // 获取时干
        const hourGZ = this.siZhu.hour;
        const shiGan = hourGZ[0];
        
        // 六仪和三奇
        const liuYi = ['戊', '己', '庚', '辛', '壬', '癸'];
        const sanQi = ['乙', '丙', '丁'];
        
        // 值使落宫
        let startGong = this.zhiShiLuoGong;
        if (startGong === 5) startGong = 2; // 中宫寄坤
        
        // 六仪排列的宫位顺序（跳过2、3、4给三奇）
        const liuYiGongOrder = [1, 5, 6, 7, 8, 9];
        
        // 确定六仪起始位置
        let liuYiStartIdx = liuYi.indexOf(shiGan);
        if (liuYiStartIdx === -1) {
            // 时干是三奇(乙丙丁)或甲，找对应的遁仪
            liuYiStartIdx = liuYi.indexOf(this.dunYi);
        }
        
        // 确定起始宫在六仪宫位中的位置
        let gongStartIdx = liuYiGongOrder.indexOf(startGong);
        if (gongStartIdx === -1) {
            // 起始宫是2、3、4之一，需要调整
            // 2宫后是5宫，3宫后是4宫（但4也是三奇宫），4宫后是5宫
            if (startGong === 2 || startGong === 4) gongStartIdx = liuYiGongOrder.indexOf(5);
            else if (startGong === 3) gongStartIdx = liuYiGongOrder.indexOf(5);
        }
        
        // 排列六仪
        for (let i = 0; i < 6; i++) {
            const yiIdx = (liuYiStartIdx + i) % 6;
            const yi = liuYi[yiIdx];
            
            let gongIdx;
            if (this.isYangDun) {
                gongIdx = (gongStartIdx + i) % 6;
            } else {
                gongIdx = (gongStartIdx - i + 6) % 6;
            }
            const targetGong = liuYiGongOrder[gongIdx];
            this.gong[targetGong].yinGan = yi;
        }
        
        // 三奇固定逆排入4、3、2宫
        this.gong[4].yinGan = '乙';
        this.gong[3].yinGan = '丙';
        this.gong[2].yinGan = '丁';
    }
    
    arrangeBaMen() {
        const menYuanPos = { '休门': 1, '生门': 8, '伤门': 3, '杜门': 4, '景门': 9, '死门': 2, '惊门': 7, '开门': 6 };
        
        // 八门转动：值使按时干在旬内序号的一半移动（五子元遁）
        const hourGZ = this.siZhu.hour;
        const hourIdx = JIA_ZI_60.indexOf(hourGZ);
        const xunStart = Math.floor(hourIdx / 10) * 10;
        const xunNei = hourIdx - xunStart; // 时干在旬内的序号（0-9）
        
        // 八门转动步数 = 旬内序号 / 2（整除）
        const menSteps = Math.floor(xunNei / 2);
        
        const zhiShiYuanGong = menYuanPos[this.zhiShiMen] || 4;
        const yuanIdx = this.gongOrder.indexOf(zhiShiYuanGong);
        
        // 计算值使落宫：阳遁顺转，阴遁逆转
        let luoIdx;
        if (this.isYangDun) {
            luoIdx = (yuanIdx + menSteps) % 8;
        } else {
            luoIdx = (yuanIdx - menSteps + 8) % 8;
        }
        this.zhiShiLuoGong = this.gongOrder[luoIdx];
        
        for (let i = 1; i <= 9; i++) this.gong[i].baMen = '';
        
        // 八门整体转动
        for (const [men, yuanGong] of Object.entries(menYuanPos)) {
            const idx = this.gongOrder.indexOf(yuanGong);
            let targetIdx;
            if (this.isYangDun) {
                targetIdx = (idx + menSteps) % 8;
            } else {
                targetIdx = (idx - menSteps + 8) % 8;
            }
            this.gong[this.gongOrder[targetIdx]].baMen = men;
        }
        this.gong[5].baMen = '';
    }
    
    arrangeBaShen() {
        // 八神顺序：直符、腾蛇、太阴、六合、白虎、玄武、九地、九天
        const baShen = ['直符', '腾蛇', '太阴', '六合', '白虎', '玄武', '九地', '九天'];
        
        for (let i = 1; i <= 9; i++) {
            this.gong[i].baShen = '';      // 地盘八神（固定）
            this.gong[i].tianShen = '';    // 天盘八神（随天盘转动）
        }
        
        // 地盘八神：从值符原宫开始排（固定不动）
        // 如果原宫是5宫（中宫），寄到2宫（坤）
        let diStartGong = this.zhiFuYuanGong === 5 ? 2 : this.zhiFuYuanGong;
        const diStartIdx = this.gongOrder.indexOf(diStartGong);
        if (diStartIdx !== -1) {
            for (let i = 0; i < 8; i++) {
                const idx = this.isYangDun ? (diStartIdx + i) % 8 : (diStartIdx - i + 8) % 8;
                this.gong[this.gongOrder[idx]].baShen = baShen[i];
            }
        }
        
        // 天盘八神：从值符落宫开始排（随天盘转动）
        // 如果落宫是5宫（中宫），寄到2宫（坤）
        let tianStartGong = this.zhiFuLuoGong === 5 ? 2 : this.zhiFuLuoGong;
        const tianStartIdx = this.gongOrder.indexOf(tianStartGong);
        if (tianStartIdx !== -1) {
            for (let i = 0; i < 8; i++) {
                const idx = this.isYangDun ? (tianStartIdx + i) % 8 : (tianStartIdx - i + 8) % 8;
                this.gong[this.gongOrder[idx]].tianShen = baShen[i];
            }
        }
        
        this.gong[5].baShen = '';
        this.gong[5].tianShen = '';
    }
    
    calculateKongWang() {
        this.kongWang = getKongWang(this.siZhu.hour);
        for (const zhi of this.kongWang) {
            const gong = ZHI_GONG[zhi];
            if (gong && this.gong[gong]) this.gong[gong].kongWang = true;
        }
    }
    
    calculateMaStar() {
        this.maXing = YI_MA[this.siZhu.hour[1]];
        const gong = ZHI_GONG[this.maXing];
        if (gong && this.gong[gong]) this.gong[gong].maStar = true;
    }
    
    getResult() {
        // 旬首显示格式: "甲申庚"
        const xunShouDisplay = this.xunShou + this.dunYi;
        
        // 计算四柱各自的旬空
        const yearKong = this.getXunKong(this.siZhu.year);
        const monthKong = this.getXunKong(this.siZhu.month);
        const dayKong = this.getXunKong(this.siZhu.day);
        const hourKong = this.getXunKong(this.siZhu.hour);
        const kongWangDisplay = `${yearKong}空　${monthKong}空　${dayKong}空　${hourKong}空`;
        
        // 计算节气时间（显示当前节和下一节）
        const currentJie = this.formatJieQiTime(this.jieQi.currentJie);
        const nextJie = this.formatJieQiTime(this.jieQi.nextJie);
        
        // 计算本元第几天
        const yuanDayNum = this.getYuanDayNum();
        
        // 计算上元第一天
        const yuanFirstDay = this.getYuanFirstDay();
        
        return {
            originalTime: this.originalDate,
            trueSolarTime: this.trueSolarTime,
            timeDiff: this.timeDiff,
            siZhu: this.siZhu,
            jieQi: this.jieQi.name,
            jieQiObj: this.jieQi,
            dunType: this.dunType,
            yuan: ['上元', '中元', '下元'][this.yuan],
            juNum: this.juNum,
            method: this.method === 'chaiBu' ? '拆补法' : '置闰法',
            xunShou: this.xunShou,
            xunShouDisplay: xunShouDisplay,
            dunYi: this.dunYi,
            zhiFuXing: this.zhiFuXing,
            zhiShiMen: this.zhiShiMen,
            zhiFuLuoGong: this.zhiFuLuoGong,
            zhiShiLuoGong: this.zhiShiLuoGong,
            kongWang: this.kongWang,
            kongWangDisplay: kongWangDisplay,
            maXing: this.maXing,
            gong: this.gong,
            currentJie: currentJie,
            nextJie: nextJie,
            yuanDayNum: yuanDayNum,
            yuanFirstDay: yuanFirstDay,
            lunarMonth: this.siZhu.lunarMonth || '',
            lunarDay: this.siZhu.lunarDay || ''
        };
    }
    
    getXunKong(gz) {
        const index = JIA_ZI_60.indexOf(gz);
        const xunStart = Math.floor(index / 10) * 10;
        // 旬空是该旬未出现的两个地支
        const kongIndex1 = (xunStart + 10) % 12;
        const kongIndex2 = (xunStart + 11) % 12;
        return DI_ZHI[kongIndex1] + DI_ZHI[kongIndex2];
    }
    
    formatJieQiTime(jq) {
        if (!jq) return null;
        const sd = jq.startDate;
        if (!sd) return null;
        return {
            name: jq.name,
            time: `${sd.year}/${sd.month}/${sd.day} ${sd.hour}:${String(sd.minute).padStart(2,'0')}:00`
        };
    }
    
    getYuanDayNum() {
        // 计算当前日在本元的第几天
        const dayIndex = JIA_ZI_60.indexOf(this.siZhu.day);
        const xunStart = Math.floor(dayIndex / 10) * 10;
        const dayInXun = dayIndex - xunStart;
        // 每5天为一元
        return (dayInXun % 5) + 1;
    }
    
    getYuanFirstDay() {
        // 计算本节气上元第一天
        const sd = this.jieQi.startDate;
        if (!sd) return '';
        const jqDate = new Date(sd.year, sd.month - 1, sd.day, sd.hour, sd.minute);
        const jqSiZhu = getSiZhu(jqDate);
        return `${sd.year}年${sd.month}月${sd.day}日${jqSiZhu.day}`;
    }
}

// 暴露给全局
if (typeof globalThis !== 'undefined') globalThis.QimenPan = QimenPan;
