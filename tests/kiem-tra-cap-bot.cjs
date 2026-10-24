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
    assert(moi.trePhanUng < cu.trePhanUng);
    assert(moi.saiSoNgam < cu.saiSoNgam);
    assert(moi.tyLeDonDau > cu.tyLeDonDau);
    assert(moi.chanTroi >= cu.chanTroi);
    if (moi.cap >= 4) assert(moi.chanTroi > cu.chanTroi);
    assert(moi.soUngVien >= cu.soUngVien);
    if (moi.cap >= 4) assert(moi.soUngVien > cu.soUngVien);
  }
  assert.equal(cacCap[9].chanTroi, 1.8);
  assert.equal(cacCap[9].soUngVien, 15);
  assert.equal(cacCap[9].tyLeDonDau, 1);
  assert.equal(cacCap[0].neDan, false);
  assert.equal(cacCap[3].neDan, true);
  assert.equal(cacCap[6].chienThuat, true);
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
  assert.equal(D.cauHinhCapBot(10).chanTroi, 1.8);
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
    assert.equal(thap.bot.boNhoAI.phanTichBot.diemNgam.y, 300);
    assert(cao.bot.boNhoAI.phanTichBot.diemNgam.y > 370);
    assert(Math.abs(b.gocNong - gocDung) <= D.cauHinhCapBot(10).saiSoNgam + 1e-8);
  }
  assert(saiSoCap10 < saiSoCap1 / 10);
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

kiemTra('Dự đoán quỹ đạo tránh được đạn xa mà bot cấp 1 không nhận ra', () => {
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
  function khoangCachNhoNhat(xe, lenh) {
    let nhoNhat = Infinity;
    let viTri = { x: xe.x, y: xe.y, goc: xe.goc };
    for (let i = 0; i <= 600; i++) {
      const t = i / 600;
      nhoNhat = Math.min(nhoNhat, Math.hypot(viTri.x - (dan.x + dan.vx * t), viTri.y - dan.y));
      viTri = D.tinhBuocXe(viTri, lenh, 1 / 600, []);
    }
    return nhoNhat;
  }
  const ganThap = khoangCachNhoNhat(thap.bot, lenhThap);
  const ganCao = khoangCachNhoNhat(cao.bot, lenhCao);
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
    assert(tran.xe[0].boNhoAI.phanTich.ungVien.length >= 15 && tran.xe[0].boNhoAI.phanTich.ungVien.length <= 29);
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
  console.log(`  Trạng thái: ${tran.ketThuc ? (tran.nguoiThang ? tran.nguoiThang.ten + ' chiến thắng' : 'hòa') : 'tiếp tục giao chiến trong bo cuối'}`);
});

console.log(`\nKết quả cấp bot: ${soDat} nhóm đạt, ${soLoi} nhóm lỗi.`);
process.exitCode = soLoi ? 1 : 0;
