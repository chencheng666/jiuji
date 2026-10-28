// 四季与生存手册：仅依赖游戏状态，可独立验算与存档。
export const SEASONS = [
 {name:'新芽春',color:'#b9d3a0',temperature:22,tip:'温和的季节。准备工具、食物与营地。'},
 {name:'长昼夏',color:'#e5be78',temperature:36,tip:'白昼炎热。庇护所能遮阳，夜间适合远行。'},
 {name:'丰收秋',color:'#d49b68',temperature:18,tip:'风渐凉。准备毛皮披肩和过冬柴火。'},
 {name:'静雪冬',color:'#c0dfe7',temperature:2,tip:'远行注意体感温度。披肩、火炬和营火可以保暖。'}
];
export function season(s){const days=Math.floor(s.time/300),index=Math.floor(days/4)%4;return {...SEASONS[index],index,day:days%4+1,remaining:1200-s.time%1200,next:SEASONS[(index+1)%4].name};}
export function initSeasons(s){s.living??={temperature:25,claimed:[],fishCaught:0};}
export function stepSeasons(s,dt){
 const current=season(s),night=s.time%300>=230,covered=s.buildings.some(b=>b.type==='shelter'&&Math.hypot(b.x-s.player.x,b.y-s.player.y)<125),warm=s.buildings.some(b=>b.type==='campfire'&&b.fuel>0&&Math.hypot(b.x-s.player.x,b.y-s.player.y)<165);
 let target=current.temperature-(night?7:0)-s.wilderness.wetness*.05;
 if(s.inventory.coat&&target<20)target+=12;if(s.torchOn&&s.torchFuel>0)target+=5;if(covered)target= Math.max(14,Math.min(29,target));if(warm)target=27;if(s.level>=8)target=25;
 s.living.temperature+=Math.max(-dt*.3,Math.min(dt*.3,target-s.living.temperature));
 if(s.level<8&&(s.living.temperature<6||s.living.temperature>33)){s.player.hunger=Math.max(0,s.player.hunger-dt*.025);s.player.clarity=Math.max(0,s.player.clarity-dt*.035);}
}
export const HANDBOOK = [
 {id:'tools',name:'把双手变成工具',text:'制作石斧与石镐，开始采集木材和矿石。',goal:2,progress:s=>['axe','pickaxe'].filter(id=>s.crafted.includes(id)).length,reward:{berry:4}},
 {id:'camp',name:'第一处落脚地',text:'建造营火与庇护所，让荒野成为家。',goal:2,progress:s=>['campfire','shelter'].filter(id=>s.buildings.some(b=>b.type===id)).length,reward:{wood:5}},
 {id:'night',name:'看见第二个清晨',text:'平安度过第一个夜晚。可以在营火旁用睡袋休息。',goal:1,progress:s=>s.stats.nights,reward:{flower:3}},
 {id:'fish',name:'水边的耐心',text:'制作钓竿，在涟漪鱼塘钓到三次鱼。',goal:3,progress:s=>s.living.fishCaught,reward:{mushroom:4}},
 {id:'soup',name:'一锅属于自己的汤',text:'用烹饪锅炖煮并领取一份鱼汤。',goal:1,progress:s=>s.discoveries.includes('dish:fishsoup')?1:0,reward:{fur:2}},
 {id:'plant',name:'归还给土地',text:'种下六颗种子，修复你的家园。',goal:6,progress:s=>s.stats.planted,reward:{resonance:4}},
 {id:'explore',name:'岛屿的每一面',text:'踏足岛上五类区域，二级开放星陨高地。',goal:5,progress:s=>s.visited.length,reward:{insight:6}},
 {id:'ascend',name:'从荒野到星海',text:'成长到九级，完成文明旅程。',goal:9,progress:s=>s.level,reward:{resonance:10}}
];
export function validateLiving(s){const l=s.living;if(!l)return;if(typeof l!=='object'||!Number.isFinite(l.temperature)||l.temperature< -20||l.temperature>60||!Number.isInteger(l.fishCaught)||l.fishCaught<0||l.fishCaught>100000||!Array.isArray(l.claimed)||l.claimed.some(id=>!HANDBOOK.some(h=>h.id===id))||new Set(l.claimed).size!==l.claimed.length)throw new Error('四季与手册数据无效');}
