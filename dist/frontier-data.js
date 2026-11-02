// 归途与新生：事件选择保留后续，生产订单只在所在地图运转。
export const FRONTIER_ITEMS={compost:{name:'腐殖堆肥',icon:'compost'},stardew:{name:'星露',icon:'stardew'},seal:{name:'守护印记',icon:'aidbeacon'}};
export const FRONTIER_RECIPES=[
 {id:'composter',name:'林地堆肥箱',category:'camp',level:2,cost:{wood:10,grass:8,stone:4},building:'composter',desc:'将种子与纤维做成堆肥。为育苗床追肥，或为营地土地补养。'},
 {id:'relaywork',name:'共振工坊',category:'advanced',level:4,cost:{board:4,ingot:4,crystal:6},building:'relaywork',desc:'四级经营：用共鸣凝结星露；五级后可修缮古代构件。可安排一批或三批订单。'},
 {id:'matterloom',name:'循环织造台',category:'advanced',level:6,cost:{board:5,alloy:3,stardew:2},building:'matterloom',desc:'六级经营：消耗星露与共鸣生成建材或林地补给。产能与意识储备需要权衡。'},
 {id:'aidbeacon',name:'远方守护台',category:'advanced',level:7,cost:{board:5,alloy:4,stardew:2},building:'aidbeacon',desc:'七级经营：回应已经接触的远方营地，选择物资援助。对方保留自己的生活方式。'}
];
export const JOBS={
 compost:{station:'composter',level:2,name:'林地堆肥',cost:{seed:3,grass:4},drop:{compost:2},seconds:45,text:'每批 45 秒，产出两份堆肥。'},
 stardew:{station:'relaywork',level:4,name:'凝结星露',cost:{flower:3,crystal:2,resonance:3},drop:{stardew:1},seconds:60,text:'每批 60 秒。共鸣也是晋升资源，请保留储备。'},
 restore:{station:'relaywork',level:5,name:'构件修缮',cost:{star:2,ingot:2,stardew:1},drop:{relicpart:2},seconds:75,text:'五级开放，让一次性探索之外也有构件来源。'},
 timber:{station:'matterloom',level:6,name:'织造建材',cost:{stardew:1,resonance:4},drop:{wood:20,stone:16},seconds:50,text:'为营地扩建提供建材，减少重复砍伐。'},
 flora:{station:'matterloom',level:6,name:'培育林地补给',cost:{stardew:1,resonance:4},drop:{grass:16,flower:8,seed:6},seconds:50,text:'给冥想、种植与远行提供另一种补给途径。'}
};
const option=(id,name,cost,drop,text,extra={})=>({id,name,cost,drop,text,...extra});
export const ENCOUNTERS=[
 {id:'verdant-grove',map:'verdant',name:'风倒后的幼林',icon:'nursery',x:1440,y:1840,text:'倒木压住新芽。一条路通向补种，另一条路可以让清理队更快到达。',options:[option('plant','留下种子',{seed:3},{wildpod:1},'生态 +5；60 秒有效游玩后，清理队送来 6 木材。',{eco:5,later:{wood:6},delay:60}),option('bridge','搭一条便道',{wood:6,grass:3},{relicpart:1},'先投入建材，直接取回一件古构件。')]},
 {id:'verdant-traveler',map:'verdant',name:'雨中的旅人',icon:'shelter',x:1990,y:1490,text:'旅人想等雨停再出发。你可以分出食物，也可以一起修好漏雨的棚顶。',options:[option('food','分出热食',{cooked:2},{silk:2},'90 秒有效游玩后，旅人回赠两枚林海种荚。',{later:{wildpod:2},delay:90}),option('roof','修缮棚顶',{board:2,grass:4},{relicpart:1},'消耗建材，现在取得旅人保管的构件。')]},
 {id:'verdant-bank',map:'verdant',name:'沉睡种子库',icon:'wildpod',x:2240,y:1940,text:'旧种子库只剩一格保存完好的种荚。留下营地收成，能让更多种子恢复活性。',options:[option('exchange','交换营地收成',{root:2,grain:2},{wildpod:3,seed:4},'用两种作物换回更多种荚与种子。'),option('record','只记录环境',{}, {},'取得 4 洞见；保留手中的物资。',{insight:4})]},
 {id:'cinder-vent',map:'cinder',name:'裂口旁的冷却槽',icon:'oldwell',x:1440,y:1840,text:'矿道冷却槽已经干裂。快速修复需要金属，耐心清理则要投入更多纤维。',options:[option('metal','修复金属阀',{ingot:2},{ember:4},'60 秒后可领取一件修复后的古代构件。',{later:{relicpart:1},delay:60}),option('filter','更换过滤层',{grass:8,stone:4},{ember:2},'即时取得少量余烬核，生态 +5。',{eco:5})]},
 {id:'cinder-caravan',map:'cinder',name:'迷路的采样队',icon:'fielddesk',x:1990,y:1490,text:'队员要自己决定是否继续行程。你能提供补给，也能留下工具，让他们从容作出选择。',options:[option('ration','留下远行补给',{graincake:1},{shell:2},'90 秒后收到队伍回赠的 3 陨星碎片。',{later:{star:3},delay:90}),option('tools','留下修理材料',{flint:4,wood:5},{ore:6},'当场交换铜矿；不替他们决定去留。')]},
 {id:'cinder-cache',map:'cinder',name:'余温里的旧信标',icon:'echoStone',x:2240,y:1940,text:'旧信标仍然接收远方回声。可以耗费原晶接续讯号，也可以只把记录带回。',options:[option('relay','接续讯号',{crystal:3},{relicpart:1},'消耗原晶，获得构件与 3 共鸣。',{resonance:3}),option('copy','抄录记录',{}, {},'取得 5 洞见，不动旧装置。',{insight:5})]},
 {id:'frost-shelter',map:'frost',name:'雪线下的营火',icon:'campfire',x:1440,y:1840,text:'远行者守着快熄灭的火。他们希望继续留在这里，等待自己的伙伴。',options:[option('fuel','分出干燥木材',{wood:8},{fur:2},'60 秒后，收到他们找到的一件古代构件。',{later:{relicpart:1},delay:60}),option('soup','分享热鱼汤',{fishsoup:1},{frostshard:4},'立即换回霜晶；体感温度向 25℃ 恢复一半。',{warmth:true})]},
 {id:'frost-garden',map:'frost',name:'冰层下的苗圃',icon:'nursery',x:1990,y:1490,text:'几株谷物还在结籽。可以用营地堆肥照料它们，也可以整理旁边遗落的工具。',options:[option('care','埋入堆肥',{compost:2},{grain:5,wildpod:2},'生态 +6，带回耐寒作物与种荚。',{eco:6}),option('tools','修好旧工具',{flint:4,grass:4},{relicpart:1},'带回一件古代构件，保留堆肥。')]},
 {id:'frost-echo',map:'frost',name:'风雪中的回声',icon:'echoStone',x:2240,y:1940,text:'石缝里留有光的痕迹。你可以留下荧光花，也可以点亮更稳定的星露。',options:[option('flower','留下荧光花',{flower:3},{echo:1},'取得记忆回响与 4 共鸣。',{resonance:4}),option('dew','留下星露',{stardew:1},{echo:2},'90 秒后可领取两件古代构件。',{later:{relicpart:2},delay:90})]}
];
export const AID_MAPS={verdant:{name:'林海播种约定',text:'为已经接触的林海营地准备下一季播种。',options:[option('seed','提供种子与堆肥',{seed:8,compost:2},{seal:1,stardew:1},'提供可持续的种植物资。'),option('crop','提供块根与谷物',{root:6,grain:4},{seal:1,relicpart:1},'先帮助他们安稳度过这一季。')]},cinder:{name:'烬岩修缮约定',text:'由采样队自行安排修缮，你提供所需材料。',options:[option('metal','提供金属与建材',{ingot:4,board:4},{seal:1,ember:8},'帮助修好已有的设施。'),option('dew','提供星露与纤维',{stardew:2,grass:12},{seal:1,relicpart:2},'提供另一种修缮方案。')]},frost:{name:'霜月过冬约定',text:'雪线营地决定继续驻留，请你为他们补足物资。',options:[option('food','提供冬季口粮',{graincake:2,wood:10},{seal:1,frostshard:8},'为过冬准备食物与柴火。'),option('warmth','提供星露与蛛丝',{stardew:2,silk:6},{seal:1,relicpart:2},'让营地修复自己的保暖设施。')]}};
export const IMPROVE_COST={nursery:{relicpart:2,compost:2},dryingrack:{relicpart:2,wood:8},composter:{relicpart:2,ingot:2},relaywork:{relicpart:3,stardew:2},matterloom:{relicpart:3,stardew:3}};
