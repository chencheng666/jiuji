// 构建可从本地包加载的 TapTap 版本，不依赖 ES 模块与跨域网络。
import {build} from 'esbuild';
import {readFile,writeFile,copyFile,mkdir,readdir,mkdtemp,rm} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {dirname,join} from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const root=dirname(dirname(fileURLToPath(import.meta.url)));
const version=JSON.parse(await readFile(join(root,'package.json'),'utf8')).version;
const output=join(root,'artifacts',`taptap-v${version}`);
await mkdir(output,{recursive:true});
const scratch=await mkdtemp(join(output,'build-')),game=join(scratch,'Jiuji');
try{
 await mkdir(join(game,'assets'),{recursive:true});
 const result=await build({entryPoints:[join(root,'dist/play.js')],bundle:true,write:false,format:'iife',target:['chrome80','safari14.1'],minify:true,legalComments:'none',plugins:[{name:'taptap-offline',setup(b){
  b.onLoad({filter:/[\\/]dist[\\/]telemetry\.js$/},async args=>({contents:(await readFile(args.path,'utf8')).replace('const enabledHost=official||pages||desktop;','const enabledHost=false;'),loader:'js',resolveDir:dirname(args.path)}));
  b.onLoad({filter:/[\\/]dist[\\/]play\.js$/},async args=>{
   const privacy=' if(panel===\'privacy\')html=dialog(\'本地进度与隐私\',\'TAPTAP 离线运行版\',\'<p class="subtle">游戏不自动上传存档、设备信息或游玩时长。进度保存在当前设备，可从暂停菜单导出备份。更新或清理数据前，请先导出存档。</p>\');';
   const contents=(await readFile(args.path,'utf8')).replace('匿名玩法统计默认关闭，可在菜单随时选择。','TapTap 离线运行版，进度保存在当前设备。').replace(/ if\(panel==='privacy'\)[^\n]*/,privacy);
   return{contents,loader:'js',resolveDir:dirname(args.path)};
  });
 }}]});
 if(result.outputFiles.length!==1)throw Error('游戏必须只有一个完整脚本入口');
 await writeFile(join(game,'game.js'),result.outputFiles[0].text);
 let html=(await readFile(join(root,'dist/index.html'),'utf8')).replace(/<link\b[^>]+rel="modulepreload"[^>]*>/g,'').replace('<script type="module" src="./play.js"></script>','<script src="./game.js"></script>');
 if(/type="module"|modulepreload/.test(html))throw Error('离线包仍依赖模块加载');
 await writeFile(join(game,'index.html'),html);
 for(const name of ['boot.js','survival.css','favicon.svg','privacy.html'])await copyFile(join(root,'dist',name),join(game,name));
 for(const name of await readdir(join(root,'dist/assets')))if(name.endsWith('.svg'))await copyFile(join(root,'dist/assets',name),join(game,'assets',name));
 await copyFile(join(root,'LICENSE'),join(game,'LICENSE'));
 const zip=join(output,`Jiuji-v${version}-TapTap-H5.zip`);
 // 不覆盖历史包；同版本重建时仅替换本脚本生成的发行文件。
 await rm(zip,{force:true});execFileSync('/usr/bin/tar',['--format','zip','-cf',zip,'Jiuji'],{cwd:scratch,env:{...process.env,COPYFILE_DISABLE:'1'}});
 execFileSync('/usr/bin/unzip',['-t',zip],{stdio:'ignore'});
 const bytes=await readFile(zip),report={version,zip,sha256:createHash('sha256').update(bytes).digest('hex'),bytes:bytes.length,entry:'Jiuji/index.html',script:'classic-iife',target:['chrome80','safari14.1'],screenOrientation:0,networkRequired:false,deviceVerified:false};
 await writeFile(join(output,'构建报告.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
}finally{await rm(scratch,{recursive:true,force:true});}
