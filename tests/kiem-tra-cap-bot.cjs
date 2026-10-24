'use strict';

// Kiểm tra hành vi trên tình huống cố định; không giả định cấp cao thắng mọi trận.
const path = require('node:path');
const assert = require('node:assert/strict');
const { performance } = require('node:perf_hooks');
// Nạp mã dự án đáng tin cậy trong ngữ cảnh Node gốc để số đo CPU không gồm
// chi phí tra cứu biến toàn cục qua lớp cô lập VM. Không cần trình duyệt/DOM.
globalThis.window = globalThis;
for (const tep of ['vat-ly.js', 'ai.js']) {
  require(path.join(__dirname, '..', tep));
}
const D = globalThis.DauTruong;
const H = D.hangSo;
const sao = giaTri => JSON.parse(JSON.stringify(giaTri));
let soDat = 0;
let soLoi = 0;

function kiemTra(ten, ham) {
  if (process.env.LOC_KIEM_TRA_CAP && !ten.includes(process.env.LOC_KIEM_TRA_CAP)) return;
  const dau = performance.now();
  try { ham(); soDat++; console.log(`ĐẠT ${ten} (${Math.round(performance.now() - dau)} ms)`); }
  catch (loi) { soLoi++; console.error(`LỖI ${ten}\n${loi.stack}`); }
}

function tinhHuong(cap, hatGiong = 42) {
  const tran = D.taoTranDau({ soBot: 1, capBot: cap, hp: 3, hatGiong });
  tran.tuong = [];
  const bot = tran.xe[1];
  const dich = tran.xe[0];
  Object.assign(bot, { x: 300, y: 300, goc: 0, gocNong: 0, vx: 0, vy: 0 });
  Object.assign(dich, { x: 700, y: 300, goc: Math.PI / 2, gocNong: Math.PI / 2, vx: 0, vy: 100 });
  return { tran, bot, dich };
}

function diChuyen(xe, lenh, thoiGian, tuong = []) {
  let viTri = { x: xe.x, y: xe.y, goc: xe.goc };
  const soBuoc = Math.round(thoiGian * 600);
  for (let i = 0; i < soBuoc; i++) viTri = D.tinhBuocXe(viTri, lenh, thoiGian / soBuoc, tuong);
  return viTri;
}

kiemTra('Mười cấp có phản ứng, sai số, đón đầu và tầm nhìn tăng dần đúng chiều', () => {
  const cacCap = Array.from({ length: 10 }, (_, i) => D.cauHinhCapBot(i + 1));
  for (let i = 1; i < cacCap.length; i++) {
    const cu = cacCap[i - 1], moi = cacCap[i];
    assert(moi.trePhanUng <= cu.trePhanUng);
    assert(moi.saiSoNgam < cu.saiSoNgam);
    assert.equal(moi.tyLeDonDau, 1);
    assert(moi.chanTroi >= cu.chanTroi);
    if (moi.cap >= 4) assert(moi.chanTroi > cu.chanTroi);
    assert(moi.soUngVien >= cu.soUngVien);
    if (moi.cap >= 4) assert(moi.soUngVien > cu.soUngVien);
  }
  assert.equal(cacCap[9].chanTroi, 2.4);
  assert.equal(cacCap[9].soUngVien, 33);
  assert.equal(cacCap[9].tyLeDonDau, 1);
  assert.equal(cacCap[0].neDan, true);
  assert.equal(cacCap[3].neDan, true);
  assert.equal(cacCap[6].chienThuat, true);
  assert(cacCap[0].chanTroi > 1.8 && cacCap[0].soUngVien > 15);
  assert(cacCap[0].saiSoNgam < 0.006);
  assert.deepEqual(cacCap.slice(0, 5).map(c => c.capSucManh), [11, 12, 13, 14, 15]);
  assert.equal(cacCap[9].capSucManh, 20);
  assert(cacCap.every(c => c.trePhanUng >= H.chuKyAI));
});

kiemTra('Cấu hình được giới hạn, đầu vào lỗi về cấp 5 và là dữ liệu độc lập', () => {
  for (const giaTri of [undefined, null, '', '   ', NaN, Infinity, true, 'không hợp lệ']) {
    assert.equal(D.cauHinhCapBot(giaTri).cap, 5);
  }
  assert.equal(D.cauHinhCapBot(-5).cap, 1);
  assert.equal(D.cauHinhCapBot(20).cap, 10);
  assert.equal(D.cauHinhCapBot(7.6).cap, 8);
  const cauHinh = D.cauHinhCapBot(10);
  cauHinh.chanTroi = 999;
  assert.equal(D.cauHinhCapBot(10).chanTroi, 2.4);
});

kiemTra('Bot cấp cao ngắm đón đầu mục tiêu ngang và giảm sai lệch thực tế', () => {
  let saiSoCap1 = 0;
  let saiSoCap10 = 0;
  // Nghiệm chặn đầu nòng dài 25 px, mục tiêu ở (700,300), vận tốc (0,100).
  const a = 100 * 100 - H.tocDoDan * H.tocDoDan;
  const b = -2 * H.tocDoDan * 25;
  const c = 400 * 400 - 25 * 25;
  const t = (-b - Math.sqrt(b * b - 4 * a * c)) / (2 * a);
  const gocDung = Math.atan2(100 * t, 400);
  for (let hat = 1; hat <= 20; hat++) {
    const thap = tinhHuong(1, hat);
    const cao = tinhHuong(10, hat);
    const a = D.AIBot(thap.bot, thap.tran);
    const b = D.AIBot(cao.bot, cao.tran);
    saiSoCap1 += Math.abs(D.chuanHoaGoc(a.gocNong - gocDung));
    saiSoCap10 += Math.abs(D.chuanHoaGoc(b.gocNong - gocDung));
    assert.equal(thap.bot.boNhoAI.phanTichBot.diemNgam.y > 370, true);
    assert(cao.bot.boNhoAI.phanTichBot.diemNgam.y > 370);
    assert(Math.abs(b.gocNong - gocDung) <= D.cauHinhCapBot(10).saiSoNgam + 1e-8);
  }
  assert(saiSoCap10 < saiSoCap1 * 0.12);
});

kiemTra('Mỗi cấp giữ lệnh đúng độ trễ, không rút ngẫu nhiên mỗi khung hình', () => {
  for (const cap of [1, 5, 10]) {
    const { tran, bot, dich } = tinhHuong(cap);
    const lenhDau = sao(D.AIBot(bot, tran));
    const trangThaiNgauNhien = tran._trangThaiNgauNhien;
    const lucNghi = bot.boNhoAI.nghiTiepLuc;
    dich.y += 80;
    tran.thoiGian = lucNghi - 0.01;
    assert.deepEqual(sao(D.AIBot(bot, tran)), lenhDau);
    assert.equal(tran._trangThaiNgauNhien, trangThaiNgauNhien);
    tran.thoiGian = lucNghi + 0.001;
    const lenhMoi = D.AIBot(bot, tran);
    assert.notEqual(lenhMoi.gocNong, lenhDau.gocNong);
    assert(bot.boNhoAI.nghiTiepLuc > tran.thoiGian);
  }
});

kiemTra('Dự đoán quỹ đạo tránh được đạn đang cắt đường di chuyển', () => {
  const thap = tinhHuong(1);
  const cao = tinhHuong(10);
  for (const tinh of [thap, cao]) {
    Object.assign(tinh.bot, { x: 480, y: 480, goc: 0 });
    Object.assign(tinh.dich, { x: 800, y: 760, vx: 0, vy: 0, gocNong: Math.PI / 2 });
  }
  const lenhThap = D.AIBot(thap.bot, thap.tran);
  const viTriGap = diChuyen(thap.bot, lenhThap, 0.8);
  const vx = viTriGap.x < 500 ? -H.tocDoDan : H.tocDoDan;
  const dan = { id: 1, chuId: cao.dich.id, x: viTriGap.x - vx * 0.8,
    y: viTriGap.y, vx, vy: 0, tuoi: 0 };
  cao.tran.dan = [dan];
  const lenhCao = D.AIBot(cao.bot, cao.tran);
  function khoangCachNhoNhat(xe, lenh, chuoi) {
    let nhoNhat = Infinity;
    let viTri = { x: xe.x, y: xe.y, goc: xe.goc };
    for (let i = 0; i <= 600; i++) {
      const t = i / 600;
      nhoNhat = Math.min(nhoNhat, Math.hypot(viTri.x - (dan.x + dan.vx * t), viTri.y - dan.y));
      viTri = D.tinhBuocXe(viTri, chuoi ? (chuoi.find(l => t < l.den) || chuoi.at(-1)) : lenh, 1 / 600, []);
    }
    return nhoNhat;
  }
  const ganThap = khoangCachNhoNhat(thap.bot, lenhThap);
  const ganCao = khoangCachNhoNhat(cao.bot, lenhCao, cao.bot.boNhoAI.phanTichBot.chuoiLenh);
  assert(ganThap < H.banKinhXe + H.banKinhDan);
  assert(ganCao > H.banKinhXe + H.banKinhDan + 5, `Cấp cao còn quá gần đạn: ${ganCao}`);
  assert(ganCao > ganThap + 25);
  assert(cao.bot.boNhoAI.phanTichBot.soDanTheoDoi >= 1);
});

kiemTra('Cấp cao ít máu chọn đường rút xa hơn và sử dụng chiến thuật phòng thủ', () => {
  const khoe = tinhHuong(10, 185);
  const yeu = tinhHuong(10, 185);
  for (const tinh of [khoe, yeu]) {
    Object.assign(tinh.bot, { x: 480, y: 480, goc: 0 });
    Object.assign(tinh.dich, { x: 760, y: 480, vx: 0, vy: 0, gocNong: Math.PI / 2 });
  }
  yeu.bot.hp = 1;
  D.AIBot(khoe.bot, khoe.tran);
  D.AIBot(yeu.bot, yeu.tran);
  const cuoiKhoe = khoe.bot.boNhoAI.phanTichBot.duongChon.at(-1);
  const cuoiYeu = yeu.bot.boNhoAI.phanTichBot.duongChon.at(-1);
  const tam = viTri => Math.hypot(viTri.x - 760, viTri.y - 480);
  assert(tam(cuoiYeu) > tam(cuoiKhoe) + 20, `Máu ít chưa giữ khoảng cách: ${tam(cuoiYeu)} / ${tam(cuoiKhoe)}`);
  assert.match(yeu.bot.boNhoAI.phanTichBot.chienThuat, /Rút lui/);
});

kiemTra('Cấp cao ưu tiên mục tiêu ít máu đang lộ thiên', () => {
  const tran = D.taoTranDau({ soBot: 2, capBot: 10, hp: 3, hatGiong: 42 });
  tran.tuong = [];
  const bot = tran.xe[1];
  const gan = tran.xe[0];
  const yeu = tran.xe[2];
  Object.assign(bot, { x: 480, y: 480, goc: 0 });
  Object.assign(gan, { x: 720, y: 480, vx: 0, vy: 0 });
  Object.assign(yeu, { x: 480, y: 780, vx: 0, vy: 0, hp: 1 });
  D.AIBot(bot, tran);
  assert.equal(bot.boNhoAI.mucTieuId, yeu.id);
});

kiemTra('Không bắn xuyên tường và khóa cò an toàn cả khi lệnh đang giữ', () => {
  for (let cap = 1; cap <= 10; cap++) {
    const { tran, bot, dich } = tinhHuong(cap);
    Object.assign(dich, { vx: 0, vy: 0 });
    assert.equal(D.AIBot(bot, tran).ban, true);
    tran.tuong.push({ x: 450, y: 150, rong: 80, cao: 300 });
    tran.thoiGian = 0.01;
    assert.equal(D.AIBot(bot, tran).ban, false);
    tran.thoiGian = 1;
    assert.equal(D.AIBot(bot, tran).ban, false);
    dich.conSong = false;
    assert.equal(D.AIBot(bot, tran).ban, false, 'Không có đối thủ thì không tự bắn');
  }
});

kiemTra('Cấp 6 tìm điểm đi vòng khi mục tiêu bị che, cấp 5 chưa có bộ đi vòng', () => {
  for (const cap of [5, 6]) {
    const { tran, bot, dich } = tinhHuong(cap);
    Object.assign(bot, { x: 300, y: 480 });
    Object.assign(dich, { x: 700, y: 480, vx: 0, vy: 0 });
    tran.tuong = [{ x: 450, y: 400, rong: 60, cao: 160 }];
    D.AIBot(bot, tran);
    const p = bot.boNhoAI.phanTichBot;
    if (cap === 6) { assert(p.diemDen); assert.equal(p.soUngVien, D.cauHinhCapBot(cap).soUngVien + 4); }
    else assert.equal(p.diemDen, null);
  }
});

kiemTra('Ngay cấp 1 mới cũng chọn đường tránh đạn thật sắp cắt ngang', () => {
  for (const cap of [1, 5, 10]) {
    const { tran, bot, dich } = tinhHuong(cap);
    Object.assign(bot, { x: 480, y: 480, goc: Math.PI / 2 });
    Object.assign(dich, { x: 800, y: 800, vx: 0, vy: 0, gocNong: 0 });
    tran.dan = [{ id: 91, x: 300, y: 480, vx: H.tocDoDan, vy: 0, chuId: dich.id, tuoi: 0 }];
    const lenh = D.AIBot(bot, tran), p = bot.boNhoAI.phanTichBot;
    assert.equal(p.satThuongGan, 0); assert.notEqual(lenh.ga, 0);
    let x = { x: bot.x, y: bot.y, goc: bot.goc };
    let t = 0;
    for (const q of p.duongChon.slice(1)) {
      const dt = q.t - t, soBuoc = Math.ceil(dt * 60 - 1e-6);
      for (let i = 0; i < soBuoc; i++) {
        const luc = t + i * dt / soBuoc;
        const l = p.chuoiLenh.find(l => luc < l.den - 1e-6) || p.chuoiLenh.at(-1);
        x = D.tinhBuocXe(x, l, dt / soBuoc, []);
      }
      assert(Math.hypot(x.x - q.x, x.y - q.y) < 1e-6, 'Đường né khớp chuỗi lệnh và bước vật lý');
      t = q.t;
    }
  }
});

kiemTra('Cấp 7 chủ động bảo toàn mạng khi đối thủ sát bên và sắp bắn, dù còn 3 HP', () => {
  for (const cap of [6, 7]) {
    const { tran, bot, dich } = tinhHuong(cap);
    Object.assign(bot, { x: 480, y: 480 });
    Object.assign(dich, { x: 620, y: 480, vx: 0, vy: 0, thoiGianNap: 0.1 });
    D.AIBot(bot, tran);
    assert.equal(bot.hp, 3);
    assert.equal(bot.boNhoAI.rutLuiBot, cap === 7);
  }
});

kiemTra('Điểm rút còn hạn bị hủy khi đường đi đã lọt vào đối thủ mới áp sát', () => {
  const { tran, bot, dich } = tinhHuong(7);
  Object.assign(bot, { x: 480, y: 480, hp: 1 });
  Object.assign(dich, { x: 480, y: 620, vx: 0, vy: 0, thoiGianNap: 0 });
  bot.boNhoAI.diemDenBot = { x: 480, y: 700, rut: true, dichId: dich.id, hetHan: 10 };
  D.AIBot(bot, tran);
  const den = bot.boNhoAI.phanTichBot.diemDen;
  assert(den); assert(Math.hypot(den.x - 480, den.y - 700) > 30);
});

kiemTra('Cấp 8 học mô hình ngắm từ chuyển động quan sát, không đọc lệnh địch', () => {
  const { tran, bot, dich } = tinhHuong(8);
  Object.assign(bot, { x: 200, y: 450 });
  Object.assign(dich, { x: 600, y: 450, goc: Math.PI / 2 });
  dich.lenh = new Proxy({}, { get() { throw new Error('Không được đọc lệnh đối thủ'); } });
  let soCong = 0;
  for (let k = 0; k < 60; k++) {
    for (let j = 0; j < 6; j++) {
      const cu = { x: dich.x, y: dich.y };
      Object.assign(dich, D.tinhBuocXe(dich, { ga: 1, quay: .5 }, 1 / 60, []));
      dich.vx = (dich.x - cu.x) * 60; dich.vy = (dich.y - cu.y) * 60;
    }
    tran.thoiGian = (k + 1) * .1;
    D.AIBot(bot, tran);
    if (bot.boNhoAI.phanTichBot.kieuNgam === 'theo-duong-cong') soCong++;
  }
  assert(soCong > 10, `Chưa thích nghi khi địch chạy vòng: ${soCong}`);
});

kiemTra('Cấp 9 quá 6 giây không trúng thì chủ động tìm góc mới ngay cả sân trống', () => {
  const { tran, bot } = tinhHuong(9);
  D.AIBot(bot, tran); tran.thoiGian = 7; D.AIBot(bot, tran);
  assert(bot.boNhoAI.phanTichBot.diemDen);
});

kiemTra('Cấp 10 dự đoán nguy cơ sát nòng trước khi có đạn thật', () => {
  const { tran, bot, dich } = tinhHuong(10);
  Object.assign(bot, { x: 480, y: 480, goc: Math.PI / 2 });
  Object.assign(dich, { x: 560, y: 480, vx: 0, vy: 0, gocNong: Math.PI, thoiGianNap: 0 });
  D.AIBot(bot, tran);
  assert.equal(tran.dan.length, 0);
  assert(bot.boNhoAI.phanTichBot.soDanTheoDoi >= 1);
  assert.equal(bot.boNhoAI.phanTichBot.phienBan, 'bot-2');
});

kiemTra('Kế hoạch nhiều bước giữ mốc ban đầu và tiến tới lệnh thứ hai', () => {
  const { tran, bot, dich } = tinhHuong(1);
  Object.assign(dich, { x: 900, y: 900, vx: 0, vy: 0 });
  const tot = D.AIBot(bot, tran);
  bot.boNhoAI.keHoachBot = { batDau: 0, chuoi: [{ ga: -tot.ga, quay: -tot.quay, den: .25 },
    { ga: tot.ga, quay: tot.quay, den: 1.9 }] };
  tran.thoiGian = .3; D.AIBot(bot, tran);
  assert.equal(bot.boNhoAI.phanTichBot.soUngVien, D.cauHinhCapBot(1).soUngVien + 1);
  const p = bot.boNhoAI.keHoachBot;
  assert.equal(p.batDau, 0, 'Không khởi động lại mốc đổi hướng khi kế hoạch còn phù hợp');
  assert.equal(bot.boNhoAI.lenhDaChon.ga, tot.ga, 'Đã chuyển tới ga của đoạn hai');
  assert.equal(bot.boNhoAI.lenhDaChon.quay, tot.quay, 'Đã chuyển tới hướng của đoạn hai');
});

kiemTra('Tất cả cấp trả lệnh hữu hạn, không thay chỉ số vật lý và không phụ thuộc AI người chơi', () => {
  for (let cap = 1; cap <= 10; cap++) {
    const { tran, bot } = tinhHuong(cap);
    const hangSoCu = sao(H);
    const hp = bot.hp;
    const lenh = D.AIBot(bot, tran);
    assert(Number.isFinite(lenh.ga) && Math.abs(lenh.ga) <= 1);
    assert(Number.isFinite(lenh.quay) && Math.abs(lenh.quay) <= 1);
    assert(Number.isFinite(lenh.gocNong));
    assert.equal(typeof lenh.ban, 'boolean');
    assert.equal(bot.hp, hp);
    assert.deepEqual(sao(H), hangSoCu);
    if (cap >= 4) assert.equal(bot.boNhoAI.phanTichBot.soUngVien, D.cauHinhCapBot(cap).soUngVien);
    D.AINguoiChoi(tran.xe[0], tran);
    assert.equal(tran.xe[0].boNhoAI.phanTich.chanTroi, 1.5);
    assert(tran.xe[0].boNhoAI.phanTich.ungVien.length >= 15 && tran.xe[0].boNhoAI.phanTich.ungVien.length <= 48);
  }
});

kiemTra('Cùng hạt giống/cấp tái hiện được; đổi hạt giống vẫn đổi cách chạy', () => {
  const moPhong = hatGiong => {
    const tran = D.taoTranDau({ soBot: 4, capBot: 8, hp: 3, hatGiong });
    for (let i = 0; i < 240; i++) D.buocMoPhong(tran, 1 / 60, (xe, tran) =>
      xe.laNguoiChoi ? D.AINguoiChoi(xe, tran) : D.AIBot(xe, tran));
    return sao(tran);
  };
  const a = moPhong(7331);
  const b = moPhong(7331);
  const c = moPhong(7332);
  assert.deepEqual(a, b);
  assert.notDeepEqual(a.xe.map(xe => [xe.x, xe.y]), c.xe.map(xe => [xe.x, xe.y]));
});

kiemTra('Mười bot cấp 10 giao tranh ổn định, bo cuối giữ đủ diện tích', () => {
  const tran = D.taoTranDau({ soBot: 10, capBot: 10, hp: 3, hatGiong: 5218 });
  const dau = performance.now();
  for (let i = 0; i < 180 * 60 && !tran.ketThuc; i++) {
    D.buocMoPhong(tran, 1 / 60, (xe, tran) => xe.laNguoiChoi ? D.AINguoiChoi(xe, tran) : D.AIBot(xe, tran));
    assert(tran.vungAnToan <= H.gioiHanThuVung);
    assert(H.kichThuoc - 2 * tran.vungAnToan >= H.kichThuocBoToiThieu);
    if (i > 0 && i % 1800 === 0) console.log(`  Tiến độ ${tran.thoiGian.toFixed(0)}s; còn ${tran.xe.filter(xe => xe.conSong).length} xe; xử lý ${((performance.now() - dau) / 1000).toFixed(1)}s`);
    if (i % 60 === 0) for (const xe of tran.xe) {
      for (const khoa of ['x', 'y', 'vx', 'vy', 'goc', 'hp']) assert(Number.isFinite(xe[khoa]));
      assert(xe.x >= H.banKinhXe && xe.x <= H.kichThuoc - H.banKinhXe);
      assert(xe.y >= H.banKinhXe && xe.y <= H.kichThuoc - H.banKinhXe);
      assert(xe.hp >= 0 && xe.hp <= xe.hpToiDa);
    }
  }
  const miliGiay = performance.now() - dau;
  console.log(`  ${tran.thoiGian.toFixed(1)} giây trong game / ${(miliGiay / 1000).toFixed(2)} giây xử lý; còn ${tran.xe.filter(xe => xe.conSong).length} xe`);
  if (!tran.ketThuc) console.log('  Xe còn sống: ' + tran.xe.filter(xe => xe.conSong).map(xe =>
    `${xe.id} HP=${xe.hp.toFixed(2)} @(${Math.round(xe.x)},${Math.round(xe.y)})`).join('; '));
  assert(tran.xe.reduce((tong, xe) => tong + xe.soTrung, 0) > 0);
  if (!tran.ketThuc) {
    // Sân cuối còn chơi được: không ép mọi xe vào một điểm để kết thúc giả tạo.
    assert.equal(tran.vungAnToan, H.gioiHanThuVung);
    assert.equal(H.kichThuoc - 2 * tran.vungAnToan, H.kichThuocBoToiThieu);
  }
  console.log(`  Trạng thái: ${tran.ketThuc ? tran.ketQua : 'tiếp tục giao chiến trong bo cuối'}`);
});

console.log(`\nKết quả cấp bot: ${soDat} nhóm đạt, ${soLoi} nhóm lỗi.`);
process.exitCode = soLoi ? 1 : 0;
