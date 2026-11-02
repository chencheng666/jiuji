#!/usr/bin/env python3
"""部署九级独立静态路径，保留同服务器其他服务并支持失败回滚。"""
import argparse
import fcntl
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import tarfile
import time
import urllib.request

BASE = Path('/opt/jiuji')
EXT = Path('/www/server/panel/vhost/nginx/extension/www.daguojueqi.site/30-jiuji.conf')
SITE_CONF = Path('/www/server/panel/vhost/nginx/html_www.daguojueqi.site.conf')
GP_CONF = EXT.with_name('20-great-powers.conf')
NGINX = '/www/server/nginx/sbin/nginx'
ORIGIN = 'https://www.daguojueqi.site'
SERVICES = ['great-powers-domestic', 'great-powers-domestic-six']
CONFIG = '''# 九级独立静态路由；保留大国崛起、个人站和现有证书。
location = /jiuji { return 302 /jiuji/; }
location ^~ /jiuji/ {
    alias /opt/jiuji/current/;
    index index.html;
    autoindex off;
    add_header Cache-Control "no-cache" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Strict-Transport-Security "max-age=31536000" always;
}
'''


def run(*args):
    return subprocess.check_output(args, stderr=subprocess.STDOUT)


def digest(data):
    return hashlib.sha256(data).hexdigest()


def service_state():
    values = []
    for service, port in zip(SERVICES, [8088, 8089]):
        pid = run('systemctl', 'show', service, '-p', 'MainPID', '--value').decode().strip()
        with urllib.request.urlopen(f'http://127.0.0.1:{port}/api/health', timeout=5) as r:
            health = json.load(r)
        if pid == '0' or not health.get('ok'):
            raise RuntimeError('原游戏服务未通过预检，停止部署')
        values.append({'service': service, 'pid': pid, 'version': health['version'], 'build': health.get('build')})
    return values


def atomic_write(path, content):
    temp = path.with_name(path.name + '.jiuji-next')
    with temp.open('xb') as file:
        file.write(content)
    temp.chmod(0o644)
    os.replace(temp, path)


def switch(target):
    temp = BASE / 'current-next'
    if temp.exists() or temp.is_symlink():
        raise RuntimeError('发现未完成的版本切换，停止部署')
    temp.symlink_to(target)
    os.replace(temp, BASE / 'current')


def deploy(args):
    if os.geteuid() != 0 or not SITE_CONF.is_file() or not GP_CONF.is_file():
        raise RuntimeError('目标必须是已部署大国崛起的国内实例，且以管理员执行')
    if 'www.daguojueqi.site' not in SITE_CONF.read_text():
        raise RuntimeError('站点域名不匹配')
    archive = Path(args.archive).resolve()
    if not re.fullmatch(r'[a-f0-9]{64}', args.sha256) or digest(archive.read_bytes()) != args.sha256:
        raise RuntimeError('发布包 SHA256 校验失败')
    if not re.fullmatch(r'[A-Za-z0-9.-]+', args.release):
        raise RuntimeError('发布编号无效')
    BASE.mkdir(exist_ok=True)
    # 与大国崛起发布共用互斥锁，避免同机发布交叉进行。
    locks = [(Path('/opt/great-powers') / 'deploy.lock').open('a'), (BASE / 'deploy.lock').open('a')]
    for lock in locks:
        fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
    if shutil.disk_usage(BASE).free < 50_000_000:
        raise RuntimeError('服务器剩余空间不足')
    before = service_state()
    protected = {p: digest(p.read_bytes()) for p in [SITE_CONF, GP_CONF]}
    current = BASE / 'current'
    if current.exists() and not current.is_symlink():
        raise RuntimeError('当前目录不是受管理的链接，拒绝覆盖')
    previous = str(current.resolve()) if current.is_symlink() else None
    if previous and not previous.startswith(str(BASE / 'releases') + '/'):
        raise RuntimeError('旧版本目录不符合预期')
    if EXT.exists() and '九级独立静态路由' not in EXT.read_text():
        raise RuntimeError('发现未知同名路由，拒绝覆盖')
    old_config = EXT.read_bytes() if EXT.exists() else None
    release = BASE / 'releases' / args.release
    backup = BASE / 'backups' / args.release
    release.mkdir(parents=True)
    backup.mkdir(parents=True)
    for path in protected:
        shutil.copy2(path, backup / path.name)
    if old_config is not None:
        (backup / '30-jiuji.conf').write_bytes(old_config)
    (backup / 'previous.json').write_text(json.dumps({'previous': previous, 'had_config': old_config is not None}))
    with tarfile.open(archive) as package:
        for member in package.getmembers():
            path = Path(member.name)
            if path.is_absolute() or '..' in path.parts or not member.isfile() or not (member.name == 'manifest.json' or member.name.startswith('site/')):
                raise RuntimeError('发布包路径或类型不安全')
        package.extractall(release)
    manifest = json.loads((release / 'manifest.json').read_text())
    for name, sha in manifest.items():
        if Path(name).is_absolute() or '..' in Path(name).parts or digest((release / 'site' / name).read_bytes()) != sha:
            raise RuntimeError('发布文件校验失败：' + name)
    info = json.loads((release / 'site/version.json').read_text())
    for name in ['index.html', 'play.js', 'survival.js', 'chapters.js', 'world.js', 'survival.css', info['download']]:
        if name not in manifest:
            raise RuntimeError('缺少必要文件：' + name)
    changed = False
    config_changed = old_config != CONFIG.encode()
    try:
        switch(release / 'site')
        changed = True
        if config_changed:
            atomic_write(EXT, CONFIG.encode())
        run(NGINX, '-t')
        if config_changed:
            run(NGINX, '-s', 'reload')
        # 通过本机 HTTPS 虚拟主机验证路由与证书；允许旧工作进程短暂退出。
        for attempt in range(10):
            try:
                for name in ['index.html', 'play.js', 'chapters.js', 'assets/player.svg', 'version.json']:
                    body = run('curl', '-fsS', '--max-time', '5', '--resolve', 'www.daguojueqi.site:443:127.0.0.1', ORIGIN + '/jiuji/' + name)
                    if digest(body) != manifest[name]:
                        raise RuntimeError('线上文件与发布包不一致：' + name)
                break
            except (subprocess.CalledProcessError, RuntimeError):
                if attempt == 9:
                    raise
                time.sleep(1)
        after = service_state()
        if after != before or any(digest(p.read_bytes()) != h for p, h in protected.items()):
            raise RuntimeError('原站配置或服务状态发生变化，回退本次路由')
        report = {**info, 'url': ORIGIN + '/jiuji/', 'release': str(release), 'backup': str(backup),
                  'sha256': args.sha256, 'services_before': before, 'services_after': after, 'files': len(manifest), 'nginx_reloaded': config_changed}
        atomic_write(BASE / 'deployment.json', json.dumps(report, ensure_ascii=False, indent=2).encode())
        print(json.dumps(report, ensure_ascii=False), flush=True)
    except Exception:
        if changed:
            if previous:
                switch(previous)
            else:
                current.unlink()
            if config_changed:
                if old_config is not None:
                    atomic_write(EXT, old_config)
                elif EXT.exists():
                    EXT.unlink()
                run(NGINX, '-t')
                run(NGINX, '-s', 'reload')
        raise


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='部署九级至腾讯云独立路径')
    parser.add_argument('archive')
    parser.add_argument('sha256')
    parser.add_argument('release')
    deploy(parser.parse_args())
