// 菜单偏好独立于旅程存档；切换横竖屏时保留玩家的主动选择。
export function initCampToolbar(doc, win) {
  const root = doc.querySelector('#camp-toolbar');
  const button = doc.querySelector('#camp-toolbar-toggle');
  const tools = doc.querySelector('#camp-tools');
  const compact = win.matchMedia('(max-width: 650px), (max-height: 560px)');
  const key = 'jiuji.ui.camp-toolbar';
  let preference = null;
  try {
    const saved = win.localStorage.getItem(key);
    if (saved === 'collapsed' || saved === 'expanded') preference = saved;
  } catch { /* 隐私模式下仍可展开和收起，只不保存偏好。 */ }
  let collapsed = preference ? preference === 'collapsed' : compact.matches;
  function render() {
    tools.hidden = collapsed;
    root.classList.toggle('is-collapsed', collapsed);
    button.setAttribute('aria-expanded', String(!collapsed));
    button.setAttribute('aria-label', collapsed ? '展开营地菜单' : '收起营地菜单');
    button.title = collapsed ? '展开营地菜单' : '收起营地菜单';
    button.querySelector('b').textContent = collapsed ? '营地' : '收起';
  }
  button.addEventListener('click', () => {
    collapsed = !collapsed;
    preference = collapsed ? 'collapsed' : 'expanded';
    try { win.localStorage.setItem(key, preference); } catch { /* 不影响当前操作。 */ }
    render();
  });
  const adapt = () => {
    if (preference !== null) return;
    collapsed = compact.matches;
    render();
  };
  if (compact.addEventListener) compact.addEventListener('change', adapt);
  else compact.addListener(adapt);
  render();
}
