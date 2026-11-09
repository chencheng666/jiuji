import * as G from './survival.js';

// 引导读取真实条件，避免界面文案与研究、冥想规则各算一套。
export function growthStatus(s){
  const camp=s.buildings.filter(b=>b.type==='campfire').sort((a,b)=>G.distance(s.player,a)-G.distance(s.player,b))[0];
  const saplings=s.nodes.filter(n=>n.sapling);
  return{
    camp,
    meditationReason:G.meditationReason(s,camp),
    planted:Math.min(3,s.stats.planted),
    saplings:saplings.length,
    nextGrowth:saplings.length?Math.max(0,Math.ceil(Math.min(...saplings.map(n=>n.respawnAt))-s.time)):null,
    plantingPoint:G.plantingNearPlayer(s),
    requirements:G.advancementRequirements(s)
  };
}
