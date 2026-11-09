// 使用已确认的历史提交重建同一游戏版本，联网修复不夹带新版本玩法。
import {build} from 'esbuild';
import {readFile,writeFile,copyFile,mkdir,readdir,mkdtemp,rm} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {dirname,join} from 'node:path';
import {parseArgs} from 'node:util';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {offlineTelemetry,offlineEntry,offlineHtml,offlinePrivacy,auditOfflineFiles} from './offline-package.mjs';
const root=dirname(dirname(fileURLToPath(import.meta.url)));
const {values}=parseArgs({options:{'source-ref':{type:'string'},'output-tag':{type:'string',default:'offline-r1'}}});
if(!/^[a-zA-Z0-9-]+$/.test(values['output-tag']))throw Error('构建标识只能使用字母、数字和连字符');
const git=(...args)=>execFileSync('git',args,{cwd:root,encoding:'utf8'}).trim();
const gameSourceCommit=git('rev-parse','--verify',(values['source-ref']||'HEAD')+'^{commit}');
await mkdir(join(root,'artifacts'),{recursive:true});
const scratch=await mkdtemp(join(root,'artifacts','taptap-build-')),game=join(scratch,'Jiuji');
let source=root;
try{
 if(values['source-ref']){
  source=join(scratch,'source');await mkdir(source);
  const archive=execFileSync('git',['archive',gameSourceCommit],{cwd:root,maxBuffer:128*1024*1024});
  execFileSync('/usr/bin/tar',['-xf','-','-C',source],{input:archive});
 }
 const version=JSON.parse(await readFile(join(source,'package.json'),'utf8')).version;
 const output=join(root,'artifacts',`taptap-v${version}-${values['output-tag']}`);
 await mkdir(output,{recursive:true});await mkdir(join(game,'assets'),{recursive:true});
 const result=await build({entryPoints:[join(source,'dist/play.js')],bundle:true,write:false,format:'iife',target:['chrome80','safari14.1'],minify:true,legalComments:'none',plugins:[{name:'taptap-offline',setup(b){
  b.onLoad({filter:/[\\/]dist[\\/]telemetry\.js$/},()=>({contents:offlineTelemetry,loader:'js'}));
  b.onLoad({filter:/[\\/]dist[\\/]play\.js$/},async args=>({contents:offlineEntry(await readFile(args.path,'utf8')),loader:'js',resolveDir:dirname(args.path)}));
 }}]});
 if(result.outputFiles.length!==1)throw Error('游戏必须只有一个完整脚本入口');
 await writeFile(join(game,'game.js'),result.outputFiles[0].text);
 const html=offlineHtml(await readFile(join(source,'dist/index.html'),'utf8'));
 await writeFile(join(game,'index.html'),html);await writeFile(join(game,'privacy.html'),offlinePrivacy);
 const styles=[...html.matchAll(/<link\b[^>]*rel="stylesheet"[^>]*href="\.\/([^"/]+)"[^>]*>/g)].map(m=>m[1]);
 if(!styles.length)throw Error('未找到本地样式，停止打包');
 for(const name of ['boot.js','favicon.svg',...styles])await copyFile(join(source,'dist',name),join(game,name));
 for(const name of await readdir(join(source,'dist/assets')))if(/\.(svg|png|webp)$/.test(name))await copyFile(join(source,'dist/assets',name),join(game,'assets',name));
 await copyFile(join(source,'LICENSE'),join(game,'LICENSE'));
 const files=[];
 async function collect(dir,prefix=''){for(const item of await readdir(dir,{withFileTypes:true})){const path=join(dir,item.name),name=prefix+item.name;if(item.isDirectory())await collect(path,name+'/');else if(/\.(js|html|css|svg)$/.test(name))files.push({name,text:await readFile(path,'utf8')});}}
 await collect(game);
 const findings=auditOfflineFiles(files);
 await writeFile(join(output,'联网能力静态检查.json'),JSON.stringify({files:files.length,findings},null,2));
 if(findings.length)throw Error('发行文件仍含联网能力或外部地址：'+JSON.stringify(findings));
 const zip=join(output,`Jiuji-v${version}-TapTap-H5-${values['output-tag']}.zip`);
 // 保留旧发行包，只替换独立修订目录中的本次候选。
 await rm(zip,{force:true});execFileSync('/usr/bin/tar',['--format','zip','-cf',zip,'Jiuji'],{cwd:scratch,env:{...process.env,COPYFILE_DISABLE:'1'}});
 execFileSync('/usr/bin/unzip',['-t',zip],{stdio:'ignore'});
 const bytes=await readFile(zip),report={version,zip,sha256:createHash('sha256').update(bytes).digest('hex'),bytes:bytes.length,entry:'Jiuji/index.html',script:'classic-iife',target:['chrome80','safari14.1'],screenOrientation:0,networkRequired:false,networkImplementationRemoved:true,externalLinksRemoved:true,staticAuditPassed:true,gameSourceCommit,gameSourceDirty:values['source-ref']?false:!!git('status','--porcelain','--','dist','package.json'),packagingSourceCommit:git('rev-parse','HEAD'),packagingSourceDirty:!!git('status','--porcelain','--','scripts/package-taptap.mjs','scripts/offline-package.mjs'),deviceVerified:false,platformReviewed:false};
 await writeFile(join(output,'构建报告.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
}finally{await rm(scratch,{recursive:true,force:true});}
