'use strict';

// Kiểm tra độc lập địa hình của 300 trận, không cần cài thư viện hay mở giao diện.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const { performance } = require('node:perf_hooks');
const thuMuc = path.resolve(__dirname, '..');
const nguCanh = { Math, console, performance,
  crypto: { getRandomValues(mang) { mang.fill(2048); return mang; } } };
nguCanh.window = nguCanh; nguCanh.globalThis = nguCanh;
vm.createContext(nguCanh);
vm.runInContext(fs.readFileSync(path.join(thuMuc, 'vat-ly.js'), 'utf8'), nguCanh,
  { filename: 'vat-ly.js' });
const D = nguCanh.DauTruong;
const H = D.hangSo;
const duPhongXe = H.banKinhXe + 4;
let soDat = 0;
let soLoi = 0;

function kiemTra(ten, ham) {
  const dau = performance.now();
  try {
    ham(); soDat++;
    console.log(`ĐẠT ${ten} (${Math.round(performance.now() - dau)} ms)`);
  } catch (loi) {
    soLoi++;
    console.error(`LỖI ${ten}\n${loi.stack}`);
  }
}

function maBanDo(tran) { return JSON.stringify(tran.tuong); }
function khoangCachToiTuong(x, y, tuong) {
  return Math.hypot(Math.max(tuong.x - x, x - tuong.x - tuong.rong, 0),
    Math.max(tuong.y - y, y - tuong.y - tuong.cao, 0));
}
function khoangCachHaiTuong(a, b) {
  return Math.hypot(Math.max(a.x - b.x - b.rong, b.x - a.x - a.rong, 0),
    Math.max(a.y - b.y - b.cao, b.y - a.y - a.cao, 0));
}

// Dùng hình chữ nhật nở 20px thay cho xe tròn 16px: đường đi tìm được
// còn có 4px dự phòng, không chỉ vừa lọt sát mép tường.
function luoiDiChuyen(tran, bien = 0, buoc = 10) {
  const dau = bien + duPhongXe;
  const cuoi = H.kichThuoc - bien - duPhongXe;
  const canh = Math.floor((cuoi - dau) / buoc) + 1;
  const o = new Uint8Array(canh * canh);
  const hangDoi = new Int32Array(o.length);
  let soTrong = 0, soDen = 0;
  for (let iy = 0; iy < canh; iy++) {
    const y = dau + iy * buoc;
    for (let ix = 0; ix < canh; ix++) {
      const x = dau + ix * buoc;
      const biChan = tran.tuong.some(tuong => x >= tuong.x - duPhongXe &&
        x <= tuong.x + tuong.rong + duPhongXe && y >= tuong.y - duPhongXe &&
        y <= tuong.y + tuong.cao + duPhongXe);
      if (!biChan) { o[iy * canh + ix] = 1; soTrong++; }
    }
  }
  const batDau = o.indexOf(1);
  if (batDau >= 0) {
    o[batDau] = 2; hangDoi[soDen++] = batDau;
    for (let dauHang = 0; dauHang < soDen; dauHang++) {
      const ma = hangDoi[dauHang];
      const ix = ma % canh;
      const thu = (maKe) => {
        if (o[maKe] === 1) { o[maKe] = 2; hangDoi[soDen++] = maKe; }
      };
      if (ix > 0) thu(ma - 1);
      if (ix < canh - 1) thu(ma + 1);
      if (ma >= canh) thu(ma - canh);
      if (ma < o.length - canh) thu(ma + canh);
    }
  }
  const daDenGan = (x, y) => {
    const ix = Math.round((x - dau) / buoc);
    const iy = Math.round((y - dau) / buoc);
    return ix >= 0 && ix < canh && iy >= 0 && iy < canh && o[iy * canh + ix] === 2;
  };
  return { soTrong, soDen, soO: o.length, daDenGan };
}

const cacTran = Array.from({ length: 300 }, (_, i) =>
  D.taoTranDau({ soBot: 1 + i % 10, hp: i % 2 ? 1 : 3, capBot: 1 + i % 10, hatGiong: i + 1 }));

kiemTra('300 hạt giống có bố trí, kích thước và số vật cản đa dạng', () => {
  assert.equal(new Set(cacTran.map(maBanDo)).size, cacTran.length);
  assert(new Set(cacTran.map(tran => tran.tuong.length)).size >= 3,
    'Số chướng ngại cần thay đổi giữa các trận');
  assert(new Set(cacTran.flatMap(tran => tran.tuong.map(tuong => `${tuong.rong},${tuong.cao}`))).size > 100,
    'Kích thước chướng ngại cần thực sự ngẫu nhiên');
});

kiemTra('300 bản đồ: tường hợp lệ, cách biên, không chồng lên nhau, đủ lối cho thân xe', () => {
  for (const tran of cacTran) {
    const nhan = `Hạt ${tran.hatGiong}`;
    assert(tran.tuong.length >= 7 && tran.tuong.length <= 12, `${nhan}: số vật cản bất thường`);
    for (let i = 0; i < tran.tuong.length; i++) {
      const a = tran.tuong[i];
      for (const khoa of ['x', 'y', 'rong', 'cao']) assert(Number.isFinite(a[khoa]), `${nhan}: ${khoa}`);
      assert(a.rong > 0 && a.cao > 0, `${nhan}: kích thước không dương`);
      assert(a.x >= 60 && a.y >= 60 && a.x + a.rong <= H.kichThuoc - 60 &&
        a.y + a.cao <= H.kichThuoc - 60, `${nhan}: tường chắn lối sát biên`);
      for (const b of tran.tuong.slice(i + 1)) {
        assert(khoangCachHaiTuong(a, b) >= 76 - 1e-7, `${nhan}: tường quá sát hoặc chồng nhau`);
      }
      for (const xe of tran.xe) {
        assert(khoangCachToiTuong(xe.x, xe.y, a) >= 52 - 1e-7,
          `${nhan}: vật cản sát/chồng vị trí xuất phát ${xe.id}`);
      }
    }
  }
});

kiemTra('300 bản đồ: mọi vùng trống và vị trí xuất phát đều thông tới bo cuối', () => {
  for (const tran of cacTran) {
    const luoi = luoiDiChuyen(tran);
    assert(luoi.soTrong > luoi.soO * 0.5, `Hạt ${tran.hatGiong}: thiếu diện tích di chuyển`);
    assert.equal(luoi.soDen, luoi.soTrong, `Hạt ${tran.hatGiong}: có túi trống bị cô lập`);
    assert(luoi.daDenGan(360, 380), `Hạt ${tran.hatGiong}: không nối vào bo cuối`);
    for (const xe of tran.xe) assert(luoi.daDenGan(xe.x, xe.y),
      `Hạt ${tran.hatGiong}: xe ${xe.id} bị kẹt ngoài vùng liên thông`);
  }
});

kiemTra('300 bo cuối 360 × 360 còn hơn 70% diện tích, thông 4 phía và có đường bắn', () => {
  const bien = H.gioiHanThuVung;
  assert.equal(H.kichThuoc - 2 * bien, 360);
  for (const tran of cacTran) {
    const luoi = luoiDiChuyen(tran, bien, 4);
    assert(luoi.soTrong > luoi.soO * 0.7, `Hạt ${tran.hatGiong}: bo cuối quá chật`);
    assert.equal(luoi.soDen, luoi.soTrong, `Hạt ${tran.hatGiong}: bo cuối có vùng bị cô lập`);
    for (const [x, y] of [[480, 348], [612, 480], [480, 612], [348, 480]]) {
      assert(luoi.daDenGan(x, y), `Hạt ${tran.hatGiong}: bo cuối mất lối vòng`);
    }
    const tuongNo = tran.tuong.map(tuong => ({ x: tuong.x - H.banKinhDan,
      y: tuong.y - H.banKinhDan, rong: tuong.rong + H.banKinhDan * 2,
      cao: tuong.cao + H.banKinhDan * 2 }));
    for (const y of [380, 580]) assert.equal(D.doanBiChan(360, y, 600, y, tuongNo), false);
    for (const x of [380, 580]) assert.equal(D.doanBiChan(x, 360, x, 600, tuongNo), false);
  }
});

kiemTra('Truyền lại hạt giống tái hiện đúng toàn bộ vật cản', () => {
  for (const hatGiong of [1, 2, 42, 713, 999, 0xffffffff]) {
    for (const soBot of [1, 5, 10]) {
      const tuyChon = { soBot, hp: 3, capBot: 10, hatGiong };
      assert.equal(maBanDo(D.taoTranDau(tuyChon)), maBanDo(D.taoTranDau(tuyChon)));
    }
  }
});

kiemTra('100 trận tự tạo vẫn đổi bản đồ dù nguồn crypto liên tục trả cùng số', () => {
  const cacTranMoi = Array.from({ length: 100 }, () => D.taoTranDau({ soBot: 5, hp: 3 }));
  assert.equal(new Set(cacTranMoi.map(tran => tran.hatGiong)).size, cacTranMoi.length);
  assert.equal(new Set(cacTranMoi.map(maBanDo)).size, cacTranMoi.length);
});

kiemTra('Bắn đạn, di chuyển, va chạm và bo thu không bốc lại địa hình giữa trận', () => {
  const tran = D.taoTranDau({ soBot: 10, hp: 3, capBot: 10, hatGiong: 42 });
  const banDoDau = maBanDo(tran);
  // Đẩy mốc tới lúc bắt đầu thu để kiểm tra cả sát thương và bo.
  tran.thoiGian = H.batDauThuVung;
  for (let i = 0; i < 60 * 20 && !tran.ketThuc; i++) {
    D.buocMoPhong(tran, 1 / 60, xe => ({ ga: 1, quay: Math.sin(i * 0.02),
      gocNong: xe.goc, ban: true }));
    assert.equal(maBanDo(tran), banDoDau, `Địa hình đổi ở bước ${i}`);
  }
  assert(tran.xe.reduce((tong, xe) => tong + xe.soBan, 0) > 0, 'Phải thật sự bắn trong ca thử');
  assert(tran.vungAnToan > 0, 'Phải thật sự có bo thu trong ca thử');
});

console.log(`\nKết quả: ${soDat} nhóm đạt, ${soLoi} nhóm lỗi.`);
process.exitCode = soLoi ? 1 : 0;
