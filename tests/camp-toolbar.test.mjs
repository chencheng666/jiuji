import test from 'node:test';
import assert from 'node:assert/strict';
import {initCampToolbar} from '../dist/camp-toolbar.js';

function setup({compact = true, saved = null, blocked = false} = {}) {
  const attrs = {}, label = {}, tools = {}, classes = new Map(), events = {};
  const button = {setAttribute: (k, v) => attrs[k] = v, querySelector: () => label,
    addEventListener: (k, v) => events[k] = v};
  const root = {classList: {toggle: (k, v) => classes.set(k, v)}};
  const media = {matches: compact, addEventListener: (_, fn) => events.resize = fn};
  const data = new Map(saved === null ? [] : [['jiuji.ui.camp-toolbar', saved]]);
  const storage = {getItem: k => {if (blocked) throw Error('禁用存储'); return data.get(k);},
    setItem: (k, v) => {if (blocked) throw Error('禁用存储'); data.set(k, v);}};
  initCampToolbar({querySelector: s => ({'#camp-toolbar': root, '#camp-toolbar-toggle': button, '#camp-tools': tools})[s]},
    {matchMedia: () => media, localStorage: storage});
  return {attrs, tools, label, events, media, data};
}

test('手机默认收起，展开恢复全部入口并保存偏好，旋转不覆盖主动选择', () => {
  const ui = setup();
  assert.equal(ui.tools.hidden, true);
  assert.equal(ui.attrs['aria-expanded'], 'false');
  ui.events.click();
  assert.equal(ui.tools.hidden, false);
  assert.equal(ui.attrs['aria-label'], '收起营地菜单');
  assert.equal(ui.data.get('jiuji.ui.camp-toolbar'), 'expanded');
  ui.events.resize();
  assert.equal(ui.tools.hidden, false);
  assert.equal(setup({saved: 'expanded'}).tools.hidden, false);
});

test('未主动选择时随屏幕适配，损坏偏好与不可用存储均不阻断操作', () => {
  const ui = setup({compact: false, saved: '损坏值'});
  assert.equal(ui.tools.hidden, false);
  ui.media.matches = true;
  ui.events.resize();
  assert.equal(ui.tools.hidden, true);
  const privateUI = setup({blocked: true});
  assert.doesNotThrow(() => privateUI.events.click());
  assert.equal(privateUI.tools.hidden, false);
});
