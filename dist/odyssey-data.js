// 2.0「星海回响」：地图、工业配方与文明里程碑共享这份配置。
export const NEW_REALMS = {
 mirror:{name:'镜沙遗境',subtitle:'让光找到它的归路',level:4,color:'#cbb887',temperature:8,tip:'镜面会反射光束。解开棱镜光路，取得镜砂，修复守卫或迎接它的挑战。'},
 orbit:{name:'星环残骸',subtitle:'星空也需要一处归途',level:6,color:'#8c91b8',temperature:-6,tip:'记录信号序列，接续失联的星环。能量武器需要晶能，记得携带晶能电池。'}
};
export const NEW_ITEMS = {
 mirrorsand:{name:'镜砂',icon:'mirrorsand'},starfiber:{name:'星纤维',icon:'starfiber'},phasecore:{name:'相位核心',icon:'phasecore'},accord:{name:'共建印记',icon:'accord'},
 powercell:{name:'晶能电池',icon:'powercell'},pulsebolt:{name:'脉冲箭',icon:'pulsebolt'},
 arcblade:{name:'弧光刃',icon:'arcblade',durability:180},prismBow:{name:'棱镜长弓',icon:'prismBow',durability:150},gravityHammer:{name:'引力锤',icon:'gravityHammer',durability:180}
};
export const NEW_NODES = {
 mirrorsand:{name:'镜砂结晶',tool:'pickaxe',hp:3,time:.7,drop:{mirrorsand:3,crystal:1},regrow:300,eco:-.4},
 starroot:{name:'星纤维丛',tool:'axe',hp:3,time:.7,drop:{starfiber:3,essence:1},regrow:260,eco:-.5},
 conduit:{name:'文明遗构',hp:1,time:0,drop:{}},wayfarer:{name:'远方营地',hp:1,time:0,drop:{}}
};
export const NEW_TECHS = [
 {id:'powergrid',name:'晶能供电',branch:'matter',level:2,requires:['drilling','observe'],cost:{insight:6,ingot:3,crystal:2},text:'建造风能塔，为采矿与营地设备供电。2.0 新旅程中的工业设备实际消耗晶能。'},
 {id:'relaynetwork',name:'折跃货运',branch:'matter',level:4,requires:['spatial','powergrid'],cost:{insight:8,prism:2,ingot:3},text:'每张地图建设一座折跃货栈。配置跨图货运，货物实际装载、运输和入库。'},
 {id:'automation',name:'生产逻辑',branch:'matter',level:5,requires:['synthesis','relaynetwork'],cost:{insight:9,mirrorsand:4,alloy:2},text:'建造自动装配台，设置配方、目标库存与优先级；接入货栈后可在远行期间继续运转。'},
 {id:'projection',name:'意识投影臂',branch:'mind',level:6,requires:['clarity','automation'],cost:{insight:9,starfiber:4,resonance:8},text:'展开三对投影臂，协助采集身边资源。消耗便携晶能、工具耐久并积累热量。'},
 {id:'ecolink',name:'群落共生网',branch:'mind',level:7,requires:['custodian','projection'],cost:{insight:8,starfiber:5,resonance:9},text:'跨地图修复生态。用堆肥照料花园，连接多个健康营地。'},
 {id:'signalweb',name:'星海信使',branch:'mind',level:8,requires:['messenger','ecolink'],cost:{insight:10,phasecore:1,resonance:10},text:'在六片地图征得营地同意后接续信号。守护者保留各自的选择。'}
];
export const NEW_RECIPES = [
 {id:'windmill',name:'风能塔',category:'advanced',cost:{wood:8,ingot:3,crystal:2},building:'windmill',tech:'powergrid',level:2,desc:'持续产生晶能。当前地图的工业耗电；接入货栈后，供电与工业可跨图运行。'},
 {id:'solararray',name:'星光集能板',category:'advanced',cost:{alloy:2,mirrorsand:4,crystal:4},building:'solararray',tech:'automation',level:5,desc:'白天产能高、夜晚产能低。与风能塔互补，增加营地晶能容量。'},
 {id:'relay',name:'折跃货栈',category:'advanced',cost:{stone:8,ingot:3,prism:1},building:'relay',tech:'relaynetwork',level:4,desc:'每图一座。储存材料、接续后台工业并配置跨地图运输；暂停与离线不推进。'},
 {id:'assembler',name:'自动装配台',category:'advanced',cost:{alloy:3,mirrorsand:4,board:4},building:'assembler',tech:'automation',level:5,desc:'设置生产配方、目标库存与设备优先级。材料先入库存，再按订单消耗，不会凭空产出。'},
 {id:'powercell',name:'晶能电池',category:'survival',cost:{crystal:2,essence:1},item:'powercell',tech:'synthesis',level:5,desc:'使用后便携晶能 +35。用于能量武器、投影臂与远行。'},
 {id:'pulsebolt',name:'脉冲箭束',category:'weapons',cost:{mirrorsand:1,twig:2},item:'pulsebolt',count:10,tech:'automation',level:5,desc:'制作 10 支脉冲箭，供棱镜长弓使用。'},
 {id:'arcblade',name:'弧光刃',category:'weapons',cost:{alloy:3,mirrorsand:4,phasecore:1},item:'arcblade',tech:'automation',level:5,desc:'中距离能量斩击，克制星环机械。每次消耗 1 便携晶能，晶能不足时可换回普通武器。'},
 {id:'prismBow',name:'棱镜长弓',category:'weapons',cost:{starfiber:5,mirrorsand:6,alloy:2},item:'prismBow',tech:'projection',level:6,desc:'远距离贯穿攻击。每次消耗 1 脉冲箭与 1 晶能。'},
 {id:'gravityHammer',name:'引力锤',category:'weapons',cost:{alloy:4,phasecore:1,starfiber:3},item:'gravityHammer',tech:'projection',level:6,desc:'近身范围重击，克制镜砂甲壳。消耗 2 晶能，重击有明显间隔。'}
];
export const AUTO_RECIPES = {
 board:{name:'木板装配',cost:{wood:3},drop:{board:1},seconds:8,power:.14},
 ingot:{name:'铜锭冶炼',cost:{ore:3,wood:2},drop:{ingot:1},seconds:12,power:.2},
 alloy:{name:'星铜合金',cost:{ingot:2,star:1},drop:{alloy:1},seconds:20,power:.23},
 prism:{name:'棱镜研磨',cost:{mirrorsand:3,crystal:1},drop:{prism:1},seconds:18,power:.2},
 ration:{name:'旅行口粮',cost:{cooked:1,seed:2},drop:{ration:1},seconds:10,power:.12},
 powercell:{name:'晶能电池',cost:{crystal:2,essence:1},drop:{powercell:2},seconds:25,power:.3}
};
export const NEW_WEAPONS = {
 arcblade:{damage:37,range:165,cooldown:.65,kind:'energy',power:1,text:'能量斩击；每次消耗 1 便携晶能'},
 prismBow:{damage:33,range:430,cooldown:.8,kind:'energy',ammo:'pulsebolt',power:1,text:'脉冲箭与晶能各消耗 1，适合精准打击'},
 gravityHammer:{damage:45,range:115,cooldown:1.2,kind:'blunt',area:125,power:2,text:'范围破甲，消耗 2 便携晶能'}
};
export const NEW_CREATURES = {
 sandskitter:{name:'镜甲沙行者',hp:95,damage:16,speed:88,range:200,windup:.9,cooldown:2.6,kind:'charge',weak:'blunt',armor:true,drop:{mirrorsand:3,shell:2},color:'#d0b97d',tip:'绕开锁定方向的冲锋，用钝击破开镜甲。'},
 prismMoth:{name:'棱光蛾',hp:68,damage:14,speed:65,range:290,windup:1.25,cooldown:3,kind:'beam',weak:'fire',drop:{mirrorsand:2,silk:2},color:'#d9cfac',tip:'直线光束会显示宽度，侧移离开光路。'},
 sentinel:{name:'失序哨兵',hp:145,damage:20,speed:40,range:160,windup:1.35,cooldown:3.1,kind:'ring',weak:'energy',armor:true,drop:{starfiber:2,relicpart:1},color:'#9ca6cd',tip:'环形冲击的中心和外侧安全，能量斩击能穿透护甲。'},
 voidRay:{name:'星尘游鳐',hp:90,damage:17,speed:100,range:240,windup:1,cooldown:2.8,kind:'charge',weak:'pierce',drop:{starfiber:3,essence:1},color:'#a9b4d7',tip:'看清冲锋锁定线，拉开距离使用弓矛。'},
 prismwarden:{name:'镜沙巨像',hp:380,damage:24,speed:40,range:250,windup:1.6,cooldown:3.4,kind:'slam',weak:'blunt',armor:true,boss:true,phases:['slam','beam','ring'],drop:{phasecore:2,mirrorsand:12},color:'#d5bd84',tip:'三阶段：破甲、光束、环形冲击。也可在解开光路后修复它的核心，和平取得同等主线进度。'},
 orbitwarden:{name:'失落星环',hp:400,damage:25,speed:55,range:280,windup:1.6,cooldown:3.5,kind:'ring',weak:'energy',boss:true,phases:['ring','charge','beam'],drop:{phasecore:2,starfiber:12},color:'#a8b5d7',tip:'三阶段会改变攻击方式；提前退出预警。也可修复信号、交付材料，让守卫恢复平静。'}
};
export const SITES = {
 home:{name:'初始能源站',kind:'switch',level:2,x:1510,y:1420,icon:'powercell',hint:'开关会同时改变自己与右侧的灯。让三盏灯全部亮起，接续营地能源。'},
 verdant:{name:'林海回声阵',kind:'switch',level:3,x:1840,y:1140,icon:'resonator',hint:'每次拨动会改变当前与下一盏灯。倾听灯火的连锁回应，让四盏灯全部亮起。'},
 cinder:{name:'烬岩配电枢',kind:'power',level:3,x:1810,y:1120,icon:'furnace',hint:'先为冷却泵与营地维生供电；采样矿机可以暂缓。总负荷不能超过 5。'},
 frost:{name:'雪线供暖站',kind:'power',level:7,x:1840,y:1120,icon:'campfire',hint:'旅人决定继续驻留。保持营地供暖和信号在线，采矿可等到风雪过去。总负荷不能超过 5。'},
 mirror:{name:'棱镜归光庭',kind:'beam',level:4,x:1810,y:1100,icon:'prismBow',hint:'光从左侧第二行进入，目标在右侧第三行。转动四面镜子，让光经过上方的中继点再抵达出口。'},
 orbit:{name:'星环记忆阵',kind:'memory',level:6,x:1820,y:1110,icon:'archive',hint:'先阅读星环留下的信号，再按相同顺序回应。出错只会重新开始，不消耗材料。'}
};
export const CONTACTS = {
 home:{name:'守火人的邀请',x:1450,y:1870,text:'守火人希望修缮原岛的道路。他接受建材，也欢迎你留下能延续生长的种子。',options:[{id:'craft',name:'修整旧路',cost:{board:2,stone:6},drop:{relicpart:1,crystal:3},text:'修好道路，带回一份古代构件与原晶。'},{id:'care',name:'留下春种',cost:{seed:5,berry:4},drop:{relicpart:1,flower:3},text:'由守火人决定播种位置，土地健康 +8。',health:8}]},
 verdant:{name:'林下的交换',x:1460,y:1870,text:'林下住民想自己守住采种地。你可以帮助修整工具，也可以分享食物与种子。',options:[{id:'craft',name:'修整采种工具',cost:{flint:4,wood:5},drop:{relicpart:2,silk:3},text:'修好工具；获得构件与蛛丝。'},{id:'care',name:'交换种植补给',cost:{berry:5,seed:4},drop:{relicpart:2,wildpod:2},text:'留下补给；取得种荚，土地健康 +8。',health:8}]},
 cinder:{name:'火山脚下的选择',x:1460,y:1870,text:'采样队决定留在荒原。让他们自己安排工作，你可以提供阀门建材或降温补给。',options:[{id:'craft',name:'修复冷却阀',cost:{ingot:2,stone:5},drop:{ember:6,relicpart:2},text:'修缮设备，换取余烬核与构件。'},{id:'care',name:'送来清凉补给',cost:{berry:7,flower:3},drop:{ember:4,relicpart:2},text:'帮助队员平稳度夏，土地健康 +10。',health:10}]},
 frost:{name:'雪线的约定',x:1460,y:1870,text:'雪线营地希望等同伴归来，不愿搬迁。请尊重他们的决定，选择一份过冬援助。',options:[{id:'craft',name:'修好屋顶',cost:{board:3,grass:6},drop:{frostshard:6,relicpart:2},text:'修好遮蔽风雪的屋顶。'},{id:'care',name:'留下食物与柴火',cost:{cooked:2,wood:6},drop:{frostshard:4,relicpart:2},text:'留下过冬补给，土地健康 +10。',health:10}]},
 mirror:{name:'镜沙旅人的请求',x:1460,y:1870,text:'旅人想重新接通光路，继续记录这片沙海。你可以提供棱镜，或以种子和荧光花修复镜庭。',options:[{id:'craft',name:'重制导光支架',cost:{ingot:3,crystal:4},drop:{mirrorsand:8,phasecore:1},text:'取得镜砂与相位核心，便于搭建后续工业。'},{id:'care',name:'照料镜庭绿洲',cost:{seed:6,flower:5},drop:{mirrorsand:6,phasecore:1},text:'复苏绿洲，取得核心；土地健康 +12。',health:12}]},
 orbit:{name:'失联研究员的回声',x:1460,y:1870,text:'研究员们希望修复信号，自己决定是否返航。你可以维修天线，或先送去维生与意识补给。',options:[{id:'craft',name:'修好接收天线',cost:{alloy:2,prism:1},drop:{starfiber:8,phasecore:1},text:'带回星纤维与核心。'},{id:'care',name:'留下维生补给',cost:{ration:2,flower:4},drop:{starfiber:6,phasecore:1},text:'让研究员自行安排后续旅程，土地健康 +12。',health:12}]}
};
export const GUARDIAN_REPAIR = {
 mirror:{kind:'prismwarden',cost:{mirrorsand:6,prism:2,flower:4},drop:{phasecore:2,mirrorsand:6}},
 orbit:{kind:'orbitwarden',cost:{starfiber:6,alloy:2,resonance:6},drop:{phasecore:2,starfiber:6}}
};
export const SIGNAL_COST = {home:{board:2,crystal:2},verdant:{seed:4,crystal:2},cinder:{ingot:2,crystal:2},frost:{wood:5,crystal:2},mirror:{mirrorsand:4,crystal:2},orbit:{starfiber:4,crystal:2}};
export const INITIAL_HEALTH = {home:75,verdant:60,cinder:38,frost:45,mirror:30,orbit:20};
