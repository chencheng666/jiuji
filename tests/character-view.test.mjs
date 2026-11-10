import test from 'node:test';
import assert from 'node:assert/strict';
import * as G from '../dist/survival.js';
import {playerSpriteName} from '../dist/character-view.js';
test('明确方向优先于旧 face 字段，朝上、朝下和侧身不再混用',()=>{const s=G.createGame();G.step(s,.1,{y:-1});assert.equal(playerSpriteName(s.player),'player-back');G.step(s,.1,{x:1});assert.equal(playerSpriteName(s.player),'player-right');G.step(s,.1,{y:1});assert.equal(playerSpriteName(s.player),'player');G.step(s,.1,{x:-1});assert.equal(playerSpriteName(s.player),'player-left');assert.equal(playerSpriteName({face:-1}),'player-back');});
test('采集时面向资源，避免身体还背向目标而工具挥向另一侧',()=>{const s=G.createGame(),n=s.nodes.find(n=>n.type==='twig');Object.assign(s.player,{x:n.x-50,y:n.y,direction:'left'});assert.ok(G.interact(s,n.id).ok);assert.equal(playerSpriteName(s.player),'player-right');});
