// 同一份离线资源分别供桌面安装包和可直接打开的 ZIP 使用。
import {build} from 'esbuild';
import {readFile,writeFile,mkdir,readdir,copyFile,rm} from 'node:fs/promises';
import {dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {offlineEntry,offlineHtml,offlinePrivacy,offlineTelemetry,auditOfflineFiles} from './offline-package.mjs';
const root=dirname(dirname(fileURLToPath(import.meta.url))),version=JSON.parse(await readFile(join(root,'package.json'),'utf8')).version;
const portable=join(root,'artifacts','portable-web'),desktop=join(root,'artifacts','desktop-web'),downloads=join(root,'artifacts','desktop-downloads');
await rm(portable,{recursive:true,force:true});await rm(desktop,{recursive:true,force:true});await mkdir(join(portable,'assets'),{recursive:true});await mkdir(desktop,{recursive:true});await mkdir(downloads,{recursive:true});
const result=await build({entryPoints:[join(root,'dist/play.js')],bundle:true,write:false,format:'iife',target:['chrome80','safari14.1'],minify:true,legalComments:'none',plugins:[{name:'desktop-offline',setup(b){b.onLoad({filter:/[\\/]dist[\\/]telemetry\.js$/},()=>({contents:offlineTelemetry,loader:'js'}));b.onLoad({filter:/[\\/]dist[\\/]play\.js$/},async args=>({contents:offlineEntry(await readFile(args.path,'utf8')).replaceAll('TapTap','九级').replaceAll('TAPTAP','九级'),loader:'js',resolveDir:dirname(args.path)}));}}]});
const html=offlineHtml(await readFile(join(root,'dist/index.html'),'utf8'));
await writeFile(join(portable,'index.html'),html);await writeFile(join(portable,'game.js'),result.outputFiles[0].text);await writeFile(join(portable,'privacy.html'),offlinePrivacy.replaceAll('TapTap','九级'));
const styles=[...html.matchAll(/<link\b[^>]*rel="stylesheet"[^>]*href="\.\/([^"/]+)"[^>]*>/g)].map(m=>m[1]);
for(const name of ['boot.js',...styles])await copyFile(join(root,'dist',name),join(portable,name));
for(const name of await readdir(join(root,'dist/assets')))if(/\.(svg|png|webp)$/.test(name))await copyFile(join(root,'dist/assets',name),join(portable,'assets',name));
await copyFile(join(root,'LICENSE'),join(portable,'LICENSE'));
await writeFile(join(portable,'使用说明.txt'),`《九级》${version} 离线版\n解压整个 Jiuji 文件夹后，用浏览器打开 index.html 即可游玩，不需要 Node.js 或联网。\n存档保存在当前浏览器；手机触屏、电脑键鼠均可操作。更换浏览器、位置或设备前，请先从暂停菜单导出存档。\n若浏览器限制本地文件存储，请使用桌面安装包，或先导出备份。\n作者公众号：数字机器莱西奥。MIT 开源。\n`);
const files=[];async function walk(dir,prefix=''){for(const e of await readdir(dir,{withFileTypes:true})){const path=join(dir,e.name),name=prefix+e.name;if(e.isDirectory())await walk(path,name+'/');else files.push({name,text:await readFile(path,'utf8')});}}await walk(portable);
const findings=auditOfflineFiles(files);if(findings.length)throw Error('离线资源含联网能力：'+JSON.stringify(findings));
// 桌面只额外允许 Tauri 本地 IPC，用于系统存档对话框；不开放互联网连接。
async function copyTree(from,to){await mkdir(to,{recursive:true});for(const e of await readdir(from,{withFileTypes:true})){if(e.isDirectory())await copyTree(join(from,e.name),join(to,e.name));else await copyFile(join(from,e.name),join(to,e.name));}}
await copyTree(portable,desktop);await writeFile(join(desktop,'index.html'),html.replace("connect-src 'none'","connect-src ipc: http://ipc.localhost"));
const zip=join(downloads,`Jiuji-v${version}-offline.zip`),python=process.platform==='win32'?'python':'python3';
execFileSync(python,['-c',"import sys,zipfile,pathlib\np=pathlib.Path(sys.argv[1])\nwith zipfile.ZipFile(sys.argv[2],'w',zipfile.ZIP_DEFLATED) as z:\n for f in sorted(p.rglob('*')):\n  if f.is_file(): z.write(f,'Jiuji/'+str(f.relative_to(p)))",portable,zip]);
const bytes=await readFile(zip),report={version,offline:true,staticAuditPassed:true,zip,bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex'),desktopIPCOnly:true,files:files.length};
await writeFile(join(downloads,'portable-report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
