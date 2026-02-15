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
        this.arrangeTianPan();
        this.arrangeJiuXing();
        this.arrangeBaMen();
        this.arrangeBaShen();
        this.calculateKongWang();
        this.calculateMaStar();
    }
    
    determineDunJu() {
        const jieqiInfo = JIE_QI_JU[this.jieQi.name];
        this.dunType = jieqiInfo.dun;
        this.isYangDun = this.dunType === '阳';
        
        // 置闰法
        const dayIndex = JIA_ZI_60.indexOf(this.siZhu.day);
        const xunStart = Math.floor(dayIndex / 10) * 10;
        if (xunStart === 0 || xunStart === 30) this.yuan = 0;
        else if (xunStart === 10 || xunStart === 40) this.yuan = 1;
        else this.yuan = 2;
        
        this.juNum = jieqiInfo.ju[this.yuan];
    }
    
    arrangeDiPan() {
        // 九仪顺序: 六仪(戊己庚辛壬癸) + 三奇(丁丙乙)
        const jiuYi = ['戊', '己', '庚', '辛', '壬', '癸', '丁', '丙', '乙'];
        
        // 超接置闰法: 从局数宫开始,按数字顺序布九仪(含中宫)
        // 阳遁二局: 2→3→4→5→6→7→8→9→1
        // 阴遁九局: 9→8→7→6→5→4→3→2→1
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
    
    arrangeTianPan() {
        // 天盘算法：地盘干按宫号移动(旬内序号-1)步
        // 1. 构建完整地盘(含中宫)
        // 2. 天盘干[gong] = 地盘干[gong + 步数]
        
        const jiuYi = ['戊', '己', '庚', '辛', '壬', '癸', '丁', '丙', '乙'];
        
        // 构建完整地盘(按宫号1-9)
        const diPanFull = [''];
        for (let gong = 1; gong <= 9; gong++) {
            const yiIdx = (gong - this.ju + 9) % 9;
            diPanFull[gong] = jiuYi[yiIdx];
        }
        
        // 计算移动步数 = 时干旬内序号 - 1
        const hourGZ = this.siZhu.hour;
        const hourIdx = JIA_ZI_60.indexOf(hourGZ);
        const xunStart = Math.floor(hourIdx / 10) * 10;
        const xunNei = hourIdx - xunStart;
        const steps = xunNei - 1;
        
        // 天盘干 = 地盘干向前移动steps步
        for (let gong = 1; gong <= 9; gong++) {
            if (gong === 5) {
                this.gong[gong].tianPan = '';
                continue;
            }
            let srcGong = gong + steps;
            if (srcGong > 9) srcGong -= 9;
            if (srcGong < 1) srcGong += 9;
            this.gong[gong].tianPan = diPanFull[srcGong];
        }
    }
    
    arrangeJiuXing() {
        const xingYuanPos = { '天蓬': 1, '天任': 8, '天冲': 3, '天辅': 4, '天英': 9, '天芮': 2, '天柱': 7, '天心': 6 };
        const fromIdx = this.gongOrder.indexOf(this.zhiFuYuanGong);
        const toIdx = this.gongOrder.indexOf(this.zhiFuLuoGong);
        const steps = (toIdx - fromIdx + 8) % 8;
        
        for (let i = 1; i <= 9; i++) {
            this.gong[i].jiuXing = '';
            this.gong[i].xingDaiGan = ''; // 九星所带地盘干
        }
        
        for (const [xing, yuanGong] of Object.entries(xingYuanPos)) {
            const idx = this.gongOrder.indexOf(yuanGong);
            const targetGong = this.gongOrder[(idx + steps) % 8];
            this.gong[targetGong].jiuXing = xing;
            // 九星所带地盘干 = 九星原宫的地盘干
            this.gong[targetGong].xingDaiGan = this.gong[yuanGong].diPan;
        }
        
        // 天禽寄宫（寄到天芮所在宫）
        const jiGong = this.isYangDun ? 2 : 8;
        const jiIdx = this.gongOrder.indexOf(jiGong);
        const qinGong = this.gongOrder[(jiIdx + steps) % 8];
        // 禽芮合体显示
        this.gong[qinGong].jiuXing = '禽芮';
        // 保存天禽所带地盘干（5宫地盘干）
        this.gong[qinGong].qinDaiGan = this.gong[5].diPan;
        // 天芮所带地盘干（2宫地盘干）
        this.gong[qinGong].xingDaiGan = this.gong[2].diPan;
        
        // 5宫不显示九星
        this.gong[5].jiuXing = '';
    }
    
    arrangeBaMen() {
        const menYuanPos = { '休门': 1, '生门': 8, '伤门': 3, '杜门': 4, '景门': 9, '死门': 2, '惊门': 7, '开门': 6 };
        
        // 八门转动：值使落宫 = 值使原宫 + 旬内序号（数字直接相加）
        const hourGZ = this.siZhu.hour;
        const hourIdx = JIA_ZI_60.indexOf(hourGZ);
        const xunStart = Math.floor(hourIdx / 10) * 10;
        const xunNei = hourIdx - xunStart; // 时干在旬内的序号（0-9）
        
        const zhiShiYuanGong = menYuanPos[this.zhiShiMen] || 4;
        
        // 值使落宫 = 原宫 + 旬内序号
        let zhiShiLuoGongNum = zhiShiYuanGong + xunNei;
        if (zhiShiLuoGongNum > 9) zhiShiLuoGongNum -= 9;
        if (zhiShiLuoGongNum === 5) zhiShiLuoGongNum = 2; // 中宫寄坤
        this.zhiShiLuoGong = zhiShiLuoGongNum;
        
        // 计算八门转动步数（在八宫顺序中）
        const zhiShiFromIdx = this.gongOrder.indexOf(zhiShiYuanGong);
        const zhiShiToIdx = this.gongOrder.indexOf(this.zhiShiLuoGong);
        const menSteps = (zhiShiToIdx - zhiShiFromIdx + 8) % 8;
        
        for (let i = 1; i <= 9; i++) this.gong[i].baMen = '';
        
        for (const [men, yuanGong] of Object.entries(menYuanPos)) {
            const idx = this.gongOrder.indexOf(yuanGong);
            this.gong[this.gongOrder[(idx + menSteps) % 8]].baMen = men;
        }
        this.gong[5].baMen = '';
    }
    
    arrangeBaShen() {
        // 八神顺序：值符、腾蛇、太阴、六合、白虎、玄武、九地、九天
        const baShen = ['值符', '腾蛇', '太阴', '六合', '白虎', '玄武', '九地', '九天'];
        
        // 地盘八神：从值符原宫开始排
        const diStartIdx = this.gongOrder.indexOf(this.zhiFuYuanGong);
        for (let i = 1; i <= 9; i++) {
            this.gong[i].baShen = '';    // 地盘八神
            this.gong[i].tianShen = '';  // 天盘八神
        }
        
        for (let i = 0; i < 8; i++) {
            const diIdx = this.isYangDun ? (diStartIdx + i) % 8 : (diStartIdx - i + 8) % 8;
            this.gong[this.gongOrder[diIdx]].baShen = baShen[i];
        }
        
        // 天盘八神：从值符落宫开始排
        const tianStartIdx = this.gongOrder.indexOf(this.zhiFuLuoGong);
        for (let i = 0; i < 8; i++) {
            const tianIdx = this.isYangDun ? (tianStartIdx + i) % 8 : (tianStartIdx - i + 8) % 8;
            this.gong[this.gongOrder[tianIdx]].tianShen = baShen[i];
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
