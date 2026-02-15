// ESM 模块测试
import { readFileSync } from 'fs';
import { JSDOM } from 'jsdom';

// 创建模拟浏览器环境
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
global.window = dom.window;
global.document = dom.window.document;

// 读取并执行所有 JS 文件
const files = ['constants.js', 'calendar.js', 'solar-time.js', 'qimen.js'];
for (const f of files) {
    const code = readFileSync(`js/${f}`, 'utf8');
    eval(code);
}

// 测试
const testDate = new Date(2026, 1, 15, 21, 3); // 2026-02-15 21:03
console.log('测试时间:', testDate.toLocaleString());

const pan = new QimenPan(testDate, 116.4, 39.9, 'zhiRun', false);
const r = pan.getResult();

console.log('\n=== 排盘信息显示 ===');
console.log('四柱:', r.siZhu.year, r.siZhu.month, r.siZhu.day, r.siZhu.hour);
console.log('旬空:', r.kongWangDisplay);
console.log('节气:', r.jieQi);
console.log('阴阳遁:', r.dunType + '遁' + r.juNum + '局');
console.log('三元:', r.yuan, '第' + r.yuanDayNum + '天');
console.log('旬首显示:', r.xunShouDisplay);
console.log('值符星:', r.zhiFuXing, '落', r.zhiFuLuoGong, '宫');
console.log('值使门:', r.zhiShiMen, '落', r.zhiShiLuoGong, '宫');
console.log('上元第一天:', r.yuanFirstDay);

console.log('\n=== 九宫 ===');
const pos = [4, 9, 2, 3, 5, 7, 8, 1, 6];
for (const i of pos) {
    const g = r.gong[i];
    console.log(`${i}宫: 地${g.diPan} 天${g.tianPan} ${g.jiuXing} ${g.baMen} ${g.baShen}`);
}
