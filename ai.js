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
        vy: Number.isFinite(dich.vy) ? dich.vy : vyQuanSat
      };
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
      const t = kep(thoiGianDonDau(xe, dich, duLieu.vx, duLieu.vy), 0, 3);
      const diemNgam = duDoanViTriDich(dich, duLieu, t, tran);
      const thong = duongBanThong(xe, diemNgam, tran);
      const tam = khoangCach(xe, dich);
      const diem = (thong ? 5 : 0) - tam / 220 + (1 - dich.hp / dich.hpToiDa) * 1.6
        + (xe.boNhoAI.mucTieuId === dich.id ? 0.32 : 0);
      if (!totNhat || diem > totNhat.diem) totNhat = { dich, diemNgam, thong, diem };
    }
    return totNhat;
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

  function taoUngVien(xe, tran) {
    const ungVien = [];
    for (const ga of [-1, 0, 1]) {
      for (const quay of [-1, -0.5, 0, 0.5, 1]) {
        let xeGiaLap = { ...xe };
        const duong = [{ x: xe.x, y: xe.y, t: 0 }];
        let biCan = 0;
        for (let buoc = 1; buoc <= Math.round(chanTroi / buocDuDoan); buoc++) {
          // Cung buoc 1/60 giay voi game. Buoc 0.1s mot lan lam duong re bi lech.
          const viTriCu = xeGiaLap;
          for (let buocNho = 0; buocNho < 6; buocNho++) {
            xeGiaLap = { ...xeGiaLap, ...D.tinhBuocXe(xeGiaLap, { ga, quay }, buocDuDoan / 6, tran.tuong) };
          }
          const viTri = xeGiaLap;
          if (ga !== 0 && Math.hypot(viTri.x - viTriCu.x, viTri.y - viTriCu.y) < D.hangSo.tocDoXe * buocDuDoan * 0.3) biCan += buocDuDoan;
          duong.push({ x: viTri.x, y: viTri.y, t: buoc * buocDuDoan });
        }
        ungVien.push({ ga, quay, duong, biCan, diem: 0, nguyHiem: 0 });
      }
    }
    return ungVien;
  }

  function chamDiem(ungVien, xe, tran, cacDan, doiThu, mucTieu, quanSat) {
    const banKinhAnToan = D.hangSo.banKinhXe + D.hangSo.banKinhDan + 6;
    let diem = -ungVien.biCan * 120;
    let nguyHiem = 0;
    for (const dan of cacDan) {
      let ganNhat = { khoangCach: Infinity, t: chanTroi };
      for (let moc = 1; moc < ungVien.duong.length; moc++) {
        const dau = ungVien.duong[moc - 1];
        const cuoi = ungVien.duong[moc];
        const batDau = Math.max(dau.t, dan.batDau);
        const ketThuc = Math.min(cuoi.t, dan.ketThuc);
        if (ketThuc <= batDau) continue;
        const tiepCan = tiepCanGanNhat(dau, cuoi, dan, batDau, ketThuc);
        if (tiepCan.khoangCach < ganNhat.khoangCach) ganNhat = tiepCan;
      }
      const khoangDu = ganNhat.khoangCach - banKinhAnToan;
      const doKhanCap = 1 - ganNhat.t / (chanTroi + 0.8);
      const ruiRo = kep(Math.exp(-Math.max(0, khoangDu) / 24) * dan.doTinCay, 0, 1);
      nguyHiem = Math.max(nguyHiem, ruiRo);
      if (khoangDu <= 0) diem -= 2300 * doKhanCap * dan.doTinCay;
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
      if (khoangRaNgoai > 0) diem -= (210 + khoangRaNgoai * 2.2) * buocDuDoan;
    }

    const cuoi = ungVien.duong[ungVien.duong.length - 1];
    let soDichTrongTam = 0;
    for (const dich of doiThu) {
      const viTriDich = duDoanViTriDich(dich, quanSat[dich.id], chanTroi * 0.5, tran);
      const tam = khoangCach(cuoi, viTriDich);
      if (tam < 110) diem -= (110 - tam) * 1.2;
      if (tam < 420 && !D.doanBiChan(cuoi.x, cuoi.y, viTriDich.x, viTriDich.y, tran.tuong)) soDichTrongTam++;
    }
    diem -= Math.max(0, soDichTrongTam - 1) * 8;
    if (mucTieu) {
      const tamHienTai = khoangCach(xe, mucTieu.dich);
      const tamMoi = khoangCach(cuoi, mucTieu.dich);
      diem -= Math.abs(tamMoi - 280) * 0.055;
      if (tamHienTai > 340) diem += (tamHienTai - tamMoi) * 0.09;
      if (!D.doanBiChan(cuoi.x, cuoi.y, mucTieu.diemNgam.x, mucTieu.diemNgam.y, tran.tuong)) diem += 23;
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
    return diem;
  }

  D.AINguoiChoi = function (xe, tran) {
    xe.boNhoAI = xe.boNhoAI || {};
    const doiThu = doiThuConSong(xe, tran);
    const quanSat = theoDoiDoiThu(xe, tran, doiThu);
    const theoDoi = theoDoiDan(xe, tran, doiThu);
    const mucTieu = chonMucTieu(xe, tran, doiThu, quanSat);
    const cacUngVien = taoUngVien(xe, tran);
    let chon = cacUngVien[0];
    for (const ungVien of cacUngVien) {
      chamDiem(ungVien, xe, tran, theoDoi.danhSach, doiThu, mucTieu, quanSat);
      if (ungVien.diem > chon.diem) chon = ungVien;
    }
    const gocNong = mucTieu ? Math.atan2(mucTieu.diemNgam.y - xe.y, mucTieu.diemNgam.x - xe.x) : xe.gocNong;
    const lenh = { ga: chon.ga, quay: chon.quay, gocNong, ban: !!mucTieu && mucTieu.thong && xe.thoiGianNap <= 0 };
    xe.boNhoAI.mucTieuId = mucTieu ? mucTieu.dich.id : null;
    xe.boNhoAI.lenhTruoc = { ga: chon.ga, quay: chon.quay };
    const dungYen = cacUngVien.find(ungVien => ungVien.ga === 0 && ungVien.quay === 0);
    let lyDo = "Giữ khoảng cách, tìm góc bắn thoáng";
    if (theoDoi.soDanThuc > 0 && dungYen.nguyHiem > 0.25) lyDo = "Đổi đường để né quỹ đạo đạn";
    if (chon.nguyHiem > 0.7) lyDo = "Nguy hiểm cao: chọn đường ít rủi ro nhất";
    if (tran.vungAnToan > Math.min(xe.x, xe.y, D.hangSo.kichThuoc - xe.x, D.hangSo.kichThuoc - xe.y) - D.hangSo.banKinhXe) lyDo = "Rời vùng nguy hiểm, trở lại khu an toàn";
    xe.boNhoAI.phanTich = {
      ungVien: cacUngVien.map(ungVien => ({ diem: ungVien.diem, duong: ungVien.duong.slice(1), nguyHiem: ungVien.nguyHiem })),
      duongChon: chon.duong.slice(1),
      mucTieu: mucTieu ? { id: mucTieu.dich.id, x: mucTieu.dich.x, y: mucTieu.dich.y } : null,
      diemNgam: mucTieu ? mucTieu.diemNgam : null,
      nguyHiem: chon.nguyHiem,
      lyDo,
      soDanTheoDoi: theoDoi.soDanThuc,
      chanTroi,
      diem: chon.diem
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
