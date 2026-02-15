/**
 * 奇门遁甲格局判断
 */

// 十干克应（天盘干克地盘干的格局）
const GE_JU = {
    // 吉格
    '乙+丙': { name: '奇仪顺遂', type: '吉', desc: '谋事吉利，百事顺遂' },
    '乙+丁': { name: '奇仪相佐', type: '吉', desc: '文书和合，贵人相助' },
    '丙+乙': { name: '日奇伏吟', type: '吉', desc: '官事和合，利见贵人' },
    '丙+丁': { name: '月奇星奇', type: '吉', desc: '贵人提携，事业有成' },
    '丁+乙': { name: '星奇入太阴', type: '吉', desc: '文书利达，考试高中' },
    '丁+丙': { name: '星奇朱雀', type: '吉', desc: '文章焕彩，信息吉利' },
    
    // 三奇得使
    '乙+开门': { name: '乙奇得使', type: '大吉', desc: '乙奇临开门，大吉大利' },
    '丙+休门': { name: '丙奇得使', type: '大吉', desc: '丙奇临休门，万事如意' },
    '丁+生门': { name: '丁奇得使', type: '大吉', desc: '丁奇临生门，财源广进' },
    
    // 凶格
    '庚+乙': { name: '白虎猖狂', type: '凶', desc: '官非口舌，凶险之事' },
    '庚+丙': { name: '太白入荧', type: '凶', desc: '贼来害己，被人暗算' },
    '庚+丁': { name: '金神入火', type: '凶', desc: '文书有损，事业受阻' },
    '庚+戊': { name: '天乙会合', type: '中', desc: '利于和合，须防小人' },
    '庚+己': { name: '刑格', type: '凶', desc: '主刑伤官非，凶' },
    '庚+庚': { name: '太白天乙', type: '大凶', desc: '主兄弟相争，自相残杀' },
    '庚+辛': { name: '白虎干格', type: '凶', desc: '主官非牢狱之灾' },
    '庚+壬': { name: '小格', type: '凶', desc: '主小人陷害' },
    '庚+癸': { name: '大格', type: '凶', desc: '主大的灾难' },
    
    // 辛加格局
    '辛+乙': { name: '白虎逢星', type: '凶', desc: '官事不利，文书有阻' },
    '辛+丙': { name: '天狱', type: '凶', desc: '主牢狱之灾' },
    '辛+丁': { name: '朱雀入狱', type: '凶', desc: '主文书信息出问题' },
    '辛+戊': { name: '困龙', type: '凶', desc: '主事业受阻' },
    '辛+己': { name: '入墓', type: '凶', desc: '主事情拖延' },
    '辛+庚': { name: '白虎出力', type: '凶', desc: '主争斗官非' },
    '辛+辛': { name: '伏吟', type: '凶', desc: '主疾病缠身' },
    '辛+壬': { name: '凶蛇入狱', type: '凶', desc: '主纠缠不清' },
    '辛+癸': { name: '天牢', type: '大凶', desc: '主牢狱绝症' },
    
    // 壬癸加格局
    '壬+乙': { name: '小蛇得势', type: '中', desc: '主小人得志' },
    '壬+丙': { name: '火入天罗', type: '凶', desc: '主文书不利' },
    '壬+丁': { name: '朱雀投江', type: '凶', desc: '主文书有损' },
    '壬+戊': { name: '小蛇化龙', type: '中', desc: '主先难后易' },
    '壬+己': { name: '天蓬入墓', type: '凶', desc: '主智慧被困' },
    '壬+庚': { name: '太白擒蛇', type: '凶', desc: '主刑狱' },
    '壬+辛': { name: '天牢华盖', type: '凶', desc: '主官司缠身' },
    '壬+壬': { name: '蛇矫', type: '凶', desc: '主水灾盗贼' },
    '壬+癸': { name: '幼女奸淫', type: '凶', desc: '主女人不贞' },
    
    '癸+乙': { name: '华盖逢星', type: '中', desc: '主阴私暗昧' },
    '癸+丙': { name: '华盖悖师', type: '凶', desc: '主背师叛道' },
    '癸+丁': { name: '朱雀入地', type: '凶', desc: '主讼狱不利' },
    '癸+戊': { name: '天乙会合', type: '中', desc: '主云游四方' },
    '癸+己': { name: '华盖地户', type: '中', desc: '主隐遁修道' },
    '癸+庚': { name: '太白临魁', type: '凶', desc: '主大的灾难' },
    '癸+辛': { name: '网盖天牢', type: '凶', desc: '主牢狱之灾' },
    '癸+壬': { name: '复吟', type: '凶', desc: '主事情反复' },
    '癸+癸': { name: '伏吟', type: '凶', desc: '主病重难医' },
    
    // 戊己加格局
    '戊+乙': { name: '青龙逃走', type: '凶', desc: '主逃亡走失' },
    '戊+丙': { name: '青龙返首', type: '大吉', desc: '主大吉大利' },
    '戊+丁': { name: '青龙耀明', type: '吉', desc: '主富贵荣昌' },
    '戊+戊': { name: '伏吟', type: '中', desc: '主事难成就' },
    '戊+己': { name: '贵人入狱', type: '凶', desc: '主尊长有灾' },
    '戊+庚': { name: '天乙伏宫', type: '凶', desc: '主官事不利' },
    '戊+辛': { name: '青龙折足', type: '凶', desc: '主折伤损财' },
    '戊+壬': { name: '青龙入水', type: '中', desc: '主漂流不定' },
    '戊+癸': { name: '青龙华盖', type: '吉', desc: '主遁迹修真' },
    
    '己+乙': { name: '墓神不明', type: '凶', desc: '主暗昧不明' },
    '己+丙': { name: '火入勾陈', type: '凶', desc: '主官讼是非' },
    '己+丁': { name: '朱雀入墓', type: '凶', desc: '主文书不明' },
    '己+戊': { name: '犬遇青龙', type: '吉', desc: '主富贵荣昌' },
    '己+己': { name: '地户逢鬼', type: '凶', desc: '主病灾官非' },
    '己+庚': { name: '刑格返吟', type: '凶', desc: '主刑伤官非' },
    '己+辛': { name: '入墓伏吟', type: '凶', desc: '主事延滞' },
    '己+壬': { name: '地网高张', type: '凶', desc: '主闭塞不通' },
    '己+癸': { name: '地刑玄武', type: '凶', desc: '主阴谋暗害' }
};

// 门迫（门克宫）
const MEN_PO = {
    '休门': { gong: [9, 2], desc: '休门土被克' },     // 休门属水，被土克
    '生门': { gong: [3, 4], desc: '生门被木克' },     // 生门属土，被木克
    '伤门': { gong: [6, 7], desc: '伤门被金克' },     // 伤门属木，被金克
    '杜门': { gong: [6, 7], desc: '杜门被金克' },     // 杜门属木，被金克
    '景门': { gong: [1], desc: '景门被水克' },        // 景门属火，被水克
    '死门': { gong: [3, 4], desc: '死门被木克' },     // 死门属土，被木克
    '惊门': { gong: [9], desc: '惊门被火克' },        // 惊门属金，被火克
    '开门': { gong: [9], desc: '开门被火克' }         // 开门属金，被火克
};

// 击刑
const JI_XING = {
    3: '震宫被刑',  // 卯刑自刑
    6: '乾宫被刑',  // 戌刑未
    9: '离宫被刑'   // 午刑自刑
};

/**
 * 判断格局
 * @param {Object} panResult 排盘结果
 * @returns {Array} 格局列表
 */
function analyzePatterns(panResult) {
    const patterns = [];
    const gong = panResult.gong;
    
    // 1. 分析每宫的天地盘干格局
    for (let i = 1; i <= 9; i++) {
        if (i === 5) continue;
        
        const tianGan = gong[i].tianPan;
        const diGan = gong[i].diPan;
        const key = tianGan + '+' + diGan;
        
        if (GE_JU[key]) {
            patterns.push({
                gong: i,
                pattern: GE_JU[key].name,
                type: GE_JU[key].type,
                desc: GE_JU[key].desc,
                detail: `${JIU_GONG[i]}：${tianGan}加${diGan}`
            });
        }
    }
    
    // 2. 分析三奇得使
    for (let i = 1; i <= 9; i++) {
        if (i === 5) continue;
        
        const tianGan = gong[i].tianPan;
        const men = gong[i].baMen;
        
        if (tianGan === '乙' && men === '开门') {
            patterns.push({
                gong: i,
                pattern: '乙奇得使',
                type: '大吉',
                desc: '乙奇临开门，大吉大利',
                detail: `${JIU_GONG[i]}：乙奇临开门`
            });
        }
        if (tianGan === '丙' && men === '休门') {
            patterns.push({
                gong: i,
                pattern: '丙奇得使',
                type: '大吉',
                desc: '丙奇临休门，万事如意',
                detail: `${JIU_GONG[i]}：丙奇临休门`
            });
        }
        if (tianGan === '丁' && men === '生门') {
            patterns.push({
                gong: i,
                pattern: '丁奇得使',
                type: '大吉',
                desc: '丁奇临生门，财源广进',
                detail: `${JIU_GONG[i]}：丁奇临生门`
            });
        }
    }
    
    // 3. 分析门迫
    for (let i = 1; i <= 9; i++) {
        if (i === 5) continue;
        
        const men = gong[i].baMen;
        if (men && MEN_PO[men] && MEN_PO[men].gong.includes(i)) {
            patterns.push({
                gong: i,
                pattern: '门迫',
                type: '凶',
                desc: MEN_PO[men].desc,
                detail: `${JIU_GONG[i]}：${men}受宫克`
            });
        }
    }
    
    // 4. 分析入墓
    const muGong = { '甲': 6, '乙': 6, '丙': 6, '丁': 6, '戊': 6, 
                    '己': 6, '庚': 2, '辛': 2, '壬': 4, '癸': 4 };
    for (let i = 1; i <= 9; i++) {
        if (i === 5) continue;
        
        const tianGan = gong[i].tianPan;
        if (muGong[tianGan] === i) {
            patterns.push({
                gong: i,
                pattern: '入墓',
                type: '凶',
                desc: `${tianGan}入墓于${JIU_GONG[i]}`,
                detail: `${JIU_GONG[i]}：${tianGan}入墓`
            });
        }
    }
    
    // 5. 分析空亡
    for (let i = 1; i <= 9; i++) {
        if (gong[i].kongWang) {
            patterns.push({
                gong: i,
                pattern: '空亡',
                type: '凶',
                desc: `${JIU_GONG[i]}落空亡`,
                detail: `${JIU_GONG[i]}：空亡`
            });
        }
    }
    
    // 6. 分析马星
    for (let i = 1; i <= 9; i++) {
        if (gong[i].maStar) {
            patterns.push({
                gong: i,
                pattern: '驿马',
                type: '吉',
                desc: `${JIU_GONG[i]}有驿马，主动、变化`,
                detail: `${JIU_GONG[i]}：驿马临`
            });
        }
    }
    
    return patterns;
}

/**
 * 获取吉凶汇总
 * @param {Array} patterns 格局列表
 * @returns {Object} 汇总信息
 */
function summarizePatterns(patterns) {
    const summary = {
        大吉: [],
        吉: [],
        中: [],
        凶: [],
        大凶: []
    };
    
    for (const p of patterns) {
        if (summary[p.type]) {
            summary[p.type].push(p);
        }
    }
    
    return summary;
}
