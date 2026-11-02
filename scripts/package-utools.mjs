import {build} from 'esbuild';
import {readFile,writeFile,copyFile,mkdir,readdir,stat,rm} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {dirname,join} from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const root=dirname(dirname(fileURLToPath(import.meta.url))),version=JSON.parse(await readFile(join(root,'package.json'),'utf8')).version;
const parent=join(root,'releases/utools'),out=join(parent,'饥荒升级版-九级');
// 仅清理本脚本专用构建目录，不触碰网页版本、存档或其他插件。
await rm(out,{recursive:true,force:true});await mkdir(join(out,'assets'),{recursive:true});
const privacy=" if(panel==='privacy')html=dialog('本地离线版隐私说明','由你掌握进度','<p class=\"subtle\">本插件在本机运行，不自动联网或上传存档、设备、昵称与游玩时长。导入的备份只在本机使用。<br>更新、卸载或清理数据前，请先导出存档。网页版与 uTools 的进度可手动导出、导入。</p><button class=\"primary\" data-do=\"close\">返回旅程</button>');";
const result=await build({entryPoints:[join(root,'dist/play.js')],bundle:true,write:false,format:'iife',target:'chrome120',minify:true,legalComments:'none',plugins:[{name:'jiuji-utools-offline',setup(b){
 b.onLoad({filter:/[\\/]dist[\\/]play\.js$/},async args=>{
  let code=await readFile(args.path,'utf8');
  if(!code.includes('匿名玩法统计默认关闭，可在菜单随时选择。')||!code.includes("if(panel==='privacy')"))throw Error('游戏入口已变化，需要重新核对离线隐私文案');
  code=code.replace('匿名玩法统计默认关闭，可在菜单随时选择。','uTools 本地离线版。更新前请导出存档备份。').replace(/ if\(panel==='privacy'\)[^\n]*/,privacy);
  code=code.replaceAll('隐私与统计','离线隐私说明');
  code=code.replace('电脑和手机可直接玩网页版。','此版本为 uTools 桌面离线版。').replace('（目前桌面安装包为 Linux / 统信；联机仍在规划中）。','。网页版可在手机体验，联机仍在规划中。');
  code=code.replace('<a href="https://github.com/chencheng666/jiuji/releases" target="_blank" rel="noopener">查看开源发行与安装包</a>','回到 uTools 应用入口查看开源发行与更新');
  return{contents:code,loader:'js',resolveDir:dirname(args.path)};
 });
 b.onLoad({filter:/[\\/]dist[\\/]telemetry\.js$/},async args=>{
  let code=await readFile(args.path,'utf8');if(!code.includes('const enabledHost=official||pages||desktop;'))throw Error('统计入口已变化，停止离线打包');
  code=code.replace('const enabledHost=official||pages||desktop;','const enabledHost=false;');return{contents:code,loader:'js',resolveDir:dirname(args.path)};
 });
}}]});
if(result.outputFiles.length!==1)throw Error('离线游戏必须只有一个完整 JavaScript 入口');
let html=await readFile(join(root,'dist/index.html'),'utf8'),css=await readFile(join(root,'dist/survival.css'),'utf8');
html=html.replace(/<link\b[^>]+rel="(?:stylesheet|modulepreload)"[^>]*>/g,'').replace('<script src="./boot.js"></script>','').replace('<script type="module" src="./play.js"></script>',()=>'<script>'+result.outputFiles[0].text.replace(/<\/script/gi,'<\\/script')+'</script>');
const policy="default-src 'self' data: blob:; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; media-src 'self' blob:; connect-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'; frame-src 'none'";
html=html.replace('<head>','<head><meta name="jiuji-runtime" content="utools"><meta http-equiv="Content-Security-Policy" content="'+policy+'"><style>'+css.replace(/<\/style/gi,'<\\/style')+'</style>');
if(/<script\b[^>]+src=/.test(html)||/type="module"/.test(html))throw Error('游戏仍然依赖外置脚本或文件模块加载');
await writeFile(join(out,'game.html'),html);
for(const name of await readdir(join(root,'dist/assets')))if(name.endsWith('.svg'))await copyFile(join(root,'dist/assets',name),join(out,'assets',name));
for(const name of ['plugin.json','index.html','launcher.js','privacy.html','使用说明.txt'])await copyFile(join(root,'packaging/utools',name),join(out,name));
await copyFile(join(root,'src-tauri/icons/128x128@2x.png'),join(out,'logo.png'));
await copyFile(join(root,'dist/favicon.svg'),join(out,'favicon.svg'));
await copyFile(join(root,'LICENSE'),join(out,'LICENSE'));
const manifest={};async function collect(dir,prefix=''){for(const name of (await readdir(dir)).sort()){const file=join(dir,name),key=prefix+name;if((await stat(file)).isDirectory())await collect(file,key+'/');else manifest[key]=createHash('sha256').update(await readFile(file)).digest('hex');}}
await collect(out);await writeFile(join(out,'文件摘要.json'),JSON.stringify(manifest,null,2));
const zip=join(parent,`Jiuji-utools-v${version}-目录备份.zip`);await rm(zip,{force:true});execFileSync('/usr/bin/tar',['--format','zip','-cf',zip,'饥荒升级版-九级'],{cwd:parent,env:{...process.env,COPYFILE_DISABLE:'1'}});execFileSync('/usr/bin/unzip',['-t',zip],{stdio:'ignore'});
const bytes=(await stat(zip)).size;if(bytes>=19_500_000)throw Error('构建包超出平台 20MB 限制的预留预算');
const report={name:'饥荒升级版-九级',version,directory:out,plugin:join(out,'plugin.json'),zip,bytes,sha256:createHash('sha256').update(await readFile(zip)).digest('hex'),sourceCommit:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),files:Object.keys(manifest).length,offlineGame:true,automaticTelemetry:false,gameNodeIntegration:false,preload:false,packageType:'开发导入目录备份；正式UPXS由uTools开发者工具生成',nativeValidated:false,submitted:false};
await writeFile(join(parent,'构建报告.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
