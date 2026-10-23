// 九级主线配置。每一阶同时改变探索目标与可用能力。
export const LEVEL_NAMES=['','初醒','协同','觉醒','远航','同频','塑能','守序','信使','归一'];
export const LEVEL_ROMAN=['','Ⅰ','Ⅱ','Ⅲ','Ⅳ','Ⅴ','Ⅵ','Ⅶ','Ⅷ','Ⅸ'];
export const LEVEL_BENEFITS={1:'采集、合成、建造营地',2:'进入星陨高地，建造自动采矿机',3:'Q 闪步，开采陨星矿与观测遗迹',4:'R 归途传送，快速返回营地',5:'自动合成基础资源，采集光蕴',6:'消耗共鸣显化材料，减少重复采集',7:'饱食消耗减半，生命缓慢恢复',8:'自身持续发光，不再惧怕黑暗',9:'不再饥饿，选择守护或归源'};
export const EXTRA_ITEMS={star:{name:'陨星碎片',icon:'meteor'},prism:{name:'导能棱镜',icon:'crystal'},alloy:{name:'星铜合金',icon:'ingot'},essence:{name:'光蕴',icon:'lumen'},echo:{name:'记忆回响',icon:'trial'},salve:{name:'草药膏',icon:'flower',health:35},armor:{name:'藤编护甲',icon:'armor',durability:120}};
export const EXTRA_NODES={meteor:{name:'陨星矿',tool:'pickaxe',hp:4,time:.7,drop:{star:3,stone:1},eco:-.4,regrow:210,level:3},lumen:{name:'光蕴植株',hp:1,time:.9,drop:{essence:3},regrow:150,level:5},trial:{name:'遗迹试炼',hp:1,time:1,drop:{}}};
export const EXTRA_TECHS=[
 {id:'optics',name:'星光工程',branch:'matter',level:3,requires:['crystal'],cost:{insight:7,star:2},text:'解锁观星仪、导能棱镜与星铜合金。'},
 {id:'attunement',name:'心域感知',branch:'mind',level:3,requires:['ward'],cost:{insight:6,resonance:6},text:'听取潮汐回声，完成第一次遗迹共振。'},
 {id:'spatial',name:'空间折叠',branch:'matter',level:4,requires:['optics'],cost:{insight:8,prism:2},text:'建造折跃门。R 消耗共鸣返回最早营火。'},
 {id:'memory',name:'记忆接续',branch:'mind',level:4,requires:['attunement'],cost:{insight:7,resonance:7},text:'修复破碎的坐标，让遗迹的记忆重新连接。'},
 {id:'synthesis',name:'循环合成',branch:'matter',level:5,requires:['spatial'],cost:{insight:8,alloy:2},text:'自动合成站每 30 秒积累木材、石料、铜矿与浆果。'},
 {id:'symbiosis',name:'生命同频',branch:'mind',level:5,requires:['memory'],cost:{insight:7,essence:3,resonance:8},text:'在受伤林地附近亲手播种，修复生命循环。'},
 {id:'manifestation',name:'物质显化',branch:'matter',level:6,requires:['synthesis'],cost:{insight:9,prism:2},text:'建造塑能台，以共鸣显化基础材料。'},
 {id:'clarity',name:'意识分流',branch:'mind',level:6,requires:['symbiosis'],cost:{insight:8,essence:3,resonance:8},text:'稳定过载的矿脉。选择承担损耗或延长调谐。'},
 {id:'restoration',name:'生态织网',branch:'matter',level:7,requires:['manifestation'],cost:{insight:8,alloy:2},text:'生态花园持续修复生态并产生共鸣。'},
 {id:'custodian',name:'守护之约',branch:'mind',level:7,requires:['clarity'],cost:{insight:8,resonance:9},text:'倾听沉睡聚落，提供援助而保留其选择。'},
 {id:'chronicle',name:'时空档案',branch:'matter',level:8,requires:['restoration'],cost:{insight:9,prism:2},text:'建造记忆档案馆与归一星环，记录旅程的全部选择。'},
 {id:'messenger',name:'自由信使',branch:'mind',level:8,requires:['custodian'],cost:{insight:9,resonance:10},text:'回应最后的来访者，完成九级之前的最后试炼。'}
];
export const EXTRA_RECIPES=[
 {id:'salve',name:'草药膏',category:'survival',cost:{flower:2,grass:2},item:'salve',desc:'生命 +35。受伤后在背包中使用。'},
 {id:'armor',name:'藤编护甲',category:'tools',cost:{wood:4,grass:8},item:'armor',desc:'自动穿戴，减少 45% 夜影攻击伤害。耐久 120。'},
 {id:'chest',name:'营地储物箱',category:'camp',cost:{wood:6,grass:3},building:'chest',desc:'存入或取出材料。拆除前必须取空物品。'},
 {id:'prism',name:'导能棱镜',category:'materials',cost:{star:2,crystal:2},item:'prism',tech:'optics',station:'furnace',desc:'陨星与原晶的结晶，用于高阶设施。'},
 {id:'alloy',name:'星铜合金',category:'materials',cost:{ingot:2,star:1},item:'alloy',tech:'optics',station:'furnace',desc:'高强度材料；仍需要熔炉冶炼。'},
 {id:'observatory',name:'观星仪',category:'advanced',cost:{board:3,prism:2,alloy:2},building:'observatory',tech:'optics',level:3,desc:'三级晋升设施。完成潮汐回声试炼后开启远航。'},
 {id:'gate',name:'折跃门',category:'advanced',cost:{alloy:3,prism:2,stone:8},building:'gate',tech:'spatial',level:4,desc:'解锁归途传送，也是四级晋升设施。'},
 {id:'synthesizer',name:'自动合成站',category:'advanced',cost:{alloy:3,prism:2,essence:4},building:'synthesizer',tech:'synthesis',level:5,desc:'每 30 秒产出木材 5、石料 4、铜矿 3、浆果 4；靠近取出。'},
 {id:'forge',name:'塑能台',category:'advanced',cost:{alloy:3,prism:2,essence:5},building:'forge',tech:'manifestation',level:6,desc:'每次消耗 3 共鸣，显化一批基础材料。'},
 {id:'garden',name:'生态花园',category:'advanced',cost:{wood:6,seed:6,essence:4},building:'garden',tech:'restoration',level:7,desc:'每秒恢复 0.04 生态与 0.025 共鸣。三处不同区域构成生态织网。'},
 {id:'archive',name:'记忆档案馆',category:'advanced',cost:{alloy:3,prism:3,essence:6},building:'archive',tech:'chronicle',level:8,desc:'保存六处遗迹的选择，为最终晋升做好准备。'},
 {id:'ascension',name:'归一星环',category:'advanced',cost:{prism:4,essence:8,echo:3},building:'ascension',tech:'chronicle',level:8,desc:'八级晋升设施。完成全部试炼，晋升九级并选择结局。'}
];
export const TRIALS=[
 {id:'tide',level:3,name:'潮汐回声',x:650,y:1530,tech:'attunement',intro:'海潮中有一段被遗忘的呼吸。停下来，让自己的节律与它相遇。',options:[{id:'listen',name:'静听潮汐',text:'消耗 3 共鸣，原地调谐 8 秒；移动会中断，可重新开始。',cost:{resonance:3},duration:8}]},
 {id:'coordinates',level:4,name:'破碎坐标',x:1690,y:650,tech:'memory',intro:'星门的另一端没有征服者，只有等待重连的旧记忆。',options:[{id:'repair',name:'重建坐标',text:'交付 2 铜锭与 1 棱镜，调谐 6 秒。',cost:{ingot:2,prism:1},duration:6}]},
 {id:'grove',level:5,name:'受伤的林地',x:850,y:960,tech:'symbiosis',intro:'这片土地不需要更多开采。请在遗迹 220 步以内种下三株青杉。',planted:3,options:[{id:'restore',name:'唤回林地',text:'附近三株亲手种下的青杉或树苗，消耗 2 光蕴，调谐 8 秒。',cost:{essence:2},duration:8}]},
 {id:'vein',level:6,name:'静默矿脉',x:2520,y:1580,tech:'clarity',intro:'过载的矿脉仍在渴求能量。你可以慢慢疏导，也可以承担材料损耗。',options:[{id:'patience',name:'耐心疏导',text:'消耗 5 共鸣，调谐 18 秒。',cost:{resonance:5},duration:18},{id:'stabilize',name:'重建稳定器',text:'消耗 3 合金，调谐 5 秒。',cost:{alloy:3},duration:5}]},
 {id:'village',level:7,name:'沉睡聚落',x:1910,y:2190,tech:'custodian',intro:'陌生的聚落不愿接受你的统治。它们请求渡过缺粮的季节，也希望保留自己的生活。',options:[{id:'supply',name:'提供食物',text:'留下 8 浆果和 4 种子，调谐 6 秒；帮助他们继续自己的生活。',cost:{berry:8,seed:4},duration:6},{id:'teach',name:'分享种植知识',text:'留下 8 种子和 5 共鸣，调谐 10 秒；由他们决定何时开始。',cost:{seed:8,resonance:5},duration:10}]},
 {id:'visitor',level:8,name:'最后的来访者',x:2830,y:730,tech:'messenger',intro:'来访者问：如果你能替所有人选择更好的未来，为什么还要等待他们自己醒来？',options:[{id:'guide',name:'分享答案，保留选择',text:'消耗 8 共鸣，调谐 8 秒。把你的经历作为一种可能。',cost:{resonance:8},duration:8},{id:'listen',name:'先听完他的故事',text:'消耗 4 共鸣与 3 光蕴，调谐 12 秒。让答案在对话中生长。',cost:{resonance:4,essence:3},duration:12}]}
];
export const CHAPTERS={
 3:{target:4,station:'observatory',tech:['optics','attunement'],trial:'tide',cost:8,eco:60,title:'让星光有一个落点',text:'调查西岸潮汐回声，建造观星仪，晋升远航。'},
 4:{target:5,station:'gate',tech:['spatial','memory'],trial:'coordinates',cost:10,eco:60,title:'走过距离，接续记忆',text:'修复北方破碎坐标，在折跃门晋升同频。'},
 5:{target:6,station:'synthesizer',tech:['synthesis','symbiosis'],trial:'grove',cost:12,eco:65,title:'让创造形成循环',text:'修复西北林地，建造自动合成站，晋升塑能。'},
 6:{target:7,station:'forge',tech:['manifestation','clarity'],trial:'vein',cost:14,eco:70,title:'力量也需要耐心',text:'稳定东岸静默矿脉，在塑能台晋升守序。'},
 7:{target:8,station:'garden',tech:['restoration','custodian'],trial:'village',cost:16,eco:75,title:'把守护留在土地上',text:'援助南方聚落，在三个不同区域建设生态花园，晋升信使。'},
 8:{target:9,station:'ascension',tech:['chronicle','messenger'],trial:'visitor',cost:20,eco:80,title:'最后一道门，不是边界',text:'回应高地来访者，建造档案馆与归一星环，迈入九级。'}
};
