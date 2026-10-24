/* Giao diện và nét vẽ. Vật lý nằm trong vat-ly.js; bộ não nằm trong ai.js. */
(function () {
  'use strict';
  const D = window.DauTruong;
  const lay = id => document.getElementById(id);
  const banDo = lay('ban-do');
  const khungDauTruong = lay('khung-dau-truong');
  const nutToanManHinh = lay('nut-toan-man-hinh');
  const but = banDo.getContext('2d');
  const K = D.hangSo.kichThuoc;
  const BUOC_CO_DINH = 1 / 60;
  const dinhDangGio = giay => `${String(Math.floor(giay / 60)).padStart(2, '0')}:${String(Math.floor(giay % 60)).padStart(2, '0')}`;
  let tran, trangThai = 'san-sang', tocDo = 1, tichLuy = 0;
  let mocHinh = 0, mocBang = 0, maSuKienCu = -1;
  let hienDuDoan = true;
  let dangDoiToanManHinh = false;
  let mocTuDauLai = null;

  // Nền được vẽ một lần, tránh lặp lại các chi tiết tĩnh mỗi khung hình.
  const nen = document.createElement('canvas');
  nen.width = nen.height = K;
  const butNen = nen.getContext('2d');
  butNen.fillStyle = '#142820';
  butNen.fillRect(0, 0, K, K);
  for (let y = 0; y < K; y += 48) {
    for (let x = 0; x < K; x += 48) {
      if (((x * 13 + y * 7) / 48) % 7 < 2) {
        butNen.fillStyle = '#182d23';
        butNen.fillRect(x + 1, y + 1, 46, 46);
      }
    }
  }
  butNen.lineWidth = 1;
  for (let x = 0; x <= K; x += 48) {
    butNen.strokeStyle = x % 192 === 0 ? '#284235' : '#20392c';
    butNen.beginPath(); butNen.moveTo(x, 0); butNen.lineTo(x, K); butNen.stroke();
    butNen.beginPath(); butNen.moveTo(0, x); butNen.lineTo(K, x); butNen.stroke();
  }
  butNen.strokeStyle = '#4b6550';
  butNen.lineWidth = 2;
  for (const [x, y, sx, sy] of [[17, 17, 1, 1], [K - 17, 17, -1, 1], [17, K - 17, 1, -1], [K - 17, K - 17, -1, -1]]) {
    butNen.beginPath(); butNen.moveTo(x, y + sy * 25); butNen.lineTo(x, y); butNen.lineTo(x + sx * 25, y); butNen.stroke();
  }
  butNen.strokeStyle = '#37513d';
  butNen.beginPath(); butNen.arc(K / 2, K / 2, 87, 0, Math.PI * 2); butNen.stroke();
  butNen.setLineDash([4, 8]);
  butNen.beginPath(); butNen.arc(K / 2, K / 2, 270, 0, Math.PI * 2); butNen.stroke();
  butNen.setLineDash([]);

  function chinhKichThuoc() {
    const luoi = lay('khung-tran-dau');
    const dangPhongTo = khungDauTruong && (document.fullscreenElement === khungDauTruong || khungDauTruong.classList.contains('toan-man-hinh-du-phong'));
    const coKichThuocManHinh = Number.isFinite(window.innerHeight) && Number.isFinite(window.innerWidth);
    const caoDauSan = khungDauTruong?.querySelector('.arena-heading')?.offsetHeight || 44;
    const caoChanSan = khungDauTruong?.querySelector('.arena-footer')?.offsetHeight || 40;
    // Bố cục thường dùng hết chiều ngang thanh điều khiển; bản đồ luôn vuông.
    // Chỉ chế độ toàn màn hình mới giới hạn đồng thời cả chiều ngang và chiều cao.
    if (dangPhongTo && typeof khungDauTruong.style.setProperty === 'function' && coKichThuocManHinh) {
      const canhSan = Math.floor(Math.max(120, Math.min(window.innerWidth - 24, window.innerHeight - caoDauSan - caoChanSan - 24)));
      khungDauTruong.style.setProperty('--canh-toan-man-hinh', `${canhSan}px`);
    } else if (!dangPhongTo && luoi && typeof luoi.style.setProperty === 'function') {
      const rongKhung = khungDauTruong?.getBoundingClientRect().width;
      if (Number.isFinite(rongKhung) && rongKhung > 0) {
        // Biến này chỉ đồng bộ chiều cao bảng trạng thái, không giới hạn chiều ngang sân.
        luoi.style.setProperty('--canh-san', `${rongKhung}px`);
      }
    }
    const tyLe = Math.min(window.devicePixelRatio || 1, 2);
    const rong = Math.max(1, Math.round(banDo.getBoundingClientRect().width * tyLe));
    if (banDo.width !== rong) banDo.width = banDo.height = rong;
    veTran();
  }

  // Chỉ đổi cách hiển thị: giữ nguyên bản đồ, thời gian và trạng thái của trận.
  function capNhatToanManHinh() {
    if (!khungDauTruong || !nutToanManHinh) return;
    const toanManHinh = document.fullscreenElement === khungDauTruong;
    const duPhong = khungDauTruong.classList.contains('toan-man-hinh-du-phong');
    const dangPhongTo = toanManHinh || duPhong;
    const nhan = toanManHinh ? 'Thoát toàn màn hình' : duPhong ? 'Thoát phóng to' : 'Toàn màn hình';
    nutToanManHinh.querySelector('span').textContent = nhan;
    nutToanManHinh.querySelector('use').setAttribute('href', dangPhongTo ? '#i-collapse' : '#i-expand');
    nutToanManHinh.setAttribute('aria-pressed', String(dangPhongTo));
    nutToanManHinh.setAttribute('aria-label', nhan);
    nutToanManHinh.title = dangPhongTo ? `${nhan} (Esc)` : 'Phóng to đấu trường toàn màn hình';
    chinhKichThuoc();
  }

  function tatPhongToDuPhong() {
    khungDauTruong.classList.remove('toan-man-hinh-du-phong');
    document.body.classList.remove('dang-phong-to');
    capNhatToanManHinh();
  }

  function batPhongToDuPhong() {
    khungDauTruong.classList.add('toan-man-hinh-du-phong');
    document.body.classList.add('dang-phong-to');
    lay('thong-bao-doc').textContent = 'Trình duyệt không cho phép toàn màn hình. Đấu trường đang được phóng to trong cửa sổ; nhấn Esc để thu lại.';
    capNhatToanManHinh();
  }

  async function doiToanManHinh() {
    if (!khungDauTruong || !nutToanManHinh || dangDoiToanManHinh) return;
    if (khungDauTruong.classList.contains('toan-man-hinh-du-phong')) {
      tatPhongToDuPhong();
      return;
    }
    dangDoiToanManHinh = true;
    nutToanManHinh.disabled = true;
    try {
      if (document.fullscreenElement === khungDauTruong) {
        await document.exitFullscreen();
      } else if (typeof khungDauTruong.requestFullscreen === 'function' && document.fullscreenEnabled !== false) {
        await khungDauTruong.requestFullscreen();
      } else {
        batPhongToDuPhong();
      }
    } catch (loi) {
      if (document.fullscreenElement !== khungDauTruong) batPhongToDuPhong();
      else lay('thong-bao-doc').textContent = 'Chưa thể thoát toàn màn hình. Bạn có thể nhấn Esc để thoát.';
    } finally {
      dangDoiToanManHinh = false;
      nutToanManHinh.disabled = false;
      capNhatToanManHinh();
    }
  }

  function datLai() {
    mocTuDauLai = null;
    lay('dem-nguoc-dau-lai').hidden = true;
    if (tran) D.tuDongLuuLog?.(tran);
    // Không truyền lại mã cũ: mở game, Đặt lại và Đấu lại đều tạo lượt ngẫu nhiên mới.
    tran = D.taoTranDau({ soBot: Number(lay('so-bot').value), hp: Number(lay('che-do').value), capBot: Number(lay('cap-bot').value),
      tenNguoiChoi: lay('ten-nguoi-choi').value, mauNguoiChoi: lay('mau-nguoi-choi').value });
    trangThai = 'san-sang';
    tichLuy = 0;
    mocHinh = performance.now();
    maSuKienCu = -1;
    lay('ket-qua').hidden = true;
    lay('phan-tich-log').hidden = true;
    lay('trang-thai-log').textContent = 'Lưu log trước khi Đặt lại để giữ dữ liệu trận cũ.';
    // Cấp bot có thể đổi dù số xe không đổi; dựng lại nhãn theo trận mới.
    lay('danh-sach-xe').replaceChildren();
    lay('thong-bao-doc').textContent = 'Trận mới đã sẵn sàng.';
    capNhatDieuKhien();
    capNhatBang();
    veTran();
  }

  function batDauHoacDung() {
    if (tran.ketThuc) datLai();
    trangThai = trangThai === 'dang-chay' ? 'tam-dung' : 'dang-chay';
    tichLuy = 0;
    mocHinh = performance.now();
    capNhatDieuKhien();
    capNhatBang();
  }

  function doiNhanDang(hoanTat) {
    if (trangThai !== 'san-sang') return;
    const xe = tran.xe.find(xe => xe.laNguoiChoi);
    xe.ten = D.chuanHoaTenNguoiChoi(lay('ten-nguoi-choi').value);
    xe.mau = D.chuanHoaMauNguoiChoi(lay('mau-nguoi-choi').value);
    // Giữ nguyên nội dung khi đang gõ để người chơi nhập được dấu cách.
    if (hoanTat) lay('ten-nguoi-choi').value = xe.ten;
    lay('danh-sach-xe').replaceChildren();
    capNhatBang();
    veTran();
  }

  function capNhatDieuKhien() {
    const dangChay = trangThai === 'dang-chay';
    const sanSang = trangThai === 'san-sang';
    const nhan = tran.ketThuc ? 'Trận mới' : dangChay ? 'Tạm dừng' : sanSang ? 'Bắt đầu' : 'Tiếp tục';
    for (const id of ['nut-bat-dau', 'nut-chay-toan-man-hinh']) {
      const nut = lay(id);
      if (!nut) continue;
      nut.querySelector('span').textContent = nhan;
      nut.querySelector('use').setAttribute('href', dangChay ? '#i-pause' : '#i-play');
      nut.setAttribute('aria-label', `${nhan} (phím cách)`);
    }
    const nutChayPhongTo = lay('nut-chay-toan-man-hinh');
    const nutDatLaiPhongTo = lay('nut-dat-lai-toan-man-hinh');
    if (nutChayPhongTo) nutChayPhongTo.disabled = lay('nut-bat-dau').disabled;
    if (nutDatLaiPhongTo) nutDatLaiPhongTo.disabled = lay('nut-dat-lai').disabled;
    for (const id of ['so-bot', 'che-do', 'cap-bot', 'ten-nguoi-choi', 'mau-nguoi-choi']) lay(id).disabled = !sanSang;
    lay('huong-dan-nhan-dang').textContent = sanSang ? 'Đặt tên và chọn màu trước khi bắt đầu.' : 'Nhấn Đặt lại để đổi tên hoặc màu xe.';
    lay('trang-thai-tran').textContent = tran.ketThuc ? 'KẾT THÚC' : dangChay ? 'ĐANG GIAO TRANH' : sanSang ? 'SẴN SÀNG' : 'TẠM DỪNG';
    lay('nhan-truc-tiep').textContent = tran.ketThuc ? 'HOÀN TẤT' : dangChay ? 'TRỰC TIẾP' : sanSang ? 'CHỜ LỆNH' : 'TẠM DỪNG';
    lay('cham-trang-thai').className = `status-dot ${dangChay ? 'running' : sanSang ? '' : 'paused'}`;
    const thongBao = lay('thong-bao-san');
    thongBao.hidden = dangChay || tran.ketThuc;
    // hidden cần thắng display:flex của thông báo.
    thongBao.style.display = thongBao.hidden ? 'none' : '';
    thongBao.querySelector('strong').textContent = sanSang ? 'Đội hình đã sẵn sàng' : 'Chiến trường đang tạm dừng';
    thongBao.querySelector('div > span').textContent = sanSang ? 'Nhấn Bắt đầu để các AI tranh tài.' : 'Nhấn Tiếp tục để trở lại trận đấu.';
  }

  function ketThucTran(mocKetThuc) {
    trangThai = 'ket-thuc';
    D.tuDongLuuLog?.(tran);
    // Nếu vừa xử lý bù sau một nhịp nền bị trễ, tính 5 giây từ lúc
    // trận thực sự kết thúc, không bắt đầu đếm lại lúc quay về tab.
    if (lay('tu-dau-lai').checked) mocTuDauLai = mocKetThuc + 5000;
    tichLuy = 0;
    const cuaBan = tran.xe.find(xe => xe.laNguoiChoi);
    lay('tieu-de-ket-qua').textContent = tran.ketQua === 'hoa' ? 'Hòa · Hết 5 phút' : tran.ketQua === 'thua' ? `${cuaBan.ten} đã thua` : `${cuaBan.ten} chiến thắng!`;
    lay('mo-ta-ket-qua').textContent = `Sau ${dinhDangGio(tran.thoiGian)}, xe của bạn hạ ${cuaBan.soHa} đối thủ, bắn ${cuaBan.soBan} phát và trúng ${cuaBan.soTrung} phát.`;
    lay('ket-qua').hidden = false;
    lay('thong-bao-doc').textContent = lay('tieu-de-ket-qua').textContent;
    henTuDauLai();
    capNhatDieuKhien();
    capNhatBang();
  }

  function henTuDauLai() {
    const nhan = lay('dem-nguoc-dau-lai');
    if (!tran.ketThuc || !lay('tu-dau-lai').checked) {
      mocTuDauLai = null;
      nhan.hidden = true;
      return;
    }
    if (mocTuDauLai === null) mocTuDauLai = performance.now() + 5000;
    nhan.hidden = false;
    const con = Math.max(0, Math.ceil((mocTuDauLai - performance.now() - 1e-6) / 1000));
    if (con > 0) { nhan.textContent = `Tự động đấu lại sau ${con} giây…`; return; }
    const luu = D.layTrangThaiTuLuu?.(tran);
    if (luu === 'dang-luu' || luu === 'cho') {
      nhan.textContent = 'Đang chờ lưu log trước khi đấu lại…'; return;
    }
    if (luu === 'loi') {
      nhan.textContent = 'Chưa tự đấu lại vì lưu log thất bại. Giữ trận để lưu thủ công hoặc bấm Đấu lại.';
      return;
    }
    mocTuDauLai = null;
    datLai();
    batDauHoacDung();
  }

  function capNhatBang() {
    if (!tran) return;
    const cuaBan = tran.xe.find(xe => xe.laNguoiChoi);
    lay('ten-xe-hien-thi').textContent = cuaBan.ten;
    lay('ten-xe-hien-thi').title = cuaBan.ten;
    document.body.style.setProperty('--mau-xe-nguoi', cuaBan.mau);
    const phanTich = cuaBan.boNhoAI.phanTich;
    const conSong = tran.xe.filter(xe => xe.conSong).length;
    lay('so-con-song').replaceChildren(document.createTextNode(`${conSong} `));
    const tong = document.createElement('small'); tong.textContent = `/ ${tran.xe.length}`; lay('so-con-song').append(tong);
    lay('thoi-gian').textContent = dinhDangGio(tran.thoiGian);
    lay('so-dan').textContent = String(tran.dan.length).padStart(2, '0');
    lay('vung-an-toan').textContent = tran.vungAnToan >= D.hangSo.gioiHanThuVung
      ? `Bo cuối ${D.hangSo.kichThuocBoToiThieu} × ${D.hangSo.kichThuocBoToiThieu} · Đã dừng thu`
      : tran.vungAnToan > 0 ? `Vùng an toàn còn ${Math.round(K - 2 * tran.vungAnToan)} × ${Math.round(K - 2 * tran.vungAnToan)}`
        : `Vùng an toàn thu hẹp sau ${Math.max(0, Math.ceil(45 - tran.thoiGian))} giây`;
    const hp = Math.max(0, cuaBan.hp);
    lay('mau-xe').replaceChildren(document.createTextNode(Number.isInteger(hp) ? hp : hp.toFixed(1)));
    const hpTong = document.createElement('small'); hpTong.textContent = `/${cuaBan.hpToiDa} HP`; lay('mau-xe').append(hpTong);
    lay('thanh-mau').style.width = `${hp / cuaBan.hpToiDa * 100}%`;
    lay('trang-thai-xe').textContent = !cuaBan.conSong ? 'Đã bị loại · trận đã dừng' : trangThai === 'san-sang' ? 'Đang chờ xuất phát' : `${cuaBan.soHa} hạ · ${cuaBan.soTrung}/${cuaBan.soBan} phát trúng`;
    const nguyHiem = cuaBan.conSong && phanTich ? Math.max(0, Math.min(1, phanTich.nguyHiem)) : 0;
    lay('quyet-dinh').textContent = !cuaBan.conSong ? 'Đã bị loại khỏi trận đấu' : phanTich ? phanTich.lyDo : 'Quan sát chiến trường';
    lay('so-ung-vien').textContent = phanTich ? phanTich.ungVien.length : 15;
    lay('muc-nguy-hiem').textContent = phanTich && cuaBan.conSong ? `${Math.round(nguyHiem * 100)}/100` : '—';
    lay('thanh-nguy-hiem').style.width = `${nguyHiem * 100}%`;
    lay('thanh-nguy-hiem').style.background = nguyHiem > .65 ? '#c78f68' : '#a7bc7e';
    lay('dan-theo-doi').textContent = `${cuaBan.conSong && phanTich ? phanTich.soDanTheoDoi : 0} đạn`;
    const mucTieu = phanTich && phanTich.mucTieu && tran.xe.find(xe => xe.id === phanTich.mucTieu.id);
    lay('muc-tieu').textContent = cuaBan.conSong && mucTieu && mucTieu.conSong ? mucTieu.ten : '—';
    veDanhSachXe();
    const maMoi = tran.suKien.length ? tran.suKien[0].id : 0;
    if (maMoi !== maSuKienCu) {
      maSuKienCu = maMoi;
      const danhSach = lay('nhat-ky');
      danhSach.replaceChildren();
      if (!tran.suKien.length) {
        const dong = document.createElement('li'); dong.className = 'empty-event'; dong.textContent = 'Các diễn biến sẽ xuất hiện tại đây.'; danhSach.append(dong);
      }
      for (const suKien of tran.suKien.slice(0, 8)) {
        const dong = document.createElement('li'), gio = document.createElement('time'), noiDung = document.createElement('span');
        gio.textContent = dinhDangGio(suKien.thoiGian); noiDung.textContent = suKien.noiDung;
        dong.append(gio, noiDung); danhSach.append(dong);
      }
    }
  }

  function veDanhSachXe() {
    const danhSach = lay('danh-sach-xe');
    if (danhSach.children.length !== tran.xe.length) danhSach.replaceChildren();
    tran.xe.forEach((xe, viTri) => {
      let dong = danhSach.children[viTri];
      if (!dong) {
        dong = document.createElement('div'); dong.className = 'roster-row';
        const mau = document.createElement('i'); mau.className = 'roster-color'; mau.style.background = xe.mau;
        const ten = document.createElement('span'); ten.className = 'roster-name'; ten.textContent = xe.ten;
        const nhanCap = document.createElement('small');
        nhanCap.textContent = xe.laNguoiChoi ? 'BẠN' : `CẤP ${xe.capBot}`;
        ten.append(nhanCap);
        const mauXe = document.createElement('span'); mauXe.className = 'roster-hp';
        const soHa = document.createElement('span'); soHa.className = 'roster-kills';
        dong.append(mau, ten, mauXe, soHa); danhSach.append(dong);
      }
      dong.classList.toggle('dead', !xe.conSong);
      const oMau = dong.children[2]; oMau.replaceChildren();
      oMau.className = xe.conSong ? 'roster-hp' : 'roster-dead';
      if (xe.conSong) {
        for (let i = 0; i < xe.hpToiDa; i++) { const vach = document.createElement('i'); vach.className = `hp-pip ${xe.hp > i ? 'filled' : ''}`; oMau.append(vach); }
      } else oMau.textContent = 'ĐÃ LOẠI';
      oMau.setAttribute('aria-label', `${Math.max(0, xe.hp).toFixed(1)} trên ${xe.hpToiDa} HP`);
      dong.children[3].textContent = xe.soHa;
      dong.children[3].setAttribute('aria-label', `${xe.soHa} đối thủ bị hạ`);
    });
  }

  function duongQuaDiem(diem, mau, doDay, dutNet, dau) {
    if (!diem || !diem.length) return;
    but.beginPath(); but.moveTo(dau.x, dau.y);
    for (const d of diem) but.lineTo(d.x, d.y);
    but.strokeStyle = mau; but.lineWidth = doDay; but.setLineDash(dutNet || []); but.stroke(); but.setLineDash([]);
  }

  function veTuDuy() {
    const xe = tran.xe.find(x => x.laNguoiChoi);
    const pt = xe.boNhoAI.phanTich;
    if (!hienDuDoan || !xe.conSong || !pt) return;
    for (const d of tran.dan) {
      if (d.chuId === xe.id) continue;
      const duong = [];
      let cu = d;
      for (let t = .1; t <= 1.5; t += .1) {
        const diem = { x: d.x + d.vx * t, y: d.y + d.vy * t };
        if (diem.x < 0 || diem.x > K || diem.y < 0 || diem.y > K || d.tuoi + t > D.hangSo.tuoiThoDan || D.doanBiChan(cu.x, cu.y, diem.x, diem.y, tran.tuong)) break;
        duong.push(diem); cu = diem;
      }
      duongQuaDiem(duong, '#d5a16b50', 1.1, [5, 8], d);
    }
    for (const uv of pt.ungVien) duongQuaDiem(uv.duong, uv.nguyHiem > .5 ? '#d49e6b20' : '#a9c7791e', 1, [], xe);
    duongQuaDiem(pt.duongChon, '#bddc80bb', 2.2, [], xe);
    for (let i = 4; i < pt.duongChon.length; i += 5) {
      const p = pt.duongChon[i]; but.fillStyle = '#b5d47d'; but.beginPath(); but.arc(p.x, p.y, 2.5, 0, Math.PI * 2); but.fill();
    }
    if (pt.diemNgam && pt.mucTieu) {
      const p = pt.diemNgam;
      if (p.x < 0 || p.x > K || p.y < 0 || p.y > K) return;
      duongQuaDiem([p], '#b2d78232', 1, [3, 7], xe);
      but.strokeStyle = '#c0df88aa'; but.lineWidth = 1.3;
      but.beginPath(); but.arc(p.x, p.y, 11, 0, Math.PI * 2); but.stroke();
      but.beginPath(); but.moveTo(p.x - 17, p.y); but.lineTo(p.x - 6, p.y); but.moveTo(p.x + 6, p.y); but.lineTo(p.x + 17, p.y); but.moveTo(p.x, p.y - 17); but.lineTo(p.x, p.y - 6); but.moveTo(p.x, p.y + 6); but.lineTo(p.x, p.y + 17); but.stroke();
    }
  }

  function veTuong(vat) {
    but.fillStyle = '#091c1866'; but.fillRect(vat.x + 7, vat.y + 9, vat.rong, vat.cao);
    but.fillStyle = '#314339'; but.fillRect(vat.x, vat.y, vat.rong, vat.cao);
    but.strokeStyle = '#52604a'; but.lineWidth = 1.5; but.strokeRect(vat.x + .5, vat.y + .5, vat.rong - 1, vat.cao - 1);
    but.fillStyle = '#3e5040'; but.fillRect(vat.x + 3, vat.y + 3, vat.rong - 6, 4);
    but.strokeStyle = '#435440'; but.lineWidth = 1;
    for (let x = vat.x + 15; x < vat.x + vat.rong - 8; x += 23) { but.beginPath(); but.moveTo(x, vat.y + 10); but.lineTo(x, vat.y + vat.cao - 10); but.stroke(); }
    but.fillStyle = '#6a7251';
    for (const x of [vat.x + 5, vat.x + vat.rong - 7]) for (const y of [vat.y + 5, vat.y + vat.cao - 7]) but.fillRect(x, y, 2, 2);
  }

  function veXe(xe) {
    but.save(); but.translate(xe.x, xe.y);
    if (!xe.conSong) {
      but.rotate(xe.goc); but.fillStyle = '#314038'; but.fillRect(-13, -15, 26, 30); but.fillStyle = '#213329'; but.fillRect(-8, -10, 16, 20);
      but.strokeStyle = '#536049'; but.lineWidth = 1.5; but.beginPath(); but.moveTo(-7, -6); but.lineTo(7, 6); but.moveTo(-7, 6); but.lineTo(7, -6); but.stroke(); but.restore(); return;
    }
    if (xe.laNguoiChoi) {
      but.strokeStyle = xe.mau + '99'; but.lineWidth = 1; but.setLineDash([4, 5]);
      but.beginPath(); but.arc(0, 0, 26, 0, Math.PI * 2); but.stroke(); but.setLineDash([]);
      but.fillStyle = xe.mau + '08'; but.beginPath(); but.arc(0, 0, 33, 0, Math.PI * 2); but.fill();
    }
    but.save(); but.rotate(xe.goc);
    but.fillStyle = '#081c17a0'; but.fillRect(-12, -14, 29, 32);
    but.fillStyle = xe.laNguoiChoi ? xe.mau : '#745e4f';
    but.fillRect(-14, -16, 28, 8); but.fillRect(-14, 8, 28, 8);
    but.strokeStyle = '#14251dcc'; but.lineWidth = 1.7;
    for (let x = -10; x <= 11; x += 5) { but.beginPath(); but.moveTo(x, -16); but.lineTo(x, -8); but.moveTo(x, 8); but.lineTo(x, 16); but.stroke(); }
    but.fillStyle = xe.mau; but.fillRect(-13, -10, 26, 20);
    but.fillStyle = '#f5f9b722'; but.fillRect(-10, -7, 20, 3); but.fillStyle = '#142d2744'; but.fillRect(-10, 5, 19, 3);
    but.restore(); but.save(); but.rotate(xe.gocNong);
    but.fillStyle = '#172b20'; but.fillRect(-5, -4, 34, 8); but.fillStyle = xe.mau; but.fillRect(-5, -2, 35, 4);
    but.fillStyle = xe.mau;
    but.beginPath(); but.arc(0, 0, 8, 0, Math.PI * 2); but.fill();
    but.fillStyle = '#203d2a77'; but.fillRect(-5, -3, 9, 6); but.restore();
    but.font = `${xe.laNguoiChoi ? 'bold ' : ''}10px Consolas,monospace`; but.textAlign = 'center';
    but.fillStyle = xe.laNguoiChoi ? '#c5df9e' : '#afab91';
    but.fillText(xe.ten.toUpperCase(), 0, -36, 150);
    const largeur = xe.hpToiDa === 1 ? 18 : 27;
    but.fillStyle = '#091b15'; but.fillRect(-largeur / 2 - 1, -30, largeur + 2, 4);
    but.fillStyle = xe.mau; but.fillRect(-largeur / 2, -29, largeur * Math.max(0, xe.hp) / xe.hpToiDa, 2);
    but.restore();
  }

  function veTran() {
    if (!tran || !but) return;
    but.setTransform(banDo.width / K, 0, 0, banDo.height / K, 0, 0);
    but.drawImage(nen, 0, 0);
    const bien = tran.vungAnToan;
    if (bien > 0) {
      but.fillStyle = '#b36e4828'; but.fillRect(0, 0, K, bien); but.fillRect(0, K - bien, K, bien); but.fillRect(0, bien, bien, K - 2 * bien); but.fillRect(K - bien, bien, bien, K - 2 * bien);
      but.strokeStyle = '#d99e6c99'; but.lineWidth = 2; but.setLineDash([10, 8]); but.strokeRect(bien, bien, K - 2 * bien, K - 2 * bien); but.setLineDash([]);
    }
    veTuDuy();
    for (const tuong of tran.tuong) veTuong(tuong);
    for (const xe of tran.xe) if (!xe.conSong) veXe(xe);
    for (const xe of tran.xe) if (xe.conSong) veXe(xe);
    for (const dan of tran.dan) {
      const a = Math.atan2(dan.vy, dan.vx);
      but.beginPath(); but.moveTo(dan.x - Math.cos(a) * 15, dan.y - Math.sin(a) * 15); but.lineTo(dan.x, dan.y);
      but.strokeStyle = dan.mau + '85'; but.lineWidth = 2; but.stroke();
      but.fillStyle = '#f3e4b0'; but.shadowColor = dan.mau; but.shadowBlur = 8;
      but.beginPath(); but.arc(dan.x, dan.y, 3.2, 0, Math.PI * 2); but.fill(); but.shadowBlur = 0;
    }
    for (const hu of tran.hieuUng) {
      const tyLe = hu.tuoi / hu.thoiLuong;
      but.save(); but.globalAlpha = Math.max(0, 1 - tyLe);
      but.strokeStyle = hu.mau; but.lineWidth = hu.loai === 'no' ? 3 : 2;
      but.beginPath(); but.arc(hu.x, hu.y, (hu.loai === 'no' ? 50 : 17) * tyLe + 3, 0, Math.PI * 2); but.stroke();
      if (hu.loai === 'no') {
        for (let i = 0; i < 8; i++) { const g = i * Math.PI / 4; but.beginPath(); but.moveTo(hu.x + Math.cos(g) * tyLe * 25, hu.y + Math.sin(g) * tyLe * 25); but.lineTo(hu.x + Math.cos(g) * tyLe * 47, hu.y + Math.sin(g) * tyLe * 47); but.stroke(); }
      }
      but.restore();
    }
  }

  // Tần số vật lý giữ nguyên ở mọi tốc độ phát; không dùng thời gian vẽ để lái xe.
  function capNhatMoPhong(moc) {
    if (trangThai === 'ket-thuc') {
      henTuDauLai();
      mocHinh = moc;
      return;
    }
    // Dùng một đồng hồ chung cho bộ hẹn giờ và vòng vẽ để không chạy gấp đôi.
    moc = Math.max(moc, mocHinh);
    const thoiGianQua = Math.max(0, (moc - (mocHinh || moc)) / 1000);
    mocHinh = moc;
    if (trangThai === 'dang-chay') {
      tichLuy += thoiGianQua * tocDo;
      let soBuoc = 0;
      while (tichLuy + 1e-9 >= BUOC_CO_DINH && soBuoc < 120 && !tran.ketThuc) {
        D.buocMoPhong(tran, BUOC_CO_DINH, (xe, theGioi) => xe.laNguoiChoi ? D.layAINguoiChoi()(xe, theGioi) : D.AIBot(xe, theGioi));
        tichLuy = Math.max(0, tichLuy - BUOC_CO_DINH); soBuoc++;
      }
      if (tran.ketThuc) ketThucTran(moc - tichLuy / tocDo * 1000);
      if (moc - mocBang > 120) { capNhatBang(); mocBang = moc; }
    }
  }

  function khungHinh() {
    capNhatMoPhong(performance.now());
    if (!document.hidden) veTran();
    requestAnimationFrame(khungHinh);
  }
  // requestAnimationFrame thường dừng khi tab bị ẩn. Hẹn giờ vẫn cập nhật
  // mô phỏng bằng thời gian thực, kể cả khi trình duyệt giãn nhịp gọi.
  setInterval(() => capNhatMoPhong(performance.now()), 100);

  // Luồng nền gửi nhịp độc lập với vòng vẽ và bộ hẹn giờ của tab.
  // Mọi nguồn nhịp vẫn dùng chung đồng hồ, không nhân đôi tốc độ trận.
  // Mở trực tiếp file hoặc trình duyệt không hỗ trợ vẫn dùng hẹn giờ trên.
  if (typeof Worker !== 'undefined') {
    let nhipNen;
    try {
      nhipNen = new Worker('nhip-nen.js');
      nhipNen.onmessage = () => capNhatMoPhong(performance.now());
      nhipNen.onerror = () => { nhipNen.terminate(); };
    } catch (_) { nhipNen?.terminate(); }
  }

  lay('nut-xem-log').addEventListener('click', () => {
    lay('phan-tich-log').textContent = D.phanTichNhatKy(D.xuatNhatKy(tran));
    lay('phan-tich-log').hidden = false;
    lay('trang-thai-log').textContent = 'Phân tích trận hiện tại tại thời điểm bấm.';
  });
  lay('nut-luu-log').addEventListener('click', () => {
    const log = D.xuatNhatKy(tran);
    const tep = new Blob([JSON.stringify(log, null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(tep), lienKet = document.createElement('a');
    lienKet.href = url; lienKet.download = `tank-log-${tran.hatGiong}-${Math.floor(tran.thoiGian)}s.json`;
    document.body.append(lienKet); lienKet.click(); lienKet.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    lay('trang-thai-log').textContent = 'Đã tạo tệp log. Hãy giữ tệp trước khi Đặt lại hoặc đóng trang.';
  });
  lay('tep-log').addEventListener('change', async e => {
    const tep = e.target.files?.[0]; if (!tep) return;
    try {
      if (tep.size > 50 * 1024 * 1024) throw new Error('Tệp quá lớn (tối đa 50 MB).');
      const log = JSON.parse(await tep.text());
      D.kiemTraNhatKy(log);
      lay('phan-tich-log').textContent = D.phanTichNhatKy(log);
      lay('phan-tich-log').hidden = false;
      lay('trang-thai-log').textContent = `Đang đọc tệp: ${tep.name}. Trận đang chơi được giữ nguyên.`;
    } catch (loi) { lay('trang-thai-log').textContent = 'Không đọc được log: ' + loi.message; }
    finally { e.target.value = ''; }
  });

  lay('tu-dau-lai').addEventListener('change', () => {
    if (tran.ketThuc && lay('tu-dau-lai').checked) D.tuDongLuuLog?.(tran);
    henTuDauLai();
  });

  lay('nut-bat-dau').addEventListener('click', batDauHoacDung);
  lay('nut-dat-lai').addEventListener('click', datLai);
  lay('nut-chay-toan-man-hinh')?.addEventListener('click', batDauHoacDung);
  lay('nut-dat-lai-toan-man-hinh')?.addEventListener('click', datLai);
  nutToanManHinh?.addEventListener('click', doiToanManHinh);
  lay('nut-choi-lai').addEventListener('click', () => { datLai(); batDauHoacDung(); });
  for (const id of ['so-bot', 'che-do', 'cap-bot']) lay(id).addEventListener('change', datLai);
  for (const id of ['ten-nguoi-choi', 'mau-nguoi-choi']) {
    lay(id).addEventListener('input', () => doiNhanDang(false));
    lay(id).addEventListener('change', () => doiNhanDang(true));
  }
  lay('hien-du-doan').addEventListener('change', e => { hienDuDoan = e.target.checked; veTran(); });
  for (const nut of document.querySelectorAll('[data-toc-do]')) {
    nut.addEventListener('click', () => {
      tocDo = Number(nut.dataset.tocDo);
      for (const n of document.querySelectorAll('[data-toc-do]')) { const chon = n === nut; n.classList.toggle('selected', chon); n.setAttribute('aria-pressed', String(chon)); }
    });
  }
  document.addEventListener('keydown', e => {
    if (e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === 'Escape' && khungDauTruong?.classList.contains('toan-man-hinh-du-phong')) {
      e.preventDefault(); tatPhongToDuPhong(); return;
    }
    if (/INPUT|SELECT|TEXTAREA/.test(e.target.tagName) || e.target.isContentEditable) return;
    // Nút và phần giải thích đã có thao tác Space mặc định của trình duyệt.
    if (e.code === 'Space' && !/BUTTON|SUMMARY/.test(e.target.tagName)) { e.preventDefault(); batDauHoacDung(); }
    if (e.key.toLowerCase() === 'r') { e.preventDefault(); datLai(); }
  });
  document.addEventListener('visibilitychange', () => {
    capNhatMoPhong(performance.now());
    capNhatBang();
    if (!document.hidden) veTran();
  });
  document.addEventListener('fullscreenchange', capNhatToanManHinh);
  window.addEventListener('resize', chinhKichThuoc);
  datLai(); chinhKichThuoc(); capNhatToanManHinh(); requestAnimationFrame(khungHinh);
})();
