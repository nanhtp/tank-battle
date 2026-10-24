import sys
sys.dont_write_bytecode = True
import importlib.util, json, tempfile, threading, unittest
from pathlib import Path
from urllib.request import Request, urlopen
from urllib.error import HTTPError
root = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('luu_log', root / 'khoi-chay.py')
m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m)

class ThuLuuLog(unittest.TestCase):
    def setUp(self):
        work = root.parent / 'work'; work.mkdir(exist_ok=True)
        self.tmp = tempfile.TemporaryDirectory(dir=work)
        self.server = m.tao_may_chu(Path(self.tmp.name) / 'LogTank')
        self.thread = threading.Thread(target=self.server.serve_forever, daemon=True); self.thread.start()
        self.url = 'http://127.0.0.1:' + str(self.server.server_port)
        self.log = {'dinhDang':'tank-lab-log', 'phienBan':1, 'xeCuoi':[{'ten':'Rồng Thép'}], 'dienBien':[]}
    def tearDown(self):
        self.server.shutdown(); self.server.server_close(); self.thread.join(); self.tmp.cleanup()
    def post(self, origin=None, token=None, data=None):
        return urlopen(Request(self.url+'/api/luu-log', data=json.dumps(data or self.log,ensure_ascii=False).encode('utf-8'),
            headers={'Content-Type':'application/json', 'Origin':origin or self.url,
                     'X-Tank-Token': token or self.server.ma_bao_ve}),timeout=3)
    def test_duong_dan_mac_dinh(self):
        self.assertEqual(str(m.THU_MUC_LOG), r'D:\Projects\tank-battle\LogTank')
    def test_luu_doc_lai_khong_ghi_de(self):
        with urlopen(self.url+'/api/cau-hinh-log') as r:
            c=json.load(r); self.assertEqual(c['maBaoVe'],self.server.ma_bao_ve)
        with self.post() as r: a=json.load(r)
        with self.post() as r: b=json.load(r)
        self.assertNotEqual(a['duongDan'],b['duongDan'])
        p=Path(a['duongDan']); self.assertEqual(p.parent, self.server.thu_muc_log)
        self.assertEqual(json.loads(p.read_text(encoding='utf-8')), self.log)
    def test_tu_choi_nguon_khac_va_token_sai(self):
        for args in [{'origin':'http://example.com'}, {'token':'sai'}]:
            with self.assertRaises(HTTPError) as c: self.post(**args)
            self.assertEqual(c.exception.code,403)
        self.assertEqual(list(self.server.thu_muc_log.iterdir()),[])
    def test_tu_choi_log_sai(self):
        with self.assertRaises(HTTPError) as c: self.post(data={'sai':True})
        self.assertEqual(c.exception.code,400)
    def test_game_co_script_tu_luu(self):
        with urlopen(self.url+'/index.html') as r:
            self.assertIn('tu-luu-log.js',r.read().decode())
        with urlopen(self.url+'/nhip-nen.js') as r:
            self.assertIn('postMessage', r.read().decode())
            self.assertIn('javascript', r.headers['Content-Type'])
        with self.assertRaises(HTTPError) as c: urlopen(self.url+'/khoi-chay.py')
        self.assertEqual(c.exception.code,404)

unittest.main()
