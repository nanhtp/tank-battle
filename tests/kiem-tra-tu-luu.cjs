const fs = require('node:fs'), vm = require('node:vm'), assert = require('node:assert/strict');
const code=fs.readFileSync(require('node:path').join(__dirname,'../tu-luu-log.js'),'utf8');
async function phien(loi=false) {
 const status={textContent:''}, gui=[];
 const w={DauTruong:{xuatNhatKy:t=>({hatGiong:t.hatGiong})},location:{protocol:'http:',hostname:'127.0.0.1'}};
 const c={window:w,document:{getElementById:()=>status},fetch:async(url,opt)=>{
   if(!opt)return {ok:true,json:async()=>({maBaoVe:'token',thuMuc:'D:\\Projects\\tank-battle\\LogTank'})};
   gui.push(opt); return {ok:!loi,json:async()=>loi?({loi:'Không ghi được'}):({duongDan:'D:\\Projects\\tank-battle\\LogTank\\test.json'})};
 }};
 vm.runInNewContext(code,c); const t={thoiGian:10,hatGiong:123};
 await Promise.all([w.DauTruong.tuDongLuuLog(t),w.DauTruong.tuDongLuuLog(t)]);
 assert.equal(gui.length,1); assert.equal(JSON.parse(gui[0].body).hatGiong,123);
 if(!loi){assert(status.textContent.includes('Đã tự lưu'));await w.DauTruong.tuDongLuuLog(t);assert.equal(gui.length,1);}
 else {assert(status.textContent.includes('Tự lưu thất bại'));await w.DauTruong.tuDongLuuLog(t);assert.equal(gui.length,2);}
 await w.DauTruong.tuDongLuuLog({thoiGian:0});assert.equal(gui.length,loi?2:1);
}
(async()=>{await phien();await phien(true);console.log('ĐẠT tự lưu thành công, tránh gửi trùng, báo lỗi, thử lại và bỏ qua trận chưa chơi.');})().catch(e=>{console.error(e);process.exitCode=1});
