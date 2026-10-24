"""Mở Tank Lab và lưu log vào thư mục cố định, chỉ nhận kết nối trên máy này."""
import argparse
import json
import secrets
import threading
import webbrowser
from datetime import datetime
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit

THU_MUC_GAME = Path(__file__).resolve().parent
THU_MUC_LOG = Path(r'D:\Projects\tank-battle\LogTank')

class XuLy(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(THU_MUC_GAME), **kwargs)

    def tra_json(self, ma, du_lieu):
        noi_dung = json.dumps(du_lieu, ensure_ascii=False).encode('utf-8')
        self.send_response(ma)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Cache-Control', 'no-store')
        self.send_header('Content-Length', str(len(noi_dung)))
        self.end_headers()
        self.wfile.write(noi_dung)

    def dung_may(self):
        return self.headers.get('Host') == f'127.0.0.1:{self.server.server_port}'

    def do_GET(self):
        if not self.dung_may():
            self.tra_json(403, {'loi': 'Địa chỉ máy chủ không hợp lệ.'}); return
        if urlsplit(self.path).path == '/api/cau-hinh-log':
            self.tra_json(200, {'maBaoVe': self.server.ma_bao_ve, 'thuMuc': str(self.server.thu_muc_log)})
        elif self.path.split('?')[0] in ['/', '/index.html', '/style.css', '/game.js', '/nhip-nen.js', '/nhat-ky.js', '/tu-luu-log.js', '/vat-ly.js', '/ai.js', '/HUONG-DAN.md']:
            super().do_GET()
        else:
            self.send_error(404)

    def do_POST(self):
        dia_chi = f'http://127.0.0.1:{self.server.server_port}'
        if self.path != '/api/luu-log':
            self.tra_json(404, {'loi': 'Không có chức năng này.'}); return
        try:
            kich_thuoc = int(self.headers.get('Content-Length', '0'))
            if not 0 < kich_thuoc <= 50 * 1024 * 1024:
                self.tra_json(413, {'loi': 'Log phải nhỏ hơn 50 MB.'}); return
            if self.headers.get_content_type() != 'application/json':
                self.tra_json(415, {'loi': 'Cần dữ liệu JSON.'}); return
            noi_dung = self.rfile.read(kich_thuoc)
            if (not self.dung_may() or self.headers.get('Origin') != dia_chi or
                    self.headers.get('X-Tank-Token') != self.server.ma_bao_ve):
                self.tra_json(403, {'loi': 'Yêu cầu lưu không hợp lệ.'}); return
            log = json.loads(noi_dung)
            if (not isinstance(log, dict) or log.get('dinhDang') != 'tank-lab-log' or
                    log.get('phienBan') != 1 or not isinstance(log.get('xeCuoi'), list) or
                    not isinstance(log.get('dienBien'), list)):
                raise ValueError('Không đúng định dạng Tank Lab.')
            # Tên tệp do máy chủ tạo; không nhận đường dẫn do trang gửi lên.
            ten = 'tank-log-' + datetime.now().strftime('%Y%m%d-%H%M%S') + '-' + secrets.token_hex(6) + '.json'
            tep = self.server.thu_muc_log / ten
            with tep.open('xb') as f:
                f.write(noi_dung)
            self.tra_json(200, {'duongDan': str(tep)})
        except (ValueError, UnicodeError):
            self.tra_json(400, {'loi': 'Log JSON không hợp lệ.'})
        except OSError:
            self.tra_json(500, {'loi': 'Không ghi được vào thư mục LogTank. Kiểm tra ổ đĩa, quyền ghi và dung lượng trống.'})

    def log_message(self, *_):
        pass

def tao_may_chu(thu_muc_log=THU_MUC_LOG, cong=0):
    thu_muc_log = Path(thu_muc_log).resolve()
    thu_muc_log.mkdir(parents=True, exist_ok=True)
    may = ThreadingHTTPServer(('127.0.0.1', cong), XuLy)
    may.thu_muc_log = thu_muc_log
    may.ma_bao_ve = secrets.token_urlsafe(32)
    return may

if __name__ == '__main__':
    tham_so = argparse.ArgumentParser()
    tham_so.add_argument('--log-dir', type=Path, default=THU_MUC_LOG)
    tham_so.add_argument('--no-browser', action='store_true')
    args = tham_so.parse_args()
    try:
        may = tao_may_chu(args.log_dir)
    except OSError as loi:
        raise SystemExit('Khong tao duoc thu muc log: ' + str(loi))
    url = f'http://127.0.0.1:{may.server_port}/index.html'
    print('Tank Lab: ' + url, flush=True)
    print('Tu dong luu log: ' + str(may.thu_muc_log), flush=True)
    print('Giu cua so nay trong khi choi. Nhan Ctrl+C de dung.', flush=True)
    if not args.no_browser:
        threading.Timer(.3, lambda: webbrowser.open(url)).start()
    try:
        may.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        may.server_close()
