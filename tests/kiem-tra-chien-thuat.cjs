'use strict';
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..'), window = { Math, performance };
new Function('window', ['vat-ly.js', 'ai.js', 'nhat-ky.js'].map(f=>fs.readFileSync(path.join(root,f),'utf8')).join('\n'))(window);
const D = window.DauTruong, H = D.hangSo;
let dat = 0;
function thu(ten, ham) { ham(); dat++; console.log('ĐẠT', ten); }
function tranTrong() {
  const t = D.taoTranDau({ soBot: 1, capBot: 10, hp: 3, hatGiong: 38171 });
  t.tuong = []; t.xe.forEach((x,i)=>Object.assign(x,{x:480+i*240,y:480,goc:Math.PI/2,gocNong:Math.PI,vx:0,vy:0,boNhoAI:{}}));
  return t;
}
function suyNghi(t) { const x=t.xe[0]; x.lenh=D.AINguoiChoi(x,t);return x.boNhoAI.phanTich; }
thu('Không đọc lệnh ẩn hoặc thay đổi trạng thái đối thủ, không tiêu thụ số ngẫu nhiên',()=>{
  const t=tranTrong(), dich=t.xe[1], cu=JSON.stringify(dich), rng=t._trangThaiNgauNhien;
  Object.defineProperty(dich,'lenh',{get(){throw Error('Đọc lệnh đối thủ');},configurable:true});
  suyNghi(t); delete dich.lenh;
  assert.equal(t._trangThaiNgauNhien,rng); const a=JSON.parse(cu);delete a.lenh;assert.deepEqual(JSON.parse(JSON.stringify(dich)),a);
});
thu('Địch sắp bắn ở cự ly gần được dự đoán dù chưa có đạn thật',()=>{
  const t=tranTrong();t.xe[1].x=600;t.xe[1].thoiGianNap=0;
  const p=suyNghi(t);assert.equal(p.soDanTheoDoi,0);
  assert(p.ungVien.some(u=>u.nguyHiem>=0.6));assert.equal(p.ungVien.length,27);
});
thu('Ít máu và vừa nhận sát thương chuyển sang bảo toàn mạng rồi hết hạn',()=>{
  const t=tranTrong(),x=t.xe[0];assert.equal(suyNghi(t).rutLui,false);
  x.hp=2;t.thoiGian=.1;assert.equal(suyNghi(t).rutLui,true);
  t.thoiGian=4;assert.equal(suyNghi(t).rutLui,false);
  x.hp=1;t.thoiGian=10;assert.equal(suyNghi(t).rutLui,true);
});
thu('Đường đổi lệnh nhiều bước khớp vật lý 1/60; có đổi chiều và rẽ ngược',()=>{
  const t=tranTrong(); const p=suyNghi(t);
  const us=p.ungVien.filter(u=>u.chuoiLenh.length>1);assert(us.length>=12);
  assert(us.some(u=>u.chuoiLenh[0].ga!==u.chuoiLenh[1].ga));
  for(const u of us){let x={...t.xe[0]};
    for(let i=0;i<90;i++){const l=u.chuoiLenh.find(l=>i/60<l.den-1e-6)||u.chuoiLenh.at(-1);x=D.tinhBuocXe(x,l,1/60,t.tuong);
      if(i%6===5)assert(Math.hypot(x.x-u.duong[Math.floor(i/6)].x,x.y-u.duong[Math.floor(i/6)].y)<1e-7);
    }
  }
});
thu('Có đường thoát đạn thật tức thời thì không chọn đường va chạm sớm',()=>{
  const t=tranTrong();t.dan=[{id:1,x:330,y:480,vx:440,vy:0,chuId:t.xe[1].id,tuoi:0}];
  const p=suyNghi(t);assert(p.ungVien.some(u=>u.satThuongGan>0));assert(p.ungVien.some(u=>u.satThuongGan===0));assert.equal(p.satThuongGan,0);
});
thu('Đi vòng vật cản giữa sân, tìm được góc bắn và gây sát thương trong 30 giây',()=>{
 for (const hp of [3,1]) {
  const t=tranTrong();t.thoiGian=150;t.vungAnToan=300;
  Object.assign(t.xe[0],{x:480,y:380,goc:0});Object.assign(t.xe[1],{x:480,y:610,thoiGianNap:.9});
  t.xe[0].hp=hp;
  t.tuong=[{x:430,y:460,rong:100,cao:70}];
  const p=suyNghi(t);assert(p.diemDen);assert(p.ungVien.some(u=>u.chuoiLenh.length>=3));
  for(let i=0;i<1800 && !t.ketThuc && !t.xe[0].soTrung;i++)D.buocMoPhong(t,1/60,(x,s)=>x.laNguoiChoi?D.AINguoiChoi(x,s):{ga:0,quay:0,gocNong:0,ban:false});
  assert(t.xe[0].soTrung>0,`Chưa bắn trúng sau ${t.thoiGian-150}s, x=${t.xe[0].x}, y=${t.xe[0].y}`);
 }
});
thu('Đấu tay đôi quá 7 giây không gây sát thương thì tìm góc tiếp cận mới',()=>{
 const t=tranTrong();suyNghi(t);t.thoiGian=8;const p=suyNghi(t);
 assert.equal(p.beTac,true);assert(p.diemDen);
 t.xe[0].soTrung++;t.thoiGian=8.1;assert.equal(suyNghi(t).beTac,false);
});
thu('Học từ sai số đã quan sát: dùng ngắm cong khi đối thủ thực sự chạy vòng',()=>{
  const t=tranTrong(),d=t.xe[1];Object.assign(t.xe[0],{x:200,y:450});Object.assign(d,{x:600,y:450,goc:Math.PI/2});
  let soNgamCong=0;
  for(let k=0;k<80;k++){
    for(let j=0;j<6;j++){const cu={x:d.x,y:d.y};Object.assign(d,D.tinhBuocXe(d,{ga:1,quay:.5},1/60,t.tuong));d.vx=(d.x-cu.x)*60;d.vy=(d.y-cu.y)*60;}
    t.thoiGian=(k+1)/10;const p=suyNghi(t);if(p.kieuNgam==='theo-duong-cong')soNgamCong++;
  }
  assert(soNgamCong>20,`Chỉ dùng mô hình cong ${soNgamCong} lần`);
});
thu('Xe dừng trước tường được ngắm ở vị trí quan sát, không bắn vượt tường',()=>{
  const t=tranTrong();Object.assign(t.xe[1],{vx:0,vy:0});const p=suyNghi(t);
  assert.equal(p.kieuNgam,'dich-dang-dung');assert.deepEqual(p.diemNgam,{x:720,y:480});
});
thu('Log lưu phiên bản, chế độ và chuỗi lệnh; đọc lại được log cũ',()=>{
  const t=tranTrong();D.khoiTaoNhatKy(t);suyNghi(t);t.thoiGian=1;D.ghiDienBien(t,true);
  const log=D.xuatNhatKy(t);D.kiemTraNhatKy(log);assert.equal(log.cauHinh.phienBanAI,D.phienBanAI);
  const p=log.dienBien.at(-1).xe[0].phanTich;assert.equal(p.phienBan,D.phienBanAI);assert(Array.isArray(p.chuoiLenh));assert.equal(p.thoiDiemQuyetDinh,0);
  delete log.cauHinh.phienBanAI;delete p.chuoiLenh;D.kiemTraNhatKy(log);
});
console.log(`${dat} nhóm chiến thuật đạt.`);
