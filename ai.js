/*
 * BO NAO XE TANG
 * Doi AI bang: DauTruong.dangKyAI(function (xe, tran) { return lenh; });
 * Lenh: { ga: -1..1, quay: -1..1, gocNong: radian, ban: true/false }.
 * Chi doc trang thai hien tai; khong doc lenh hay bo nho cua doi thu.
 */
(function () {
  "use strict";
  const D = window.DauTruong = window.DauTruong || {};
  const chanTroi = 1.5;
  const buocDuDoan = 0.1;
  let aiThayThe = null;
  D.phienBanAI = "chien-thuat-3";

  const kep = (giaTri, nhoNhat, lonNhat) => Math.max(nhoNhat, Math.min(lonNhat, giaTri));
  const binhPhuong = giaTri => giaTri * giaTri;
  const khoangCach = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const doiThuConSong = (xe, tran) => tran.xe.filter(doiThu => doiThu.conSong && doiThu.id !== xe.id);

  // Thoi diem tia gap hinh chu nhat. Tra ve Infinity neu khong gap.
  function thoiGianGapHop(x, y, vx, vy, trai, tren, phai, duoi) {
    let vao = -Infinity;
    let ra = Infinity;
    for (const [viTri, vanToc, nhoNhat, lonNhat] of [[x, vx, trai, phai], [y, vy, tren, duoi]]) {
      if (Math.abs(vanToc) < 0.00001) {
        if (viTri < nhoNhat || viTri > lonNhat) return Infinity;
      } else {
        const dau = (nhoNhat - viTri) / vanToc;
        const cuoi = (lonNhat - viTri) / vanToc;
        vao = Math.max(vao, Math.min(dau, cuoi));
        ra = Math.min(ra, Math.max(dau, cuoi));
      }
    }
    return ra >= Math.max(0, vao) ? Math.max(0, vao) : Infinity;
  }

  // Dan co ban kinh, nen duong tam khong cham tuong van co the bi mep tuong chan.
  function duongBanThong(xe, diemNgam, tran) {
    const r = D.hangSo.banKinhDan;
    return !tran.tuong.some(tuong => thoiGianGapHop(xe.x, xe.y,
      diemNgam.x - xe.x, diemNgam.y - xe.y,
      tuong.x - r, tuong.y - r, tuong.x + tuong.rong + r, tuong.y + tuong.cao + r) <= 1);
  }

  function thoiGianDanConBay(dan, tran) {
    const h = D.hangSo;
    const r = h.banKinhDan;
    let conLai = Math.max(0, (h.tuoiThoDan || 4) - (dan.tuoi || 0));
    if (dan.vx > 0) conLai = Math.min(conLai, (h.kichThuoc - r - dan.x) / dan.vx);
    if (dan.vx < 0) conLai = Math.min(conLai, (r - dan.x) / dan.vx);
    if (dan.vy > 0) conLai = Math.min(conLai, (h.kichThuoc - r - dan.y) / dan.vy);
    if (dan.vy < 0) conLai = Math.min(conLai, (r - dan.y) / dan.vy);
    for (const tuong of tran.tuong) {
      conLai = Math.min(conLai, thoiGianGapHop(dan.x, dan.y, dan.vx, dan.vy,
        tuong.x - r, tuong.y - r, tuong.x + tuong.rong + r, tuong.y + tuong.cao + r));
    }
    return Math.max(0, conLai);
  }

  // Khoang cach nho nhat cua HAI vat dang di chuyen trong cung mot doan thoi gian.
  // Khong chi kiem tra dau/cuoi buoc: dan nhanh co the xuyen qua xe giua hai moc.
  function tiepCanGanNhat(dau, cuoi, dan, batDau, ketThuc) {
    const doDai = cuoi.t - dau.t;
    const vxXe = (cuoi.x - dau.x) / doDai;
    const vyXe = (cuoi.y - dau.y) / doDai;
    const xXe = dau.x + vxXe * (batDau - dau.t);
    const yXe = dau.y + vyXe * (batDau - dau.t);
    const xDan = dan.x + dan.vx * (batDau - dan.batDau);
    const yDan = dan.y + dan.vy * (batDau - dan.batDau);
    const dx = xDan - xXe;
    const dy = yDan - yXe;
    const vx = dan.vx - vxXe;
    const vy = dan.vy - vyXe;
    const tocDoTuongDoi = vx * vx + vy * vy;
    const tre = tocDoTuongDoi > 0.00001
      ? kep(-(dx * vx + dy * vy) / tocDoTuongDoi, 0, ketThuc - batDau) : 0;
    return { khoangCach: Math.hypot(dx + vx * tre, dy + vy * tre), t: batDau + tre };
  }

  // Nghiệm tiếp xúc ĐẦU TIÊN của hai vòng tròn, khác thời điểm gần nhất.
  function tiepXucDauTien(dau, cuoi, dan, batDau, ketThuc) {
    const dt = cuoi.t - dau.t;
    const vxXe = (cuoi.x - dau.x) / dt, vyXe = (cuoi.y - dau.y) / dt;
    const dx = dan.x + dan.vx * (batDau - dan.batDau) - dau.x - vxXe * (batDau - dau.t);
    const dy = dan.y + dan.vy * (batDau - dan.batDau) - dau.y - vyXe * (batDau - dau.t);
    const vx = dan.vx - vxXe, vy = dan.vy - vyXe;
    const r = D.hangSo.banKinhXe + D.hangSo.banKinhDan;
    const a = vx * vx + vy * vy, b = 2 * (dx * vx + dy * vy), c = dx * dx + dy * dy - r * r;
    if (c <= 0) return batDau;
    const delta = b * b - 4 * a * c;
    if (a < 1e-8 || delta < 0) return Infinity;
    const t = (-b - Math.sqrt(delta)) / (2 * a);
    return t >= 0 && t <= ketThuc - batDau ? batDau + t : Infinity;
  }

  function theoDoiDan(xe, tran, doiThu, tamNhin = chanTroi, doanPhatBan = true) {
    const danhSach = [];
    for (const dan of tran.dan) {
      if (dan.chuId === xe.id) continue;
      const conBay = thoiGianDanConBay(dan, tran);
      if (conBay > 0.001) danhSach.push({ ...dan, batDau: 0, ketThuc: Math.min(tamNhin, conBay), doTinCay: 1 });
    }
    const soDanThuc = danhSach.length;

    // Du doan mot phat ban SAP TOI tu huong nong dang quan sat duoc.
    // Day la gia thuyet co trong so thap, khong phai truy cap tuong lai cua bot.
    for (const dich of doanPhatBan ? doiThu : []) {
      const tre = Math.max(0.12, dich.thoiGianNap || 0);
      if (tre > 0.85) continue;
      const gocDenTa = Math.atan2(xe.y - dich.y, xe.x - dich.x);
      if (Math.abs(D.chuanHoaGoc(gocDenTa - dich.gocNong)) > 0.3) continue;
      if (D.doanBiChan(dich.x, dich.y, xe.x, xe.y, tran.tuong)) continue;
      const huongX = Math.cos(dich.gocNong);
      const huongY = Math.sin(dich.gocNong);
      const danGiaThuyet = {
        x: dich.x + (dich.vx || 0) * tre + huongX * 26,
        y: dich.y + (dich.vy || 0) * tre + huongY * 26,
        vx: huongX * D.hangSo.tocDoDan,
        vy: huongY * D.hangSo.tocDoDan,
        tuoi: 0,
        batDau: tre,
        doTinCay: 0.28
      };
      danGiaThuyet.ketThuc = Math.min(tamNhin, tre + thoiGianDanConBay(danGiaThuyet, tran));
      if (danGiaThuyet.ketThuc > tre) danhSach.push(danGiaThuyet);
    }
    return { danhSach, soDanThuc };
  }

  function theoDoiDoiThu(xe, tran, doiThu) {
    const boNho = xe.boNhoAI;
    const cu = boNho.quanSatDoiThu || {};
    const moi = {};
    for (const dich of doiThu) {
      const lanTruoc = cu[dich.id];
      const dt = lanTruoc ? tran.thoiGian - lanTruoc.t : 0;
      // Van toc hien tai duoc game cong bo; luu quan sat de AI thay the co the dung lai.
      const vxQuanSat = dt > 0.001 ? (dich.x - lanTruoc.x) / dt : 0;
      const vyQuanSat = dt > 0.001 ? (dich.y - lanTruoc.y) / dt : 0;
      moi[dich.id] = {
        x: dich.x, y: dich.y, t: tran.thoiGian,
        vx: Number.isFinite(dich.vx) ? dich.vx : vxQuanSat,
        vy: Number.isFinite(dich.vy) ? dich.vy : vyQuanSat,
        soLan: (lanTruoc?.soLan || 0) + 1, tocDoQuay: 0,
        danhGia: lanTruoc?.danhGia || { soMau: 0, thang: 0, cong: 0, cho: [] }
      };
      const q = moi[dich.id];
      // So dự đoán cũ với vị trí thật khi đạn lẽ ra đã tới đích.
      // Chỉ dùng kết quả đã xảy ra để chọn mô hình ngắm cho lần sau.
      q.danhGia.cho = q.danhGia.cho.filter(mau => {
        if (mau.t > tran.thoiGian) return true;
        if (tran.thoiGian - mau.t < 0.16) {
          const tiLe = q.danhGia.soMau ? 0.25 : 1;
          q.danhGia.thang += (khoangCach(dich, mau.thang) - q.danhGia.thang) * tiLe;
          q.danhGia.cong += (khoangCach(dich, mau.cong) - q.danhGia.cong) * tiLe;
          q.danhGia.soMau++;
        }
        return false;
      });
      if (lanTruoc && dt > 0.001 && dt < 0.35 &&
          Math.hypot(q.vx, q.vy) > 35 && Math.hypot(lanTruoc.vx, lanTruoc.vy) > 35) {
        const quay = kep(D.chuanHoaGoc(Math.atan2(q.vy, q.vx) - Math.atan2(lanTruoc.vy, lanTruoc.vx)) / dt, -2.7, 2.7);
        q.tocDoQuay = quay * 0.7 + (lanTruoc.tocDoQuay || 0) * 0.3;
      }
    }
    boNho.quanSatDoiThu = moi;
    return moi;
  }

  // Dan xuat phat cach tam xe 25px: khoang cach can bay = tocDoDan*t + 25.
  function thoiGianDonDau(xe, dich, vx, vy) {
    const dx = dich.x - xe.x;
    const dy = dich.y - xe.y;
    const a = vx * vx + vy * vy - binhPhuong(D.hangSo.tocDoDan);
    const doDaiNong = 25;
    const b = 2 * (dx * vx + dy * vy - D.hangSo.tocDoDan * doDaiNong);
    const c = dx * dx + dy * dy - doDaiNong * doDaiNong;
    if (Math.abs(a) < 0.00001) return b < -0.00001 ? -c / b : 0;
    const bietThuc = b * b - 4 * a * c;
    if (bietThuc < 0) return 0;
    const can = Math.sqrt(bietThuc);
    const nghiem = [(-b - can) / (2 * a), (-b + can) / (2 * a)].filter(t => t > 0);
    return nghiem.length ? Math.min(...nghiem) : 0;
  }

  function duDoanViTriDich(dich, quanSat, t, tran) {
    const r = D.hangSo.banKinhXe;
    let x = kep(dich.x + quanSat.vx * t, r, D.hangSo.kichThuoc - r);
    let y = kep(dich.y + quanSat.vy * t, r, D.hangSo.kichThuoc - r);
    // Xe dung truoc tuong theo ban kinh xe, khong dua tam xe toi sat mat tuong.
    let tiLeDiDuoc = 1;
    for (const tuong of tran.tuong) {
      // Dang cham mot mat tuong van duoc phep roi tuong hoac truot doc mat do.
      if ((dich.x <= tuong.x - r + 0.00001 && x <= dich.x) ||
        (dich.x >= tuong.x + tuong.rong + r - 0.00001 && x >= dich.x) ||
        (dich.y <= tuong.y - r + 0.00001 && y <= dich.y) ||
        (dich.y >= tuong.y + tuong.cao + r - 0.00001 && y >= dich.y)) continue;
      const gapTuong = thoiGianGapHop(dich.x, dich.y, x - dich.x, y - dich.y,
        tuong.x - r, tuong.y - r, tuong.x + tuong.rong + r, tuong.y + tuong.cao + r);
      if (gapTuong <= tiLeDiDuoc) tiLeDiDuoc = Math.max(0, gapTuong - 0.00001);
    }
    x = dich.x + (x - dich.x) * tiLeDiDuoc;
    y = dich.y + (y - dich.y) * tiLeDiDuoc;
    return { x, y };
  }

  function chonMucTieu(xe, tran, doiThu, quanSat) {
    let totNhat = null;
    for (const dich of doiThu) {
      const duLieu = quanSat[dich.id];
      let t = kep(thoiGianDonDau(xe, dich, duLieu.vx, duLieu.vy), 0, 3);
      let diemNgam = duDoanViTriDich(dich, duLieu, t, tran);
      const diemThang = diemNgam;
      const thoiGianThang = t;
      const dangQuay = duLieu.soLan >= 3 && Math.abs(duLieu.tocDoQuay) > 0.25;
      if (dangQuay) {
        // Chỉ suy ra độ cong từ vận tốc đã quan sát; không đọc lệnh của bot.
        for (let lap = 0; lap < 3; lap++) {
          let viTri = { x: dich.x, y: dich.y, goc: Math.atan2(duLieu.vy, duLieu.vx) };
          const lenh = { ga: kep(Math.hypot(duLieu.vx, duLieu.vy) / D.hangSo.tocDoXe, 0, 1),
            quay: duLieu.tocDoQuay / D.hangSo.tocDoQuay };
          for (let daDi = 0; daDi < t - 1e-6;) {
            const dt = Math.min(1 / 30, t - daDi);
            viTri = D.tinhBuocXe(viTri, lenh, dt, tran.tuong); daDi += dt;
          }
          diemNgam = { x: viTri.x, y: viTri.y };
          t = kep((khoangCach(xe, diemNgam) - 25) / D.hangSo.tocDoDan, 0, 3);
        }
      }
      const dg = duLieu.danhGia;
      if (dangQuay && (dg.cho.length === 0 || tran.thoiGian - dg.cho.at(-1).luc >= 0.19)) {
        dg.cho.push({ luc: tran.thoiGian, t: tran.thoiGian + thoiGianThang, thang: diemThang,
          cong: duDoanCongTaiThoiDiem(dich, duLieu, thoiGianThang, tran) });
      }
      const dungDuongCong = dangQuay && dg.soMau >= 3 && dg.cong < dg.thang * 0.85;
      if (!dungDuongCong) diemNgam = diemThang;
      const thong = duongBanThong(xe, diemNgam, tran);
      const tam = khoangCach(xe, dich);
      const diem = (thong ? 5 : 0) - tam / 240 + (1 - dich.hp / dich.hpToiDa) * 2.6
        + (xe.boNhoAI.mucTieuId === dich.id ? 0.65 : 0);
      if (!totNhat || diem > totNhat.diem) totNhat = { dich, diemNgam, thong, diem,
        kieuNgam: dungDuongCong ? "theo-duong-cong" : Math.hypot(duLieu.vx, duLieu.vy) < 15 ? "dich-dang-dung" : "don-dau-thang" };
    }
    return totNhat;
  }

  function duDoanCongTaiThoiDiem(dich, quanSat, t, tran) {
    let viTri = { x: dich.x, y: dich.y, goc: Math.atan2(quanSat.vy, quanSat.vx) };
    const lenh = { ga: kep(Math.hypot(quanSat.vx, quanSat.vy) / D.hangSo.tocDoXe, 0, 1),
      quay: quanSat.tocDoQuay / D.hangSo.tocDoQuay };
    for (let daDi = 0; daDi < t - 1e-6;) {
      const dt = Math.min(1 / 30, t - daDi);
      viTri = D.tinhBuocXe(viTri, lenh, dt, tran.tuong); daDi += dt;
    }
    return { x: viTri.x, y: viTri.y };
  }

  function khoangTrongDenTuong(x, y, tran) {
    let trong = Math.min(x, y, D.hangSo.kichThuoc - x, D.hangSo.kichThuoc - y) - D.hangSo.banKinhXe;
    for (const tuong of tran.tuong) {
      const dx = Math.max(tuong.x - x, 0, x - tuong.x - tuong.rong);
      const dy = Math.max(tuong.y - y, 0, y - tuong.y - tuong.cao);
      trong = Math.min(trong, Math.hypot(dx, dy) - D.hangSo.banKinhXe);
    }
    return trong;
  }

  function taoUngVien(xe, tran, chuoiLenh = []) {
    const ungVien = [];
    const cacChuoi = [];
    for (const ga of [-1, 0, 1]) for (const quay of [-1, -0.5, 0, 0.5, 1]) cacChuoi.push([{ ga, quay, den: chanTroi }]);
    cacChuoi.push(...chuoiLenh);
    for (const chuoi of cacChuoi) {
        const { ga, quay } = chuoi[0];
        let xeGiaLap = { x: xe.x, y: xe.y, goc: xe.goc };
        const duong = [{ x: xe.x, y: xe.y, t: 0 }];
        let biCan = 0;
        for (let buoc = 1; buoc <= Math.round(chanTroi / buocDuDoan); buoc++) {
          // Cung buoc 1/60 giay voi game. Buoc 0.1s mot lan lam duong re bi lech.
          for (let buocNho = 0; buocNho < 6; buocNho++) {
            const t = (buoc - 1) * buocDuDoan + buocNho * buocDuDoan / 6;
            const lenh = chuoi.find(l => t < l.den - 1e-6) || chuoi.at(-1);
            const cu = xeGiaLap;
            xeGiaLap = D.tinhBuocXe(xeGiaLap, lenh, buocDuDoan / 6, tran.tuong);
            if (lenh.ga !== 0 && khoangCach(cu, xeGiaLap) < D.hangSo.tocDoXe * buocDuDoan / 6 * 0.3) biCan += buocDuDoan / 6;
          }
          const viTri = xeGiaLap;
          duong.push({ x: viTri.x, y: viTri.y, t: buoc * buocDuDoan });
        }
        ungVien.push({ ga, quay, chuoi, loai: chuoi.loai || "co-ban", duong, biCan, diem: 0, nguyHiem: 0 });
    }
    return ungVien;
  }

  function duDoanPhatBanGan(xe, tran, doiThu) {
    const theoDoi = theoDoiDan(xe, tran, doiThu, chanTroi, false);
    for (const dich of doiThu) {
      const tam = khoangCach(xe, dich);
      const tre = Math.max(1 / 60, (dich.thoiGianNap || 0) - 1 / 60);
      if (tam > 650 || tre > 0.8 || !duongBanThong(dich, xe, tran)) continue;
      const gocDenTa = Math.atan2(xe.y - dich.y, xe.x - dich.x);
      const lechNong = Math.abs(D.chuanHoaGoc(gocDenTa - dich.gocNong));
      const thoiGianBay = Math.max(0, (tam - 25) / D.hangSo.tocDoDan);
      const gocDon = Math.atan2(xe.y + (xe.vy || 0) * thoiGianBay - dich.y,
        xe.x + (xe.vx || 0) * thoiGianBay - dich.x);
      // Nòng có thể đổi hướng ngay trong game: xét cả ngắm hiện tại và đón đầu.
      const cacGoc = [gocDon];
      if (lechNong < 0.7 && Math.abs(D.chuanHoaGoc(dich.gocNong - gocDon)) > 0.05) cacGoc.push(dich.gocNong);
      for (const goc of cacGoc) {
        const dan = { x: dich.x + (dich.vx || 0) * tre + Math.cos(goc) * 25,
          y: dich.y + (dich.vy || 0) * tre + Math.sin(goc) * 25,
          vx: Math.cos(goc) * D.hangSo.tocDoDan, vy: Math.sin(goc) * D.hangSo.tocDoDan,
          tuoi: 0, batDau: tre, doTinCay: tam < 200 && tre < 0.25 ? 0.65 : 0.38 };
        dan.ketThuc = Math.min(chanTroi, tre + thoiGianDanConBay(dan, tran));
        theoDoi.danhSach.push(dan);
      }
    }
    return theoDoi;
  }

  // Đồ thị các góc vật cản, có khoảng đệm bằng bán kính xe. Tìm đường
  // tới điểm mở góc bắn; không buộc xe lao vào vị trí đối thủ.
  function giaNguyCoViTri(p, tran, doiThu, rutLui) {
    let gia = 0, lo = 0;
    for (const d of doiThu) {
      if (!duongBanThong(p, d, tran)) continue;
      const tam = Math.min(khoangCach(p, d), Math.hypot(p.x - d.x - (d.vx || 0) * 0.5, p.y - d.y - (d.vy || 0) * 0.5));
      gia += Math.max(0, (rutLui ? 270 : 190) - tam) * (rutLui ? 2.8 : 1.8);
      if (tam < 400) lo++;
    }
    return gia + Math.max(0, lo - 1) * (rutLui ? 100 : 45);
  }

  function timDiemDiVong(xe, tran, mucTieu, doiThu, beTac, chienThuat) {
    if (!mucTieu) return null;
    const boNho = xe.boNhoAI;
    const biChe = !duongBanThong(xe, mucTieu.dich, tran);
    const loai = chienThuat.canRut ? "rut-lui" : "di-vong";
    if (!biChe && !beTac && !chienThuat.canRut) { boNho.diVong = null; return null; }
    const cu = boNho.diVong;
    if (cu && cu.loai === loai && cu.dichId === mucTieu.dich.id && tran.thoiGian < cu.hetHan) {
      while (khoangCach(xe, cu) <= 22 && cu.duongConLai?.length) Object.assign(cu, cu.duongConLai.shift());
      const bienCu = D.tinhVungAnToan(tran.thoiGian + 1) + D.hangSo.banKinhXe + 5;
      if (khoangCach(xe, cu) > 22 && Math.min(cu.x, cu.y, D.hangSo.kichThuoc - cu.x, D.hangSo.kichThuoc - cu.y) > bienCu && duongDiThong(xe, cu, tran)) return cu;
    }
    const dem = D.hangSo.banKinhXe + 14;
    const bien = D.tinhVungAnToan(tran.thoiGian + 2) + dem;
    const hopLe = p => p.x > bien && p.y > bien && p.x < D.hangSo.kichThuoc - bien && p.y < D.hangSo.kichThuoc - bien &&
      khoangTrongDenTuong(p.x, p.y, tran) >= 10;
    const nut = [{ x: xe.x, y: xe.y }];
    for (const w of tran.tuong) for (const x of [w.x - dem, w.x + w.rong + dem])
      for (const y of [w.y - dem, w.y + w.cao + dem]) if (hopLe({ x, y })) nut.push({ x, y });
    if (beTac || biChe) for (const tamVong of [170, 210, 250]) for (let i = 0; i < 12; i++) {
      const goc = i * Math.PI / 6;
      const p = { x: mucTieu.dich.x + Math.cos(goc) * tamVong, y: mucTieu.dich.y + Math.sin(goc) * tamVong };
      if (hopLe(p)) nut.push(p);
    }
    if (chienThuat.canRut) {
      for (let i = 0; i < 12; i++) {
        const goc = i * Math.PI / 6;
        const p = { x: kep(xe.x + Math.cos(goc) * 150, bien + 1, D.hangSo.kichThuoc - bien - 1),
          y: kep(xe.y + Math.sin(goc) * 150, bien + 1, D.hangSo.kichThuoc - bien - 1) };
        if (hopLe(p) && khoangCach(xe, p) > 35) nut.push(p);
      }
      if (hopLe({ x: 480, y: 480 })) nut.push({ x: 480, y: 480 });
    }
    const giaNut = nut.map(p => giaNguyCoViTri(p, tran, doiThu, chienThuat.rutLui) +
      (boNho.diemBiKet && tran.thoiGian < boNho.diemBiKet.hetHan && khoangCach(p, boNho.diemBiKet) < 45 ? 450 : 0));
    // Cho phép đi qua nhiều góc đối với các dãy tường.
    const diem = nut.map(() => Infinity), truoc = nut.map(() => -1), daXet = new Set();
    diem[0] = 0;
    for (let lap = 0; lap < nut.length; lap++) {
      let i = -1;
      for (let j = 0; j < nut.length; j++) if (!daXet.has(j) && (i < 0 || diem[j] < diem[i])) i = j;
      if (i < 0 || !Number.isFinite(diem[i])) break;
      daXet.add(i);
      for (let j = 1; j < nut.length; j++) if (!daXet.has(j) && duongDiThong(nut[i], nut[j], tran)) {
        const moi = diem[i] + khoangCach(nut[i], nut[j]) + (giaNut[i] + giaNut[j]) * 0.12;
        if (moi < diem[j]) { diem[j] = moi; truoc[j] = i; }
      }
    }
    let chon = -1, diemChon = Infinity;
    for (let j = 1; j < nut.length; j++) {
      if ((!chienThuat.canRut && !duongBanThong(nut[j], mucTieu.dich, tran)) || !Number.isFinite(diem[j])) continue;
      if (beTac && !biChe && !chienThuat.canRut) {
        const gocCu = Math.atan2(xe.y - mucTieu.dich.y, xe.x - mucTieu.dich.x);
        const gocMoi = Math.atan2(nut[j].y - mucTieu.dich.y, nut[j].x - mucTieu.dich.x);
        if (Math.abs(D.chuanHoaGoc(gocMoi - gocCu)) < 0.5 || khoangCach(xe, nut[j]) < 70) continue;
      }
      const tam = khoangCach(nut[j], mucTieu.dich);
      const loThien = doiThu.filter(d => khoangCach(nut[j], d) < 380 && duongBanThong(nut[j], d, tran)).length;
      const biKet = boNho.diemBiKet && tran.thoiGian < boNho.diemBiKet.hetHan && khoangCach(nut[j], boNho.diemBiKet) < 45;
      const gia = diem[j] + giaNut[j] + (chienThuat.canRut ? 0 : Math.max(0, (chienThuat.rutLui ? 240 : 190) - tam) * 2.8)
        + Math.max(0, loThien - 1) * 60 + (biKet ? 600 : 0);
      if (gia < diemChon) { diemChon = gia; chon = j; }
    }
    if (chon < 0) return null;
    const duong = [];
    for (let k = chon; k > 0; k = truoc[k]) duong.unshift({ ...nut[k] });
    boNho.diVong = { ...duong[0], duongConLai: duong.slice(1), loai, dichId: mucTieu.dich.id, hetHan: tran.thoiGian + 6 };
    return boNho.diVong;
  }

  function duongDiThong(a, b, tran) {
    const r = D.hangSo.banKinhXe + 5;
    return !tran.tuong.some(w => thoiGianGapHop(a.x, a.y, b.x - a.x, b.y - a.y,
      w.x - r, w.y - r, w.x + w.rong + r, w.y + w.cao + r) <= 1);
  }

  function taoChuoiNe(xe, diemDen, coNguyCo, khanCap) {
    const cacChuoi = [];
    const mocDoi = khanCap ? 0.1 : 0.3;
    if (coNguyCo) for (const ga of [-1, 1]) for (const quay of [-1, 0, 1]) {
      cacChuoi.push(Object.assign([{ ga, quay, den: mocDoi }, { ga, quay: -quay, den: chanTroi }], { loai: "doi-huong" }));
      cacChuoi.push(Object.assign([{ ga, quay, den: mocDoi }, { ga: -ga, quay, den: chanTroi }], { loai: "doi-chieu" }));
    }
    if (khanCap) for (const ga of [-1, 1]) {
      for (const quay of [-0.75, -0.25, 0.25, 0.75]) cacChuoi.push(Object.assign([{ ga, quay, den: chanTroi }], { loai: "ne-khan-cap" }));
      for (const quay of [-1, 1]) cacChuoi.push(Object.assign([{ ga: ga * 0.5, quay, den: chanTroi }], { loai: "ne-khan-cap" }));
    }
    if (diemDen) for (const ga of [-1, 1]) {
      const goc = Math.atan2(diemDen.y - xe.y, diemDen.x - xe.x) + (ga < 0 ? Math.PI : 0);
      const lech = D.chuanHoaGoc(goc - xe.goc);
      // Chọn hướng truyền động cần quay ít hơn; tránh đổi tiến/lùi mỗi
      // chu kỳ chỉ để hứa sẽ tới điểm đến trong phần cuối dự đoán.
      if (Math.abs(lech) > Math.PI / 2) continue;
      const quay = Math.sign(lech), den = kep(Math.abs(lech) / D.hangSo.tocDoQuay, 0.1, 1.3);
      cacChuoi.push(Object.assign([{ ga, quay, den }, { ga, quay: 0, den: chanTroi }], { loai: "toi-diem" }));
      // Điểm đến gần cần phanh đúng chỗ; chỉ giữ ga suốt 1,5 giây sẽ
      // khiến xe chọn đứng yên vì mọi đường còn lại đều vượt quá góc tường.
      // Căn mốc đổi lệnh theo chu kỳ 0,1 giây để không quay quá góc
      // rồi lắc qua lại khi thời gian cần quay nhỏ hơn một chu kỳ.
      const thoiGianQuay = Math.abs(lech) < 0.08 ? 0 : Math.ceil(Math.abs(lech) / D.hangSo.tocDoQuay / 0.1) * 0.1;
      const toiDiem = Math.min(chanTroi, thoiGianQuay + khoangCach(xe, diemDen) / D.hangSo.tocDoXe);
      const chuoiDen = [];
      if (thoiGianQuay > 0) chuoiDen.push({ ga: 0, quay: lech / (thoiGianQuay * D.hangSo.tocDoQuay), den: thoiGianQuay });
      if (toiDiem > thoiGianQuay) chuoiDen.push({ ga, quay: 0, den: toiDiem });
      chuoiDen.push({ ga: 0, quay: 0, den: chanTroi });
      cacChuoi.push(Object.assign(chuoiDen, { loai: "toi-diem" }));
    }
    return cacChuoi;
  }

  function phanKeHoachConLai(keHoach, thoiGian) {
    if (!keHoach) return null;
    const tre = thoiGian - keHoach.batDau;
    if (tre < 0 || tre >= keHoach.chuoi.at(-1).den - 1e-6) return null;
    const chuoi = keHoach.chuoi.filter(l => l.den > tre + 1e-6).map(l => ({ ...l, den: l.den - tre }));
    // Đánh giá cả đoạn còn lại và phần giữ lệnh cuối cho đủ cùng chân trời.
    chuoi.at(-1).den = chanTroi;
    return Object.assign(chuoi, { loai: "tiep-tuc" });
  }

  function capNhatTrangThaiChienThuat(xe, tran, doiThu) {
    const n = xe.boNhoAI;
    const matMau = Number.isFinite(n.hpTruoc) && xe.hp < n.hpTruoc - 0.1;
    const lo = doiThu.filter(d => khoangCach(xe, d) < 330 && duongBanThong(xe, d, tran));
    const ganNhat = Math.min(Infinity, ...lo.map(d => khoangCach(xe, d)));
    const r = D.hangSo.banKinhXe;
    const ngoaiBo = Math.min(xe.x, xe.y, D.hangSo.kichThuoc - xe.x, D.hangSo.kichThuoc - xe.y) < D.tinhVungAnToan(tran.thoiGian + 0.6) + r;
    if (matMau) { n.rutLuiDen = tran.thoiGian + 3; n.lanMatMau = tran.thoiGian; n.dangRutLui = true; }
    const daAnToan = lo.length <= 1 && ganNhat > 280 && !ngoaiBo;
    if (!daAnToan) n.anToanTu = null;
    else if (n.anToanTu == null) n.anToanTu = tran.thoiGian;
    if (n.dangRutLui && daAnToan && tran.thoiGian - n.anToanTu >= 1.2 && tran.thoiGian >= n.rutLuiDen) n.dangRutLui = false;
    n.hpTruoc = xe.hp;
    const rutLui = xe.hp / xe.hpToiDa <= 0.4 || !!n.dangRutLui;
    if (!n.lichSuViTri) n.lichSuViTri = [];
    if (!n.lichSuViTri.length || tran.thoiGian - n.lichSuViTri.at(-1).t >= 0.19) n.lichSuViTri.push({ x: xe.x, y: xe.y, t: tran.thoiGian });
    n.lichSuViTri = n.lichSuViTri.filter(p => tran.thoiGian - p.t <= 2.6);
    let biLap = false;
    if (n.diVong && n.lichSuViTri.length > 8 && tran.thoiGian - n.lichSuViTri[0].t >= 2 && khoangCach(xe, n.diVong) > 22) {
      const xs = n.lichSuViTri.map(p => p.x), ys = n.lichSuViTri.map(p => p.y);
      biLap = Math.hypot(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)) < 35;
      if (biLap) {
        n.diemBiKet = { ...n.diVong, hetHan: tran.thoiGian + 6 };
        n.diVong = null; n.keHoach = null; n.lichSuViTri = [];
      }
    }
    return { rutLui, ngoaiBo, canRut: ngoaiBo || (rutLui && (lo.length >= 2 || ganNhat < 225)), biLap };
  }

  function chamDiem(ungVien, xe, tran, cacDan, doiThu, mucTieu, quanSat, chienThuat) {
    const banKinhAnToan = D.hangSo.banKinhXe + D.hangSo.banKinhDan + 6;
    let diem = -ungVien.biCan * 120;
    let nguyHiem = 0;
    ungVien.satThuongGan = 0;
    ungVien.vaChamSom = chanTroi + 1;
    ungVien.tiepXucDau = chanTroi + 1;
    ungVien.satThuongBoGan = 0;
    for (const dan of cacDan) {
      let ganNhat = { khoangCach: Infinity, t: chanTroi };
      let tiepXuc = Infinity;
      for (let moc = 1; moc < ungVien.duong.length; moc++) {
        const dau = ungVien.duong[moc - 1];
        const cuoi = ungVien.duong[moc];
        const batDau = Math.max(dau.t, dan.batDau);
        const ketThuc = Math.min(cuoi.t, dan.ketThuc);
        if (ketThuc <= batDau) continue;
        const tiepCan = tiepCanGanNhat(dau, cuoi, dan, batDau, ketThuc);
        if (tiepCan.khoangCach < ganNhat.khoangCach) ganNhat = tiepCan;
        if (dan.doTinCay === 1) tiepXuc = Math.min(tiepXuc, tiepXucDauTien(dau, cuoi, dan, batDau, ketThuc));
      }
      const khoangDu = ganNhat.khoangCach - banKinhAnToan;
      const doKhanCap = 1 - ganNhat.t / (chanTroi + 0.8);
      const ruiRo = kep(Math.exp(-Math.max(0, khoangDu) / 24) * dan.doTinCay, 0, 1);
      nguyHiem = Math.max(nguyHiem, ruiRo);
      // Chỉ đạn thật được dùng để loại các đường chắc chắn va chạm sớm.
      if (dan.doTinCay === 1 && ganNhat.khoangCach <= banKinhAnToan - 4) {
        ungVien.vaChamSom = Math.min(ungVien.vaChamSom, ganNhat.t);
      }
      if (dan.doTinCay === 1) {
        ungVien.tiepXucDau = Math.min(ungVien.tiepXucDau, tiepXuc);
        if (tiepXuc <= 0.6) ungVien.satThuongGan++;
      }
      if (khoangDu <= 0) diem -= (dan.doTinCay === 1 ? 2300 : 240) * doKhanCap * dan.doTinCay;
      else diem -= 160 * ruiRo * doKhanCap;
    }

    for (let moc = 1; moc < ungVien.duong.length; moc++) {
      const viTri = ungVien.duong[moc];
      diem -= Math.max(0, 30 - khoangTrongDenTuong(viTri.x, viTri.y, tran)) * 0.13;
      const bienAnToan = Math.max(tran.vungAnToan || 0, D.tinhVungAnToan(tran.thoiGian + viTri.t));
      const khoangRaNgoai = Math.max(bienAnToan + D.hangSo.banKinhXe - viTri.x,
        bienAnToan + D.hangSo.banKinhXe - viTri.y,
        viTri.x + D.hangSo.banKinhXe - (D.hangSo.kichThuoc - bienAnToan),
        viTri.y + D.hangSo.banKinhXe - (D.hangSo.kichThuoc - bienAnToan), 0);
      if (khoangRaNgoai > 0) {
        diem -= (xe.hp <= 1 ? 1800 : 650) * buocDuDoan + khoangRaNgoai * 3 * buocDuDoan;
        if (viTri.t <= 0.6 + 1e-6) ungVien.satThuongBoGan += D.hangSo.satThuongNgoaiVung * buocDuDoan;
      }
      const doiGocAnToan = chienThuat.beTac && doiThu.length === 1 && !chienThuat.khanCap;
      if (chienThuat.rutLui && !doiGocAnToan && moc % 3 === 0) diem -= giaNguyCoViTri(viTri, tran, doiThu, true) * 0.12;
    }

    const cuoi = ungVien.duong[ungVien.duong.length - 1];
    let soDichTrongTam = 0;
    for (const dich of doiThu) {
      const viTriDich = duDoanViTriDich(dich, quanSat[dich.id], chanTroi * 0.5, tran);
      const tam = khoangCach(cuoi, viTriDich);
      const thong = !D.doanBiChan(cuoi.x, cuoi.y, viTriDich.x, viTriDich.y, tran.tuong);
      const phaBeTac = chienThuat.beTac && doiThu.length === 1 && chienThuat.diemDen?.loai === "di-vong" && !chienThuat.khanCap;
      const tamAnToan = chienThuat.rutLui ? (phaBeTac ? 180 : 240) : 190;
      if (tam < tamAnToan && thong) diem -= (tamAnToan - tam) * (chienThuat.rutLui ? 2.8 : 1.8);
      // Phạt cả đường áp sát ở giữa, không chỉ vị trí cuối 1,5 giây.
      for (const moc of [3, 6, 9]) {
        const viTri = ungVien.duong[moc];
        const xDich = dich.x + quanSat[dich.id].vx * Math.min(viTri.t, 0.5);
        const yDich = dich.y + quanSat[dich.id].vy * Math.min(viTri.t, 0.5);
        const tamGiua = Math.hypot(viTri.x - xDich, viTri.y - yDich);
        if (tamGiua < 150 && thong) diem -= (150 - tamGiua) * 1.2;
      }
      if (chienThuat.rutLui && !thong && khoangCach(xe, dich) < 500) diem += 18;
      if (tam < 420 && !D.doanBiChan(cuoi.x, cuoi.y, viTriDich.x, viTriDich.y, tran.tuong)) soDichTrongTam++;
    }
    diem -= Math.max(0, soDichTrongTam - 1) * (chienThuat.rutLui ? 65 : 32);
    if (mucTieu) {
      const tamHienTai = khoangCach(xe, mucTieu.dich);
      const tamMoi = khoangCach(cuoi, mucTieu.dich);
      const tamMuon = chienThuat.rutLui ? 340 : 280;
      diem -= Math.abs(tamMoi - tamMuon) * 0.075;
      if (tamHienTai > tamMuon + 60 && !chienThuat.diemDen) diem += (tamHienTai - tamMoi) * 0.09;
      if (!D.doanBiChan(cuoi.x, cuoi.y, mucTieu.diemNgam.x, mucTieu.diemNgam.y, tran.tuong)) diem += chienThuat.rutLui ? 9 : 27;
    }
    if (chienThuat.diemDen) {
      const den = chienThuat.diemDen;
      const dau = khoangCach(xe, den);
      for (const [moc, trongSo] of [[1, 0.7], [3, 0.8], [6, 0.6], [9, 0.4], [15, 1]]) {
        diem += (dau - khoangCach(ungVien.duong[moc], den)) * trongSo;
      }
      // Không hưởng trọn điểm đích xa nếu cứ chạy ngược hướng ở đầu chuỗi.
      diem -= Math.max(0, khoangCach(ungVien.duong[3], den) - dau) * 2;
    }
    // Duy tri chuyen dong de doi thu khong de ban trung; on dinh lenh khi hai duong tuong duong.
    if (ungVien.ga === 0) diem -= 11;
    if (ungVien.ga === 1) diem += 1.5;
    if (xe.boNhoAI.lenhTruoc) {
      diem -= Math.abs(ungVien.quay - xe.boNhoAI.lenhTruoc.quay) * 1.8;
      if (ungVien.ga !== xe.boNhoAI.lenhTruoc.ga) diem -= 1.2;
    }
    ungVien.diem = diem;
    ungVien.nguyHiem = nguyHiem;
    ungVien.nguyCoMatMang = ungVien.satThuongGan + ungVien.satThuongBoGan >= xe.hp - 1e-6 ? 1 : 0;
    return diem;
  }

  function bacAnToan(u) {
    return [u.nguyCoMatMang, u.satThuongGan,
      u.satThuongGan > 0 ? -Math.floor(Math.min(0.6, u.tiepXucDau) / 0.08) : 0];
  }

  function soAnToan(a, b) {
    const aa = bacAnToan(a), bb = bacAnToan(b);
    for (let i = 0; i < aa.length; i++) if (aa[i] !== bb[i]) return aa[i] - bb[i];
    return 0;
  }

  D.AINguoiChoi = function (xe, tran) {
    xe.boNhoAI = xe.boNhoAI || {};
    const boNho = xe.boNhoAI;
    const doiThu = doiThuConSong(xe, tran);
    const chienThuat = capNhatTrangThaiChienThuat(xe, tran, doiThu);
    const { rutLui } = chienThuat;
    if (!Number.isFinite(boNho.lanTrungCuoi) || boNho.soTrungTruoc !== xe.soTrung) boNho.lanTrungCuoi = tran.thoiGian;
    boNho.soTrungTruoc = xe.soTrung;
    const beTac = doiThu.length === 1 && tran.thoiGian - boNho.lanTrungCuoi >= 7;
    const quanSat = theoDoiDoiThu(xe, tran, doiThu);
    const theoDoi = duDoanPhatBanGan(xe, tran, doiThu);
    const giuHuong = [{ x: xe.x, y: xe.y, t: 0 }, { x: xe.x + (xe.vx || 0) * 0.5, y: xe.y + (xe.vy || 0) * 0.5, t: 0.5 }];
    const khanCap = theoDoi.danhSach.some(d => d.doTinCay === 1 &&
      tiepXucDauTien(giuHuong[0], giuHuong[1], d, 0, Math.min(0.45, d.ketThuc)) <= 0.45);
    if (beTac && !khanCap && !chienThuat.ngoaiBo && tran.thoiGian - (boNho.lanMatMau ?? -Infinity) > 1.2) chienThuat.canRut = false;
    const mucTieu = chonMucTieu(xe, tran, doiThu, quanSat);
    const diemDen = timDiemDiVong(xe, tran, mucTieu, doiThu, beTac, chienThuat);
    const khoaDiemDen = diemDen ? `${diemDen.loai}:${Math.round(diemDen.x)}:${Math.round(diemDen.y)}` : "tu-do";
    if (boNho.keHoach?.khoaDiemDen !== khoaDiemDen) boNho.keHoach = null;
    const chuoi = taoChuoiNe(xe, diemDen, theoDoi.soDanThuc > 0 || doiThu.some(d => khoangCach(xe, d) < 320), khanCap);
    const tiepTuc = phanKeHoachConLai(boNho.keHoach, tran.thoiGian);
    if (tiepTuc) chuoi.push(tiepTuc);
    const cacUngVien = taoUngVien(xe, tran, chuoi);
    let chon = cacUngVien[0];
    for (const ungVien of cacUngVien) {
      chamDiem(ungVien, xe, tran, theoDoi.danhSach, doiThu, mucTieu, quanSat, { ...chienThuat, diemDen, beTac, khanCap });
      if (soAnToan(ungVien, chon) < 0 || (soAnToan(ungVien, chon) === 0 && ungVien.diem > chon.diem)) chon = ungVien;
    }
    const giuLai = cacUngVien.find(u => u.loai === "tiep-tuc");
    if (giuLai && soAnToan(giuLai, chon) === 0 && giuLai.diem >= chon.diem - 18 &&
        giuLai.tiepXucDau > 0.15 && giuLai.biCan < 0.3) chon = giuLai;
    let chuDongMoGoc = false;
    if (beTac && diemDen?.loai === "di-vong" && !khanCap && tran.thoiGian - (boNho.lanMatMau ?? -Infinity) > 1.2 &&
        khoangCach(xe, diemDen) - khoangCach(chon.duong.at(-1), diemDen) < 8) {
      // Nếu điểm mềm vẫn khuyến khích đứng sau tường, thử đường mở góc
      // đã qua đủ kiểm tra đạn thật, thân xe, bo và cự ly tối thiểu.
      const moGoc = cacUngVien.filter(u => u.loai === "toi-diem" && soAnToan(u, chon) <= 0 && u.tiepXucDau > chanTroi && u.biCan < 0.15 &&
        khoangCach(xe, diemDen) - khoangCach(u.duong.at(-1), diemDen) > 8 &&
        u.duong.every(p => {
          const bien = D.tinhVungAnToan(tran.thoiGian + p.t) + D.hangSo.banKinhXe;
          return Math.min(p.x, p.y, D.hangSo.kichThuoc - p.x, D.hangSo.kichThuoc - p.y) >= bien &&
            doiThu.every(d => khoangCach(p, d) >= 105 || !duongBanThong(p, d, tran));
        })).sort((a, b) => b.diem - a.diem)[0];
      if (moGoc) { chon = moGoc; chuDongMoGoc = true; }
    }
    if (chon.loai !== "tiep-tuc") {
      boNho.soKeHoach = (boNho.soKeHoach || 0) + 1;
      boNho.keHoach = { id: boNho.soKeHoach, batDau: tran.thoiGian, khoaDiemDen, chuoi: chon.chuoi.map(l => ({ ...l })) };
    }
    const gocNong = mucTieu ? Math.atan2(mucTieu.diemNgam.y - xe.y, mucTieu.diemNgam.x - xe.x) : xe.gocNong;
    const lenh = { ga: chon.ga, quay: chon.quay, gocNong, ban: !!mucTieu && mucTieu.thong && xe.thoiGianNap <= 0 };
    xe.boNhoAI.mucTieuId = mucTieu ? mucTieu.dich.id : null;
    xe.boNhoAI.lenhTruoc = { ga: chon.ga, quay: chon.quay };
    const dungYen = cacUngVien.find(ungVien => ungVien.ga === 0 && ungVien.quay === 0);
    let lyDo = "Giữ khoảng cách, tìm góc bắn thoáng";
    if (diemDen) lyDo = beTac ? "Đổi góc tiếp cận để phá bế tắc" : "Đi vòng vật cản để mở góc bắn";
    if (rutLui) lyDo = "Bảo toàn mạng: giãn cách và tìm vật che";
    if (theoDoi.soDanThuc > 0 && dungYen.nguyHiem > 0.25) lyDo = "Đổi đường để né quỹ đạo đạn";
    if (chon.nguyHiem > 0.7) lyDo = "Nguy hiểm cao: chọn đường ít rủi ro nhất";
    if (tran.vungAnToan > Math.min(xe.x, xe.y, D.hangSo.kichThuoc - xe.x, D.hangSo.kichThuoc - xe.y) - D.hangSo.banKinhXe) lyDo = "Rời vùng nguy hiểm, trở lại khu an toàn";
    xe.boNhoAI.phanTich = {
      ungVien: cacUngVien.map(ungVien => ({ diem: ungVien.diem, duong: ungVien.duong.slice(1), nguyHiem: ungVien.nguyHiem,
        ga: ungVien.ga, quay: ungVien.quay, chuoiLenh: ungVien.chuoi,
        satThuongGan: ungVien.satThuongGan, vaChamSom: ungVien.vaChamSom,
        tiepXucDau: Number.isFinite(ungVien.tiepXucDau) ? ungVien.tiepXucDau : chanTroi + 1,
        nguyCoMatMang: ungVien.nguyCoMatMang, loai: ungVien.loai })),
      duongChon: chon.duong.slice(1),
      mucTieu: mucTieu ? { id: mucTieu.dich.id, x: mucTieu.dich.x, y: mucTieu.dich.y } : null,
      diemNgam: mucTieu ? mucTieu.diemNgam : null,
      nguyHiem: chon.nguyHiem,
      lyDo,
      soDanTheoDoi: theoDoi.soDanThuc,
      chanTroi,
      diem: chon.diem, phienBan: D.phienBanAI, rutLui, beTac,
      diemDen, kieuNgam: mucTieu?.kieuNgam || null,
      chuoiLenh: chon.chuoi, satThuongGan: chon.satThuongGan,
      keHoachId: boNho.keHoach?.id, tuoiKeHoach: tran.thoiGian - (boNho.keHoach?.batDau || 0),
      tiepTucKeHoach: chon.loai === "tiep-tuc", biLap: chienThuat.biLap,
      canRut: chienThuat.canRut, khanCap, tiepXucDau: Number.isFinite(chon.tiepXucDau) ? chon.tiepXucDau : chanTroi + 1,
      chuDongMoGoc,
      thoiDiemQuyetDinh: tran.thoiGian
    };
    return lenh;
  };

  // Các cấp khác nhau ở cách suy nghĩ. Máu, tốc độ, sát thương và thời gian
  // nạp đạn vẫn do cùng bộ vật lý quyết định, không được cộng chỉ số cho bot.
  D.cauHinhCapBot = function (giaTri) {
    const so = Number(giaTri);
    const cap = typeof D.gioiHanCapBot === "function" ? D.gioiHanCapBot(giaTri)
      : (giaTri === undefined || giaTri === null || giaTri === "" || !Number.isFinite(so)
        ? 5 : kep(Math.round(so), 1, 10));
    const i = cap - 1;
    return {
      cap,
      trePhanUng: [0.60, 0.55, 0.50, 0.45, 0.40, 0.34, 0.28, 0.22, 0.16, 0.10][i],
      saiSoNgam: [0.260, 0.210, 0.170, 0.125, 0.090, 0.065, 0.042, 0.026, 0.014, 0.006][i],
      tyLeDonDau: [0, 0.04, 0.10, 0.25, 0.45, 0.62, 0.75, 0.86, 0.94, 1][i],
      chanTroi: [0, 0, 0, 0.65, 0.8, 1.0, 1.2, 1.4, 1.6, 1.8][i],
      soUngVien: [0, 0, 0, 6, 7, 8, 10, 12, 14, 15][i],
      neDan: cap >= 4,
      neDanDuDoan: cap >= 5,
      chienThuat: cap >= 7
    };
  };

  function doiDotNgauNhien(xe, tran, doiThu, cauHinh) {
    const boNho = xe.boNhoAI;
    const soLuaChon = Math.min(3, doiThu.length);
    boNho.mucTieuId = doiThu[Math.floor(D.ngauNhien(tran) * soLuaChon)].id;
    boNho.ben = D.ngauNhien(tran) < 0.5 ? -1 : 1;
    boNho.khoangCachApSat = 190 + D.ngauNhien(tran) * 150;
    boNho.gocVong = 0.85 + D.ngauNhien(tran) * 0.65;
    boNho.gocLech = (D.ngauNhien(tran) - 0.5) * 0.9;
    boNho.ga = 0.7 + D.ngauNhien(tran) * 0.3;
    // Sai số được giữ trong một đợt; không rung nòng theo từng khung hình.
    boNho.saiSo = (D.ngauNhien(tran) * 2 - 1) * cauHinh.saiSoNgam;
    boNho.doiHuongLuc = tran.thoiGian + 0.8 + D.ngauNhien(tran) * 1.6;
  }

  function chonMucTieuBot(xe, tran, doiThu, cauHinh) {
    let chon = null;
    for (const dich of doiThu) {
      const quanSat = { vx: dich.vx || 0, vy: dich.vy || 0 };
      const thoiGian = kep(thoiGianDonDau(xe, dich, quanSat.vx, quanSat.vy), 0, 3)
        * cauHinh.tyLeDonDau;
      const diemNgam = duDoanViTriDich(dich, quanSat, thoiGian, tran);
      const thong = duongBanThong(xe, diemNgam, tran);
      // Ở cấp thấp, tiếp tục mục tiêu ngẫu nhiên trong đợt. Cấp cao ưu tiên
      // địch lộ thiên đang ít máu, nhưng giữ một chút ổn định khi đổi mục tiêu.
      const uuTienCu = xe.boNhoAI.mucTieuId === dich.id;
      const diem = cauHinh.chienThuat
        ? (thong ? 8 : 0) - khoangCach(xe, dich) / 190
          + (1 - dich.hp / dich.hpToiDa) * (2 + cauHinh.cap * 0.30)
          + (uuTienCu ? 0.4 : 0)
        : (uuTienCu ? 100 : 0) - khoangCach(xe, dich) / 500;
      if (!chon || diem > chon.diem) chon = { dich, diemNgam, thong, diem };
    }
    return chon;
  }

  function lenhDiDonGian(xe, tran, mucTieu, cauHinh) {
    const boNho = xe.boNhoAI;
    const tam = khoangCach(xe, mucTieu.dich);
    let gocDi = Math.atan2(mucTieu.dich.y - xe.y, mucTieu.dich.x - xe.x)
      + (tam < boNho.khoangCachApSat ? boNho.ben * boNho.gocVong : boNho.gocLech);
    let ga = boNho.ga;
    let quay = kep(D.chuanHoaGoc(gocDi - xe.goc) * 1.6, -1, 1);
    const thu = D.tinhBuocXe(xe, { ga, quay }, 0.22 + cauHinh.cap * 0.025, tran.tuong);
    if (khoangCach(xe, thu) < 12) { ga = -1; quay = boNho.ben; }
    const bien = (tran.vungAnToan || 0) + 38;
    if (Math.min(xe.x, xe.y, D.hangSo.kichThuoc - xe.x, D.hangSo.kichThuoc - xe.y) < bien) {
      gocDi = Math.atan2(D.hangSo.kichThuoc / 2 - xe.y, D.hangSo.kichThuoc / 2 - xe.x);
      quay = kep(D.chuanHoaGoc(gocDi - xe.goc) * 2, -1, 1);
    }
    return { ga, quay };
  }

  function taoUngVienBot(xe, tran, cauHinh) {
    // Thêm dần lựa chọn tiến/lùi/dừng và độ cong đường đi ở mỗi cấp.
    // Cấp 10 xét đủ 3 mức ga × 5 mức quay như bộ AI người chơi.
    const cacLenh = [[1, 0], [1, -1], [1, 1], [-1, 0], [0, 0], [-1, -1],
      [-1, 1], [1, -0.5], [1, 0.5], [0, -1], [0, 1], [-1, -0.5],
      [-1, 0.5], [0, -0.5], [0, 0.5]].slice(0, cauHinh.soUngVien);
    return cacLenh.map(([ga, quay]) => {
      quay *= xe.boNhoAI.ben;
      // Chỉ sao chép vị trí; không sao chép lịch sử AI vào hàng nghìn bước thử.
      let viTri = { x: xe.x, y: xe.y, goc: xe.goc };
      const duong = [{ x: xe.x, y: xe.y, t: 0 }];
      let biCan = 0;
      let t = 0;
      while (t < cauHinh.chanTroi - 0.000001) {
        const dt = Math.min(0.1, cauHinh.chanTroi - t);
        const dau = viTri;
        const soBuoc = Math.ceil(dt * 60 - 0.000001);
        for (let i = 0; i < soBuoc; i++) viTri = D.tinhBuocXe(viTri, { ga, quay }, dt / soBuoc, tran.tuong);
        if (ga && khoangCach(dau, viTri) < D.hangSo.tocDoXe * dt * 0.3) biCan += dt;
        t += dt;
        duong.push({ x: viTri.x, y: viTri.y, t });
      }
      return { ga, quay, duong, biCan, diem: 0, nguyHiem: 0 };
    });
  }

  function chamDiemBot(ungVien, xe, tran, cauHinh, cacDan, doiThu, mucTieu, lenhDonGian) {
    const H = D.hangSo;
    const tamNhin = cauHinh.chanTroi;
    const itMau = xe.hp / xe.hpToiDa <= 0.40;
    let diem = -ungVien.biCan * (100 + cauHinh.cap * 12);
    let nguyHiem = 0;
    for (const dan of cacDan) {
      let ganNhat = { khoangCach: Infinity, t: tamNhin };
      for (let i = 1; i < ungVien.duong.length; i++) {
        const dau = ungVien.duong[i - 1];
        const cuoi = ungVien.duong[i];
        const batDau = Math.max(dau.t, dan.batDau);
        const ketThuc = Math.min(cuoi.t, dan.ketThuc);
        if (ketThuc <= batDau) continue;
        const gan = tiepCanGanNhat(dau, cuoi, dan, batDau, ketThuc);
        if (gan.khoangCach < ganNhat.khoangCach) ganNhat = gan;
      }
      const khoangDu = ganNhat.khoangCach - H.banKinhXe - H.banKinhDan - 5;
      const khanCap = 1 - ganNhat.t / (tamNhin + 0.8);
      const ruiRo = Math.exp(-Math.max(0, khoangDu) / 24) * dan.doTinCay;
      nguyHiem = Math.max(nguyHiem, ruiRo);
      // Cộng rủi ro của TẤT CẢ viên đạn để nhận biết hai làn đạn giao nhau.
      diem -= (khoangDu <= 0 ? 3200 : 190 * ruiRo) * khanCap * dan.doTinCay;
    }
    for (let i = 1; i < ungVien.duong.length; i++) {
      const viTri = ungVien.duong[i];
      const dt = viTri.t - ungVien.duong[i - 1].t;
      diem -= Math.max(0, 38 - khoangTrongDenTuong(viTri.x, viTri.y, tran)) * dt * 1.2;
      const bien = Math.max(tran.vungAnToan || 0, D.tinhVungAnToan(tran.thoiGian + viTri.t));
      const raNgoai = Math.max(bien + H.banKinhXe - viTri.x, bien + H.banKinhXe - viTri.y,
        viTri.x + H.banKinhXe - (H.kichThuoc - bien),
        viTri.y + H.banKinhXe - (H.kichThuoc - bien), 0);
      if (raNgoai > 0) diem -= (500 + raNgoai * 5) * dt;
    }
    const cuoi = ungVien.duong[ungVien.duong.length - 1];
    let soDichLoThien = 0;
    for (const dich of doiThu) {
      const viTri = duDoanViTriDich(dich, { vx: dich.vx || 0, vy: dich.vy || 0 }, tamNhin * 0.5, tran);
      const tam = khoangCach(cuoi, viTri);
      if (tam < 105) diem -= (105 - tam) * (cauHinh.chienThuat ? 1.6 : 0.8);
      const loThien = !D.doanBiChan(cuoi.x, cuoi.y, viTri.x, viTri.y, tran.tuong);
      if (tam < 480 && loThien) soDichLoThien++;
      if (cauHinh.chienThuat && itMau) {
        if (loThien && tam < 370) diem -= (370 - tam) * 0.32;
        if (!loThien && tam < 500) diem += 25;
      }
    }
    if (cauHinh.chienThuat) diem -= Math.max(0, soDichLoThien - 1) * (20 + cauHinh.cap * 2);
    const tamCu = khoangCach(xe, mucTieu.dich);
    const tamMoi = khoangCach(cuoi, mucTieu.dich);
    const tamMuon = cauHinh.chienThuat && itMau ? 370 : xe.boNhoAI.khoangCachApSat;
    diem -= Math.abs(tamMoi - tamMuon) * 0.11;
    if (tamCu > tamMuon + 50) diem += (tamCu - tamMoi) * 0.08;
    if (!D.doanBiChan(cuoi.x, cuoi.y, mucTieu.diemNgam.x, mucTieu.diemNgam.y, tran.tuong)) {
      diem += cauHinh.chienThuat && itMau ? 3 : 27;
    }
    // Cấp trung vẫn thích hướng ngẫu nhiên của đợt; ở cấp cao chiến thuật nặng hơn.
    diem -= Math.abs(ungVien.quay - lenhDonGian.quay) * (cauHinh.chienThuat ? 1 : 5);
    if (ungVien.ga === 0) diem -= 9;
    if (ungVien.ga === 1) diem += 1.5;
    if (xe.boNhoAI.lenhDaChon) {
      diem -= Math.abs(ungVien.quay - xe.boNhoAI.lenhDaChon.quay) * 1.8;
      if (ungVien.ga !== xe.boNhoAI.lenhDaChon.ga) diem -= 1.2;
    }
    ungVien.diem = diem;
    ungVien.nguyHiem = nguyHiem;
    return diem;
  }

  // Kiểm tra tia bắn THỰC sau khi đã cộng sai số, kể cả đoạn từ tâm ra đầu nòng.
  // Với lệnh đang giữ giữa hai lần suy nghĩ, chỉ khóa cò nếu tường đã che đường.
  function khoaCoAnToan(xe, tran, lenh, tamBan) {
    return { ...lenh, ban: !!lenh.ban && duongBanThong(xe, {
      x: xe.x + Math.cos(lenh.gocNong) * tamBan,
      y: xe.y + Math.sin(lenh.gocNong) * tamBan
    }, tran) };
  }

  D.AIBot = function (xe, tran) {
    xe.boNhoAI = xe.boNhoAI || {};
    const boNho = xe.boNhoAI;
    const cauHinh = D.cauHinhCapBot(xe.capBot === undefined ? tran.capBot : xe.capBot);
    const doiThu = doiThuConSong(xe, tran).sort((a, b) => khoangCach(xe, a) - khoangCach(xe, b));
    if (!doiThu.length) return { ga: 0, quay: 0, gocNong: xe.gocNong, ban: false };
    const doiCap = boNho.capBot !== cauHinh.cap;
    const matMucTieu = !doiThu.some(dich => dich.id === boNho.mucTieuId);
    if (!doiCap && !matMucTieu && boNho.lenhDaChon && tran.thoiGian + 0.000001 < boNho.nghiTiepLuc) {
      return khoaCoAnToan(xe, tran, boNho.lenhDaChon, boNho.tamBan);
    }
    if (doiCap || matMucTieu || boNho.doiHuongLuc === undefined || tran.thoiGian >= boNho.doiHuongLuc) {
      doiDotNgauNhien(xe, tran, doiThu, cauHinh);
    }
    const mucTieu = chonMucTieuBot(xe, tran, doiThu, cauHinh);
    const lenhDonGian = lenhDiDonGian(xe, tran, mucTieu, cauHinh);
    let chon = lenhDonGian;
    let cacUngVien = [];
    let cacDan = [];
    if (cauHinh.cap >= 4) {
      cacDan = theoDoiDan(xe, tran, doiThu, cauHinh.chanTroi, cauHinh.chienThuat).danhSach;
      if (!cauHinh.neDanDuDoan) cacDan = cacDan.filter(dan => khoangCach(xe, dan) < 140);
      cacUngVien = taoUngVienBot(xe, tran, cauHinh);
      let diemTotNhat = -Infinity;
      for (const ungVien of cacUngVien) {
        const diem = chamDiemBot(ungVien, xe, tran, cauHinh, cacDan, doiThu, mucTieu, lenhDonGian);
        if (diem > diemTotNhat) { diemTotNhat = diem; chon = ungVien; }
      }
    }
    const gocNong = Math.atan2(mucTieu.diemNgam.y - xe.y, mucTieu.diemNgam.x - xe.x) + boNho.saiSo;
    const lenh = { ga: chon.ga, quay: chon.quay, gocNong,
      ban: mucTieu.thong && xe.thoiGianNap <= 0 && khoangCach(xe, mucTieu.dich) > 20 };
    boNho.capBot = cauHinh.cap;
    boNho.mucTieuId = mucTieu.dich.id;
    boNho.nghiTiepLuc = tran.thoiGian + cauHinh.trePhanUng;
    boNho.tamBan = Math.max(30, khoangCach(xe, mucTieu.diemNgam) + HIEU_CHINH_TAM_BAN);
    boNho.lenhDaChon = lenh;
    boNho.phanTichBot = { cap: cauHinh.cap, chanTroi: cauHinh.chanTroi,
      soUngVien: cacUngVien.length, nguyHiem: chon.nguyHiem || 0,
      diemNgam: { ...mucTieu.diemNgam }, duongChon: chon.duong || [],
      soDanTheoDoi: cacDan.length, chienThuat: cauHinh.chienThuat && xe.hp / xe.hpToiDa <= 0.40
        ? "Rút lui, tìm vật che chắn" : (cauHinh.chienThuat ? "Chọn góc bắn, tránh nhiều hướng đạn" : "Áp sát, di chuyển vòng") };
    return khoaCoAnToan(xe, tran, lenh, boNho.tamBan);
  };
  const HIEU_CHINH_TAM_BAN = 12;

  D.dangKyAI = function (hamAI) {
    if (hamAI !== null && typeof hamAI !== "function") throw new TypeError("AI phải là một hàm hoặc null để dùng lại AI mặc định.");
    aiThayThe = hamAI;
  };
  D.layAINguoiChoi = function () { return aiThayThe || D.AINguoiChoi; };
})();
