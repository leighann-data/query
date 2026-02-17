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
    (0, eval)(code); // 间接eval在全局作用域执行
}

// 测试4个时间点
const testCases = [
    { date: new Date(2026, 1, 15, 20, 12), desc: '2026-02-15 20:12 戌时' },
    { date: new Date(2026, 1, 15, 21, 36), desc: '2026-02-15 21:36 亥时' },
    { date: new Date(2026, 1, 16, 0, 28), desc: '2026-02-16 00:28 子时' },
];

for (const tc of testCases) {
    console.log('\n' + '='.repeat(60));
    console.log('测试:', tc.desc);
    console.log('='.repeat(60));
    
    const pan = new QimenPan(tc.date, 116.4, 39.9, 'zhiRun', false);
    const r = pan.getResult();
    
    console.log('四柱:', r.siZhu.year, r.siZhu.month, r.siZhu.day, r.siZhu.hour);
    console.log('旬空:', r.kongWangDisplay);
    console.log('节气:', r.jieQi);
    console.log('阴阳遁:', r.dunType + '遁' + r.juNum + '局');
    console.log('三元:', r.yuan, '第' + r.yuanDayNum + '天');
    console.log('旬首:', r.xunShouDisplay);
    console.log('值符:', r.zhiFuXing, '落', r.zhiFuLuoGong, '宫');
    console.log('值使:', r.zhiShiMen, '落', r.zhiShiLuoGong, '宫');
    
    console.log('\n九宫布局 (宫号: 天盘干 九星+带干 八门 地盘干 | 天八神 地八神):');
    const pos = [4, 9, 2, 3, 5, 7, 8, 1, 6];
    for (const i of pos) {
        const g = r.gong[i];
        const xingStr = g.jiuXing ? `${g.jiuXing}${g.xingDaiGan||''}` : '-';
        console.log(`  ${i}宫: ${g.tianPan||'-'} ${xingStr} ${g.baMen||'-'} ${g.diPan||'-'} | ${g.tianShen||'-'} ${g.baShen||'-'}`);
    }
}
