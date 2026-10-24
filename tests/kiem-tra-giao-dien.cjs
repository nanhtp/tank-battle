'use strict';

// Kiểm tra mã giao diện bằng môi trường DOM/Canvas nhỏ, không phải trình duyệt.
// Không kiểm tra bố cục CSS, phông chữ hay ảnh chụp màn hình.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const { performance } = require('node:perf_hooks');
const thuMuc = fs.existsSync(path.join(__dirname, '../vat-ly.js'))
  ? path.resolve(__dirname, '..') : path.resolve(__dirname, '../outputs/tank-battle');
const html = fs.readFileSync(path.join(thuMuc, 'index.html'), 'utf8');
const maNguon = Object.fromEntries(['vat-ly.js', 'ai.js', 'nhat-ky.js', 'tu-luu-log.js', 'game.js'].map(tep =>
  [tep, fs.readFileSync(path.join(thuMuc, tep), 'utf8')]));
let soDat = 0;
let soLoi = 0;

function kiemTra(ten, ham) {
  const dau = performance.now();
  try {
    ham();
    soDat++;
    console.log(`ĐẠT ${ten} (${Math.round(performance.now() - dau)} ms)`);
  } catch (loi) {
    soLoi++;
    console.error(`LỖI ${ten}\n${loi.stack}`);
  }
}

async function kiemTraBatDongBo(ten, ham) {
  const dau = performance.now();
  try {
    await ham();
    soDat++;
    console.log(`ĐẠT ${ten} (${Math.round(performance.now() - dau)} ms)`);
  } catch (loi) {
    soLoi++;
    console.error(`LỖI ${ten}\n${loi.stack}`);
  }
}

class BoSuKien {
  constructor() { this.suKien = new Map(); }
  addEventListener(ten, ham) {
    if (!this.suKien.has(ten)) this.suKien.set(ten, []);
    this.suKien.get(ten).push(ham);
  }
  phat(ten, them = {}) {
    const e = { target: this, defaultPrevented: false,
      preventDefault() { this.defaultPrevented = true; }, ...them };
    for (const ham of this.suKien.get(ten) || []) ham(e);
    return e;
  }
}

class NutChu {
  constructor(chu) { this.nodeType = 3; this.data = String(chu); this.parentNode = null; }
  get textContent() { return this.data; }
  set textContent(chu) { this.data = String(chu); }
}

function taoButVe(canvas) {
  const but = { canvas, thongKe: {}, doSau: 0 };
  const soHopLe = (giaTri, ten) => assert(Number.isFinite(giaTri), `Canvas ${ten}: số không hữu hạn`);
  const cachVe = {
    fillRect: 4, strokeRect: 4, moveTo: 2, lineTo: 2,
    translate: 2, rotate: 1, setTransform: 6
  };
  const dem = ten => { but.thongKe[ten] = (but.thongKe[ten] || 0) + 1; };
  for (const [ten, soDoiSo] of Object.entries(cachVe)) {
    but[ten] = (...doiSo) => {
      assert(doiSo.length >= soDoiSo, `Canvas ${ten}: thiếu đối số`);
      doiSo.slice(0, soDoiSo).forEach(so => soHopLe(so, ten));
      dem(ten);
    };
  }
  for (const ten of ['beginPath', 'stroke', 'fill']) but[ten] = () => dem(ten);
  but.arc = (x, y, r, dau, cuoi) => {
    [x, y, r, dau, cuoi].forEach(so => soHopLe(so, 'arc'));
    assert(r >= 0, 'Canvas arc: bán kính âm'); dem('arc');
  };
  but.setLineDash = mang => {
    assert(Array.isArray(mang)); mang.forEach(so => soHopLe(so, 'setLineDash')); dem('setLineDash');
  };
  but.save = () => { but.doSau++; dem('save'); };
  but.restore = () => { assert(but.doSau > 0, 'Canvas restore thiếu save'); but.doSau--; dem('restore'); };
  but.drawImage = (anh, x, y) => {
    assert(anh && anh.tagName === 'CANVAS', 'Nền phải là Canvas');
    [x, y].forEach(so => soHopLe(so, 'drawImage')); dem('drawImage');
  };
  but.fillText = (chu, x, y) => {
    assert.equal(typeof chu, 'string');
    [x, y].forEach(so => soHopLe(so, 'fillText')); dem('fillText');
  };
  return but;
}

class PhanTu extends BoSuKien {
  constructor(ten) {
    super(); this.nodeType = 1; this.tagName = ten.toUpperCase(); this.childNodes = [];
    this.parentNode = null; this.thuocTinh = {}; this.style = {}; this.dataset = {};
    this.style.setProperty = (ten, giaTri) => { this.style[ten] = String(giaTri); };
    this.value = ''; this.disabled = false; this.hidden = false; this.checked = false;
    this.className = ''; this.id = ''; this.isContentEditable = false;
    this.rongGiaLap = 700; this.width = 300; this.height = 150;
    this.classList = {
      contains: tenLop => this.className.split(/\s+/).includes(tenLop),
      toggle: (tenLop, bat) => {
        const cacLop = new Set(this.className.split(/\s+/).filter(Boolean));
        const them = bat === undefined ? !cacLop.has(tenLop) : !!bat;
        if (them) cacLop.add(tenLop); else cacLop.delete(tenLop);
        this.className = [...cacLop].join(' ');
        return them;
      }
    };
    this.classList.add = (...cacLop) => cacLop.forEach(tenLop => this.classList.toggle(tenLop, true));
    this.classList.remove = (...cacLop) => cacLop.forEach(tenLop => this.classList.toggle(tenLop, false));
  }
  get children() { return this.childNodes.filter(nut => nut.nodeType === 1); }
  get textContent() { return this.childNodes.map(nut => nut.textContent).join(''); }
  set textContent(chu) { this.replaceChildren(new NutChu(chu)); }
  append(...cacNut) {
    for (let nut of cacNut) {
      if (typeof nut === 'string') nut = new NutChu(nut);
      assert(nut && (nut.nodeType === 1 || nut.nodeType === 3), 'DOM append: nút không hợp lệ');
      nut.parentNode = this; this.childNodes.push(nut);
    }
  }
  replaceChildren(...cacNut) {
    for (const nut of this.childNodes) nut.parentNode = null;
    this.childNodes = []; this.append(...cacNut);
  }
  setAttribute(ten, giaTri) {
    const chu = String(giaTri);
    this.thuocTinh[ten] = chu;
    if (ten === 'id') this.id = chu;
    if (ten === 'class') this.className = chu;
    if (ten === 'value') this.value = chu;
    if (ten === 'width' || ten === 'height') this[ten] = Number(chu);
    if (['hidden', 'disabled', 'checked'].includes(ten)) this[ten] = true;
    if (ten.startsWith('data-')) this.dataset[ten.slice(5).replace(/-([a-z])/g, (_, kyTu) => kyTu.toUpperCase())] = chu;
  }
  getAttribute(ten) { return this.thuocTinh[ten] ?? null; }
  contains(nut) {
    if (nut === this) return true;
    return this.children.some(con => con.contains(nut));
  }
  getBoundingClientRect() {
    return { width: this.rongGiaLap, height: this.rongGiaLap, x: 0, y: this.dauGiaLap || 0, top: this.dauGiaLap || 0 };
  }
  getContext(loai) {
    assert.equal(this.tagName, 'CANVAS'); assert.equal(loai, '2d');
    if (!this.butVe) this.butVe = taoButVe(this);
    return this.butVe;
  }
  querySelectorAll(boChon) {
    const hop = (nut, don) => {
      if (don.startsWith('#')) return nut.id === don.slice(1);
      if (don.startsWith('.')) return nut.classList.contains(don.slice(1));
      if (/^\[[\w-]+\]$/.test(don)) return nut.getAttribute(don.slice(1, -1)) !== null;
      assert(/^[a-z-]+$/i.test(don), `Bộ chọn chưa hỗ trợ: ${don}`);
      return nut.tagName.toLowerCase() === don.toLowerCase();
    };
    const don = boChon.split(/\s*>\s*/);
    assert(don.length <= 2, `Bộ chọn chưa hỗ trợ: ${boChon}`);
    const ketQua = [];
    const duyet = nut => {
      for (const con of nut.children) {
        if (hop(con, don.at(-1)) && (don.length === 1 || (con.parentNode.nodeType === 1 && hop(con.parentNode, don[0])))) ketQua.push(con);
        duyet(con);
      }
    };
    duyet(this); return ketQua;
  }
  querySelector(boChon) { return this.querySelectorAll(boChon)[0] || null; }
  click() { if (!this.disabled) this.phat('click'); }
}

function docHTML() {
  const taiLieu = new PhanTu('document');
  taiLieu.hidden = false;
  taiLieu.createElement = ten => new PhanTu(ten);
  taiLieu.createTextNode = chu => new NutChu(chu);
  const cacId = new Map();
  taiLieu.getElementById = id => cacId.get(id) || null;
  const nganXep = [taiLieu];
  const theRong = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr']);
  const token = /<!--[\s\S]*?-->|<![^>]*>|<\/?([a-zA-Z][\w:-]*)\b([^<>]*?)\/?\s*>|([^<]+)/g;
  let khop;
  while ((khop = token.exec(html))) {
    const chu = khop[0];
    if (chu.startsWith('<!')) continue;
    if (!khop[1]) { nganXep.at(-1).append(new NutChu(khop[3])); continue; }
    const ten = khop[1].toLowerCase();
    if (chu.startsWith('</')) {
      assert.equal(nganXep.at(-1).tagName.toLowerCase(), ten, `Đóng thẻ HTML không khớp: ${chu}`);
      const nut = nganXep.pop();
      if (ten === 'select') {
        const luaChon = nut.children.find(con => con.tagName === 'OPTION' && con.getAttribute('selected') !== null) || nut.children.find(con => con.tagName === 'OPTION');
        nut.value = luaChon ? luaChon.value : '';
      }
      continue;
    }
    const nut = new PhanTu(ten);
    const thuocTinh = /([:\w-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
    let thuoc;
    while ((thuoc = thuocTinh.exec(khop[2]))) nut.setAttribute(thuoc[1], thuoc[2] ?? thuoc[3] ?? thuoc[4] ?? '');
    if (nut.id) { assert(!cacId.has(nut.id), `Trùng id HTML: ${nut.id}`); cacId.set(nut.id, nut); }
    nganXep.at(-1).append(nut);
    if (!theRong.has(ten) && !/\/\s*>$/.test(chu)) nganXep.push(nut);
  }
  assert.equal(nganXep.length, 1, 'HTML còn thẻ chưa đóng');
  taiLieu.body = taiLieu.querySelector('body');
  return { taiLieu, cacId };
}

function taoPhien(tuyChon = {}) {
  const { taiLieu, cacId } = docHTML();
  const cuaSo = new BoSuKien();
  let moc = 1000;
  let maKhung = 0;
  const hangKhung = [];
  const cacHenGio = [];
  const cacLuongNen = [];
  const cacTran = [];
  const cacTuyChon = [];
  const cacBuoc = [];
  // Chỉ mô phỏng hợp đồng API/sự kiện; trình duyệt thật quyết định kích thước CSS.
  const toanManHinh = { soLanVao: 0, soLanThoat: 0, doiTuong: null };
  taiLieu.fullscreenElement = null;
  taiLieu.fullscreenEnabled = tuyChon.toanManHinhGoc === true;
  if (tuyChon.toanManHinhGoc) {
    const khung = cacId.get('khung-dau-truong');
    assert(khung, 'Thiếu khung yêu cầu toàn màn hình');
    khung.requestFullscreen = async () => {
      toanManHinh.soLanVao++;
      toanManHinh.doiTuong = khung;
      if (tuyChon.tuChoiVao) throw new Error('Fullscreen request denied');
      taiLieu.fullscreenElement = khung;
      taiLieu.phat('fullscreenchange');
    };
    taiLieu.exitFullscreen = async () => {
      toanManHinh.soLanThoat++;
      if (tuyChon.tuChoiThoat) throw new Error('Fullscreen exit denied');
      taiLieu.fullscreenElement = null;
      taiLieu.phat('fullscreenchange');
    };
  }
  Object.assign(cuaSo, { document: taiLieu, console, Math, devicePixelRatio: 1,
    crypto: { getRandomValues: mang => { mang.fill(2048); return mang; } },
    performance: { now: () => moc },
    setInterval: ham => { cacHenGio.push(ham); return cacHenGio.length; },
    requestAnimationFrame: ham => { hangKhung.push(ham); return ++maKhung; }
  });
  cuaSo.window = cuaSo; cuaSo.globalThis = cuaSo;
  if (tuyChon.coWorker) cuaSo.Worker = class {
    constructor(tep) {
      assert.equal(tep, 'nhip-nen.js');
      if (tuyChon.loiWorker) throw new Error('Worker bị chặn');
      this.daDung = false; cacLuongNen.push(this);
    }
    terminate() { this.daDung = true; }
  };
  vm.createContext(cuaSo);
  for (const tep of ['vat-ly.js', 'ai.js']) vm.runInContext(maNguon[tep], cuaSo, { filename: tep });
  const D = cuaSo.DauTruong;
  const taoTranGoc = D.taoTranDau;
  const buocGoc = D.buocMoPhong;
  D.taoTranDau = tuyChon => {
    cacTuyChon.push({ ...tuyChon });
    const tran = taoTranGoc(tuyChon); cacTran.push(tran); return tran;
  };
  D.buocMoPhong = (tran, dt, dieuKhien) => { cacBuoc.push(dt); return buocGoc(tran, dt, dieuKhien); };
  vm.runInContext(maNguon['nhat-ky.js'], cuaSo, { filename: 'nhat-ky.js' });
  vm.runInContext(maNguon['tu-luu-log.js'], cuaSo, { filename: 'tu-luu-log.js' });
  vm.runInContext(maNguon['game.js'], cuaSo, { filename: 'game.js' });
  const lay = id => { const nut = cacId.get(id); assert(nut, `Thiếu id ${id}`); return nut; };
  function khung(soKhung, ms = 1000 / 60) {
    for (let i = 0; i < soKhung; i++) {
      moc += ms;
      assert.equal(hangKhung.length, 1, 'Phải có đúng một vòng requestAnimationFrame');
      hangKhung.shift()(moc);
      assert.equal(lay('ban-do').getContext('2d').doSau, 0, 'Canvas save/restore chưa cân bằng');
    }
  }
  return { cuaSo, taiLieu, lay, D, cacTran, cacTuyChon, cacBuoc, khung, toanManHinh, cacLuongNen,
    tran: () => cacTran.at(-1),
    troiGian: ms => { moc += ms; },
    nhipWorker: (n, ms = 100) => { for (let i = 0; i < n; i++) {
      moc += ms; cacLuongNen.filter(luong => !luong.daDung).forEach(luong => luong.onmessage({ data: 'nhip' }));
    } },
    nhipNen: (n, ms = 1000) => { for (let i = 0; i < n; i++) { moc += ms; cacHenGio.forEach(ham => ham()); } },
    henGioNgay: () => cacHenGio.forEach(ham => ham()),
    chon: (id, giaTri) => { const nut = lay(id); nut.value = String(giaTri); nut.phat('change'); },
    nhan: id => lay(id).click(),
    tocDo: giaTri => taiLieu.querySelectorAll('[data-toc-do]').find(nut => Number(nut.dataset.tocDo) === giaTri).click(),
    phim: (key, code, them = {}) => taiLieu.phat('keydown', { target: taiLieu.body, key, code, ...them }),
    doiTacVu: () => new Promise(giaiQuyet => setImmediate(giaiQuyet))
  };
}

function nhanNut(phien) { return phien.lay('nut-bat-dau').querySelector('span').textContent; }
function khoaThietLap(phien, khoa) { for (const id of ['so-bot', 'che-do', 'cap-bot', 'ten-nguoi-choi', 'mau-nguoi-choi']) assert.equal(phien.lay(id).disabled, khoa); }

kiemTra('Mở phân tích trận hiện tại và Đặt lại xóa báo cáo đang xem', () => {
  const p = taoPhien();
  p.chon('ten-nguoi-choi', 'Bão Thép');
  p.nhan('nut-xem-log');
  assert.equal(p.lay('phan-tich-log').hidden, false);
  assert(p.lay('phan-tich-log').textContent.includes('Bão Thép'));
  assert(p.lay('phan-tich-log').textContent.includes('Trận chưa kết thúc'));
  const tran = p.tran();
  p.nhan('nut-dat-lai');
  assert.equal(p.lay('phan-tich-log').hidden, true);
  assert.notEqual(p.tran(), tran);
});

kiemTra('Tên và màu xem trước ngay, không tạo lại bản đồ hay thay AI', () => {
  const p = taoPhien();
  const tran = p.tran(), tuong = JSON.stringify(tran.tuong), ai = p.D.layAINguoiChoi();
  p.lay('ten-nguoi-choi').value = 'Rồng Thép ';
  p.lay('ten-nguoi-choi').phat('input');
  assert.equal(p.lay('ten-nguoi-choi').value, 'Rồng Thép ', 'Giữ dấu cách khi đang gõ');
  p.chon('mau-nguoi-choi', '#467be3');
  assert.equal(tran.xe[0].ten, 'Rồng Thép');
  assert.equal(tran.xe[0].mau, '#467be3');
  assert.equal(p.lay('ten-xe-hien-thi').textContent, 'Rồng Thép');
  assert.equal(p.taiLieu.body.style['--mau-xe-nguoi'], '#467be3');
  const dong = p.lay('danh-sach-xe').children[0];
  assert(dong.textContent.includes('Rồng Thép'));
  assert.equal(dong.children[0].style.background, '#467be3');
  assert.equal(p.tran(), tran);
  assert.equal(p.cacTran.length, 1);
  assert.equal(JSON.stringify(tran.tuong), tuong);
  assert.equal(p.D.layAINguoiChoi(), ai);
});

kiemTra('Tên trống, Unicode, HTML và màu không hợp lệ được xử lý an toàn', () => {
  const p = taoPhien(), D = p.D;
  p.chon('ten-nguoi-choi', '   ');
  assert.equal(p.tran().xe[0].ten, 'Tiên Phong');
  assert.equal(p.lay('ten-nguoi-choi').value, 'Tiên Phong');
  p.chon('ten-nguoi-choi', '<b>Rồng</b>');
  assert.equal(p.lay('ten-xe-hien-thi').textContent, '<b>Rồng</b>');
  assert.equal(p.lay('ten-xe-hien-thi').children.length, 0, 'Tên chỉ được hiển thị dưới dạng văn bản');
  const ten = D.chuanHoaTenNguoiChoi('🚀'.repeat(30));
  assert.equal(Array.from(ten).length, 24);
  assert(!ten.includes('\ufffd'));
  const tran = D.taoTranDau({ tenNguoiChoi: '  Rồng\n  Thép  ', mauNguoiChoi: '#AB12CD', hatGiong: 345 });
  assert.equal(tran.xe[0].ten, 'Rồng Thép');
  assert.equal(tran.xe[0].mau, '#ab12cd');
  assert.equal(D.chuanHoaMauNguoiChoi('red; background:url(x)'), '#b7d77b');
  assert.equal(D.chuanHoaTenNguoiChoi(null), 'Tiên Phong');
  const macDinh = D.taoTranDau({ hatGiong: 345 });
  assert.equal(JSON.stringify(macDinh.tuong), JSON.stringify(tran.tuong));
  assert.deepEqual(tran.xe.map(x => [x.x, x.y, x.hp]), macDinh.xe.map(x => [x.x, x.y, x.hp]));
});

kiemTra('Tên và màu giữ qua thay thiết lập, Đặt lại, chiến thắng và Đấu lại', () => {
  const p = taoPhien();
  p.chon('ten-nguoi-choi', 'Bão Lửa'); p.chon('mau-nguoi-choi', '#de425b');
  p.chon('cap-bot', 3); p.chon('so-bot', 2); p.chon('che-do', 1);
  p.nhan('nut-dat-lai');
  assert.equal(p.tran().xe[0].ten, 'Bão Lửa');
  assert.equal(p.tran().xe[0].mau, '#de425b');
  p.nhan('nut-bat-dau'); khoaThietLap(p, true);
  // Sự kiện thay đổi giả lập cũng không đổi nhận dạng khi thiết lập bị khóa.
  p.lay('ten-nguoi-choi').phat('input');
  for (const xe of p.tran().xe.slice(1)) { xe.hp = 0; xe.conSong = false; }
  p.khung(1);
  assert.equal(p.lay('tieu-de-ket-qua').textContent, 'Bão Lửa chiến thắng!');
  assert(p.lay('nhat-ky').textContent.includes('Bão Lửa'));
  p.nhan('nut-choi-lai');
  assert.equal(p.tran().xe[0].ten, 'Bão Lửa');
  assert.equal(p.tran().xe[0].mau, '#de425b');
  khoaThietLap(p, true);
  p.nhan('nut-dat-lai'); khoaThietLap(p, false);
});

kiemTra('Đạn bắn ra dùng màu xe tùy chọn; tên và màu không đổi lệnh AI', () => {
  const p = taoPhien(), D = p.D;
  const tran = D.taoTranDau({ soBot: 1, tenNguoiChoi: 'Hải Đăng', mauNguoiChoi: '#5577ee', hatGiong: 99 });
  const goc = D.taoTranDau({ soBot: 1, hatGiong: 99 });
  assert.deepEqual(D.AINguoiChoi(tran.xe[0], tran), D.AINguoiChoi(goc.xe[0], goc));
  tran.tuong = [];
  Object.assign(tran.xe[0], { x: 300, y: 300, goc: 0, gocNong: 0 });
  D.buocMoPhong(tran, 1 / 60, xe => ({ ga: 0, quay: 0, gocNong: 0, ban: xe.laNguoiChoi }));
  assert.equal(tran.dan.length, 1);
  assert.equal(tran.dan[0].mau, '#5577ee');
  assert.equal(tran.dan[0].chuId, 'nguoi');
});

function ghiDuongBot(phien) {
  const duong = [];
  for (let i = 0; i < 6; i++) {
    phien.khung(15);
    duong.push(phien.tran().xe.filter(xe => !xe.laNguoiChoi).map(xe =>
      [xe.x, xe.y, xe.goc, xe.gocNong, xe.lenh.ga, xe.lenh.quay]));
  }
  return JSON.stringify(duong);
}

kiemTra('HTML không trùng id, mọi tài nguyên và liên kết nội bộ tồn tại', () => {
  const { taiLieu, cacId } = docHTML();
  assert(cacId.size > 30);
  for (const nut of [...taiLieu.querySelectorAll('[src]'), ...taiLieu.querySelectorAll('[href]')]) {
    const diaChi = nut.getAttribute('src') || nut.getAttribute('href');
    if (diaChi === '#' || diaChi.startsWith('data:')) continue;
    if (diaChi.startsWith('#')) assert(cacId.has(diaChi.slice(1)), `Liên kết id không tồn tại: ${diaChi}`);
    else {
      assert(!/^[a-z]+:/i.test(diaChi), `Tài nguyên ngoài dự án: ${diaChi}`);
      assert(fs.existsSync(path.join(thuMuc, diaChi)), `Thiếu tài nguyên: ${diaChi}`);
    }
  }
  assert.deepEqual(taiLieu.querySelectorAll('script').map(nut => nut.getAttribute('src')), ['vat-ly.js', 'ai.js', 'nhat-ky.js', 'tu-luu-log.js', 'game.js']);
});

kiemTra('Khởi tạo thực thi đầy đủ: 6 xe, sẵn sàng, có vẽ Canvas', () => {
  const p = taoPhien();
  assert.equal(p.tran().xe.length, 6);
  assert(Number.isInteger(p.tran().hatGiong) && p.tran().hatGiong > 0);
  assert.equal(p.taiLieu.getElementById('hat-giong'), null, 'Không còn ô nhập mã trận cố định');
  assert(p.taiLieu.textContent.includes('Ngẫu nhiên mỗi trận'));
  assert.equal(Object.hasOwn(p.cacTuyChon[0], 'hatGiong'), false);
  assert.equal(nhanNut(p), 'Bắt đầu');
  assert.equal(p.lay('trang-thai-tran').textContent, 'SẴN SÀNG');
  assert.equal(p.lay('thoi-gian').textContent, '00:00');
  assert.equal(p.lay('danh-sach-xe').children.length, 6);
  assert.equal(p.lay('ket-qua').hidden, true);
  assert.equal(p.lay('thong-bao-san').hidden, false);
  assert(p.lay('ban-do').getContext('2d').thongKe.drawImage >= 1);
  khoaThietLap(p, false);
});

kiemTra('Bộ chọn có đủ cấp bot 1–10, mặc định cấp 5 và bảng xe hiện đúng cấp', () => {
  const p = taoPhien();
  const luaChon = p.lay('cap-bot').children.filter(nut => nut.tagName === 'OPTION');
  assert.deepEqual(luaChon.map(nut => Number(nut.value)), Array.from({ length: 10 }, (_, i) => i + 1));
  assert.equal(p.lay('cap-bot').value, '5');
  assert(p.taiLieu.textContent.includes('CẤP BOT'));
  assert.equal(p.tran().capBot, 5);
  assert.equal(p.cacTuyChon[0].capBot, 5);
  assert(p.tran().xe.filter(xe => !xe.laNguoiChoi).every(xe => xe.capBot === 5));
  assert.equal(p.tran().xe[0].capBot, null);
  const cacDong = p.lay('danh-sach-xe').children;
  assert(cacDong[0].textContent.includes('BẠN'));
  assert(!/cấp\s+\d/i.test(cacDong[0].textContent));
  assert(cacDong.slice(1).every(dong => /cấp\s+5/i.test(dong.textContent)));
});

kiemTra('Đổi cấp thấp nhất/cao nhất tạo trận ngẫu nhiên mới và cập nhật mọi bot', () => {
  const p = taoPhien();
  let hatCu = p.tran().hatGiong;
  for (const capBot of [1, 10]) {
    p.chon('cap-bot', capBot);
    assert.equal(p.tran().capBot, capBot);
    assert.equal(p.cacTuyChon.at(-1).capBot, capBot);
    assert.notEqual(p.tran().hatGiong, hatCu);
    assert.equal(p.tran().thoiGian, 0);
    assert(p.tran().xe.filter(xe => !xe.laNguoiChoi).every(xe => xe.capBot === capBot));
    assert.equal(p.tran().xe[0].capBot, null);
    assert(p.lay('danh-sach-xe').children.slice(1).every(dong => dong.querySelector('small').textContent.toLocaleLowerCase('vi') === `cấp ${capBot}`));
    assert.equal(nhanNut(p), 'Bắt đầu');
    khoaThietLap(p, false);
    hatCu = p.tran().hatGiong;
  }
  assert.equal(p.cacTran.length, 3);
});

kiemTra('Cấp bot được giữ khi Đặt lại, Đấu lại và Trận mới; AI người chơi đăng ký riêng', () => {
  const p = taoPhien();
  let soLanGoi = 0;
  const aiRieng = () => { soLanGoi++; return { ga: 0, quay: 0, gocNong: 0, ban: false }; };
  p.D.dangKyAI(aiRieng);
  p.chon('cap-bot', 10);
  p.nhan('nut-bat-dau'); p.khung(10); p.nhan('nut-bat-dau');
  khoaThietLap(p, true);
  assert.equal(p.D.layAINguoiChoi(), aiRieng);
  assert(soLanGoi > 0, 'Chọn cấp bot vẫn phải gọi AI người chơi đã đăng ký');
  const hatDau = p.tran().hatGiong;
  p.nhan('nut-dat-lai');
  assert.notEqual(p.tran().hatGiong, hatDau);
  assert.equal(p.lay('cap-bot').value, '10');
  assert.equal(p.tran().capBot, 10);
  assert.equal(p.D.layAINguoiChoi(), aiRieng);
  khoaThietLap(p, false);
  for (const nut of ['nut-choi-lai', 'nut-bat-dau']) {
    p.nhan('nut-bat-dau');
    for (const xe of p.tran().xe.slice(1)) { xe.hp = 0; xe.conSong = false; }
    p.khung(1);
    assert.equal(p.tran().ketThuc, true);
    const tranCu = p.tran();
    p.nhan(nut);
    assert.notEqual(p.tran().hatGiong, tranCu.hatGiong);
    assert.equal(p.tran().capBot, 10);
    assert.equal(p.lay('cap-bot').value, '10');
    assert(p.tran().xe.filter(xe => !xe.laNguoiChoi).every(xe => xe.capBot === 10));
    assert.equal(p.tran().xe[0].capBot, null);
    assert.equal(p.D.layAINguoiChoi(), aiRieng);
    assert.equal(nhanNut(p), 'Tạm dừng');
    khoaThietLap(p, true);
    p.nhan('nut-dat-lai');
  }
});

kiemTra('Đổi số bot và HP tạo trận với hạt giống mới', () => {
  const p = taoPhien();
  const hatDau = p.tran().hatGiong;
  const banDoDau = JSON.stringify(p.tran().tuong);
  p.chon('so-bot', 10);
  assert.equal(p.tran().xe.length, 11);
  assert.notEqual(p.tran().hatGiong, hatDau);
  assert.notEqual(JSON.stringify(p.tran().tuong), banDoDau);
  assert.equal(p.lay('danh-sach-xe').children.length, 11);
  const hatSau = p.tran().hatGiong;
  const banDoSau = JSON.stringify(p.tran().tuong);
  p.chon('che-do', 1);
  assert.notEqual(p.tran().hatGiong, hatSau);
  assert.notEqual(JSON.stringify(p.tran().tuong), banDoSau);
  assert(p.tran().xe.every(xe => xe.hp === 1 && xe.hpToiDa === 1));
  assert.equal(p.lay('mau-xe').textContent, '1/1 HP');
  assert.equal(p.tran().thoiGian, 0);
  assert.equal(p.cacTran.length, 3);
  assert(p.cacTuyChon.every(tuyChon => !Object.hasOwn(tuyChon, 'hatGiong')));
});

kiemTra('Bắt đầu khóa thiết lập, 120 khung chạy bằng bước cố định 1/60', () => {
  const p = taoPhien();
  p.nhan('nut-bat-dau');
  assert.equal(nhanNut(p), 'Tạm dừng');
  assert.equal(p.lay('trang-thai-tran').textContent, 'ĐANG GIAO TRANH');
  assert.equal(p.lay('thong-bao-san').hidden, true);
  khoaThietLap(p, true);
  p.khung(120);
  assert(Math.abs(p.tran().thoiGian - 2) < 1e-6);
  assert.equal(p.cacBuoc.length, 120);
  assert(p.cacBuoc.every(dt => dt === 1 / 60));
  assert(p.lay('thoi-gian').textContent !== '00:00');
});

kiemTra('Nhãn bo cuối hiện 360 × 360 và dừng thu sau mốc giới hạn; thiết lập trận được giữ nguyên', () => {
  const p = taoPhien();
  p.chon('so-bot', 1);
  p.chon('cap-bot', 10);
  const tran = p.tran();
  const hatCu = tran.hatGiong;
  const soTran = p.cacTran.length;
  const H = p.D.hangSo;
  const lucDungThu = H.batDauThuVung + H.gioiHanThuVung / H.tocDoThuVung;
  Object.assign(tran.xe[0], { x: 360, y: 380, goc: 0 });
  Object.assign(tran.xe[1], { x: 600, y: 580, goc: Math.PI });
  tran.thoiGian = lucDungThu + 100;
  p.D.dangKyAI(() => ({ ga: 0, quay: 0, gocNong: 0, ban: false }));
  // Chỉ thử cập nhật bo và nhãn; không để AI bot làm thay đổi bố trí thử.
  const aiBotGoc = p.D.AIBot;
  p.D.AIBot = () => ({ ga: 0, quay: 0, gocNong: 0, ban: false });
  try {
    p.nhan('nut-bat-dau'); p.khung(30);
    assert.equal(tran.vungAnToan, H.gioiHanThuVung);
    assert.equal(p.lay('vung-an-toan').textContent, 'Bo cuối 360 × 360 · Đã dừng thu');
    const nhanCu = p.lay('vung-an-toan').textContent;
    p.khung(120);
    assert.equal(p.lay('vung-an-toan').textContent, nhanCu);
    assert.equal(p.cacTran.length, soTran);
    assert.equal(tran.hatGiong, hatCu);
    assert.equal(tran.capBot, 10);
    assert.equal(p.lay('cap-bot').value, '10');
    assert.equal(p.lay('so-bot').value, '1');
    assert.equal(tran.ketThuc, false);
    assert(tran.xe.every(xe => xe.hp === 3));
    khoaThietLap(p, true);
  } finally { p.D.AIBot = aiBotGoc; }
});

kiemTra('Tạm dừng đóng băng vật lý; tiếp tục chạy tiếp trận hiện tại', () => {
  const p = taoPhien();
  const banDoDau = JSON.stringify(p.tran().tuong);
  p.nhan('nut-bat-dau'); p.khung(40); p.nhan('nut-bat-dau');
  assert.equal(nhanNut(p), 'Tiếp tục');
  assert.equal(p.lay('trang-thai-tran').textContent, 'TẠM DỪNG');
  khoaThietLap(p, true);
  const truoc = JSON.stringify(p.tran());
  const soBuoc = p.cacBuoc.length;
  p.khung(180);
  assert.equal(JSON.stringify(p.tran()), truoc);
  assert.equal(p.cacBuoc.length, soBuoc);
  const tranCu = p.tran();
  p.nhan('nut-bat-dau'); p.khung(40);
  assert.equal(p.tran(), tranCu);
  assert.equal(JSON.stringify(p.tran().tuong), banDoDau, 'Tạm dừng/tiếp tục không đổi địa hình');
  assert(p.tran().thoiGian > 1.2);
  assert.equal(p.cacTran.length, 1, 'Tạm dừng/tiếp tục không bốc lại trận');
});

kiemTra('Bốn tốc độ 1×, 2×, 5×, 8× giữ bước vật lý và cập nhật trạng thái chọn', () => {
  assert.deepEqual(taoPhien().taiLieu.querySelectorAll('[data-toc-do]').map(n => Number(n.dataset.tocDo)), [1, 2, 5, 8]);
  for (const tocDo of [1, 2, 5, 8]) {
    const p = taoPhien();
    p.D.dangKyAI(() => ({ ga: 0, quay: 0, ban: false }));
    p.D.AIBot = () => ({ ga: 0, quay: 0, ban: false });
    const banDoDau = JSON.stringify(p.tran().tuong);
    p.tocDo(tocDo);
    for (const nut of p.taiLieu.querySelectorAll('[data-toc-do]')) {
      const chon = Number(nut.dataset.tocDo) === tocDo;
      assert.equal(nut.classList.contains('selected'), chon);
      assert.equal(nut.getAttribute('aria-pressed'), String(chon));
    }
    p.nhan('nut-bat-dau'); p.khung(60);
    assert(Math.abs(p.tran().thoiGian - tocDo) < 1e-6);
    assert(p.cacBuoc.every(dt => dt === 1 / 60));
    assert.equal(p.cacTran.length, 1, 'Đổi tốc độ không bốc lại trận');
    assert.equal(JSON.stringify(p.tran().tuong), banDoDau, 'Tốc độ không đổi địa hình giữa trận');
  }
});

kiemTra('Ẩn/hiện dự đoán thay đổi lệnh vẽ, giữ nguyên trạng thái trận', () => {
  const p = taoPhien();
  p.nhan('nut-bat-dau'); p.khung(10); p.nhan('nut-bat-dau');
  assert(p.tran().xe[0].boNhoAI.phanTich);
  const truoc = JSON.stringify(p.tran());
  const but = p.lay('ban-do').getContext('2d');
  but.thongKe = {};
  p.lay('hien-du-doan').checked = false;
  p.lay('hien-du-doan').phat('change');
  const soNetTat = but.thongKe.lineTo;
  but.thongKe = {};
  p.lay('hien-du-doan').checked = true;
  p.lay('hien-du-doan').phat('change');
  assert(but.thongKe.lineTo > soNetTat + 100);
  assert.equal(JSON.stringify(p.tran()), truoc);
  assert.equal(p.cacTran.length, 1, 'Ẩn/hiện dự đoán không bốc lại trận');
});

kiemTra('Đặt lại xóa tiến độ và mở khóa thiết lập', () => {
  const p = taoPhien();
  p.nhan('nut-bat-dau'); p.khung(30);
  const tranCu = p.tran();
  p.nhan('nut-dat-lai');
  assert.notEqual(p.tran(), tranCu);
  assert.notEqual(p.tran().hatGiong, tranCu.hatGiong);
  assert.notEqual(JSON.stringify(p.tran().tuong), JSON.stringify(tranCu.tuong), 'Đặt lại phải tạo bản đồ mới');
  assert.equal(p.tran().thoiGian, 0);
  assert(p.tran().xe.every(xe => xe.hp === 3 && xe.soBan === 0));
  assert.equal(nhanNut(p), 'Bắt đầu');
  assert.equal(p.lay('ket-qua').hidden, true);
  khoaThietLap(p, false);
  p.khung(30); assert.equal(p.tran().thoiGian, 0);
});

kiemTra('Kết thúc hiện người thắng; Đấu lại tạo và chạy trận mới', () => {
  const p = taoPhien();
  p.nhan('nut-bat-dau');
  for (const xe of p.tran().xe.slice(1)) { xe.hp = 0; xe.conSong = false; }
  p.khung(1);
  assert.equal(p.tran().ketThuc, true);
  assert.equal(p.lay('ket-qua').hidden, false);
  assert.equal(p.lay('trang-thai-tran').textContent, 'KẾT THÚC');
  assert.equal(p.lay('tieu-de-ket-qua').textContent, 'Tiên Phong chiến thắng!');
  assert.equal(nhanNut(p), 'Trận mới');
  const tranCu = p.tran();
  const gioCu = tranCu.thoiGian;
  p.khung(60); assert.equal(tranCu.thoiGian, gioCu);
  p.nhan('nut-choi-lai');
  assert.notEqual(p.tran(), tranCu);
  assert.notEqual(p.tran().hatGiong, tranCu.hatGiong);
  assert.notEqual(JSON.stringify(p.tran().tuong), JSON.stringify(tranCu.tuong), 'Đấu lại phải tạo bản đồ mới');
  assert.equal(p.lay('ket-qua').hidden, true);
  assert.equal(nhanNut(p), 'Tạm dừng');
  assert(p.tran().xe.every(xe => xe.conSong));
  p.khung(1); assert(p.tran().thoiGian > 0);
});

kiemTra('Đặt lại và Đấu lại đều đổi diễn biến di chuyển của bot ở cùng mốc thời gian', () => {
  const p = taoPhien();
  const cacHat = [p.tran().hatGiong];
  p.nhan('nut-bat-dau');
  const duongDau = ghiDuongBot(p);
  p.nhan('nut-dat-lai');
  cacHat.push(p.tran().hatGiong);
  p.nhan('nut-bat-dau');
  const duongSauDatLai = ghiDuongBot(p);
  assert.notEqual(duongSauDatLai, duongDau);
  for (const xe of p.tran().xe.slice(1)) { xe.hp = 0; xe.conSong = false; }
  p.khung(1);
  p.nhan('nut-choi-lai');
  cacHat.push(p.tran().hatGiong);
  const duongDauLai = ghiDuongBot(p);
  assert.notEqual(duongDauLai, duongDau);
  assert.notEqual(duongDauLai, duongSauDatLai);
  assert.equal(new Set(cacHat).size, 3);
  assert.equal(p.cacTran.length, 3);
});

kiemTra('Nút Trận mới sau kết quả cũng bốc hạt giống mới', () => {
  const p = taoPhien();
  const hatDau = p.tran().hatGiong;
  const banDoDau = JSON.stringify(p.tran().tuong);
  p.nhan('nut-bat-dau');
  for (const xe of p.tran().xe.slice(1)) { xe.hp = 0; xe.conSong = false; }
  p.khung(1);
  p.nhan('nut-bat-dau');
  assert.notEqual(p.tran().hatGiong, hatDau);
  assert.notEqual(JSON.stringify(p.tran().tuong), banDoDau, 'Trận mới phải tạo bản đồ mới');
  assert.equal(p.cacTran.length, 2);
  assert.equal(p.tran().thoiGian, 0);
  assert.equal(nhanNut(p), 'Tạm dừng');
});

kiemTra('Người chơi bị loại thì báo thua kể cả khi bot khác cũng bị loại', () => {
  for (const doiThang of ['hoa', 'bot']) {
    const p = taoPhien();
    p.nhan('nut-bat-dau');
    p.tran().xe.forEach((xe, i) => {
      if (!(doiThang === 'bot' && i === 1)) { xe.hp = 0; xe.conSong = false; }
    });
    p.khung(1);
    assert.equal(p.lay('ket-qua').hidden, false);
    assert.equal(p.lay('tieu-de-ket-qua').textContent, 'Tiên Phong đã thua');
  }
});

kiemTra('Dừng khi người chơi thua dù còn nhiều bot; mô phỏng đóng băng và log ghi thua', () => {
  const p = taoPhien(); p.nhan('nut-bat-dau');
  p.tran().xe[0].hp = 0; p.tran().xe[0].conSong = false;
  p.khung(1);
  assert.equal(p.tran().ketQua, 'thua');
  assert(p.tran().xe.filter(x => x.conSong).length > 1);
  const truoc = JSON.stringify(p.tran()); p.khung(120);
  assert.equal(JSON.stringify(p.tran()), truoc);
  assert.equal(p.D.xuatNhatKy(p.tran()).ketQua, 'thua');
});

kiemTra('Đúng 5 phút tính hòa, kết quả và log đồng bộ, Đấu lại xóa kết quả cũ', () => {
  const p = taoPhien();
  for (const [i,x] of p.tran().xe.entries()) Object.assign(x, { x: 350 + i * 40, y: 580 });
  p.D.dangKyAI(() => ({ ga: 0, quay: 0, ban: false }));
  p.D.AIBot = () => ({ ga: 0, quay: 0, ban: false });
  p.tran().thoiGian = 300 - 1 / 120;
  p.nhan('nut-bat-dau'); p.khung(1);
  assert.equal(p.tran().thoiGian, 300); assert.equal(p.tran().ketQua, 'hoa');
  assert.equal(p.lay('tieu-de-ket-qua').textContent, 'Hòa · Hết 5 phút');
  const log = p.D.xuatNhatKy(p.tran());
  assert.equal(log.lyDoKetThuc, 'het-5-phut'); assert(log.baoCao.includes('Hòa: hết 5 phút'));
  const truoc = JSON.stringify(p.tran()); p.khung(100); assert.equal(JSON.stringify(p.tran()), truoc);
  p.nhan('nut-choi-lai'); assert.equal(p.tran().ketQua, null); assert.equal(p.tran().thoiGian, 0);
});

kiemTra('Thắng hoặc thua đúng bước chạm 5 phút được ưu tiên hơn hòa', () => {
  for (const thua of [true, false]) {
    const p = taoPhien(); p.tran().thoiGian = 300 - 1 / 120;
    for (const [i,x] of p.tran().xe.entries()) {
      Object.assign(x, { x: 360 + i * 35, y: 580 });
      if (thua ? i === 0 : i > 0) { x.hp = 0; x.conSong = false; }
    }
    p.nhan('nut-bat-dau'); p.khung(1);
    assert.equal(p.tran().ketQua, thua ? 'thua' : 'thang');
  }
});

kiemTra('Tự lưu được gọi cho thắng, thua, hòa và trước Đặt lại', () => {
  for (const ketQua of ['thang', 'thua', 'hoa']) {
    const p = taoPhien(), daGoi = [];
    p.D.tuDongLuuLog = t => { daGoi.push({ t, ketQua: t.ketQua }); };
    if (ketQua === 'hoa') p.tran().thoiGian = 300 - 1 / 120;
    else for (const [i,x] of p.tran().xe.entries()) {
      if (ketQua === 'thua' ? i === 0 : i > 0) { x.hp = 0; x.conSong = false; }
    }
    const tran = p.tran(); p.nhan('nut-bat-dau'); p.khung(1);
    assert.equal(daGoi.length, 1); assert.equal(daGoi[0].t, tran);
    assert.equal(daGoi[0].ketQua, ketQua);
    p.khung(60); assert.equal(daGoi.length, 1);
    p.nhan('nut-dat-lai'); assert.equal(daGoi.at(-1).t, tran);
    assert.notEqual(p.tran(), tran);
  }
});

kiemTra('Tự đấu lại mặc định tắt; không tự tạo trận khi chưa chọn', () => {
  const p = taoPhien(); assert.equal(p.lay('tu-dau-lai').checked, false);
  p.nhan('nut-bat-dau'); p.tran().xe[0].conSong = false; p.tran().xe[0].hp = 0; p.khung(1);
  const tran = p.tran(); p.nhipNen(10);
  assert.equal(p.tran(), tran); assert.equal(p.lay('dem-nguoc-dau-lai').hidden, true);
});

kiemTra('Thắng, thua, hòa đều đếm đủ 5 giây thực ở nền rồi đấu lại, giữ thiết lập', () => {
  for (const tocDo of [1, 2, 5, 8]) for (const kq of ['thang', 'thua', 'hoa']) {
    const p = taoPhien(); p.chon('ten-nguoi-choi', 'Xe thử'); p.chon('mau-nguoi-choi', '#112233');
    p.chon('cap-bot', 8); p.tocDo(tocDo);
    p.lay('tu-dau-lai').checked = true; p.lay('tu-dau-lai').phat('change');
    if (kq === 'hoa') p.tran().thoiGian = 300 - 1 / 120;
    else for (const [i,x] of p.tran().xe.entries()) if (kq === 'thua' ? i === 0 : i > 0) { x.hp = 0; x.conSong = false; }
    p.nhan('nut-bat-dau'); p.khung(1, 1000 / 60 / tocDo);
    const cu = p.tran(); assert.equal(cu.ketQua, kq);
    assert(p.lay('dem-nguoc-dau-lai').textContent.includes('5 giây'));
    p.taiLieu.hidden = true; p.nhipNen(4);
    assert.equal(p.tran(), cu); assert(p.lay('dem-nguoc-dau-lai').textContent.includes('1 giây'));
    p.nhipNen(1, 999); assert.equal(p.tran(), cu);
    p.nhipNen(1, 1); assert.notEqual(p.tran(), cu);
    assert.notEqual(p.tran().hatGiong, cu.hatGiong); assert.equal(p.tran().thoiGian, 0);
    assert.equal(p.tran().xe[0].ten, 'Xe thử'); assert.equal(p.tran().xe[0].mau, '#112233');
    assert.equal(p.tran().capBot, 8); assert.equal(nhanNut(p), 'Tạm dừng');
    assert.equal(p.lay('tu-dau-lai').checked, true);
    p.nhipNen(1, 100); assert(Math.abs(p.tran().thoiGian - .1 * tocDo) < 1e-6);
  }
});

kiemTra('Tệp Worker phát nhịp 100 ms độc lập, không truy cập DOM', () => {
  let nhip, chuKy; const thongDiep = [];
  vm.runInNewContext(fs.readFileSync(path.join(thuMuc, 'nhip-nen.js'), 'utf8'), {
    setInterval: (ham, ms) => { nhip = ham; chuKy = ms; },
    postMessage: noiDung => thongDiep.push(noiDung)
  }, { filename: 'nhip-nen.js' });
  assert.equal(chuKy, 100); nhip(); nhip();
  assert.deepEqual(thongDiep, ['nhip', 'nhip']);
});

kiemTra('Worker vẫn kết thúc và tự đấu lại khi vòng vẽ và hẹn giờ tab đều ngừng', () => {
  const p = taoPhien({ coWorker: true });
  assert.equal(p.cacLuongNen.length, 1);
  p.lay('tu-dau-lai').checked = true;
  p.nhan('nut-bat-dau'); p.taiLieu.hidden = true;
  p.tran().xe[0].conSong = false;
  const cu = p.tran();
  p.nhipWorker(1);
  assert.equal(cu.ketQua, 'thua');
  p.nhipWorker(49); assert.equal(p.tran(), cu);
  p.nhipWorker(1); assert.notEqual(p.tran(), cu);
  assert.equal(nhanNut(p), 'Tạm dừng');
  p.D.dangKyAI(() => ({ ga: 0, quay: 0, ban: false }));
  p.D.AIBot = () => ({ ga: 0, quay: 0, ban: false });
  p.nhipWorker(10);
  const truoc = p.tran().thoiGian;
  p.henGioNgay(); p.khung(1, 0);
  assert.equal(p.tran().thoiGian, truoc, 'Ba nguồn nhịp không cộng trùng thời gian');
  p.nhan('nut-bat-dau'); p.nhipWorker(100);
  assert.equal(p.tran().thoiGian, truoc, 'Worker tôn trọng tạm dừng thủ công');
});

kiemTra('Nhịp nền trễ không bắt đầu lại 5 giây khi xử lý bù thắng, thua hoặc hòa', () => {
  for (const tocDo of [1, 2, 5, 8]) for (const kq of ['thang', 'thua', 'hoa']) {
    const p = taoPhien(); p.lay('tu-dau-lai').checked = true; p.tocDo(tocDo);
    const cu = p.tran();
    if (kq === 'hoa') cu.thoiGian = 300 - 1 / 120;
    else for (const [i, xe] of cu.xe.entries()) if (kq === 'thua' ? i === 0 : i > 0) xe.conSong = false;
    p.nhan('nut-bat-dau'); p.taiLieu.hidden = true;
    p.troiGian(10000); // Không có bất cứ callback nào trong 10 giây.
    p.taiLieu.hidden = false; p.taiLieu.phat('visibilitychange');
    assert.equal(cu.ketQua, kq);
    assert.notEqual(p.tran(), cu, `Không đếm lại khi đã quá hạn: ${kq}, ${tocDo}×`);
    assert.equal(p.lay('dem-nguoc-dau-lai').hidden, true);
  }
});

kiemTra('Nhịp nền trễ chỉ đếm phần 5 giây còn lại và vẫn chờ lưu log', () => {
  const p = taoPhien(); p.lay('tu-dau-lai').checked = true;
  p.nhan('nut-bat-dau'); const cu = p.tran(); cu.xe[0].conSong = false;
  p.nhipNen(1, 3000);
  assert.equal(p.tran(), cu);
  assert(p.lay('dem-nguoc-dau-lai').textContent.includes('3 giây'));
  let luu = 'dang-luu'; p.D.layTrangThaiTuLuu = () => luu;
  p.nhipNen(1, 3000);
  assert.equal(p.tran(), cu); assert(p.lay('dem-nguoc-dau-lai').textContent.includes('chờ lưu'));
  luu = 'da-luu'; p.henGioNgay(); assert.notEqual(p.tran(), cu);
});

kiemTra('Worker bị chặn hoặc lỗi vẫn có hẹn giờ dự phòng', () => {
  for (const loiWorker of [true, false]) {
    const p = taoPhien({ coWorker: true, loiWorker });
    if (!loiWorker) { p.cacLuongNen[0].onerror(); assert(p.cacLuongNen[0].daDung); }
    p.nhan('nut-bat-dau'); p.tran().xe[0].conSong = false;
    p.lay('tu-dau-lai').checked = true;
    const cu = p.tran(); p.nhipNen(1, 100); p.nhipNen(5);
    assert.notEqual(p.tran(), cu);
  }
});

kiemTra('Xử lý bù nhiều lượt vẫn giữ đúng thời điểm kết thúc trận', () => {
  const p = taoPhien(); p.lay('tu-dau-lai').checked = true;
  p.D.dangKyAI(() => ({ ga: 0, quay: 0, ban: false }));
  p.D.AIBot = () => ({ ga: 0, quay: 0, ban: false });
  const buocGoc = p.D.buocMoPhong;
  p.D.buocMoPhong = (tran, dt, ai) => {
    if (tran.thoiGian >= 3) tran.xe[0].conSong = false;
    return buocGoc(tran, dt, ai);
  };
  p.nhan('nut-bat-dau'); const cu = p.tran();
  p.nhipNen(1, 10000);
  assert.equal(cu.ketThuc, false, 'Lượt đầu chỉ xử lý tối đa 120 bước');
  p.henGioNgay();
  assert.equal(cu.ketQua, 'thua');
  assert.notEqual(p.tran(), cu, 'Trận kết thúc khoảng giây 3, hạn đấu lại khoảng giây 8');
});

kiemTra('Tắt checkbox hủy đếm ngược; bật lại bắt đầu đủ 5 giây mới', () => {
  const p = taoPhien(); p.lay('tu-dau-lai').checked = true;
  p.nhan('nut-bat-dau'); p.tran().xe[0].conSong = false; p.khung(1); p.nhipNen(3);
  p.lay('tu-dau-lai').checked = false; p.lay('tu-dau-lai').phat('change');
  const cu = p.tran(); p.nhipNen(8); assert.equal(p.tran(), cu);
  p.lay('tu-dau-lai').checked = true; p.lay('tu-dau-lai').phat('change');
  p.nhipNen(4); assert.equal(p.tran(), cu);
  p.nhipNen(1); assert.notEqual(p.tran(), cu);
});

kiemTra('Đặt lại hoặc Đấu lại bằng tay hủy lịch cũ, không tạo thêm trận sau 5 giây', () => {
  for (const nut of ['nut-dat-lai', 'nut-choi-lai']) {
    const p = taoPhien(); p.lay('tu-dau-lai').checked = true;
    p.nhan('nut-bat-dau'); p.tran().xe[0].conSong = false; p.khung(1); p.nhipNen(2);
    p.nhan(nut); const moi = p.tran();
    p.D.dangKyAI(() => ({ ga:0, quay:0, ban:false })); p.D.AIBot = () => ({ ga:0, quay:0, ban:false });
    p.nhipNen(6); assert.equal(p.tran(), moi); assert.equal(p.lay('dem-nguoc-dau-lai').hidden, true);
  }
});

kiemTra('Chờ log lưu xong trước tự đấu lại; lỗi lưu giữ nguyên kết quả để tránh mất log', () => {
  const p = taoPhien(); let luu = 'dang-luu'; p.D.layTrangThaiTuLuu = () => luu;
  p.lay('tu-dau-lai').checked = true;
  p.nhan('nut-bat-dau'); p.tran().xe[0].conSong = false; p.khung(1);
  const cu = p.tran(); p.nhipNen(6); assert.equal(p.tran(), cu);
  assert(p.lay('dem-nguoc-dau-lai').textContent.includes('chờ lưu log'));
  luu = 'loi'; p.nhipNen(1); assert.equal(p.tran(), cu);
  assert(p.lay('dem-nguoc-dau-lai').textContent.includes('thất bại'));
  luu = 'da-luu'; p.nhipNen(1); assert.notEqual(p.tran(), cu);
});

kiemTra('Space/R hoạt động và bỏ qua nhập liệu, nút, phím giữ, tổ hợp', () => {
  const p = taoPhien();
  assert(p.phim(' ', 'Space').defaultPrevented);
  assert.equal(nhanNut(p), 'Tạm dừng');
  for (const target of [p.lay('so-bot'), p.lay('che-do'), p.lay('cap-bot'), p.taiLieu.createElement('input'), p.taiLieu.createElement('textarea')]) {
    assert.equal(p.phim(' ', 'Space', { target }).defaultPrevented, false);
    assert.equal(p.phim('r', 'KeyR', { target }).defaultPrevented, false);
    assert.equal(nhanNut(p), 'Tạm dừng');
  }
  const suaDuoc = p.taiLieu.createElement('div'); suaDuoc.isContentEditable = true;
  p.phim('r', 'KeyR', { target: suaDuoc });
  for (const them of [{ repeat: true }, { ctrlKey: true }, { metaKey: true }, { altKey: true }]) p.phim(' ', 'Space', them);
  assert.equal(nhanNut(p), 'Tạm dừng');
  for (const target of [p.lay('nut-bat-dau'), p.taiLieu.querySelector('summary')]) {
    assert.equal(p.phim(' ', 'Space', { target }).defaultPrevented, false);
    assert.equal(nhanNut(p), 'Tạm dừng');
    assert.equal(p.phim('r', 'KeyR', { target }).defaultPrevented, true);
    assert.equal(nhanNut(p), 'Bắt đầu');
    p.nhan('nut-bat-dau');
  }
  p.phim(' ', 'Space'); assert.equal(nhanNut(p), 'Tiếp tục');
  p.phim('R', 'KeyR'); assert.equal(nhanNut(p), 'Bắt đầu');
  assert.equal(p.tran().thoiGian, 0);
});

kiemTra('Chuyển tab vẫn chạy nền khi vòng vẽ dừng; quay lại không cộng thời gian hai lần', () => {
  const p = taoPhien();
  p.D.dangKyAI(() => ({ ga: 0, quay: 0, ban: false }));
  p.D.AIBot = () => ({ ga: 0, quay: 0, ban: false });
  p.nhan('nut-bat-dau'); p.khung(30);
  const gioCu = p.tran().thoiGian;
  p.taiLieu.hidden = true; p.taiLieu.phat('visibilitychange');
  assert.equal(nhanNut(p), 'Tạm dừng');
  p.nhipNen(10);
  assert(Math.abs(p.tran().thoiGian - gioCu - 10) < 1e-6);
  const truoc = p.tran().thoiGian;
  p.henGioNgay(); assert.equal(p.tran().thoiGian, truoc);
  p.taiLieu.hidden = false; p.taiLieu.phat('visibilitychange');
  p.khung(60);
  assert(Math.abs(p.tran().thoiGian - truoc - 1) < 1e-6);
});

kiemTra('Tạm dừng thủ công vẫn dừng khi chạy nền; đặt lại không giữ nợ thời gian', () => {
  const p = taoPhien(); p.nhan('nut-bat-dau'); p.khung(10); p.nhan('nut-bat-dau');
  const truoc = JSON.stringify(p.tran());
  p.taiLieu.hidden = true; p.taiLieu.phat('visibilitychange'); p.nhipNen(5);
  assert.equal(JSON.stringify(p.tran()), truoc);
  p.nhan('nut-dat-lai'); p.nhipNen(5); assert.equal(p.tran().thoiGian, 0);
  p.nhan('nut-bat-dau'); p.nhipNen(1, 100);
  assert(Math.abs(p.tran().thoiGian - .1) < 1e-6);
});

kiemTra('Đủ 5 phút ở nền vẫn hòa và gọi tự lưu đúng một lần', () => {
  const p = taoPhien();
  for (const [i,x] of p.tran().xe.entries()) Object.assign(x, { x: 350 + i * 40, y: 580 });
  p.D.dangKyAI(() => ({ ga: 0, quay: 0, ban: false }));
  p.D.AIBot = () => ({ ga: 0, quay: 0, ban: false });
  let daLuu = 0; p.D.tuDongLuuLog = () => { daLuu++; };
  p.nhan('nut-bat-dau'); p.taiLieu.hidden = true; p.taiLieu.phat('visibilitychange');
  p.nhipNen(300);
  assert.equal(p.tran().thoiGian, 300); assert.equal(p.tran().ketQua, 'hoa');
  assert.equal(daLuu, 1);
  const truoc = JSON.stringify(p.tran()); p.nhipNen(10);
  assert.equal(JSON.stringify(p.tran()), truoc); assert.equal(daLuu, 1);
});

kiemTra('Hẹn giờ nền vẫn chạy khi cửa sổ mất tập trung nhưng tab chưa bị đánh dấu ẩn', () => {
  const p = taoPhien(); p.nhan('nut-bat-dau'); p.nhipNen(1);
  assert(Math.abs(p.tran().thoiGian - 1) < 1e-6);
  assert(p.cacBuoc.every(dt => dt === 1 / 60));
});

kiemTra('Đổi kích thước cập nhật Canvas theo DPR, giữ nguyên trận', () => {
  const p = taoPhien();
  const truoc = JSON.stringify(p.tran());
  p.cuaSo.devicePixelRatio = 3;
  p.lay('ban-do').rongGiaLap = 420;
  p.cuaSo.phat('resize');
  assert.equal(p.lay('ban-do').width, 840);
  assert.equal(p.lay('ban-do').height, 840);
  assert.equal(JSON.stringify(p.tran()), truoc);
});

function nhanToanManHinh(p, nhan, dangPhongTo) {
  const nut = p.lay('nut-toan-man-hinh');
  assert.equal(nut.querySelector('span').textContent, nhan);
  assert.equal(nut.getAttribute('aria-label'), nhan);
  assert.equal(nut.getAttribute('aria-pressed'), String(dangPhongTo));
  assert.equal(nut.querySelector('use').getAttribute('href'), dangPhongTo ? '#i-collapse' : '#i-expand');
}

function chupTrangThai(p) {
  return {
    tran: p.tran(), noiDung: JSON.stringify(p.tran()), soTran: p.cacTran.length,
    nhan: nhanNut(p), trangThai: p.lay('trang-thai-tran').textContent,
    thietLap: ['so-bot', 'che-do', 'cap-bot'].map(id => [p.lay(id).value, p.lay(id).disabled]),
    tocDo: p.taiLieu.querySelectorAll('[data-toc-do]').map(nut => nut.getAttribute('aria-pressed')),
    duDoan: p.lay('hien-du-doan').checked
  };
}

function giuNguyenTrangThai(p, truoc) {
  assert.equal(p.tran(), truoc.tran, 'Phóng to không thay đối tượng trận');
  assert.equal(JSON.stringify(p.tran()), truoc.noiDung, 'Phóng to không đổi thời gian, địa hình, xe hay đạn');
  assert.equal(p.cacTran.length, truoc.soTran, 'Phóng to không tạo trận mới');
  assert.equal(nhanNut(p), truoc.nhan);
  assert.equal(p.lay('trang-thai-tran').textContent, truoc.trangThai);
  assert.deepEqual(['so-bot', 'che-do', 'cap-bot'].map(id => [p.lay(id).value, p.lay(id).disabled]), truoc.thietLap);
  assert.deepEqual(p.taiLieu.querySelectorAll('[data-toc-do]').map(nut => nut.getAttribute('aria-pressed')), truoc.tocDo);
  assert.equal(p.lay('hien-du-doan').checked, truoc.duDoan);
}

(async () => {
  kiemTra('Khung toàn màn hình chứa bản đồ và đủ nút điều khiển dùng được khi phóng to', () => {
    const p = taoPhien();
    const khung = p.lay('khung-dau-truong');
    for (const id of ['ban-do', 'nut-toan-man-hinh', 'nut-chay-toan-man-hinh', 'nut-dat-lai-toan-man-hinh']) {
      assert(khung.contains(p.lay(id)), `${id} phải ở trong phần tử toàn màn hình`);
    }
    for (const id of ['nut-toan-man-hinh', 'nut-chay-toan-man-hinh', 'nut-dat-lai-toan-man-hinh']) {
      assert.equal(p.lay(id).tagName, 'BUTTON');
      assert.equal(p.lay(id).getAttribute('type'), 'button');
    }
    nhanToanManHinh(p, 'Toàn màn hình', false);
  });

  await kiemTraBatDongBo('Vào/thoát toàn màn hình gốc cập nhật nút và Canvas, giữ trận đang chạy cùng thiết lập', async () => {
    const p = taoPhien({ toanManHinhGoc: true });
    p.chon('so-bot', 2); p.chon('cap-bot', 9); p.chon('che-do', 1);
    p.tocDo(2);
    p.lay('hien-du-doan').checked = false; p.lay('hien-du-doan').phat('change');
    p.nhan('nut-bat-dau'); p.khung(20);
    const truoc = chupTrangThai(p);
    p.cuaSo.devicePixelRatio = 2;
    p.lay('ban-do').rongGiaLap = 950;
    p.nhan('nut-toan-man-hinh');
    assert.equal(p.lay('nut-toan-man-hinh').disabled, true, 'Chờ API xong trước khi nhận lần nhấn kế');
    await p.doiTacVu();
    assert.equal(p.toanManHinh.soLanVao, 1);
    assert.equal(p.toanManHinh.doiTuong, p.lay('khung-dau-truong'));
    assert.equal(p.taiLieu.fullscreenElement, p.lay('khung-dau-truong'));
    nhanToanManHinh(p, 'Thoát toàn màn hình', true);
    assert.equal(p.lay('nut-toan-man-hinh').disabled, false);
    assert.equal(p.lay('ban-do').width, 1900); assert.equal(p.lay('ban-do').height, 1900);
    giuNguyenTrangThai(p, truoc);
    const gioTruoc = p.tran().thoiGian;
    p.khung(1);
    assert(p.tran().thoiGian > gioTruoc, 'Trận tiếp tục chạy sau khi phóng to');
    const truocThoat = chupTrangThai(p);
    p.lay('ban-do').rongGiaLap = 660;
    p.nhan('nut-toan-man-hinh'); await p.doiTacVu();
    assert.equal(p.toanManHinh.soLanThoat, 1);
    assert.equal(p.taiLieu.fullscreenElement, null);
    nhanToanManHinh(p, 'Toàn màn hình', false);
    assert.equal(p.lay('ban-do').width, 1320); assert.equal(p.lay('ban-do').height, 1320);
    giuNguyenTrangThai(p, truocThoat);
    assert(!p.lay('khung-dau-truong').classList.contains('toan-man-hinh-du-phong'));
    assert(!p.taiLieu.body.classList.contains('dang-phong-to'));
  });

  await kiemTraBatDongBo('Thoát bằng Esc của trình duyệt đồng bộ nhãn và nút, không tạo lại trận', async () => {
    const p = taoPhien({ toanManHinhGoc: true });
    p.nhan('nut-toan-man-hinh'); await p.doiTacVu();
    const truoc = chupTrangThai(p);
    // Esc gốc do trình duyệt xử lý; ứng dụng chỉ nhận fullscreenchange.
    p.taiLieu.fullscreenElement = null;
    p.taiLieu.phat('fullscreenchange');
    nhanToanManHinh(p, 'Toàn màn hình', false);
    assert.equal(p.toanManHinh.soLanThoat, 0);
    giuNguyenTrangThai(p, truoc);
    p.nhan('nut-toan-man-hinh'); await p.doiTacVu();
    assert.equal(p.toanManHinh.soLanVao, 2, 'Sau Esc có thể phóng to lại');
    nhanToanManHinh(p, 'Thoát toàn màn hình', true);
  });

  await kiemTraBatDongBo('Trình duyệt thiếu API dùng phóng to dự phòng; nút và Esc thu lại, giữ lớp có sẵn', async () => {
    const p = taoPhien();
    p.taiLieu.body.classList.add('lop-co-san');
    p.lay('khung-dau-truong').classList.add('lop-khung-co-san');
    const truoc = chupTrangThai(p);
    p.nhan('nut-toan-man-hinh'); await p.doiTacVu();
    nhanToanManHinh(p, 'Thoát phóng to', true);
    assert(p.lay('khung-dau-truong').classList.contains('toan-man-hinh-du-phong'));
    assert(p.taiLieu.body.classList.contains('dang-phong-to'));
    assert.equal(p.taiLieu.fullscreenElement, null);
    assert.equal(p.lay('nut-toan-man-hinh').disabled, false);
    giuNguyenTrangThai(p, truoc);
    p.nhan('nut-toan-man-hinh'); await p.doiTacVu();
    nhanToanManHinh(p, 'Toàn màn hình', false);
    assert(!p.lay('khung-dau-truong').classList.contains('toan-man-hinh-du-phong'));
    assert(!p.taiLieu.body.classList.contains('dang-phong-to'));
    for (const target of [p.lay('cap-bot'), p.lay('hien-du-doan'), p.taiLieu.body]) {
      p.nhan('nut-toan-man-hinh'); await p.doiTacVu();
      nhanToanManHinh(p, 'Thoát phóng to', true);
      assert(p.phim('Escape', 'Escape', { target }).defaultPrevented, 'Esc phải thoát cả khi đang chọn cấp bot hoặc ô dự đoán');
      nhanToanManHinh(p, 'Toàn màn hình', false);
      assert(!p.lay('khung-dau-truong').classList.contains('toan-man-hinh-du-phong'));
      assert(!p.taiLieu.body.classList.contains('dang-phong-to'));
    }
    assert(p.taiLieu.body.classList.contains('lop-co-san'));
    assert(p.lay('khung-dau-truong').classList.contains('lop-khung-co-san'));
    assert(!p.taiLieu.body.classList.contains('dang-phong-to'));
    giuNguyenTrangThai(p, truoc);
  });

  await kiemTraBatDongBo('Yêu cầu toàn màn hình bị từ chối hoặc bị tắt vẫn phóng to và thu lại an toàn', async () => {
    for (const tuChoi of [true, false]) {
      const p = taoPhien({ toanManHinhGoc: true, tuChoiVao: tuChoi });
      if (!tuChoi) p.taiLieu.fullscreenEnabled = false;
      const truoc = chupTrangThai(p);
      p.nhan('nut-toan-man-hinh'); await p.doiTacVu();
      nhanToanManHinh(p, 'Thoát phóng to', true);
      assert.equal(p.toanManHinh.soLanVao, tuChoi ? 1 : 0);
      assert.equal(p.taiLieu.fullscreenElement, null);
      assert.equal(p.lay('nut-toan-man-hinh').disabled, false);
      assert(p.lay('thong-bao-doc').textContent.includes('phóng to trong cửa sổ'));
      giuNguyenTrangThai(p, truoc);
      p.nhan('nut-toan-man-hinh'); await p.doiTacVu();
      nhanToanManHinh(p, 'Toàn màn hình', false);
      giuNguyenTrangThai(p, truoc);
    }
  });

  await kiemTraBatDongBo('Lỗi thoát API không kẹt nút; sự kiện thoát ngoài vẫn khôi phục giao diện', async () => {
    const p = taoPhien({ toanManHinhGoc: true, tuChoiThoat: true });
    p.nhan('nut-toan-man-hinh'); await p.doiTacVu();
    const truoc = chupTrangThai(p);
    p.nhan('nut-toan-man-hinh'); await p.doiTacVu();
    assert.equal(p.toanManHinh.soLanThoat, 1);
    nhanToanManHinh(p, 'Thoát toàn màn hình', true);
    assert.equal(p.lay('nut-toan-man-hinh').disabled, false);
    assert(!p.lay('khung-dau-truong').classList.contains('toan-man-hinh-du-phong'));
    assert(p.lay('thong-bao-doc').textContent.includes('Esc'));
    p.taiLieu.fullscreenElement = null; p.taiLieu.phat('fullscreenchange');
    nhanToanManHinh(p, 'Toàn màn hình', false);
    giuNguyenTrangThai(p, truoc);
  });

  await kiemTraBatDongBo('Nút nhanh Bắt đầu/Tạm dừng/Đặt lại và Trận mới dùng được khi toàn màn hình', async () => {
    const p = taoPhien({ toanManHinhGoc: true });
    p.chon('so-bot', 2); p.chon('cap-bot', 8); p.chon('che-do', 1);
    p.nhan('nut-toan-man-hinh'); await p.doiTacVu();
    const nhanNhanh = () => p.lay('nut-chay-toan-man-hinh').querySelector('span').textContent;
    assert.equal(nhanNhanh(), 'Bắt đầu');
    p.nhan('nut-chay-toan-man-hinh');
    assert.equal(nhanNhanh(), 'Tạm dừng'); assert.equal(nhanNut(p), 'Tạm dừng');
    p.khung(20);
    assert(p.tran().thoiGian > 0);
    p.nhan('nut-chay-toan-man-hinh');
    assert.equal(nhanNhanh(), 'Tiếp tục'); assert.equal(nhanNut(p), 'Tiếp tục');
    const dung = JSON.stringify(p.tran()); p.khung(30); assert.equal(JSON.stringify(p.tran()), dung);
    p.nhan('nut-bat-dau'); assert.equal(nhanNhanh(), 'Tạm dừng');
    const tranCu = p.tran();
    p.nhan('nut-dat-lai-toan-man-hinh');
    assert.notEqual(p.tran(), tranCu); assert.notEqual(p.tran().hatGiong, tranCu.hatGiong);
    assert.equal(p.tran().thoiGian, 0); assert.equal(p.tran().xe.length, 3); assert.equal(p.tran().capBot, 8);
    assert(p.tran().xe.every(xe => xe.hp === 1));
    assert.equal(nhanNhanh(), 'Bắt đầu'); assert.equal(nhanNut(p), 'Bắt đầu'); khoaThietLap(p, false);
    assert.equal(p.taiLieu.fullscreenElement, p.lay('khung-dau-truong'), 'Đặt lại không thoát phóng to');
    p.nhan('nut-chay-toan-man-hinh');
    for (const xe of p.tran().xe.slice(1)) { xe.hp = 0; xe.conSong = false; }
    p.khung(1); assert.equal(nhanNhanh(), 'Trận mới');
    const tranKetThuc = p.tran();
    p.nhan('nut-chay-toan-man-hinh');
    assert.notEqual(p.tran(), tranKetThuc); assert.equal(nhanNhanh(), 'Tạm dừng');
    assert.equal(p.tran().capBot, 8); assert.equal(p.tran().xe.length, 3);
    assert.equal(p.taiLieu.fullscreenElement, p.lay('khung-dau-truong'));
  });

  kiemTra('Canvas luôn vuông, DPR giới hạn 2 và không có kích thước bằng 0 khi thu/phóng', () => {
    const p = taoPhien();
    const truoc = chupTrangThai(p);
    for (const [rong, tyLe, ketQua] of [[700, 1, 700], [660, 1.25, 825], [508, 2, 1016], [364, 3, 728], [0, 2, 1]]) {
      p.lay('ban-do').rongGiaLap = rong; p.cuaSo.devicePixelRatio = tyLe;
      p.cuaSo.phat('resize');
      assert.equal(p.lay('ban-do').width, ketQua); assert.equal(p.lay('ban-do').height, ketQua);
      giuNguyenTrangThai(p, truoc);
    }
  });

  kiemTra('Sân lấy chiều ngang của nội dung, giữ tỉ lệ vuông và không co theo chiều cao cửa sổ', () => {
    const p = taoPhien();
    const luoi = p.lay('khung-tran-dau');
    const khung = p.lay('khung-dau-truong');
    const dau = khung.querySelector('.arena-heading');
    const chan = khung.querySelector('.arena-footer');
    const navbar = p.taiLieu.querySelector('.toolbar');
    const kieuNavbarCu = JSON.stringify(navbar.style);
    const truoc = chupTrangThai(p);
    // Đây là số đo DOM đầu vào, không phải kết quả đo CSS bởi trình duyệt.
    for (const [rong, cao, rongLuoi, rongSan, viTriDau, caoDau, caoChan] of [
      [1920, 1080, 1072, 734, 160, 44, 40], [1920, 500, 1072, 734, 160, 44, 40],
      [1366, 768, 1000, 662, 160, 44, 40], [390, 844, 364, 364, 280, 64, 54],
      [1366, 620, 1000, 662, 210, 76, 56]
    ]) {
      Object.assign(p.cuaSo, { innerWidth: rong, innerHeight: cao, scrollY: 0 });
      luoi.rongGiaLap = rongLuoi; luoi.dauGiaLap = viTriDau;
      khung.rongGiaLap = rongSan; p.lay('ban-do').rongGiaLap = rongSan;
      dau.offsetHeight = caoDau; chan.offsetHeight = caoChan;
      p.cuaSo.phat('resize');
      const canh = parseFloat(luoi.style['--canh-san']);
      assert.equal(canh, rongSan, 'Bảng trạng thái bám chiều rộng thực tế của sân');
      assert.equal(p.lay('ban-do').width, p.lay('ban-do').height, 'Tỉ lệ bản đồ luôn 1:1');
      assert.equal(p.lay('ban-do').width, rongSan);
      assert.equal(JSON.stringify(navbar.style), kieuNavbarCu, 'Không sửa kích thước navbar');
      giuNguyenTrangThai(p, truoc);
    }
    // Cuộn trang không được làm sân tự phình to vì top tương đối thay đổi.
    const canhCu = luoi.style['--canh-san'];
    luoi.dauGiaLap -= 100; p.cuaSo.scrollY = 100; p.cuaSo.phat('resize');
    assert.equal(luoi.style['--canh-san'], canhCu);
  });

  await kiemTraBatDongBo('Phóng to tận dụng màn hình và tính đủ phần đầu/chân sân khi xuống dòng', async () => {
    for (const coAPI of [true, false]) {
      const p = taoPhien({ toanManHinhGoc: coAPI });
      const khung = p.lay('khung-dau-truong');
      Object.assign(p.cuaSo, { innerWidth: 1920, innerHeight: 1080, scrollY: 0 });
      khung.querySelector('.arena-heading').offsetHeight = 44;
      khung.querySelector('.arena-footer').offsetHeight = 40;
      const truoc = chupTrangThai(p);
      p.nhan('nut-toan-man-hinh'); await p.doiTacVu();
      let canh = parseFloat(khung.style['--canh-toan-man-hinh']);
      assert(canh > 700, 'Phóng to được dùng nhiều diện tích hơn giới hạn thường');
      assert(canh <= 1920 - 24 && canh + 44 + 40 + 24 <= 1080);
      p.cuaSo.innerWidth = 390; p.cuaSo.innerHeight = 844;
      khung.querySelector('.arena-heading').offsetHeight = 96;
      khung.querySelector('.arena-footer').offsetHeight = 60;
      p.cuaSo.phat('resize');
      canh = parseFloat(khung.style['--canh-toan-man-hinh']);
      assert(canh <= 390 - 24 && canh + 96 + 60 + 24 <= 844);
      giuNguyenTrangThai(p, truoc);
    }
  });

  await kiemTraBatDongBo('Đọc lại tệp JSON và từ chối tệp sai, không đổi trận hiện tại', async () => {
    const p = taoPhien();
    const log = p.D.xuatNhatKy(p.tran());
    log.xeCuoi[0].ten = 'Xe trong log cũ';
    const tran = p.tran(), truoc = JSON.stringify(tran);
    const o = p.lay('tep-log');
    o.files = [{ name: 'tran-cu.json', size: 1000, text: async () => JSON.stringify(log) }];
    o.phat('change'); await p.doiTacVu();
    assert(p.lay('phan-tich-log').textContent.includes('Xe trong log cũ'));
    assert.equal(JSON.stringify(tran), truoc);
    assert.equal(p.tran(), tran);
    o.files = [{ name: 'sai.json', size: 5, text: async () => '{}' }];
    o.phat('change'); await p.doiTacVu();
    assert(p.lay('trang-thai-log').textContent.includes('Không đọc được log'));
  });

  console.log(`\nKết quả: ${soDat} nhóm đạt, ${soLoi} nhóm lỗi.`);
  console.log('Phạm vi: thực thi mã và sự kiện bằng DOM/Canvas giả lập; chưa xác minh hiển thị trong trình duyệt thật.');
  process.exitCode = soLoi ? 1 : 0;
})().catch(loi => { console.error(loi.stack); process.exitCode = 1; });
