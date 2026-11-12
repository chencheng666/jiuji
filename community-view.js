export function drawCommunityGround(c,s,visible){
 for(const b of s.buildings){if(b.type!=='trail'||!visible(b))continue;c.save();c.fillStyle='#b7b08c';c.strokeStyle='#6f795f';c.lineWidth=2;c.beginPath();c.ellipse(b.x,b.y,35,18,0,0,Math.PI*2);c.fill();c.stroke();c.fillStyle='#d4ca9f';for(let i=0;i<4;i++){const a=i*2.4+(b.x%7);c.beginPath();c.ellipse(b.x+Math.cos(a)*18,b.y+Math.sin(a)*8,6,3,a,0,Math.PI*2);c.fill();}c.restore();}
}
export function drawCommunityObject(view,c,s,n){
 if(n.type!=='outpost')return false;view.sprite(c,'outpost',n.x,n.y,130);c.textAlign='center';c.font='12px sans-serif';c.fillStyle='#f2dfab';c.fillText('远行前哨站',n.x,n.y-158);
 const e=s.community;if(e?.projects.supply.includes(s.expedition.current)){view.sprite(c,'chest',n.x+48,n.y+8,36);c.fillStyle='#ddc693';c.font='bold 12px sans-serif';c.fillText('✓',n.x+48,n.y-25);}
 if(e?.projects.beacon.includes(s.expedition.current)){c.fillStyle='#a7cec0';c.strokeStyle='#314b41';c.lineWidth=3;c.beginPath();c.moveTo(n.x-65,n.y+5);c.lineTo(n.x-72,n.y-42);c.lineTo(n.x-58,n.y-65);c.lineTo(n.x-44,n.y-40);c.lineTo(n.x-50,n.y+5);c.closePath();c.fill();c.stroke();c.font='bold 16px serif';c.fillStyle='#f3dca0';c.fillText('Ⅸ',n.x-58,n.y-23);}return true;
}
// 生活事务完成后留下院落陈设；这些是公共设施，不伪装成可取走的个人库存。
export function drawVillageContribution(c,s,id,x,y,scale=1){
 const stage=s.community?.requests[id]||0;if(!stage)return;c.save();c.translate(x,y);c.scale(scale,scale);c.lineWidth=3;c.strokeStyle='#314b3b';
 if(id==='bay'){
  c.fillStyle='#bb9e67';c.fillRect(-28,-12,48,17);c.strokeRect(-28,-12,48,17);c.fillStyle='#829b73';c.beginPath();c.moveTo(-38,-21);c.lineTo(0,-42);c.lineTo(35,-20);c.closePath();c.fill();c.stroke();c.beginPath();c.moveTo(-30,-20);c.lineTo(-30,7);c.moveTo(28,-20);c.lineTo(28,7);c.stroke();
 }else if(id==='ridge'){
  c.fillStyle='#b69b6b';c.fillRect(-30,-23,51,22);c.strokeRect(-30,-23,51,22);c.beginPath();c.moveTo(20,-19);c.lineTo(39,-31);c.stroke();c.fillStyle='#4d6354';for(const xx of[-20,14]){c.beginPath();c.arc(xx,3,8,0,7);c.fill();c.stroke();}
 }else{
  c.fillStyle='#9a855e';c.fillRect(-27,-14,54,19);c.strokeRect(-27,-14,54,19);c.fillStyle='#9ebf83';for(const xx of[-17,0,17]){c.beginPath();c.ellipse(xx,-21,4,10,xx*.02,0,7);c.fill();c.stroke();}
 }
 if(stage===2){c.fillStyle='#d8c28f';c.fillRect(29,-10,22,18);c.strokeRect(29,-10,22,18);c.strokeStyle='#7e7152';c.beginPath();c.moveTo(40,-10);c.lineTo(40,8);c.stroke();}c.restore();
}
