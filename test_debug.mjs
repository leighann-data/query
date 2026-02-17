import { readFileSync } from 'fs';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
global.window = dom.window;
global.document = dom.window.document;

const files = ['constants.js', 'calendar.js', 'solar-time.js', 'qimen.js'];
for (const f of files) {
    const code = readFileSync(`js/${f}`, 'utf8');
    (0, eval)(code);
}

// 2009年11月9日16:40 
// 2009年11月7日是立冬
const date = new Date(2009, 10, 9, 16, 40);
console.log('测试时间:', date.toLocaleString());

const pan = new QimenPan(date, 116.4, 39.9, 'zhiRun', false);
const r = pan.getResult();

console.log('四柱:', r.siZhu.year, r.siZhu.month, r.siZhu.day, r.siZhu.hour);
console.log('期望: 己丑年 乙亥月 戊午日 庚申时');
console.log('');
console.log('节气:', r.jieQi);
console.log('当前节:', r.jieQiObj.currentJie?.name);
console.log('');

// 检查八门计算
console.log('=== 八门计算调试 ===');
console.log('时干支:', r.siZhu.hour);
console.log('旬首:', r.xunShou);
console.log('遁仪:', r.dunYi);
console.log('值符原宫:', pan.zhiFuYuanGong);
console.log('值使门:', r.zhiShiMen);
console.log('值使落宫:', r.zhiShiLuoGong);

// 手动计算应该的值使落宫
const hourGZ = r.siZhu.hour;
const JIA_ZI_60 = globalThis.JIA_ZI_60;
const hourIdx = JIA_ZI_60.indexOf(hourGZ);
const xunStart = Math.floor(hourIdx / 10) * 10;
const xunNei = hourIdx - xunStart;
console.log('');
console.log('时干支索引:', hourIdx);
console.log('旬首索引:', xunStart);
console.log('旬内序号:', xunNei);

// 杜门原宫是4
const menYuanGong = 4;
console.log('杜门原宫:', menYuanGong);
let zhiShiLuoGong = menYuanGong + xunNei;
if (zhiShiLuoGong > 9) zhiShiLuoGong -= 9;
console.log('计算的值使落宫(原宫+旬内序号):', zhiShiLuoGong);
