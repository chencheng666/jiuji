// 独立加载恢复按钮，兼容桌面壳的脚本安全策略。
document.querySelector('#reload-game')?.addEventListener('click',()=>location.reload());
