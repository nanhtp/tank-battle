/* Nhật ký dữ liệu: không can thiệp vào ngẫu nhiên, lệnh AI hay vật lý. */
(function () {
  'use strict';
  const D = window.DauTruong;
  const saoChep = x => JSON.parse(JSON.stringify(x));
  function chupXe(xe) {
    const p = xe.boNhoAI.phanTich;
    return { id: xe.id, ten: xe.ten, mau: xe.mau, laNguoiChoi: xe.laNguoiChoi,
      x: xe.x, y: xe.y, vx: xe.vx, vy: xe.vy, goc: xe.goc, gocNong: xe.gocNong,
      hp: xe.hp, thoiGianNap: xe.thoiGianNap, conSong: xe.conSong, soBan: xe.soBan, soTrung: xe.soTrung, soHa: xe.soHa,
      lenh: { ...xe.lenh }, phanTich: p ? { lyDo: p.lyDo, nguyHiem: p.nguyHiem,
        mucTieu: p.mucTieu, diemNgam: p.diemNgam, soDanTheoDoi: p.soDanTheoDoi,
        chanTroi: p.chanTroi, diem: p.diem, phienBan: p.phienBan,
        rutLui: p.rutLui, beTac: p.beTac, diemDen: p.diemDen, kieuNgam: p.kieuNgam,
        chuoiLenh: p.chuoiLenh, satThuongGan: p.satThuongGan, thoiDiemQuyetDinh: p.thoiDiemQuyetDinh,
        ungVien: p.ungVien.map(u => ({ diem: u.diem, nguyHiem: u.nguyHiem,
          ga: u.ga, quay: u.quay, chuoiLenh: u.chuoiLenh, satThuongGan: u.satThuongGan,
          vaChamSom: u.vaChamSom })), duongChon: p.duongChon } : null };
  }
  D.khoiTaoNhatKy = tran => {
    tran.nhatKy = { suKien: [], satThuong: [], dienBien: [], mocCuoi: -1 };
    D.ghiDienBien(tran);
  };
  D.ghiDienBien = (tran, batBuoc = false) => {
    const n = tran.nhatKy;
    if (!n || (!batBuoc && tran.thoiGian - n.mocCuoi < .25)) return;
    n.mocCuoi = tran.thoiGian;
    n.dienBien.push(saoChep({ thoiGian: tran.thoiGian, bo: tran.vungAnToan,
      xe: tran.xe.map(chupXe), dan: tran.dan }));
  };
  D.ghiSatThuong = (tran, xe, soMau, nguoiBan, dan) => {
    if (!tran.nhatKy) return;
    const hpSau = Math.max(0, xe.hp - soMau);
    // Gộp sát thương bo liên tiếp trong cùng giây, vẫn giữ tổng và thời điểm cuối.
    const ds = tran.nhatKy.satThuong;
    const cu = ds.at(-1);
    if (!dan && cu && cu.nguyenNhan === 'ngoai-bo' && cu.xe.id === xe.id &&
        Math.floor(cu.thoiGian) === Math.floor(tran.thoiGian)) {
      cu.luong += Math.min(xe.hp, soMau); cu.hpSau = hpSau; cu.lucCuoi = tran.thoiGian;
      cu.biLoai = hpSau <= .000001; return;
    }
    ds.push(saoChep({ thoiGian: tran.thoiGian, lucCuoi: tran.thoiGian,
      nguyenNhan: dan ? 'trung-dan' : 'ngoai-bo', luong: Math.min(xe.hp, soMau),
      hpSau, biLoai: hpSau <= .000001, xe: chupXe(xe),
      nguoiBan: nguoiBan ? chupXe(nguoiBan) : null, dan: dan || null,
      bo: D.tinhVungAnToan(tran.thoiGian),
      danGan: tran.dan.filter(d => Math.hypot(d.x - xe.x, d.y - xe.y) < 250) }));
  };
  D.xuatNhatKy = tran => {
    const log = saoChep({ dinhDang: 'tank-lab-log', phienBan: 1,
      taoLuc: new Date().toISOString(), hatGiong: tran.hatGiong,
      cauHinh: { capBot: tran.capBot, phienBanAI: D.layAINguoiChoi?.() === D.AINguoiChoi ? D.phienBanAI : 'tuy-chinh',
        hangSo: D.hangSo, tuong: tran.tuong },
      thoiGian: tran.thoiGian, ketThuc: tran.ketThuc, ketQua: tran.ketQua, lyDoKetThuc: tran.lyDoKetThuc,
      nguoiThang: tran.nguoiThang ? tran.nguoiThang.ten : null,
      xeCuoi: tran.xe.map(chupXe), suKien: tran.nhatKy.suKien,
      satThuong: tran.nhatKy.satThuong, dienBien: tran.nhatKy.dienBien });
    log.baoCao = D.phanTichNhatKy(log);
    return log;
  };
  D.kiemTraNhatKy = log => {
    if (!log || log.dinhDang !== 'tank-lab-log' || log.phienBan !== 1 ||
        !Array.isArray(log.xeCuoi) || !log.xeCuoi.some(x => x && x.laNguoiChoi) ||
        !Array.isArray(log.satThuong) || !Array.isArray(log.dienBien)) throw new Error('Không đúng định dạng Tank Lab phiên bản 1.');
    for (const d of log.satThuong) if (!d || !d.xe || !Number.isFinite(d.thoiGian) ||
      !Number.isFinite(d.luong) || !Number.isFinite(d.hpSau)) throw new Error('Dữ liệu sát thương không hợp lệ.');
  };
  D.phanTichNhatKy = log => {
    D.kiemTraNhatKy(log);
    const xe = log.xeCuoi.find(x => x.laNguoiChoi);
    const ds = log.satThuong.filter(d => d.xe.id === xe.id);
    const cuoi = ds.find(d => d.biLoai);
    const dan = ds.filter(d => d.nguyenNhan === 'trung-dan');
    const bo = ds.filter(d => d.nguyenNhan === 'ngoai-bo').reduce((s, d) => s + d.luong, 0);
    const dong = [`PHÂN TÍCH TRẬN — ${xe.ten}`, `Mã trận: ${log.hatGiong} · Thời gian: ${Number(log.thoiGian).toFixed(1)}s`,
      `Trạng thái: ${log.ketQua === 'hoa' ? 'Hòa: hết 5 phút, xe của bạn và đối thủ vẫn còn sống' : !xe.conSong ? 'Xe của bạn đã bị loại' : log.ketThuc ? 'Xe của bạn sống sót đến cuối trận' : 'Trận chưa kết thúc; chưa thể kết luận thắng/thua'}`,
      `Bắn ${xe.soBan} · Trúng ${xe.soTrung} · Hạ ${xe.soHa}`, '',
      `Sát thương nhận: ${dan.length} lần trúng đạn; mất ${bo.toFixed(2)} HP ngoài bo.`];
    if (cuoi) dong.push(`Bị loại lúc ${cuoi.lucCuoi.toFixed(2)}s: ${cuoi.nguyenNhan === 'trung-dan' ? 'trúng đạn của ' + (cuoi.nguoiBan?.ten || 'xe không rõ') : 'mất HP ngoài vùng an toàn'}.`);
    dong.push('', 'CÁC LẦN TRÚNG ĐẠN (dữ kiện ghi trực tiếp)');
    for (const d of dan) {
      const p = d.xe.phanTich;
      dong.push(`${d.thoiGian.toFixed(2)}s · ${d.nguoiBan?.ten || 'Không rõ'} bắn trúng tại (${Math.round(d.xe.x)}, ${Math.round(d.xe.y)}) · còn ${d.hpSau.toFixed(2)} HP`,
        `  Lệnh: ga=${d.xe.lenh?.ga}, quay=${d.xe.lenh?.quay}. AI: ${p?.lyDo || 'Không có dữ liệu giải thích từ AI tùy chỉnh'}.`,
        `  Nguy hiểm dự đoán: ${Number.isFinite(p?.nguyHiem) ? Math.round(p.nguyHiem * 100) + '/100' : 'chưa có'} · theo dõi ${p?.soDanTheoDoi ?? '?'} đạn.`);
    }
    dong.push('', 'GỢI Ý THỬ NGHIỆM (suy luận, cần kiểm chứng)');
    if (bo > 0) dong.push('• Tăng ưu tiên trở về vùng an toàn và tính thời gian cần để vào bo trước khi giao tranh.');
    if (dan.some(d => d.xe.phanTich?.nguyHiem < .25)) dong.push('• Có phát trúng khi AI chấm nguy hiểm thấp: kiểm tra khoảng dự đoán, biên an toàn và quỹ đạo đạn trong những khung trước va chạm.');
    if (dan.some(d => d.xe.phanTich?.nguyHiem >= .7)) dong.push('• Có phát trúng khi AI biết nguy hiểm cao: thử thêm đường né và tăng trọng số sống sót; chưa đủ bằng chứng rằng luôn có đường thoát.');
    if (dan.some(d => d.xe.lenh?.ga === 0)) dong.push('• Có lần trúng khi đứng yên: thử phạt đứng yên lúc có đạn đang hướng tới xe.');
    if (!ds.length) dong.push('• Chưa nhận sát thương trong phần trận đã ghi; chưa có bằng chứng để phân tích nguyên nhân thua.');
    dong.push('', 'CÁCH DÙNG DỮ LIỆU', 'dienBien: ảnh trạng thái mỗi 0,25 giây, vị trí xe/đạn, lệnh và điểm các ứng viên AI. satThuong: từng va chạm đạn và sát thương bo (gộp theo giây). suKien: toàn bộ thông báo trận.',
      'Dữ liệu lấy mẫu phục vụ phân tích, không phải bản phát lại chính xác từng bước. Điểm nguy hiểm là điểm đánh giá của AI, không phải xác suất. Mã trận đơn lẻ không tái hiện được AI tùy chỉnh; hãy giữ cả mã nguồn AI tương ứng.');
    return dong.join('\n');
  };
})();
