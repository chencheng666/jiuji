export function beginnerAdvice(s){
 const tips=[];
 if(s.player.hunger<=40)tips.push({title:'先吃一餐，再出发',text:'饱食偏低时先准备食物。生存准备里可以查看行囊食物、附近浆果和换季建议。',action:'safety',label:'查看生存准备'});
 if(!s.crafted.includes('axe'))tips.push({title:'先完成一把石斧',text:'捡 2 树枝、2 燧石，再到合成里制作石斧。第一天不用理解所有科技。',category:'tools',label:'打开工具合成'});
 if(!s.buildings.some(b=>b.type==='campfire'))tips.push({title:'天黑前，留下一团火',text:'准备 5 木材、4 石料、2 纤维建营火。火炬适合走动，营火适合烹饪和休息。',category:'camp',label:'查看营地配方'});
 if(!s.settlements.villages.bay.met)tips.push({title:'去河湾认识新邻居',text:'居民会在住处附近劳作、散步和交谈。点任一居民或聚落标牌即可交谈，不用追着移动的人跑。',action:'villages',label:'查看聚落位置'});
 if(s.level>=2&&!s.robotics.robots.length)tips.push({title:'让第一台机械助手替你跑腿',text:'研究地脉采集、万物观察，再研究营地机械助手。组装后投入原晶充能，机器人会自行采集和返站。',action:'robots',label:'查看机械助手'});
 if(s.level>=2)tips.push({title:'远征先留一份补给',text:'带上食物和照明，先探索虫洞入口附近。看清怪物预警再行动，可以用诱饵避战。',action:'handbook',label:'查看生存手册'});
 tips.push({title:'忙不过来，就先暂停',text:'打开面板会暂停世界。手机可以收起营地菜单和荒野手记；更换设备前先从菜单导出存档。',action:'controls',label:'查看手机操作'});
 return tips.slice(0,3);
}
export function renderBeginnerAdvice(s){return '<section class="beginner-advice"><h3>现在最值得做的三件事</h3><div class="co-grid">'+beginnerAdvice(s).map(t=>`<article class="co-card"><h3>${t.title}</h3><p>${t.text}</p><button class="secondary" ${t.category?'data-open-category="'+t.category+'"':'data-do="'+t.action+'"'}>${t.label}</button></article>`).join('')+'</div></section>';}
