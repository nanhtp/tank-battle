/* Tự lưu sau trận hoặc trước Đặt lại. Chỉ báo thành công khi máy chủ xác nhận. */
(function () {
  'use strict';
  const D = window.DauTruong;
  const trangThai = () => document.getElementById('tu-luu-log');
  const daLuu = new WeakSet();
  const dangLuu = new WeakSet();
  const diaChi = window.location;
  const coMayChu = diaChi && diaChi.protocol === 'http:' && diaChi.hostname === '127.0.0.1';
  const sanSang = coMayChu ? fetch('/api/cau-hinh-log').then(async r => {
    if (!r.ok) throw new Error('Chưa kết nối được chương trình lưu log.');
    const c = await r.json();
    if (!c.maBaoVe || !c.thuMuc) throw new Error('Cấu hình lưu log không hợp lệ.');
    trangThai().textContent = 'Tự lưu khi kết thúc trận → ' + c.thuMuc;
    return c;
  }).catch(e => { trangThai().textContent = 'Tự lưu chưa sẵn sàng: ' + e.message; return null; }) : Promise.resolve(null);
  if (!coMayChu) trangThai().textContent = 'Để tự lưu vào D:\\Projects\\tank-battle\\LogTank, mở game bằng MO-GAME-TU-LUU-LOG.cmd.';
  D.tuDongLuuLog = async tran => {
    if (!coMayChu || !tran || tran.thoiGian <= 0 || daLuu.has(tran) || dangLuu.has(tran)) return;
    dangLuu.add(tran);
    try {
      // Chụp dữ liệu ngay trước khi giao diện chuyển sang trận mới.
      const noiDung = JSON.stringify(D.xuatNhatKy(tran));
      const c = await sanSang;
      if (!c) throw new Error('Hãy mở lại game bằng MO-GAME-TU-LUU-LOG.cmd.');
      trangThai().textContent = 'Đang tự lưu log…';
      const r = await fetch('/api/luu-log', { method: 'POST', headers: {
        'Content-Type': 'application/json', 'X-Tank-Token': c.maBaoVe
      }, body: noiDung });
      const kq = await r.json();
      if (!r.ok) throw new Error(kq.loi || 'Không lưu được log.');
      daLuu.add(tran);
      trangThai().textContent = 'Đã tự lưu: ' + kq.duongDan;
    } catch (loi) {
      trangThai().textContent = 'Tự lưu thất bại: ' + loi.message + ' Bạn có thể dùng nút Lưu log để tải thủ công.';
    } finally { dangLuu.delete(tran); }
  };
})();
