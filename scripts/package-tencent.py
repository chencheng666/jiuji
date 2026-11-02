#!/usr/bin/env python3
"""打包腾讯云静态站点，附带版本清单与可完整下载的本地运行包。"""
import hashlib
import io
import json
from pathlib import Path
import subprocess
import tarfile
import zipfile

ROOT = Path(__file__).resolve().parents[1]
version = json.loads((ROOT / 'package.json').read_text())['version']
commit = subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=ROOT, text=True).strip()
modified_at = int(subprocess.check_output(['git', 'show', '-s', '--format=%ct', 'HEAD'], cwd=ROOT, text=True))
output = ROOT / 'artifacts' / 'tencent'
output.mkdir(parents=True, exist_ok=True)
bundle = io.BytesIO()
with zipfile.ZipFile(bundle, 'w', zipfile.ZIP_DEFLATED) as archive:
    for name in ['dist', 'scripts/server.mjs', 'package.json', 'README.md']:
        source = ROOT / name
        for file in sorted(source.rglob('*')) if source.is_dir() else [source]:
            if file.is_file() and file.name != '.DS_Store':
                archive.writestr('九级/' + str(file.relative_to(ROOT)), file.read_bytes())
files = {str(p.relative_to(ROOT / 'dist')): p.read_bytes()
         for p in sorted((ROOT / 'dist').rglob('*')) if p.is_file() and p.name != '.DS_Store'}
download = f'downloads/Jiuji-v{version}.zip'
files[download] = bundle.getvalue()
metadata = {'name': '九级', 'version': version, 'commit': commit,
            'download': download, 'download_sha256': hashlib.sha256(files[download]).hexdigest()}
files['version.json'] = json.dumps(metadata, ensure_ascii=False, indent=2).encode()
manifest = {name: hashlib.sha256(data).hexdigest() for name, data in files.items()}
path = output / f'Jiuji-v{version}-{commit[:7]}.tar.gz'
with tarfile.open(path, 'w:gz') as archive:
    for name, data in [('manifest.json', json.dumps(manifest).encode()), *[('site/' + n, d) for n, d in files.items()]]:
        info = tarfile.TarInfo(name)
        info.size = len(data)
        info.mode = 0o644
        info.mtime = modified_at
        archive.addfile(info, io.BytesIO(data))
print(json.dumps({'archive': str(path), 'sha256': hashlib.sha256(path.read_bytes()).hexdigest(),
                  'files': len(files), **metadata}, ensure_ascii=False, indent=2))
