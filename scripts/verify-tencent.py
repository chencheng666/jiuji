#!/usr/bin/env python3
"""逐文件核对公网版本，完整下载运行包并复核同机原有入口。"""
import argparse
import concurrent.futures
import hashlib
import io
import json
from pathlib import Path
import subprocess
import tarfile
import time
import zipfile

ROOT = Path(__file__).resolve().parents[1]
ORIGIN = 'https://www.daguojueqi.site'
parser=argparse.ArgumentParser(description='核验指定发布包对应的公网文件')
parser.add_argument('--package',type=Path,default=ROOT/'artifacts/tencent-package.json')
parser.add_argument('--origin',default=ORIGIN)
parser.add_argument('--prefix',default='/jiuji')
parser.add_argument('--skip-protected',action='store_true')
parser.add_argument('--output',type=Path,default=ROOT/'artifacts/tencent-online-verification.json')
args=parser.parse_args();ORIGIN=args.origin.rstrip('/')
package = json.loads(args.package.read_text())
with tarfile.open(package['archive']) as archive:
    manifest = json.load(archive.extractfile('manifest.json'))


def fetch(path):
    return subprocess.check_output(['curl', '-fsSL', '--max-time', '15', '--retry', '2',
                                    '--retry-all-errors', '--retry-delay', '1', ORIGIN + path])


def verify(item):
    name, expected = item
    data = fetch(args.prefix + '/' + name)
    actual = hashlib.sha256(data).hexdigest()
    if actual != expected:
        raise RuntimeError('公网文件不匹配：' + name)
    if name.endswith('.zip'):
        with zipfile.ZipFile(io.BytesIO(data)) as archive:
            if archive.testzip() is not None:
                raise RuntimeError('运行包完整性检查失败')
        (ROOT / 'artifacts/tencent-online-download.zip').write_bytes(data)
    return {'path': name, 'bytes': len(data), 'sha256': actual}


with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
    files = list(pool.map(verify, manifest.items()))
version = json.loads(fetch(args.prefix + '/version.json'))
if version['commit'] != package['commit']:
    raise RuntimeError('线上提交不符')
routes = []
for path in ([] if args.skip_protected else ['/', '/play/', '/candidate/', '/downloads/', '/resume/', '/api/health', '/candidate/api/health', '/jiuji']):
    body = fetch(path)
    routes.append({'path': path, 'ok': True, 'health': json.loads(body) if '/api/health' in path else None})
missing = subprocess.check_output(['curl', '-sS', '--max-time', '15', '-o', '/dev/null', '-w', '%{http_code}',
                                   ORIGIN + args.prefix + '/missing-file.js'], text=True)
if missing != '404':
    raise RuntimeError('不存在的文件没有正确返回 404')
result = {'verified': True, 'version': version, 'files': files, 'routes': routes,
          'missing_file_status': 404, 'checked_at': time.strftime('%Y-%m-%dT%H:%M:%S%z')}
args.output.write_text(json.dumps(result, ensure_ascii=False, indent=2))
print(json.dumps({'verified': True, 'files': len(files), 'version': version, 'routes': routes}, ensure_ascii=False, indent=2))
