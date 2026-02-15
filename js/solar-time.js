/**
 * 真太阳时计算模块
 */

/**
 * 计算真太阳时
 * @param {Date} date 标准时间
 * @param {number} longitude 经度（东经为正）
 * @param {number} latitude 纬度（北纬为正）
 * @returns {Object} {date: 真太阳时Date对象, diff: 时差分钟数, equation: 时差方程值}
 */
function getTrueSolarTime(date, longitude, latitude = 0) {
    // 1. 计算经度时差（与北京时间120°E的差异）
    const standardLongitude = 120; // 北京时间基准经度
    const longitudeDiff = (longitude - standardLongitude) * 4; // 每度4分钟
    
    // 2. 计算时差方程（均时差）
    const dayOfYear = getDayOfYear(date);
    const B = 2 * Math.PI * (dayOfYear - 81) / 365;
    
    // 时差方程（分钟）
    const equation = 9.87 * Math.sin(2 * B) - 7.53 * Math.cos(B) - 1.5 * Math.sin(B);
    
    // 3. 总时差
    const totalDiff = longitudeDiff + equation;
    
    // 4. 计算真太阳时
    const trueSolarTime = new Date(date.getTime() + totalDiff * 60 * 1000);
    
    return {
        date: trueSolarTime,
        diff: totalDiff,
        longitudeDiff: longitudeDiff,
        equation: equation
    };
}

/**
 * 获取一年中的第几天
 * @param {Date} date 日期
 * @returns {number} 天数
 */
function getDayOfYear(date) {
    const start = new Date(date.getFullYear(), 0, 0);
    const diff = date - start;
    const oneDay = 1000 * 60 * 60 * 24;
    return Math.floor(diff / oneDay);
}

/**
 * 获取用户地理位置
 * @returns {Promise<{longitude: number, latitude: number}>}
 */
function getGeolocation() {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error('浏览器不支持地理位置'));
            return;
        }
        
        navigator.geolocation.getCurrentPosition(
            (position) => {
                resolve({
                    longitude: position.coords.longitude,
                    latitude: position.coords.latitude
                });
            },
            (error) => {
                reject(error);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        );
    });
}

/**
 * 中国主要城市经纬度
 */
const CITY_COORDS = {
    '北京': { longitude: 116.4074, latitude: 39.9042 },
    '上海': { longitude: 121.4737, latitude: 31.2304 },
    '广州': { longitude: 113.2644, latitude: 23.1291 },
    '深圳': { longitude: 114.0579, latitude: 22.5431 },
    '成都': { longitude: 104.0665, latitude: 30.5723 },
    '重庆': { longitude: 106.5516, latitude: 29.5630 },
    '杭州': { longitude: 120.1551, latitude: 30.2741 },
    '南京': { longitude: 118.7969, latitude: 32.0603 },
    '武汉': { longitude: 114.3055, latitude: 30.5928 },
    '西安': { longitude: 108.9402, latitude: 34.3416 },
    '天津': { longitude: 117.1901, latitude: 39.1255 },
    '苏州': { longitude: 120.5853, latitude: 31.2989 },
    '郑州': { longitude: 113.6254, latitude: 34.7466 },
    '长沙': { longitude: 112.9388, latitude: 28.2282 },
    '沈阳': { longitude: 123.4315, latitude: 41.8057 },
    '青岛': { longitude: 120.3826, latitude: 36.0671 },
    '大连': { longitude: 121.6147, latitude: 38.9140 },
    '厦门': { longitude: 118.0894, latitude: 24.4798 },
    '昆明': { longitude: 102.8329, latitude: 24.8801 },
    '哈尔滨': { longitude: 126.5349, latitude: 45.8038 },
    '济南': { longitude: 117.1205, latitude: 36.6510 },
    '福州': { longitude: 119.2965, latitude: 26.0745 },
    '南昌': { longitude: 115.8581, latitude: 28.6829 },
    '合肥': { longitude: 117.2272, latitude: 31.8206 },
    '长春': { longitude: 125.3235, latitude: 43.8171 },
    '石家庄': { longitude: 114.5149, latitude: 38.0428 },
    '太原': { longitude: 112.5489, latitude: 37.8706 },
    '南宁': { longitude: 108.3661, latitude: 22.8170 },
    '贵阳': { longitude: 106.6302, latitude: 26.6477 },
    '海口': { longitude: 110.3312, latitude: 20.0312 },
    '兰州': { longitude: 103.8343, latitude: 36.0611 },
    '银川': { longitude: 106.2309, latitude: 38.4872 },
    '西宁': { longitude: 101.7782, latitude: 36.6171 },
    '乌鲁木齐': { longitude: 87.6177, latitude: 43.7928 },
    '呼和浩特': { longitude: 111.7490, latitude: 40.8424 },
    '拉萨': { longitude: 91.1409, latitude: 29.6500 },
    '台北': { longitude: 121.5654, latitude: 25.0330 },
    '香港': { longitude: 114.1694, latitude: 22.3193 },
    '澳门': { longitude: 113.5439, latitude: 22.1987 }
};

/**
 * 格式化时间差
 * @param {number} minutes 分钟数
 * @returns {string} 格式化字符串
 */
function formatTimeDiff(minutes) {
    const absMinutes = Math.abs(minutes);
    const h = Math.floor(absMinutes / 60);
    const m = Math.round(absMinutes % 60);
    const sign = minutes >= 0 ? '+' : '-';
    
    if (h > 0) {
        return `${sign}${h}小时${m}分`;
    }
    return `${sign}${m}分`;
}
