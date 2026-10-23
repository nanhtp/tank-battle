'use strict';
const fs = require('node:fs'), vm = require('node:vm'), path = require('node:path'), assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const ctx = { console, Math, Date }; ctx.window = ctx; vm.createContext(ctx);
for (const f of ['vat-ly.js', 'ai.js', 'nhat-ky.js']) vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'),ctx);
const D = ctx.DauTruong;
let passed = 0;
function test(name, fn) { fn(); passed++; console.log('ĐẠT ' + name); }
const idle = () => ({ ga:0, quay:0, gocNong:0, ban:false });
function match(hp=1) {
 const t = D.taoTranDau({ soBot:1, hp, hatGiong:123, tenNguoiChoi:'Rồng Thép' }); t.tuong=[];
 Object.assign(t.xe[0],{ x:300,y:300 }); Object.assign(t.xe[1],{ x:600,y:300 }); return t;
}
test('Ghi va chạm gây chết, người bắn, đạn và lệnh trước khi xe bị loại',()=>{
 const t=match();
 t.dan.push({id:'thu',chuId:t.xe[1].id,x:270,y:300,vx:440,vy:0,tuoi:0,mau:'#ffeeaa'});
 for(let i=0;i<5;i++) D.buocMoPhong(t,1/60,idle);
 const d=t.nhatKy.satThuong[0]; assert(d.biLoai); assert.equal(d.nguyenNhan,'trung-dan');
 assert.equal(d.nguoiBan.id,'bot-1'); assert.equal(d.dan.id,'thu'); assert.equal(d.xe.hp,1); assert.equal(d.hpSau,0);
 const log=D.xuatNhatKy(t); assert(log.baoCao.includes('trúng đạn của Bot 01')); assert(log.baoCao.includes('Rồng Thép'));
 assert.equal(D.phanTichNhatKy(JSON.parse(JSON.stringify(log))),log.baoCao);
});
test('Sát thương bo cộng đủ HP và ghi lần gây chết cuối cùng',()=>{
 const t=match(); t.thoiGian=130; Object.assign(t.xe[0],{x:100,y:100,hp:.1});
 for(let i=0;i<10;i++) D.buocMoPhong(t,1/60,idle);
 const ds=t.nhatKy.satThuong.filter(d=>d.xe.id==='nguoi');
 assert(ds.at(-1).biLoai); assert.equal(ds.at(-1).nguyenNhan,'ngoai-bo');
 assert(Math.abs(ds.reduce((s,d)=>s+d.luong,0)-.1)<1e-8);
 assert(D.xuatNhatKy(t).baoCao.includes('mất HP ngoài vùng an toàn'));
});
test('Ảnh ghi không bị thay đổi sau này, dữ liệu xuất độc lập và không giới hạn 30 sự kiện',()=>{
 const t=match(3), initial=t.nhatKy.dienBien[0].xe[0].x;
 t.xe[0].x+=80; assert.equal(t.nhatKy.dienBien[0].xe[0].x,initial);
 t.xe[0].hp=100;
 for(let i=0;i<40;i++) { t.dan.push({id:'hit'+i,chuId:'bot-1',x:t.xe[0].x,y:t.xe[0].y,vx:0,vy:0,tuoi:0,mau:'#ffffff'}); D.buocMoPhong(t,1/60,idle); }
 assert(t.suKien.length<=30); assert(t.nhatKy.suKien.length>30);
 const log=D.xuatNhatKy(t); log.xeCuoi[0].x=-99; assert.notEqual(t.xe[0].x,-99);
 assert(log.baoCao.includes('Trận chưa kết thúc'));
});
test('Ghi log không thay đổi kết quả vật lý hoặc ngẫu nhiên',()=>{
 const a=match(3), b=match(3), ghi=D.ghiDienBien;
 for(let i=0;i<120;i++) D.buocMoPhong(a,1/60,(x,t)=>x.laNguoiChoi?D.AINguoiChoi(x,t):D.AIBot(x,t));
 D.ghiDienBien=undefined;
 try { for(let i=0;i<120;i++) D.buocMoPhong(b,1/60,(x,t)=>x.laNguoiChoi?D.AINguoiChoi(x,t):D.AIBot(x,t)); }
 finally {D.ghiDienBien=ghi;}
 assert.equal(JSON.stringify(a.xe),JSON.stringify(b.xe)); assert.equal(a._trangThaiNgauNhien,b._trangThaiNgauNhien);
 assert(a.nhatKy.dienBien.length>=7);
});
test('Log mới độc lập, tệp sai định dạng bị từ chối',()=>{
 assert.throws(()=>D.kiemTraNhatKy({}),/định dạng/);
 const a=match(),b=match(); a.nhatKy.suKien.push({noiDung:'thử'}); assert.notEqual(a.nhatKy.suKien.length,b.nhatKy.suKien.length);
 const log=D.xuatNhatKy(a); log.phienBan=999; assert.throws(()=>D.kiemTraNhatKy(log));
});
console.log(`${passed} nhóm nhật ký đạt.`);
