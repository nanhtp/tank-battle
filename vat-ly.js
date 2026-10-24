/* Bộ mô phỏng độc lập: không đọc giao diện, không phụ thuộc thư viện. */
(function (gocToanCuc) {
  'use strict';

  const D = gocToanCuc.DauTruong = gocToanCuc.DauTruong || {};
  const H = D.hangSo = {
    kichThuoc: 960,
    kichThuocBoToiThieu: 360,
    banKinhXe: 16,
    tocDoXe: 135,
    tocDoQuay: 2.7,
    tocDoDan: 440,
    banKinhDan: 3.5,
    thoiGianNap: 0.9,
    tuoiThoDan: 4,
    thoiGianTranToiDa: 300,
    chuKyAI: 0.1,
    batDauThuVung: 45,
    tocDoThuVung: 4.2,
    satThuongNgoaiVung: 1.3
  };
  // Sân cuối rộng hơn 11 lần đường kính xe, còn lối đi quanh vật cản giữa sân.
  H.gioiHanThuVung = (H.kichThuoc - H.kichThuocBoToiThieu) / 2;
  const HAI_PI = Math.PI * 2;
  const SAI_SO = 0.000001;
  const cacHatGiongDaDung = new Set();

  // Mỗi trận tự lấy một nguồn ngẫu nhiên mới từ trình duyệt.
  // Nếu nguồn trả lại cùng số, đổi sang số kế tiếp chưa dùng trong phiên này.
  D.taoHatGiongNgauNhien = function () {
    let hatGiong;
    try {
      const mangSo = new Uint32Array(1);
      gocToanCuc.crypto.getRandomValues(mangSo);
      hatGiong = mangSo[0];
    } catch (loi) {
      hatGiong = (Math.floor(Math.random() * 0x100000000) ^ Date.now()) >>> 0;
    }
    hatGiong = hatGiong || 1;
    while (cacHatGiongDaDung.has(hatGiong)) hatGiong = ((hatGiong + 1) >>> 0) || 1;
    cacHatGiongDaDung.add(hatGiong);
    return hatGiong;
  };

  D.chuanHoaGoc = function (goc) {
    return ((goc + Math.PI) % HAI_PI + HAI_PI) % HAI_PI - Math.PI;
  };

  // Trong một trận, AI dùng chung nguồn này. Trận mới tự có hạt giống mới.
  // Lập trình viên vẫn có thể truyền hạt giống cụ thể để kiểm tra thuật toán.
  D.ngauNhien = function (tran) {
    tran._trangThaiNgauNhien = (Math.imul(tran._trangThaiNgauNhien, 1664525) + 1013904223) >>> 0;
    return tran._trangThaiNgauNhien / 4294967296;
  };

  function gioiHan(so, nhoNhat, lonNhat) {
    return Math.max(nhoNhat, Math.min(lonNhat, so));
  }

  function soHopLe(so, macDinh) {
    return Number.isFinite(so) ? so : macDinh;
  }

  // Dùng chung cho bo thật và AI dự đoán: đã đến sân cuối thì không thu thêm.
  D.tinhVungAnToan = function (thoiGian) {
    return gioiHan((soHopLe(thoiGian, 0) - H.batDauThuVung) * H.tocDoThuVung,
      0, H.gioiHanThuVung);
  };

  D.gioiHanCapBot = function (giaTri) {
    if (giaTri === undefined || giaTri === null || typeof giaTri === 'boolean' ||
      (typeof giaTri === 'string' && giaTri.trim() === '')) return 5;
    const cap = Number(giaTri);
    return Number.isFinite(cap) ? gioiHan(Math.round(cap), 1, 10) : 5;
  };

  function themSuKien(tran, noiDung, loai) {
    tran.suKien.unshift({
      id: ++tran._maSuKien, thoiGian: tran.thoiGian, noiDung: noiDung, loai: loai
    });
    if (tran.nhatKy) tran.nhatKy.suKien.push({ ...tran.suKien[0] });
    if (tran.suKien.length > 30) tran.suKien.length = 30;
  }

  function themHieuUng(tran, x, y, mau, loai) {
    tran.hieuUng.push({
      x: x, y: y, mau: mau, loai: loai, tuoi: 0,
      thoiLuong: loai === 'no' ? 0.7 : 0.25
    });
  }

  // Giao điểm đầu tiên của một đoạn thẳng và hình chữ nhật mở rộng.
  // Giá trị trả về nằm trong [0,1]; null nghĩa là không có giao điểm.
  function giaoDoanHinhChuNhat(x1, y1, x2, y2, tuong, moRong) {
    const trai = tuong.x - moRong;
    const phai = tuong.x + tuong.rong + moRong;
    const tren = tuong.y - moRong;
    const duoi = tuong.y + tuong.cao + moRong;
    const dx = x2 - x1;
    const dy = y2 - y1;
    let vao = 0;
    let ra = 1;
    const truc = [[x1, dx, trai, phai], [y1, dy, tren, duoi]];
    for (const [dau, delta, nho, lon] of truc) {
      if (Math.abs(delta) < SAI_SO) {
        if (dau < nho || dau > lon) return null;
      } else {
        const a = (nho - dau) / delta;
        const b = (lon - dau) / delta;
        vao = Math.max(vao, Math.min(a, b));
        ra = Math.min(ra, Math.max(a, b));
        if (vao > ra) return null;
      }
    }
    return vao;
  }

  D.doanBiChan = function (x1, y1, x2, y2, tuong) {
    return (tuong || []).some(function (vatCan) {
      return giaoDoanHinhChuNhat(x1, y1, x2, y2, vatCan, 0) !== null;
    });
  };

  // Dịch chuyển theo từng trục để xe trượt dọc tường, không xuyên tường.
  // Mép tường được nới đúng theo tiết diện hình tròn của xe tại trục còn lại.
  function dichChuyen(x, y, dx, dy, tuong) {
    const r = H.banKinhXe;
    let moiX = gioiHan(x + dx, r, H.kichThuoc - r);
    for (const vatCan of tuong) {
      const gapY = Math.max(vatCan.y - y, y - vatCan.y - vatCan.cao, 0);
      if (gapY >= r) continue;
      const noX = Math.sqrt(r * r - gapY * gapY);
      const trai = vatCan.x - noX;
      const phai = vatCan.x + vatCan.rong + noX;
      if (dx > 0 && x <= trai + SAI_SO && moiX > trai) moiX = trai;
      if (dx < 0 && x >= phai - SAI_SO && moiX < phai) moiX = phai;
    }
    let moiY = gioiHan(y + dy, r, H.kichThuoc - r);
    for (const vatCan of tuong) {
      const gapX = Math.max(vatCan.x - moiX, moiX - vatCan.x - vatCan.rong, 0);
      if (gapX >= r) continue;
      const noY = Math.sqrt(r * r - gapX * gapX);
      const tren = vatCan.y - noY;
      const duoi = vatCan.y + vatCan.cao + noY;
      if (dy > 0 && y <= tren + SAI_SO && moiY > tren) moiY = tren;
      if (dy < 0 && y >= duoi - SAI_SO && moiY < duoi) moiY = duoi;
    }
    return { x: moiX, y: moiY };
  }

  // Hàm thuần dùng chung cho thế giới thật và bộ AI thử hành động tương lai.
  D.tinhBuocXe = function (xe, lenh, dt, tuong) {
    lenh = lenh || {};
    if (!(dt > 0) || !Number.isFinite(dt)) {
      return { x: xe.x, y: xe.y, goc: xe.goc, vx: 0, vy: 0 };
    }
    const ga = gioiHan(soHopLe(lenh.ga, 0), -1, 1);
    const quay = gioiHan(soHopLe(lenh.quay, 0), -1, 1);
    const goc = D.chuanHoaGoc(xe.goc + quay * H.tocDoQuay * dt);
    const viTri = dichChuyen(xe.x, xe.y,
      Math.cos(goc) * ga * H.tocDoXe * dt,
      Math.sin(goc) * ga * H.tocDoXe * dt, tuong || []);
    return {
      x: viTri.x, y: viTri.y, goc: goc,
      vx: (viTri.x - xe.x) / dt, vy: (viTri.y - xe.y) / dt
    };
  };

  // Khoảng trống ngắn nhất giữa hai hình chữ nhật, hoặc giữa một điểm và tường.
  function khoangTrongGiuaHaiVat(a, b) {
    return Math.hypot(
      Math.max(a.x - b.x - b.rong, b.x - a.x - a.rong, 0),
      Math.max(a.y - b.y - b.cao, b.y - a.y - a.cao, 0));
  }

  // Chỉ tạo một lần khi lập trận; bắn, tạm dừng và tiếp tục giữ nguyên bản đồ.
  // Cùng hạt giống + cùng thiết lập vẫn tái hiện được trận để kiểm tra AI.
  D.taoChuongNgaiVat = function (tran) {
    const laySo = function (nho, lon) {
      return nho + Math.floor(D.ngauNhien(tran) * (lon - nho + 1));
    };
    const cacVatCan = [];
    // Một nửa số trận để trống khu giữa; các trận còn lại có cover nhỏ
    // đặt lệch ngẫu nhiên, không bắt buộc che tâm (480, 480).
    // Giữ các hành lang bắn và di chuyển quanh bo cuối thông thoáng.
    if (D.ngauNhien(tran) < 0.5) {
      const rong = laySo(56, 88);
      const cao = laySo(56, 88);
      cacVatCan.push({
        x: laySo(405, 555 - rong), y: laySo(405, 555 - cao), rong, cao
      });
    }
    const soVatCanMuonCo = laySo(7, 12);
    const cachBien = 64;
    const cachHaiVat = 76; // Rộng hơn hai đường kính xe, không tạo khe kẹt xe.
    const cachXuatPhat = H.banKinhXe + 36;
    // Chừa toàn bộ bo cuối và thêm 40 px mỗi phía. Trong bo có thể trống hoặc có một cover nhỏ.
    const ngoaiBoTrai = H.gioiHanThuVung - 40;
    const ngoaiBoPhai = H.kichThuoc - ngoaiBoTrai;
    let soLanThu = 0;

    // Giới hạn số lần thử: nếu hết chỗ, giữ số vật cản đã đặt an toàn.
    // Không nhét thêm tường vào đường đi, không lặp vô hạn lúc khởi tạo.
    while (cacVatCan.length < soVatCanMuonCo && soLanThu++ < 1000) {
      const rong = laySo(56, 116);
      const cao = laySo(56, 116);
      const phia = laySo(0, 3);
      let x = laySo(cachBien, H.kichThuoc - cachBien - rong);
      let y = laySo(cachBien, H.kichThuoc - cachBien - cao);
      if (phia === 0) x = laySo(cachBien, ngoaiBoTrai - rong);
      if (phia === 1) x = laySo(ngoaiBoPhai, H.kichThuoc - cachBien - rong);
      if (phia === 2) y = laySo(cachBien, ngoaiBoTrai - cao);
      if (phia === 3) y = laySo(ngoaiBoPhai, H.kichThuoc - cachBien - cao);
      const vatCan = { x: x, y: y, rong: rong, cao: cao };
      if (cacVatCan.some(function (daCo) {
        return khoangTrongGiuaHaiVat(vatCan, daCo) < cachHaiVat;
      })) continue;
      if (tran.xe.some(function (xe) {
        return khoangTrongGiuaHaiVat(vatCan,
          { x: xe.x, y: xe.y, rong: 0, cao: 0 }) < cachXuatPhat;
      })) continue;
      cacVatCan.push(vatCan);
    }
    // Các tường cách nhau 76 px và cách biên 64 px nên luôn có lối vòng qua.
    // Cover tùy chọn chỉ chiếm tối đa 88 × 88, giữ lối di chuyển và bắn ở bo cuối.
    return cacVatCan;
  };

  // Nhận dạng chỉ đổi cách hiển thị, không ảnh hưởng vật lý hay bộ não.
  D.chuanHoaTenNguoiChoi = function (ten) {
    const chu = typeof ten === 'string' ? ten.replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim() : '';
    return Array.from(chu).slice(0, 24).join('') || 'Tiên Phong';
  };
  D.chuanHoaMauNguoiChoi = function (mau) {
    return typeof mau === 'string' && /^#[0-9a-f]{6}$/i.test(mau) ? mau.toLowerCase() : '#b7d77b';
  };

  D.taoTranDau = function (tuyChon) {
    tuyChon = tuyChon || {};
    const soBot = gioiHan(Math.round(soHopLe(Number(tuyChon.soBot), 5)), 1, 10);
    const hp = Number(tuyChon.hp) === 1 ? 1 : 3;
    const capBot = D.gioiHanCapBot(tuyChon.capBot);
    const coHatGiong = tuyChon.hatGiong !== undefined && tuyChon.hatGiong !== null &&
      Number.isFinite(Number(tuyChon.hatGiong));
    const hatGiong = coHatGiong ? ((Number(tuyChon.hatGiong) >>> 0) || 42) : D.taoHatGiongNgauNhien();
    const tran = {
      xe: [], dan: [], tuong: [],
      thoiGian: 0, vong: 1, capBot: capBot, phienBanBot: D.phienBanBot || 'bot-1',
      cauHinhBot: D.cauHinhCapBot?.(capBot) || null, suKien: [], hieuUng: [], ketThuc: false,
      ketQua: null, lyDoKetThuc: null, nguoiThang: null, vungAnToan: 0, hatGiong: hatGiong,
      _trangThaiNgauNhien: hatGiong, _maDan: 0, _maSuKien: 0,
      _tichLuyAI: H.chuKyAI, _daBaoThuVung: false, _daBaoDungThuVung: false
    };
    const bangMau = ['#ff8a65', '#c4a1ff', '#ffc857', '#6dd5ed', '#ff80ab',
      '#e5a59b', '#faad72', '#d0bfff', '#91c8ff', '#ffd67d'];
    // Các vị trí nằm trên vành tròn và cách nhau đủ xa.
    // Tạo vật cản sau khi đặt xe để không che hoặc ép sát điểm xuất phát.
    const gocDau = D.ngauNhien(tran) * HAI_PI;
    const viTriXuatPhat = Array.from({ length: soBot + 1 }, (_, viTri) => viTri);
    // Trộn thứ tự xe trên vòng xuất phát để các đối thủ bên cạnh cũng thay đổi.
    for (let i = viTriXuatPhat.length - 1; i > 0; i--) {
      const j = Math.floor(D.ngauNhien(tran) * (i + 1));
      [viTriXuatPhat[i], viTriXuatPhat[j]] = [viTriXuatPhat[j], viTriXuatPhat[i]];
    }
    for (let i = 0; i <= soBot; i++) {
      const gocViTri = gocDau + viTriXuatPhat[i] * HAI_PI / (soBot + 1);
      const x = 480 + Math.cos(gocViTri) * 375;
      const y = 480 + Math.sin(gocViTri) * 375;
      const goc = D.chuanHoaGoc(gocViTri + Math.PI);
      tran.xe.push({
        id: i === 0 ? 'nguoi' : 'bot-' + i,
        ten: i === 0 ? D.chuanHoaTenNguoiChoi(tuyChon.tenNguoiChoi) : 'Bot ' + String(i).padStart(2, '0'),
        mau: i === 0 ? D.chuanHoaMauNguoiChoi(tuyChon.mauNguoiChoi) : bangMau[i - 1], laNguoiChoi: i === 0,
        capBot: i === 0 ? null : capBot,
        x: x, y: y, goc: goc, gocNong: goc, vx: 0, vy: 0,
        hp: hp, hpToiDa: hp, conSong: true, thoiGianNap: 0,
        soHa: 0, soBan: 0, soTrung: 0, boNhoAI: {},
        lenh: { ga: 0, quay: 0, gocNong: goc, ban: false }
      });
    }
    tran.tuong = D.taoChuongNgaiVat(tran);
    if (D.khoiTaoNhatKy) D.khoiTaoNhatKy(tran);
    themSuKien(tran, 'Đã sẵn sàng: ' + (soBot + 1) + ' xe vào đấu trường. Bot cấp ' + capBot + '.', 'bat-dau');
    return tran;
  };

  function vaChamBien(x1, y1, x2, y2, r) {
    const min = r;
    const max = H.kichThuoc - r;
    if (x1 < min || x1 > max || y1 < min || y1 > max) return 0;
    let somNhat = null;
    const dx = x2 - x1;
    const dy = y2 - y1;
    if (x2 < min) somNhat = (min - x1) / dx;
    if (x2 > max) somNhat = (max - x1) / dx;
    if (y2 < min) {
      const t = (min - y1) / dy;
      somNhat = somNhat === null ? t : Math.min(somNhat, t);
    }
    if (y2 > max) {
      const t = (max - y1) / dy;
      somNhat = somNhat === null ? t : Math.min(somNhat, t);
    }
    return somNhat;
  }

  function vaChamTuong(x1, y1, x2, y2, tuong, r) {
    let somNhat = vaChamBien(x1, y1, x2, y2, r);
    for (const vatCan of tuong) {
      const t = giaoDoanHinhChuNhat(x1, y1, x2, y2, vatCan, r);
      if (t !== null && (somNhat === null || t < somNhat)) somNhat = t;
    }
    return somNhat;
  }

  // Xét chuyển động tương đối của đạn và xe trong toàn bộ bước thời gian.
  // Cách này bắt được đạn bay nhanh đi xuyên qua xe giữa hai khung hình.
  function vaChamDanXe(dan, x2, y2, xe, viTriCu) {
    const rx = dan.x - viTriCu.x;
    const ry = dan.y - viTriCu.y;
    const dx = x2 - dan.x - (xe.x - viTriCu.x);
    const dy = y2 - dan.y - (xe.y - viTriCu.y);
    const r = H.banKinhXe + H.banKinhDan;
    const c = rx * rx + ry * ry - r * r;
    if (c <= 0) return 0;
    const a = dx * dx + dy * dy;
    if (a < SAI_SO) return null;
    const b = 2 * (rx * dx + ry * dy);
    const bietThuc = b * b - 4 * a * c;
    if (bietThuc < 0) return null;
    const t = (-b - Math.sqrt(bietThuc)) / (2 * a);
    return t >= 0 && t <= 1 ? t : null;
  }

  function nhanSatThuong(tran, xe, soMau, nguoiBan, dan) {
    if (!xe.conSong) return;
    if (D.ghiSatThuong) D.ghiSatThuong(tran, xe, soMau, nguoiBan, dan);
    xe.hp = Math.max(0, xe.hp - soMau);
    if (xe.hp > SAI_SO) return;
    xe.hp = 0;
    xe.conSong = false;
    xe.vx = 0;
    xe.vy = 0;
    if (nguoiBan) nguoiBan.soHa++;
    themHieuUng(tran, xe.x, xe.y, xe.mau, 'no');
    themSuKien(tran, nguoiBan ? nguoiBan.ten + ' hạ ' + xe.ten + '.' :
      xe.ten + ' bị loại ngoài vùng an toàn.', 'ha');
  }

  function banDan(tran, xe) {
    xe.thoiGianNap = H.thoiGianNap;
    xe.soBan++;
    const x = xe.x + Math.cos(xe.gocNong) * 25;
    const y = xe.y + Math.sin(xe.gocNong) * 25;
    const tuongChan = vaChamTuong(xe.x, xe.y, x, y, tran.tuong, H.banKinhDan);
    if (tuongChan !== null) {
      if (D.ghiPhatBan) D.ghiPhatBan(tran, xe, null, true);
      themHieuUng(tran, xe.x + (x - xe.x) * tuongChan,
        xe.y + (y - xe.y) * tuongChan, xe.mau, 'tia');
      return;
    }
    tran.dan.push({
      id: ++tran._maDan, x: x, y: y,
      vx: Math.cos(xe.gocNong) * H.tocDoDan,
      vy: Math.sin(xe.gocNong) * H.tocDoDan,
      chuId: xe.id, mau: xe.mau, tuoi: 0
    });
    if (D.ghiPhatBan) D.ghiPhatBan(tran, xe, tran.dan[tran.dan.length - 1], false);
    themHieuUng(tran, x, y, '#fff5c6', 'nong');
  }

  function tachXeChamNhau(tran) {
    if (D.ghiDienBien) D.ghiDienBien(tran);
    const xeSong = tran.xe.filter(function (xe) { return xe.conSong; });
    const duongKinh = H.banKinhXe * 2;
    // Hai lượt đủ giải phần lớn các tiếp xúc kép tại góc tường.
    for (let luot = 0; luot < 2; luot++) {
      for (let i = 0; i < xeSong.length; i++) {
        for (let j = i + 1; j < xeSong.length; j++) {
          const a = xeSong[i];
          const b = xeSong[j];
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const kc = Math.hypot(dx, dy);
          if (kc >= duongKinh) continue;
          const nx = kc < SAI_SO ? 1 : dx / kc;
          const ny = kc < SAI_SO ? 0 : dy / kc;
          const day = (duongKinh - kc + SAI_SO) / 2;
          Object.assign(a, dichChuyen(a.x, a.y, -nx * day, -ny * day, tran.tuong));
          Object.assign(b, dichChuyen(b.x, b.y, nx * day, ny * day, tran.tuong));
        }
      }
    }
  }

  D.buocMoPhong = function (tran, dt, boDieuKhien) {
    if (tran.ketThuc || !(dt > 0) || !Number.isFinite(dt)) return;
    dt = Math.min(dt, Math.max(0, H.thoiGianTranToiDa - tran.thoiGian));
    tran.thoiGian = Math.min(H.thoiGianTranToiDa, tran.thoiGian + dt);
    tran._tichLuyAI += dt;
    const capNhatAI = tran._tichLuyAI + SAI_SO >= H.chuKyAI;
    if (capNhatAI) {
      // Dùng cùng sai số khi trừ chu kỳ, tránh gọi AI hai lần sát nhau
      // khi tổng 6 bước 1/60 chỉ đạt 0,099999999 thay vì đúng 0,1.
      const soChuKy = Math.floor((tran._tichLuyAI + SAI_SO) / H.chuKyAI);
      tran._tichLuyAI = Math.max(0, tran._tichLuyAI - soChuKy * H.chuKyAI);
    }
    const viTriCu = new Map();

    // Đọc tất cả lệnh trước khi cập nhật vị trí, tránh lợi thế thứ tự trong mảng.
    for (const xe of tran.xe) {
      viTriCu.set(xe.id, { x: xe.x, y: xe.y });
      if (xe.conSong && capNhatAI && typeof boDieuKhien === 'function') {
        xe.lenh = boDieuKhien(xe, tran) || {};
      }
    }
    for (const xe of tran.xe) {
      if (!xe.conSong) continue;
      xe.thoiGianNap = Math.max(0, xe.thoiGianNap - dt);
      const lenh = xe.lenh || {};
      xe.gocNong = D.chuanHoaGoc(soHopLe(lenh.gocNong, xe.gocNong));
      // Đạn xuất phát đầu bước để phép quét xe đang chuyển động dùng cùng mốc thời gian.
      if (lenh.ban && xe.thoiGianNap <= SAI_SO) banDan(tran, xe);
      Object.assign(xe, D.tinhBuocXe(xe, lenh, dt, tran.tuong));
    }
    tachXeChamNhau(tran);
    for (const xe of tran.xe) {
      if (!xe.conSong) continue;
      const cu = viTriCu.get(xe.id);
      xe.vx = (xe.x - cu.x) / dt;
      xe.vy = (xe.y - cu.y) / dt;
    }

    const danConLai = [];
    for (const dan of tran.dan) {
      const thoiGianCon = Math.max(0, H.tuoiThoDan - dan.tuoi);
      const buocDan = Math.min(dt, thoiGianCon);
      if (buocDan <= 0) continue;
      const x2 = dan.x + dan.vx * buocDan;
      const y2 = dan.y + dan.vy * buocDan;
      let somNhat = vaChamTuong(dan.x, dan.y, x2, y2, tran.tuong, H.banKinhDan);
      let xeTrung = null;
      for (const xe of tran.xe) {
        if (!xe.conSong || xe.id === dan.chuId) continue;
        const t = vaChamDanXe(dan, x2, y2, xe, viTriCu.get(xe.id));
        // Nếu hai va chạm cùng lúc, tường che được xe phía sau.
        if (t !== null && (somNhat === null || t < somNhat - SAI_SO)) {
          somNhat = t;
          xeTrung = xe;
        }
      }
      dan.tuoi += buocDan;
      if (somNhat !== null) {
        const diemX = dan.x + (x2 - dan.x) * somNhat;
        const diemY = dan.y + (y2 - dan.y) * somNhat;
        if (D.ghiKetQuaPhatBan) D.ghiKetQuaPhatBan(tran, dan, xeTrung ? 'trung-xe' : 'cham-tuong-hoac-bien', xeTrung?.id || null, diemX, diemY);
        themHieuUng(tran, diemX, diemY, xeTrung ? xeTrung.mau : '#c6d5df', 'tia');
        if (xeTrung) {
          const nguoiBan = tran.xe.find(function (xe) { return xe.id === dan.chuId; });
          if (nguoiBan) nguoiBan.soTrung++;
          nhanSatThuong(tran, xeTrung, 1, nguoiBan, dan);
          if (xeTrung.conSong) themSuKien(tran, xeTrung.ten + ' trúng đạn.', 'trung');
        }
      } else if (dan.tuoi < H.tuoiThoDan) {
        dan.x = x2;
        dan.y = y2;
        danConLai.push(dan);
      } else if (D.ghiKetQuaPhatBan) {
        D.ghiKetQuaPhatBan(tran, dan, 'het-tuoi', null, x2, y2);
      }
    }
    tran.dan = danConLai;
    // Bo dừng hẳn ở kích thước tối thiểu, để trận cuối được quyết định bằng đấu súng.
    tran.vungAnToan = D.tinhVungAnToan(tran.thoiGian);
    if (tran.vungAnToan > 0 && !tran._daBaoThuVung) {
      tran._daBaoThuVung = true;
      themSuKien(tran, 'Vùng an toàn bắt đầu thu hẹp. Hãy tiến vào trong!', 'vung');
    }
    if (tran.vungAnToan >= H.gioiHanThuVung && !tran._daBaoDungThuVung) {
      tran._daBaoDungThuVung = true;
      themSuKien(tran, 'Bo cuối đã cố định ở ' + H.kichThuocBoToiThieu + ' × ' +
        H.kichThuocBoToiThieu + '. Tiếp tục giao chiến!', 'vung');
    }
    if (tran.vungAnToan > 0) {
      const trai = tran.vungAnToan;
      const phai = H.kichThuoc - trai;
      for (const xe of tran.xe) {
        if (xe.conSong && (xe.x < trai || xe.x > phai || xe.y < trai || xe.y > phai)) {
          nhanSatThuong(tran, xe, H.satThuongNgoaiVung * dt, null);
        }
      }
    }
    for (const hieuUng of tran.hieuUng) hieuUng.tuoi += dt;
    tran.hieuUng = tran.hieuUng.filter(function (hieuUng) {
      return hieuUng.tuoi < hieuUng.thoiLuong;
    });
    if (D.ghiDienBien) D.ghiDienBien(tran);
    const xeSong = tran.xe.filter(function (xe) { return xe.conSong; });
    const cuaBan = tran.xe.find(xe => xe.laNguoiChoi);
    // Ưu tiên kết quả thắng/thua trong bước cuối trước khi xét hết 5 phút.
    if (cuaBan && !cuaBan.conSong) {
      tran.ketQua = 'thua';
      tran.lyDoKetThuc = 'nguoi-choi-bi-loai';
      tran.nguoiThang = xeSong.length === 1 ? xeSong[0] : null;
    } else if (cuaBan && xeSong.length === 1) {
      tran.ketQua = 'thang';
      tran.lyDoKetThuc = 'nguoi-choi-song-sot-cuoi';
      tran.nguoiThang = cuaBan;
    } else if (tran.thoiGian >= H.thoiGianTranToiDa - SAI_SO) {
      tran.thoiGian = H.thoiGianTranToiDa;
      tran.ketQua = 'hoa';
      tran.lyDoKetThuc = 'het-5-phut';
    }
    if (tran.ketQua) {
      tran.ketThuc = true;
      themSuKien(tran, tran.ketQua === 'thang' ? cuaBan.ten + ' chiến thắng!' :
        tran.ketQua === 'thua' ? cuaBan.ten + ' đã thua. Trận dừng vì xe của bạn bị loại.' :
        'Hòa: hết 5 phút, xe của bạn và đối thủ vẫn còn sống.', 'ket-thuc');
      if (D.ghiDienBien) D.ghiDienBien(tran, true);
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
