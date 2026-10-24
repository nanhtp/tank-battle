'use strict';

// Chạy bằng Node để kiểm tra bộ mô phỏng; game không cần Node để mở.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const { performance } = require('node:perf_hooks');

const thuMuc = fs.existsSync(path.join(__dirname, '../vat-ly.js'))
  ? path.resolve(__dirname, '..') : path.resolve(__dirname, '../outputs/tank-battle');
const maVatLy = fs.readFileSync(path.join(thuMuc, 'vat-ly.js'), 'utf8');

function taoBoMoPhong(tuyChon = {}) {
  // Cố định mọi nguồn số ngẫu nhiên để kiểm tra trường hợp nguồn bị lặp.
  const toan = Object.create(Math);
  toan.random = () => 0.5;
  class DongHoCoDinh extends Date { static now() { return 1720000000000; } }
  const nguCanh = { console, Math: toan, Date: DongHoCoDinh,
    performance: { now: () => 1000 }, ...tuyChon };
  nguCanh.window = nguCanh;
  nguCanh.globalThis = nguCanh;
  vm.createContext(nguCanh);
  vm.runInContext(maVatLy, nguCanh, { filename: 'vat-ly.js' });
  return nguCanh.DauTruong;
}

const moiTruong = { console, performance, Math };
moiTruong.window = moiTruong;
moiTruong.globalThis = moiTruong;
vm.createContext(moiTruong);
for (const tep of ['vat-ly.js', 'ai.js']) {
  const duongDan = path.join(thuMuc, tep);
  if (fs.existsSync(duongDan)) {
    vm.runInContext(fs.readFileSync(duongDan, 'utf8'), moiTruong, { filename: tep });
  }
}
const D = moiTruong.DauTruong;
assert(D, 'Chưa có bộ mô phỏng DauTruong.');
const H = D.hangSo;
const buoc = 1 / 60;
const dungYen = () => ({ ga: 0, quay: 0, gocNong: 0, ban: false });
const banSao = (giaTri) => JSON.parse(JSON.stringify(giaTri));
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

function tranTrong(hp = 3) {
  const tran = D.taoTranDau({ soBot: 1, hp, hatGiong: 42 });
  tran.tuong = [];
  const viTri = [[100, 100], [400, 300]];
  tran.xe.forEach((xe, i) => {
    Object.assign(xe, { x: viTri[i][0], y: viTri[i][1], goc: 0,
      gocNong: 0, vx: 0, vy: 0, lenh: dungYen() });
  });
  return tran;
}

function themDan(tran, tuyChon = {}) {
  tran.dan.push(Object.assign({ id: ++tran._maDan, x: 100, y: 300,
    vx: 30000, vy: 0, chuId: tran.xe[0].id, mau: '#fff', tuoi: 0 }, tuyChon));
}

function kiemTraHuuHan(tran) {
  assert(Number.isFinite(tran.thoiGian));
  assert(tran.vungAnToan >= 0 && tran.vungAnToan <= H.gioiHanThuVung);
  for (const xe of tran.xe) {
    for (const khoa of ['x', 'y', 'goc', 'gocNong', 'vx', 'vy', 'hp', 'thoiGianNap']) {
      assert(Number.isFinite(xe[khoa]), `${xe.id}.${khoa} không hữu hạn`);
    }
    assert(xe.x >= H.banKinhXe - 1e-6 && xe.x <= H.kichThuoc - H.banKinhXe + 1e-6);
    assert(xe.y >= H.banKinhXe - 1e-6 && xe.y <= H.kichThuoc - H.banKinhXe + 1e-6);
    assert(xe.hp >= 0 && xe.hp <= xe.hpToiDa);
    assert.equal(xe.conSong, xe.hp > 0);
    assert(xe.soTrung <= xe.soBan || tran._danTaoDeThu);
  }
  for (const dan of tran.dan) {
    for (const khoa of ['x', 'y', 'vx', 'vy', 'tuoi']) assert(Number.isFinite(dan[khoa]));
    assert(dan.x >= H.banKinhDan - 1e-6 && dan.x <= H.kichThuoc - H.banKinhDan + 1e-6);
    assert(dan.y >= H.banKinhDan - 1e-6 && dan.y <= H.kichThuoc - H.banKinhDan + 1e-6);
    assert(dan.tuoi >= 0 && dan.tuoi < H.tuoiThoDan);
  }
  if (tran.ketThuc) {
    const conSong = tran.xe.filter(xe => xe.conSong);
    assert(['thang', 'thua', 'hoa'].includes(tran.ketQua));
    if (tran.ketQua === 'thang') assert.equal(tran.nguoiThang, conSong[0]);
    if (tran.ketQua === 'hoa') assert.equal(tran.thoiGian, 300);
  }
}

kiemTra('Tạo đúng số xe, chế độ HP và giới hạn tùy chọn', () => {
  for (const soBot of [1, 5, 10]) {
    for (const hp of [1, 3]) {
      const tran = D.taoTranDau({ soBot, hp, hatGiong: 12345 });
      assert.equal(tran.xe.length, soBot + 1);
      assert.equal(tran.xe.filter(xe => xe.laNguoiChoi).length, 1);
      assert(tran.xe.every(xe => xe.hp === hp && xe.hpToiDa === hp));
      kiemTraHuuHan(tran);
    }
  }
  assert.equal(D.taoTranDau({ soBot: -20 }).xe.length, 2);
  assert.equal(D.taoTranDau({ soBot: 30 }).xe.length, 11);
});

kiemTra('Cấp bot mặc định 5; mỗi bot nhận đúng cấp, AI người chơi giữ độc lập', () => {
  assert.equal(D.taoTranDau({ soBot: 3, hatGiong: 123 }).capBot, 5);
  for (let capBot = 1; capBot <= 10; capBot++) {
    const tran = D.taoTranDau({ soBot: 10, hp: 3, hatGiong: 123, capBot });
    assert.equal(tran.capBot, capBot);
    assert(tran.xe.filter(xe => !xe.laNguoiChoi).every(xe => xe.capBot === capBot));
    assert.equal(tran.xe.find(xe => xe.laNguoiChoi).capBot, null);
  }
});

kiemTra('Giới hạn cấp bot làm tròn và chặn ngoài 1–10; đầu vào lỗi về cấp 5', () => {
  assert.equal(typeof D.gioiHanCapBot, 'function');
  for (const [dauVao, ketQua] of [[-40, 1], [0, 1], [1, 1], [1.49, 1],
    [1.5, 2], [6.7, 7], [10, 10], [100, 10], ['8', 8],
    [undefined, 5], [null, 5], ['', 5], [' ', 5], [true, 5], [false, 5],
    [NaN, 5], [Infinity, 5], [-Infinity, 5], ['khong-hop-le', 5]]) {
    assert.equal(D.gioiHanCapBot(dauVao), ketQua, `Sai giới hạn với ${String(dauVao)}`);
    const tran = D.taoTranDau({ soBot: 1, capBot: dauVao, hatGiong: 123 });
    assert.equal(tran.capBot, ketQua);
    assert.equal(tran.xe[1].capBot, ketQua);
    assert.equal(tran.xe[0].capBot, null);
  }
});

kiemTra('Cùng hạt giống tạo cùng trạng thái; hạt khác đổi bố trí', () => {
  const a = D.taoTranDau({ soBot: 7, hp: 3, hatGiong: 999 });
  const b = D.taoTranDau({ soBot: 7, hp: 3, hatGiong: 999 });
  const c = D.taoTranDau({ soBot: 7, hp: 3, hatGiong: 1000 });
  assert.deepEqual(banSao(a), banSao(b));
  assert.notEqual(a.xe[0].x, c.xe[0].x);
  assert.notDeepEqual(banSao(a.tuong), banSao(c.tuong), 'Hạt giống mới phải đổi cả chướng ngại vật');
});

kiemTra('Hạt giống tự động là số nguyên dương 32 bit và không lặp khi nguồn crypto bị lặp', () => {
  for (const giaTri of [0, 0xffffffff, 123456]) {
    let soLanLay = 0;
    const bo = taoBoMoPhong({ crypto: { getRandomValues(mang) {
      soLanLay++;
      mang.fill(giaTri);
      return mang;
    } } });
    const cacHat = Array.from({ length: 500 }, () => bo.taoHatGiongNgauNhien());
    assert(cacHat.every(hat => Number.isInteger(hat) && hat > 0 && hat <= 0xffffffff));
    assert.equal(new Set(cacHat).size, cacHat.length);
    assert(soLanLay > 0, 'Có crypto thì phải lấy số từ crypto');
  }
});

kiemTra('Không có crypto hoặc crypto bị lỗi vẫn tạo các hạt giống mới', () => {
  for (const crypto of [undefined, { getRandomValues() { throw new Error('Không có quyền crypto'); } }]) {
    const bo = taoBoMoPhong({ crypto });
    const cacHat = Array.from({ length: 500 }, () => bo.taoHatGiongNgauNhien());
    assert(cacHat.every(hat => Number.isInteger(hat) && hat > 0 && hat <= 0xffffffff));
    assert.equal(new Set(cacHat).size, cacHat.length);
  }
});

kiemTra('Không truyền hạt giống tạo trận mới; truyền hạt giống giữ nguyên khả năng tái hiện', () => {
  const bo = taoBoMoPhong({ crypto: { getRandomValues(mang) { mang.fill(2048); return mang; } } });
  const cacTran = Array.from({ length: 30 }, () => bo.taoTranDau({ soBot: 5, hp: 3 }));
  assert.equal(new Set(cacTran.map(tran => tran.hatGiong)).size, cacTran.length);
  assert.equal(new Set(cacTran.map(tran => JSON.stringify(tran.xe.map(xe => [xe.x, xe.y, xe.goc])))).size,
    cacTran.length, 'Đổi hạt giống phải đổi bố trí trận, không chỉ đổi nhãn');
  assert.equal(new Set(cacTran.map(tran => JSON.stringify(tran.tuong))).size,
    cacTran.length, 'Các trận mới phải có bố trí chướng ngại khác nhau');
  const a = bo.taoTranDau({ soBot: 5, hp: 3, hatGiong: 713 });
  const b = bo.taoTranDau({ soBot: 5, hp: 3, hatGiong: 713 });
  assert.deepEqual(banSao(a), banSao(b));
});

kiemTra('Dự đoán chuyển động là hàm thuần, chặn tường và biên', () => {
  const xe = tranTrong().xe[0];
  Object.assign(xe, { x: 180, y: 300 });
  const truoc = banSao(xe);
  const tuong = [{ x: 200, y: 250, rong: 20, cao: 100 }];
  const sau = D.tinhBuocXe(xe, { ga: 1, quay: 0 }, 1, tuong);
  assert.deepEqual(banSao(xe), truoc);
  assert(Math.abs(sau.x - (200 - H.banKinhXe)) < 1e-6);
  assert.equal(sau.y, xe.y);
  Object.assign(xe, { x: 18, y: 100, goc: Math.PI });
  assert.equal(D.tinhBuocXe(xe, { ga: 1 }, 10, []).x, H.banKinhXe);
  Object.assign(xe, { x: 100, y: 18, goc: -Math.PI / 2 });
  assert.equal(D.tinhBuocXe(xe, { ga: 1 }, 10, []).y, H.banKinhXe);
  const lenhLoi = D.tinhBuocXe(xe, { ga: NaN, quay: Infinity }, buoc, []);
  assert(Number.isFinite(lenhLoi.x) && Number.isFinite(lenhLoi.goc));
});

kiemTra('Đường ngắm bị vật cản che đúng hai trường hợp', () => {
  const tuong = [{ x: 200, y: 250, rong: 20, cao: 100 }];
  assert.equal(D.doanBiChan(100, 300, 400, 300, tuong), true);
  assert.equal(D.doanBiChan(100, 100, 400, 100, tuong), false);
});

kiemTra('Đạn quét xuyên qua vị trí xe giữa hai bước vẫn gây trúng', () => {
  const tran = tranTrong();
  themDan(tran);
  D.buocMoPhong(tran, buoc, dungYen);
  assert.equal(tran.xe[1].hp, 2);
  assert.equal(tran.xe[0].soTrung, 1);
  assert.equal(tran.dan.length, 0);
});

kiemTra('Tường chặn đạn trước khi đạn tới xe phía sau', () => {
  const tran = tranTrong();
  tran.tuong.push({ x: 250, y: 250, rong: 20, cao: 100 });
  themDan(tran);
  D.buocMoPhong(tran, buoc, dungYen);
  assert.equal(tran.xe[1].hp, 3);
  assert.equal(tran.xe[0].soTrung, 0);
  assert.equal(tran.dan.length, 0);
});

kiemTra('Đạn xét cả chuyển động của xe trong cùng bước', () => {
  const tran = tranTrong();
  Object.assign(tran.xe[1], { x: 350, y: 267.5, goc: Math.PI / 2 });
  themDan(tran, { vx: 1000 });
  D.buocMoPhong(tran, 0.5, xe => xe.laNguoiChoi ? dungYen() :
    { ga: 1, quay: 0, gocNong: 0, ban: false });
  assert.equal(tran.xe[1].hp, 2);
});

kiemTra('Đạn không tự gây sát thương và biến mất ở biên', () => {
  const tran = tranTrong();
  themDan(tran, { x: tran.xe[0].x, y: tran.xe[0].y, vx: -30000 });
  D.buocMoPhong(tran, buoc, dungYen);
  assert.equal(tran.xe[0].hp, 3);
  assert.equal(tran.dan.length, 0);
});

kiemTra('Một đạn kết thúc trận 1 hit; trận kết thúc ngừng cập nhật', () => {
  const tran = tranTrong(1);
  themDan(tran);
  D.buocMoPhong(tran, buoc, dungYen);
  assert.equal(tran.xe[1].hp, 0);
  assert.equal(tran.xe[1].conSong, false);
  assert.equal(tran.xe[0].soHa, 1);
  assert.equal(tran.nguoiThang.id, 'nguoi');
  assert.equal(tran.ketThuc, true);
  const truoc = banSao(tran);
  D.buocMoPhong(tran, 100, () => { throw new Error('AI không được gọi sau kết thúc'); });
  assert.deepEqual(banSao(tran), truoc);
});

kiemTra('Súng nạp đúng chu kỳ và nòng xoay độc lập với thân', () => {
  const tran = tranTrong();
  Object.assign(tran.xe[1], { x: 800, y: 800 });
  for (let i = 0; i < 60; i++) {
    D.buocMoPhong(tran, buoc, xe => xe.laNguoiChoi ?
      { ga: 1, quay: 0, gocNong: Math.PI / 2, ban: true } : dungYen());
  }
  const xe = tran.xe[0];
  assert.equal(xe.soBan, 2);
  assert(Math.abs(xe.goc) < 1e-6);
  assert(Math.abs(xe.gocNong - Math.PI / 2) < 1e-6);
  assert(Math.abs(xe.x - 235) < 1e-6 && Math.abs(xe.y - 100) < 1e-6);
});

kiemTra('AI chạy 10 lần mỗi giây và không bị gọi lặp ở hai khung sát nhau', () => {
  const tran = tranTrong();
  const cacMoc = [];
  for (let tick = 1; tick <= 60; tick++) {
    D.buocMoPhong(tran, buoc, xe => {
      if (xe.laNguoiChoi) cacMoc.push(tick);
      return dungYen();
    });
  }
  assert.equal(cacMoc.length, 11, 'Gồm quyết định đầu tiên và 10 chu kỳ trong giây');
  for (let i = 1; i < cacMoc.length; i++) {
    assert(cacMoc[i] - cacMoc[i - 1] >= 5, 'Hai lần gọi AI quá sát nhau');
    assert(cacMoc[i] - cacMoc[i - 1] <= 6, 'AI bị bỏ một chu kỳ');
  }
});

kiemTra('Vùng chỉ thu sau 45 giây và gây sát thương ngoài biên', () => {
  const tran = tranTrong();
  tran.thoiGian = 44;
  D.buocMoPhong(tran, buoc, dungYen);
  assert.equal(tran.vungAnToan, 0);
  Object.assign(tran.xe[0], { x: 16, y: 100 });
  tran.thoiGian = 49;
  D.buocMoPhong(tran, buoc, dungYen);
  assert(tran.vungAnToan > 16);
  assert(tran.xe[0].hp < 3);
  assert.equal(tran.xe[1].hp, 3);
});

kiemTra('Bo dừng chính xác ở 360 × 360; hàm dự đoán dùng cùng giới hạn ở mọi thời điểm', () => {
  assert.equal(H.kichThuocBoToiThieu, 360);
  assert.equal(H.gioiHanThuVung, (H.kichThuoc - H.kichThuocBoToiThieu) / 2);
  assert.equal(typeof D.tinhVungAnToan, 'function');
  const lucDungThu = H.batDauThuVung + H.gioiHanThuVung / H.tocDoThuVung;
  for (const thoiGian of [-100, 0, 44, 45]) assert.equal(D.tinhVungAnToan(thoiGian), 0);
  assert.equal(D.tinhVungAnToan(H.batDauThuVung + 1), H.tocDoThuVung);
  assert(Math.abs(D.tinhVungAnToan(lucDungThu - 1) -
    (H.gioiHanThuVung - H.tocDoThuVung)) < 1e-8);
  for (const thoiGian of [lucDungThu, lucDungThu + 1, 180, 3600, 1e9]) {
    assert.equal(D.tinhVungAnToan(thoiGian), H.gioiHanThuVung);
    assert.equal(H.kichThuoc - 2 * D.tinhVungAnToan(thoiGian), 360);
  }
  const tran = tranTrong();
  Object.assign(tran.xe[0], { x: 360, y: 380 });
  Object.assign(tran.xe[1], { x: 600, y: 580 });
  tran.thoiGian = lucDungThu - 1;
  let bienCu = D.tinhVungAnToan(tran.thoiGian);
  for (let i = 0; i < 180; i++) {
    D.buocMoPhong(tran, buoc, dungYen);
    assert(tran.vungAnToan >= bienCu);
    assert.equal(tran.vungAnToan, D.tinhVungAnToan(tran.thoiGian));
    assert(H.kichThuoc - 2 * tran.vungAnToan >= 360);
    bienCu = tran.vungAnToan;
  }
  assert.equal(tran.vungAnToan, H.gioiHanThuVung);
  assert(tran.xe.every(xe => xe.hp === 3));
  const baoDungThu = tran.suKien.filter(suKien => /dừng thu|ngừng thu|360\s*[×x]\s*360/i.test(suKien.noiDung));
  assert.equal(baoDungThu.length, 1, 'Chỉ thông báo bo dừng thu một lần');
  kiemTraHuuHan(tran);
});

kiemTra('Xe trong bo cuối sống đủ 5 phút thì hòa, không bị sát thương toàn sân', () => {
  const tran = tranTrong();
  Object.assign(tran.xe[0], { x: 360, y: 380 });
  Object.assign(tran.xe[1], { x: 600, y: 580 });
  tran.thoiGian = 170;
  for (let i = 0; i < 300 * 60; i++) D.buocMoPhong(tran, buoc, dungYen);
  assert.equal(tran.ketThuc, true);
  assert.equal(tran.thoiGian, 300);
  assert.equal(tran.ketQua, 'hoa');
  assert.equal(tran.vungAnToan, H.gioiHanThuVung);
  assert(tran.xe.every(xe => xe.soBan === 0 && xe.hp === 3 && xe.conSong));
  assert.equal(tran.nguoiThang, null);
  kiemTraHuuHan(tran);
});

kiemTra('Ngoài bo cuối vẫn mất HP, xe nằm trong bo không bị ảnh hưởng', () => {
  const tran = tranTrong();
  tran.thoiGian = 200;
  Object.assign(tran.xe[0], { x: H.gioiHanThuVung - 1, y: 480 });
  Object.assign(tran.xe[1], { x: 600, y: 580 });
  D.buocMoPhong(tran, buoc, dungYen);
  assert.equal(tran.vungAnToan, H.gioiHanThuVung);
  assert(Math.abs(tran.xe[0].hp - (3 - H.satThuongNgoaiVung * buoc)) < 1e-8);
  assert.equal(tran.xe[1].hp, 3);
  assert.equal(tran.ketThuc, false);
});

kiemTra('Bản đồ thật có khoảng trống liên thông giữa 4 phía và đường bắn trong bo 360', () => {
  const tran = D.taoTranDau({ soBot: 1, hp: 3, hatGiong: 42 });
  const bien = H.gioiHanThuVung;
  const canhTrong = H.kichThuoc - 2 * bien;
  const r = H.banKinhXe;
  const trai = bien + r;
  const phai = H.kichThuoc - bien - r;
  const buocLuoi = 4;
  const soDiemCanh = Math.floor((phai - trai) / buocLuoi) + 1;
  // Nới tường theo cả hai trục bảo thủ hơn va chạm tròn thật: một đường
  // thông trên lưới này bảo đảm toàn thân xe đi lọt và còn nằm trong bo.
  const tuongNo = tran.tuong.map(tuong => ({ x: tuong.x - r, y: tuong.y - r,
    rong: tuong.rong + 2 * r, cao: tuong.cao + 2 * r }));
  const key = (x, y) => `${x},${y}`;
  const cacDiem = new Map();
  for (let iy = 0; iy < soDiemCanh; iy++) {
    for (let ix = 0; ix < soDiemCanh; ix++) {
      const x = trai + ix * buocLuoi;
      const y = trai + iy * buocLuoi;
      if (!D.doanBiChan(x, y, x, y, tuongNo)) cacDiem.set(key(x, y), { x, y });
    }
  }
  assert.equal(canhTrong, 360);
  assert(cacDiem.size > soDiemCanh * soDiemCanh * 0.7, 'Bo cuối phải còn phần lớn diện tích cho xe');
  const cacPhia = [{ x: 480, y: 348 }, { x: 612, y: 480 },
    { x: 480, y: 612 }, { x: 348, y: 480 }];
  assert(cacPhia.every(diem => cacDiem.has(key(diem.x, diem.y))), 'Cả 4 phía phải đặt được nguyên xe');
  const hangDoi = [cacPhia[0]];
  const daDen = new Set([key(hangDoi[0].x, hangDoi[0].y)]);
  for (let i = 0; i < hangDoi.length; i++) {
    const diem = hangDoi[i];
    for (const [dx, dy] of [[buocLuoi, 0], [-buocLuoi, 0], [0, buocLuoi], [0, -buocLuoi]]) {
      const x = diem.x + dx, y = diem.y + dy;
      const ma = key(x, y);
      if (cacDiem.has(ma) && !daDen.has(ma) && !D.doanBiChan(diem.x, diem.y, x, y, tuongNo)) {
        daDen.add(ma); hangDoi.push(cacDiem.get(ma));
      }
    }
  }
  assert(cacPhia.every(diem => daDen.has(key(diem.x, diem.y))), 'Xe phải đi vòng được giữa mọi phía của bo');
  assert.equal(daDen.size, cacDiem.size, 'Không có túi trống bị tường cô lập trong bo cuối');
  const tuongChanDan = tran.tuong.map(tuong => ({ x: tuong.x - H.banKinhDan,
    y: tuong.y - H.banKinhDan, rong: tuong.rong + 2 * H.banKinhDan,
    cao: tuong.cao + 2 * H.banKinhDan }));
  for (const y of [380, 580]) assert.equal(D.doanBiChan(360, y, 600, y, tuongChanDan), false);
  for (const x of [380, 580]) assert.equal(D.doanBiChan(x, 360, x, 600, tuongChanDan), false);
});

kiemTra('Xe chạy hơn 90 px và bắn trúng đối thủ trong bo cuối trên bản đồ thật', () => {
  const tran = D.taoTranDau({ soBot: 1, hp: 3, hatGiong: 42 });
  tran.thoiGian = 200;
  Object.assign(tran.xe[0], { x: 360, y: 380, goc: 0, gocNong: 0, vx: 0, vy: 0 });
  Object.assign(tran.xe[1], { x: 600, y: 380, goc: Math.PI, gocNong: Math.PI, vx: 0, vy: 0 });
  for (let i = 0; i < 45; i++) {
    D.buocMoPhong(tran, buoc, xe => xe.laNguoiChoi ?
      { ga: 1, quay: 0, gocNong: 0, ban: true } : dungYen());
    for (const xe of tran.xe) {
      assert(xe.x - H.banKinhXe >= H.gioiHanThuVung);
      assert(xe.x + H.banKinhXe <= H.kichThuoc - H.gioiHanThuVung);
      assert(xe.y - H.banKinhXe >= H.gioiHanThuVung);
      assert(xe.y + H.banKinhXe <= H.kichThuoc - H.gioiHanThuVung);
    }
  }
  assert(tran.xe[0].x > 450);
  assert.equal(tran.xe[0].hp, 3);
  assert.equal(tran.xe[0].soBan, 1);
  assert.equal(tran.xe[0].soTrung, 1);
  assert.equal(tran.xe[1].hp, 2);
  assert.equal(tran.ketThuc, false);
  kiemTraHuuHan(tran);
});

kiemTra('Cùng bị loại ngoài vùng an toàn thì người chơi thua', () => {
  const tran = tranTrong(1);
  Object.assign(tran.xe[0], { x: 16, y: 100, hp: 0.001 });
  Object.assign(tran.xe[1], { x: 944, y: 100, hp: 0.001 });
  tran.thoiGian = 50;
  D.buocMoPhong(tran, buoc, dungYen);
  assert.equal(tran.ketThuc, true);
  assert.equal(tran.nguoiThang, null);
});

kiemTra('Hai xe không đi xuyên qua nhau khi đối đầu', () => {
  const tran = tranTrong();
  Object.assign(tran.xe[0], { x: 300, y: 300, goc: 0 });
  Object.assign(tran.xe[1], { x: 340, y: 300, goc: Math.PI });
  for (let i = 0; i < 120; i++) {
    D.buocMoPhong(tran, buoc, () => ({ ga: 1, quay: 0, ban: false }));
    assert(Math.hypot(tran.xe[0].x - tran.xe[1].x, tran.xe[0].y - tran.xe[1].y) >=
      H.banKinhXe * 2 - 1e-4);
  }
  assert(tran.xe[0].x < tran.xe[1].x);
});

if (typeof D.AINguoiChoi === 'function' && typeof D.AIBot === 'function') {
  const dieuKhien = (xe, tran) => xe.laNguoiChoi ? D.layAINguoiChoi()(xe, tran) : D.AIBot(xe, tran);

  kiemTra('Đăng ký và khôi phục AI độc lập với bộ mô phỏng', () => {
    const tuyChinh = () => ({ ga: 0, quay: 0, gocNong: 0, ban: false });
    D.dangKyAI(tuyChinh);
    assert.equal(D.layAINguoiChoi(), tuyChinh);
    D.dangKyAI(D.AINguoiChoi);
    assert.equal(D.layAINguoiChoi(), D.AINguoiChoi);
  });

  kiemTra('AI cho lệnh hợp lệ và tạo kế hoạch đường đi', () => {
    const tran = D.taoTranDau({ soBot: 5, hp: 3, hatGiong: 42 });
    for (const xe of tran.xe) {
      const lenh = dieuKhien(xe, tran);
      assert(lenh && Number.isFinite(lenh.ga) && Math.abs(lenh.ga) <= 1);
      assert(Number.isFinite(lenh.quay) && Math.abs(lenh.quay) <= 1);
      assert(Number.isFinite(lenh.gocNong));
      assert.equal(typeof lenh.ban, 'boolean');
    }
    const xe = tran.xe[0];
    const phanTich = xe.boNhoAI.phanTich;
    assert(phanTich.ungVien.length >= 15 && phanTich.ungVien.length <= 29);
    assert.equal(phanTich.duongChon.length, 15);
    assert.equal(phanTich.chanTroi, 1.5);
    assert(Math.abs(phanTich.duongChon.at(-1).t - 1.5) < 1e-6);
    for (const ungVien of phanTich.ungVien) {
      assert(Number.isFinite(ungVien.diem));
      for (const diem of ungVien.duong) {
        assert(Number.isFinite(diem.x) && Number.isFinite(diem.y) && Number.isFinite(diem.t));
      }
    }
  });

  kiemTra('AI người chơi và bot cấp 10 cùng dự đoán bo dừng; không chấm một bo tiếp tục thu', () => {
    const tinhVungGoc = D.tinhVungAnToan;
    try {
      for (const loai of ['nguoi', 'bot']) {
        const tran = D.taoTranDau({ soBot: 1, hp: 3, capBot: 10, hatGiong: 42 });
        tran.thoiGian = H.batDauThuVung + H.gioiHanThuVung / H.tocDoThuVung + 100;
        tran.vungAnToan = tinhVungGoc(tran.thoiGian);
        Object.assign(tran.xe[0], { x: 360, y: 380, goc: 0 });
        Object.assign(tran.xe[1], { x: 600, y: 580, goc: Math.PI });
        const cacDuDoan = [];
        D.tinhVungAnToan = thoiGian => {
          const bien = tinhVungGoc(thoiGian);
          cacDuDoan.push({ thoiGian, bien });
          return bien;
        };
        const lenh = loai === 'nguoi' ? D.AINguoiChoi(tran.xe[0], tran) : D.AIBot(tran.xe[1], tran);
        assert(lenh && Number.isFinite(lenh.ga) && Number.isFinite(lenh.quay));
        assert(cacDuDoan.some(moc => moc.thoiGian > tran.thoiGian), `${loai} chưa dùng giới hạn bo khi thử đường tương lai`);
        assert(cacDuDoan.every(moc => moc.bien === H.gioiHanThuVung), `${loai} đang dự đoán bo nhỏ hơn giới hạn`);
      }
    } finally { D.tinhVungAnToan = tinhVungGoc; }
  });

  kiemTra('Bot đổi lựa chọn giữa các hạt giống và giữ quyết định tới hết đợt hoặc mục tiêu bị loại', () => {
    const cacLuaChon = [];
    // Chỉ xét quyết định ngẫu nhiên theo đợt; bộ lập kế hoạch có thể cập nhật
    // đường đi, lệnh né và số đo nguy hiểm ở mỗi lần phản ứng.
    const quyetDinhTheoDot = boNho => Object.fromEntries([
      'mucTieuId', 'doiHuongLuc', 'ben', 'khoangCachApSat', 'gocVong', 'gocLech', 'ga', 'saiSo'
    ].map(khoa => [khoa, boNho[khoa]]));
    for (const hatGiong of [42, 7331, 4261]) {
      const tran = D.taoTranDau({ soBot: 5, hp: 3, hatGiong });
      const bot = tran.xe[1];
      D.AIBot(bot, tran);
      assert(tran.xe.some(xe => xe !== bot && xe.conSong && xe.id === bot.boNhoAI.mucTieuId));
      assert(bot.boNhoAI.doiHuongLuc > tran.thoiGian);
      const quyetDinhDau = quyetDinhTheoDot(bot.boNhoAI);
      cacLuaChon.push(JSON.stringify(quyetDinhDau));
      const trangThaiNgauNhien = tran._trangThaiNgauNhien;
      tran.thoiGian = quyetDinhDau.doiHuongLuc / 2;
      D.AIBot(bot, tran);
      assert.deepEqual(quyetDinhTheoDot(bot.boNhoAI), quyetDinhDau, 'Giữ quyết định ngẫu nhiên trong đợt');
      assert.equal(tran._trangThaiNgauNhien, trangThaiNgauNhien, 'Không bốc lại quyết định mỗi khung');
      tran.thoiGian = quyetDinhDau.doiHuongLuc + 0.01;
      D.AIBot(bot, tran);
      assert(bot.boNhoAI.doiHuongLuc > tran.thoiGian, 'Hết đợt phải đặt mốc mới');
      assert.notEqual(tran._trangThaiNgauNhien, trangThaiNgauNhien);
      const mucTieuCu = tran.xe.find(xe => xe.id === bot.boNhoAI.mucTieuId);
      mucTieuCu.hp = 0; mucTieuCu.conSong = false;
      D.AIBot(bot, tran);
      assert.notEqual(bot.boNhoAI.mucTieuId, mucTieuCu.id, 'Đổi mục tiêu ngay khi xe đang đuổi bị loại');
      assert(tran.xe.some(xe => xe.id === bot.boNhoAI.mucTieuId && xe.conSong));
    }
    assert.equal(new Set(cacLuaChon).size, cacLuaChon.length, 'Các hạt giống phải tạo lựa chọn bot khác nhau');
  });

  kiemTra('AI ngắm đón đầu mục tiêu đang di chuyển ngang hướng bắn', () => {
    const tran = tranTrong();
    Object.assign(tran.xe[0], { x: 200, y: 300 });
    Object.assign(tran.xe[1], { x: 600, y: 300, vx: 0, vy: 100 });
    const lenh = D.AINguoiChoi(tran.xe[0], tran);
    const diemNgam = tran.xe[0].boNhoAI.phanTich.diemNgam;
    assert(diemNgam.y > tran.xe[1].y + 50);
    assert(lenh.gocNong > 0.1 && lenh.gocNong < Math.PI / 2);
  });

  kiemTra('Mọi điểm dự đoán dùng đúng 90 bước vật lý 1/60 giây', () => {
    const tran = tranTrong();
    Object.assign(tran.xe[0], { x: 300, y: 400, goc: 0.43 });
    Object.assign(tran.xe[1], { x: 800, y: 600 });
    tran.tuong = [{ x: 350, y: 450, rong: 100, cao: 100 }];
    D.AINguoiChoi(tran.xe[0], tran);
    const cacUngVien = tran.xe[0].boNhoAI.phanTich.ungVien;
    for (let i = 0; i < 15; i++) {
      let viTri = { ...tran.xe[0] };
      const lenh = { ga: [-1, 0, 1][Math.floor(i / 5)], quay: [-1, -0.5, 0, 0.5, 1][i % 5] };
      for (let moc = 0; moc < 15; moc++) {
        for (let tick = 0; tick < 6; tick++) viTri = { ...viTri, ...D.tinhBuocXe(viTri, lenh, buoc, tran.tuong) };
        const diem = cacUngVien[i].duong[moc];
        assert(Math.hypot(viTri.x - diem.x, viTri.y - diem.y) < 1e-8,
          `Sai đường dự đoán ${i}, mốc ${moc}`);
      }
    }
  });

  kiemTra('Điểm bắn đón đầu tính từ đầu nòng cách tâm xe 25 px', () => {
    const tran = tranTrong();
    Object.assign(tran.xe[0], { x: 200, y: 200 });
    Object.assign(tran.xe[1], { x: 650, y: 200, vx: 0, vy: 135 });
    D.AINguoiChoi(tran.xe[0], tran);
    const diem = tran.xe[0].boNhoAI.phanTich.diemNgam;
    const t = (Math.hypot(diem.x - 200, diem.y - 200) - 25) / H.tocDoDan;
    assert(Math.hypot(diem.x - 650, diem.y - (200 + 135 * t)) < 1e-8);
  });

  kiemTra('AI xét bán kính đạn và khoảng hở xe trước tường', () => {
    const tran = tranTrong();
    Object.assign(tran.xe[0], { x: 200, y: 200 });
    Object.assign(tran.xe[1], { x: 700, y: 200 });
    tran.tuong = [{ x: 400, y: 202, rong: 40, cao: 100 }];
    assert.equal(D.doanBiChan(200, 200, 700, 200, tran.tuong), false);
    assert.equal(D.AINguoiChoi(tran.xe[0], tran).ban, false);
    Object.assign(tran.xe[0], { x: 200, y: 400 });
    Object.assign(tran.xe[1], { x: 470, y: 400, vx: 135, vy: 0 });
    tran.tuong = [{ x: 500, y: 380, rong: 40, cao: 200 }];
    assert.equal(D.AINguoiChoi(tran.xe[0], tran).ban, true);
    assert(tran.xe[0].boNhoAI.phanTich.diemNgam.x <= 500 - H.banKinhXe);
  });

  kiemTra('AI theo dõi đạn và chọn đường an toàn hơn đứng yên', () => {
    const tran = tranTrong();
    Object.assign(tran.xe[0], { x: 480, y: 480, goc: Math.PI / 2 });
    Object.assign(tran.xe[1], { x: 800, y: 800, gocNong: 0 });
    themDan(tran, { x: 300, y: 480, vx: H.tocDoDan, chuId: tran.xe[1].id });
    const lenh = D.AINguoiChoi(tran.xe[0], tran);
    const phanTich = tran.xe[0].boNhoAI.phanTich;
    const dungTaiCho = phanTich.ungVien.find(ungVien => ungVien.duong.every(diem =>
      Math.abs(diem.x - 480) < 1e-6 && Math.abs(diem.y - 480) < 1e-6));
    assert.equal(phanTich.soDanTheoDoi, 1);
    assert(dungTaiCho.nguyHiem > 0.9);
    assert(phanTich.nguyHiem < dungTaiCho.nguyHiem - 0.3);
    assert.notEqual(lenh.ga, 0);
  });

  kiemTra('Cùng hạt giống và AI cho cùng diễn biến 10 giây', () => {
    const a = D.taoTranDau({ soBot: 5, hp: 3, hatGiong: 4261 });
    const b = D.taoTranDau({ soBot: 5, hp: 3, hatGiong: 4261 });
    for (let i = 0; i < 600; i++) {
      D.buocMoPhong(a, buoc, dieuKhien);
      D.buocMoPhong(b, buoc, dieuKhien);
    }
    assert.deepEqual(banSao(a), banSao(b));
  });

  kiemTra('Mô phỏng nhiều xe, hai chế độ: hữu hạn, trong biên, có giao tranh', () => {
    let tongSoBan = 0;
    let tongSoTrung = 0;
    for (const hp of [1, 3]) {
      for (const hatGiong of [42, 7331]) {
        const tran = D.taoTranDau({ soBot: 10, hp, hatGiong });
        for (let i = 0; i < 1800 && !tran.ketThuc; i++) {
          D.buocMoPhong(tran, buoc, dieuKhien);
          if (i % 30 === 0) kiemTraHuuHan(tran);
        }
        kiemTraHuuHan(tran);
        tongSoBan += tran.xe.reduce((tong, xe) => tong + xe.soBan, 0);
        tongSoTrung += tran.xe.reduce((tong, xe) => tong + xe.soTrung, 0);
        console.log(`  Hạt ${hatGiong}; ${hp} HP; t=${tran.thoiGian.toFixed(1)}s; còn ${tran.xe.filter(xe => xe.conSong).length} xe`);
      }
    }
    assert(tongSoBan > 10, 'AI chưa bắn đủ để kiểm tra giao tranh');
    assert(tongSoTrung > 0, 'Không có phát bắn trúng nào trong các trận thử');
  });
} else {
  console.log('CHƯA CHẠY nhóm kiểm tra AI: ai.js chưa sẵn sàng.');
}

console.log(`\nKết quả: ${soDat} nhóm đạt, ${soLoi} nhóm lỗi.`);
process.exitCode = soLoi ? 1 : 0;
