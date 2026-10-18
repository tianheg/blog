#!/usr/bin/env python3
"""本地预览服务器：禁缓存 + 相册图片占位。

用法：/usr/bin/python3 scripts/org2site/preview-server.py [输出目录] [端口]

- 禁缓存：python -m http.server 不发 Cache-Control，浏览器会按 Last-Modified 做
  启发式缓存 —— 改了 CSS/HTML 刷新却看不到变化，很容易把"缓存问题"误判成
  "布局 bug"（踩过）。
- 相册占位：生产环境 /photos/t/<key> 与 /photos/h/<key> 由 Worker 从 R2 提供，
  本地预览必然 404。这里返回一张灰色占位 SVG，让 masonry 网格真实渲染出来，
  否则没法验收相册布局。
"""
import functools
import http.server
import socketserver
import sys
import urllib.parse

DEFAULT_ROOT = "/tmp/org-html"
DEFAULT_PORT = 8099

PLACEHOLDER = (
    '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450">'
    '<rect width="800" height="450" fill="#d9d3cd"/>'
    '<text x="400" y="228" font-family="sans-serif" font-size="22" fill="#6b6560"'
    ' text-anchor="middle">%s</text></svg>'
)


class Handler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()

    def do_GET(self):
        path = urllib.parse.urlparse(self.path).path
        if path.startswith(("/photos/t/", "/photos/h/")):   # 图片端点占位
            label = path.split("/", 3)[-1]
            body = (PLACEHOLDER % label).encode()
            self.send_response(200)
            self.send_header("Content-Type", "image/svg+xml; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return
        super().do_GET()

    def log_message(self, format, *args):   # 静默，别刷屏
        pass


def main(argv):
    root = argv[1] if len(argv) > 1 else DEFAULT_ROOT
    port = int(argv[2]) if len(argv) > 2 else DEFAULT_PORT
    socketserver.TCPServer.allow_reuse_address = True
    handler = functools.partial(Handler, directory=root)
    with socketserver.TCPServer(("0.0.0.0", port), handler) as httpd:
        print(f"preview: http://0.0.0.0:{port}/  root={root}", flush=True)
        httpd.serve_forever()


if __name__ == "__main__":
    main(sys.argv)
