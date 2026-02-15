// 加载所有模块（注意顺序，constants必须先加载）
const fs = require('fs');
const constants = fs.readFileSync('js/constants.js', 'utf8');
const calendar = fs.readFileSync('js/calendar.js', 'utf8');
const solarTime = fs.readFileSync('js/solar-time.js', 'utf8');
const qimen = fs.readFileSync('js/qimen.js', 'utf8');

// 合并执行
eval(constants + '\n' + calendar + '\n' + solarTime + '\n' + qimen);

// 测试：2026年2月15日 16:55 北京时间
const testDate = new Date(2026, 1, 15, 16, 55);
console.log('测试时间:', testDate.toLocaleString());

// 1. 测试四柱
const siZhu = getSiZhu(testDate);
console.log('\n四柱:', siZhu.year, siZhu.month, siZhu.day, siZhu.hour);
console.log('节气:', siZhu.jieqi?.name);

// 2. 测试排盘
const pan = new QimenPan(testDate, 116.4, 39.9, 'chaiBu');
const result = pan.getResult();

console.log('\n=== 排盘结果 ===');
console.log('阴阳遁:', result.dunType);
console.log('局数:', result.juNum);
console.log('三元:', result.yuan);
console.log('旬首:', result.xunShou);
console.log('遁仪:', result.dunYi);
console.log('值符星:', result.zhiFuXing);
console.log('值使门:', result.zhiShiMen);
console.log('值符落宫:', result.zhiFuLuoGong);

console.log('\n=== 九宫 ===');
for (let i = 1; i <= 9; i++) {
    const g = result.gong[i];
    console.log(`${i}宫: 地${g.diPan} 天${g.tianPan} ${g.jiuXing} ${g.baMen} ${g.baShen}`);
}
