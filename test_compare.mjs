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

// 测试第一张截图：2009年11月9日16时40分 阴9局
console.log('=== 测试 2009-11-09 16:40 (截图1参考) ===');
let pan = new QimenPan(new Date(2009, 10, 9, 16, 40), 116.4, 39.9, 'zhiRun', false);
let r = pan.getResult();

console.log('四柱:', r.siZhu.year, r.siZhu.month, r.siZhu.day, r.siZhu.hour);
console.log('阴阳遁:', r.dunType + '遁' + r.juNum + '局');
console.log('旬首:', r.xunShouDisplay);
console.log('值符:', r.zhiFuXing, '落', r.zhiFuLuoGong, '宫');
console.log('值使:', r.zhiShiMen, '落', r.zhiShiLuoGong, '宫');
console.log('\n隐干和八门对比:');
console.log('宫号 | 我们隐干 | 期望隐干 | 我们八门 | 期望八门');
const expected = {
    4: {yin:'辛', men:'休门'}, 9: {yin:'丙', men:'生门'}, 2: {yin:'癸', men:'伤门'},
    3: {yin:'壬', men:'开门'}, 5: {yin:'庚', men:'-'},    7: {yin:'戊', men:'杜门'},
    8: {yin:'乙', men:'惊门'}, 1: {yin:'丁', men:'死门'}, 6: {yin:'己', men:'景门'}
};
for (let g = 1; g <= 9; g++) {
    const e = expected[g];
    const yinOk = r.gong[g].yinGan === e.yin ? '✓' : '✗';
    const menOk = (r.gong[g].baMen || '-') === e.men ? '✓' : '✗';
    console.log(`  ${g}宫 | ${r.gong[g].yinGan || '-'} ${yinOk} | ${e.yin} | ${r.gong[g].baMen || '-'} ${menOk} | ${e.men}`);
}

// 分析问题
console.log('\n=== 详细分析 ===');
console.log('我们计算: 值使杜门落1宫');
console.log('期望结果: 值使杜门落7宫(杜门在7宫)');

// 检查八门落宫
console.log('\n当前八门分布:');
for (let g = 1; g <= 9; g++) {
    if (r.gong[g].baMen) console.log(`  ${g}宫: ${r.gong[g].baMen}`);
}

// 期望八门分布(从截图)
console.log('\n期望八门分布:');
console.log('  4宫:休门, 9宫:生门, 2宫:伤门');
console.log('  3宫:开门, 7宫:杜门');
console.log('  8宫:惊门, 1宫:死门, 6宫:景门');
