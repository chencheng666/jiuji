import test from 'node:test';
import assert from 'node:assert/strict';
import {bindSelectionGuard} from '../dist/selection-guard.js';
test('长按摇杆、按钮和游戏文字不会选字或弹菜单，不截断移动事件',()=>{const handlers=new Map();bindSelectionGuard({addEventListener:(name,fn)=>handlers.set(name,fn)});let prevented=0;for(const name of['selectstart','contextmenu','dragstart'])handlers.get(name)({target:{closest:()=>null},preventDefault:()=>prevented++});handlers.get('keydown')({ctrlKey:true,code:'KeyA',target:{closest:()=>null},preventDefault:()=>prevented++});assert.equal(prevented,4);assert.equal(handlers.has('pointermove'),false);assert.equal(handlers.has('pointerup'),false);});
test('种子、文本框保留选字与全选编辑，不让保护层破坏输入',()=>{const handlers=new Map();bindSelectionGuard({addEventListener:(name,fn)=>handlers.set(name,fn)});for(const name of['selectstart','contextmenu','dragstart','keydown'])handlers.get(name)({ctrlKey:true,code:'KeyA',target:{closest:()=>({tagName:'INPUT'})},preventDefault:()=>assert.fail('输入框应保留编辑')});});
