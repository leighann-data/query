// 加载所有模块（注意顺序，constants必须先加载）
const fs = require('fs');
let code = fs.readFileSync('js/constants.js', 'utf8') + '\n' + 
           fs.readFileSync('js/calendar.js', 'utf8') + '\n' + 
           fs.readFileSync('js/solar-time.js', 'utf8') + '\n' + 
           fs.readFileSync('js/qimen.js', 'utf8');
// 将 class X 改为 var X = class (使eval中的class可被全局访问)
code = code.replace(/^class\s+(\w+)/gm, 'var $1 = class');
eval(code);

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
    
    console.log('\n九宫布局 (宫号: 地盘 天盘 九星 八门 八神):');
    const layout = [
        [4, 9, 2],
        [3, 5, 7],
        [8, 1, 6]
    ];
    for (const row of layout) {
        const cells = row.map(i => {
            const g = r.gong[i];
            return `${i}宫[${g.diPan||'-'}${g.tianPan||'-'}${g.jiuXing||'-'}${g.baMen||'-'}${g.baShen||'-'}]`;
        });
        console.log('  ' + cells.join(' | '));
    }
}
