#!/usr/bin/env python3
"""把網站合併成單一 HTML 檔。

用法：
  python3 tools/build.py            → dist/hk-tile-studio.html（離線版：已包含 three.js，雙擊即可開啟）
  python3 tools/build.py --artifact → dist/artifact.html（預覽版：three.js 由 CDN 載入，不含 <html>/<head>/<body>）

修改 js/content.js 等檔案之後，重新執行一次即可更新離線版。
"""
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CDN = 'https://cdn.jsdelivr.net/npm/three@0.149.0/build/three.min.js'


def read(rel):
    return (ROOT / rel).read_text(encoding='utf-8')


def inline_script(code):
    # 避免程式碼中的 "</script" 提早結束 <script> 標籤
    return '<script>\n' + code.replace('</script', '<\\/script') + '\n</script>'


def build(artifact=False):
    html = read('index.html')

    # CSS
    html = html.replace('<link rel="stylesheet" href="css/style.css">', '<style>\n' + read('css/style.css') + '\n</style>')

    # three.js
    three_block = re.search(r'<script src="lib/three\.min\.js"></script>\s*<script>window\.THREE \|\| document\.write\(.*?\);</script>', html, re.S)
    if not three_block:
        sys.exit('找不到 three.js 的 <script> 標籤')
    if artifact:
        html = html.replace(three_block.group(0), '<script src="' + CDN + '"></script>')
    else:
        html = html.replace(three_block.group(0), inline_script(read('lib/three.min.js')))

    # 其他 JS
    def repl(m):
        return inline_script(read(m.group(1)))
    html = re.sub(r'<script src="(js/[\w-]+\.js)"></script>', repl, html)

    if artifact:
        # 預覽平台會自行加上 <!doctype>、<html>、<head>、<body>
        title = re.search(r'<title>.*?</title>', html).group(0)
        html = re.sub(r'<!doctype html>\s*', '', html, flags=re.I)
        html = re.sub(r'</?html[^>]*>', '', html)
        html = re.sub(r'</?head>', '', html)
        html = re.sub(r'</?body>', '', html)
        html = re.sub(r'<meta charset="utf-8">\s*', '', html)
        html = re.sub(r'<meta name="viewport"[^>]*>\s*', '', html)
        html = html.replace(title, '', 1)
        html = title + '\n' + html.strip() + '\n'
        out = ROOT / 'dist' / 'artifact.html'
    else:
        out = ROOT / 'dist' / 'hk-tile-studio.html'

    out.parent.mkdir(exist_ok=True)
    out.write_text(html, encoding='utf-8')
    print(f'已輸出 {out.relative_to(ROOT)}（{out.stat().st_size / 1024:.0f} KB）')


if __name__ == '__main__':
    build(artifact='--artifact' in sys.argv)
