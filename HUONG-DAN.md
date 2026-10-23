# Đấu trường xe tăng AI

Game mô phỏng đấu sinh tồn bằng HTML, CSS và JavaScript thuần. Xe có vòng tròn nét đứt là xe của bạn; chương trình tự điều khiển cả việc di chuyển, xoay nòng và bắn. Mục tiêu là trở thành xe cuối cùng còn sống.

## Mở và chơi

1. Giữ các tệp trong cùng một thư mục.
2. Nhấp đúp `index.html` để mở bằng trình duyệt hiện đại như Chrome, Edge hoặc Firefox. Không cần cài thư viện, kết nối Internet hay chạy máy chủ.
3. Trong bảng **Bộ não của bạn**, nhập **Tên xe của bạn** (tối đa 24 ký tự) và bấm ô **Màu xe** để chọn màu. Tên và màu được xem trước ngay trên bản đồ, bảng trạng thái và đội hình; màu cũng áp dụng cho đạn của xe. Để trống tên sẽ dùng “Tiên Phong”.
4. Chọn số bot, **cấp bot từ 1 đến 10** và chế độ sát thương, rồi nhấn **Bắt đầu**. Game tự tạo diễn biến ngẫu nhiên mới.

**Tạm dừng / Tiếp tục** giữ nguyên trận hiện tại. **Đặt lại** tạo một trận ngẫu nhiên mới ở trạng thái chuẩn bị và cho phép sửa thiết lập. **Đấu lại** sau khi kết thúc cũng tạo diễn biến mới. Đặt lại và Đấu lại giữ tên, màu đã chọn trong phiên đang mở. Tên người thắng và nhật ký dùng đúng tên xe. Muốn đổi tên hoặc màu khi đang đấu, nhấn Đặt lại trước. Các thiết lập của trận bị khóa khi trận đã bắt đầu; hãy đặt lại nếu muốn đổi chúng.

Phím **Space** bắt đầu, tạm dừng hoặc tiếp tục; **R** đặt lại. Phím tắt không hoạt động khi bạn đang nhập hoặc chọn một trường thiết lập. Khi một nút hoặc mục giải thích đang được chọn bằng bàn phím, Space giữ thao tác mặc định của phần tử đó; R vẫn đặt lại trận.

## Kích thước hiển thị và toàn màn hình

Khối nội dung (bản đồ và bảng trạng thái) dùng trọn chiều ngang, thẳng hàng với thanh điều khiển phía trên. Bản đồ giữ tỉ lệ vuông **1:1** nên chiều cao tăng giảm theo chiều ngang. Kích thước thanh điều khiển được giữ nguyên. Bảng trạng thái bên phải cuộn riêng theo chiều cao sân; trên màn hình hẹp, bảng này xếp dưới bản đồ. Khi thay đổi kích thước cửa sổ, game tự cập nhật độ nét của bản đồ.

Nhấn **Toàn màn hình** ở góc trên bên phải khung bản đồ để phóng riêng đấu trường. Trong chế độ này có sẵn nút **Bắt đầu / Tạm dừng / Tiếp tục** và **Đặt lại**. Nhấn **Thoát toàn màn hình** hoặc **Esc** để trở lại bố cục thường. Phóng to và thu nhỏ tiếp tục đúng trận đang chơi, giữ nguyên bản đồ, HP và thời gian.

Nếu trình duyệt không cho phép bật toàn màn hình, game dùng chế độ phóng to trong cửa sổ; nút sẽ ghi **Thoát phóng to**. Bạn cũng có thể nhấn **Esc** để thu lại. Tọa độ mô phỏng vẫn dùng sân **960 × 960**, giúp AI hoạt động nhất quán ở mọi kích thước hiển thị.

## Thiết lập và cách đọc màn hình

- **Số bot:** từ 1 đến 10, cộng thêm một xe của bạn.
- **Cấp bot:** từ 1 đến 10, mặc định cấp 5. Cấp đang chọn áp dụng cho tất cả bot và được ghi cạnh tên trong bảng đội hình. Muốn đổi cấp khi đang đấu, nhấn Đặt lại trước. Đấu lại giữ cấp đã chọn và tạo trận ngẫu nhiên mới.
- **Chế độ 3 HP:** mỗi viên đạn trúng gây mất 1 HP. **Chế độ 1 hit:** một lần trúng đạn là bị loại.
- **Diễn biến ngẫu nhiên:** mỗi lần mở game, đặt lại hoặc đấu lại đều có nguồn ngẫu nhiên mới. Bản đồ thay đổi vị trí, kích thước và số lượng chướng ngại vật; vị trí xuất phát và thứ tự các xe cũng thay đổi. Bot chọn hướng tiếp cận và mục tiêu dựa trên cấp độ, tình huống và một phần ngẫu nhiên. Tạm dừng rồi tiếp tục vẫn giữ đúng trận đang chơi.
- **Tốc độ 0,5× / 1× / 2×:** thay đổi tốc độ xem trận; đồng hồ trận và mọi dự đoán vẫn tính theo thời gian trong game.
- **Hiện dự đoán AI:** bật hoặc tắt lớp hiển thị đường dự kiến và thông tin quyết định của xe bạn. Việc tắt lớp này không tắt AI.

Điểm nguy hiểm từ 0 đến 100 là **điểm đánh giá theo quy tắc**, không phải xác suất trúng đạn. Các đường dự kiến là xấp xỉ theo trạng thái hiện tại; AI sẽ tính lại khi xe khác đổi hướng, xuất hiện đạn mới hoặc xảy ra va chạm.

Bảng trạng thái cho biết số xe còn sống, thời gian, tình trạng xe bạn và kết quả trận. Các vạch HP trên xe giúp theo dõi sát thương trực tiếp.

## Luật mô phỏng

- Đấu trường hình vuông có tường biên và chướng ngại vật. Xe không đi xuyên tường hoặc xuyên xe khác.
- Chướng ngại vật được tạo ngẫu nhiên khi tạo trận và giữ nguyên trong suốt trận đấu. Bộ tạo bản đồ chừa khoảng trống quanh vị trí xuất phát, các lối di chuyển nối thông và sân đấu trong bo cuối **360 × 360**. Các lối trống luôn đủ cho tiết diện xe đi qua.
- Nòng súng xoay độc lập với thân xe. Xe có thể vừa chạy, vừa ngắm theo hướng khác.
- Đạn bay thẳng, biến mất khi chạm tường, chướng ngại vật hoặc một xe. Đạn không nảy lại.
- Sau **45 giây**, vùng an toàn bắt đầu thu hẹp và dừng hẳn ở **360 × 360**, đủ lối di chuyển và đấu súng quanh vật cản giữa sân. Bảng trạng thái sẽ báo **Bo cuối · Đã dừng thu**. Xe ở ngoài vùng an toàn vẫn mất HP dần, kể cả trong chế độ 1 hit. Xe ở trong bo cuối tiếp tục giao chiến bình thường, không bị ép vào một điểm; trận có thể kéo dài khi các AI phòng thủ tốt.
- Khi chỉ còn một xe, xe đó thắng. Nếu không còn xe nào, trận hòa. Nếu xe bạn bị loại sớm, bạn vẫn có thể xem các bot hoàn thành trận.

## AI của xe bạn hoạt động thế nào?

AI được tính lại mỗi **0,1 giây**. Vật lý chạy bằng bước cố định **1/60 giây** để đạn, va chạm và tốc độ xem hoạt động nhất quán.

Mỗi lần quyết định, xe bạn đọc trạng thái trận, theo dõi đạn và thử **15 hành động**: tiến / dừng / lùi kết hợp với năm mức rẽ trái, đi thẳng hoặc rẽ phải. Với mỗi cách, chương trình dự đoán đường đi trong khoảng **1,5 giây** rồi chấm điểm:

1. Nguy cơ trúng đạn và mức an toàn của đường đi.
2. Khoảng cách tới tường, chướng ngại vật và vùng an toàn.
3. Vị trí so với các đối thủ và khả năng tạo góc bắn.
4. Cơ hội bắn trúng đối thủ, có dự đoán vị trí đối thủ khi đạn tới.

Xe chọn hành động có điểm tốt nhất và chỉ thực hiện phần đầu của kế hoạch. Sau 0,1 giây, xe quan sát lại và tính lại từ đầu. Cách này giúp xe điều chỉnh khi đối thủ đổi hướng hoặc xuất hiện đạn mới.

AI bot thay đổi theo cấp được chọn. Đây là AI theo luật và mô phỏng dự đoán, **không phải mô hình học máy**, không có quá trình huấn luyện và không bảo đảm xe bạn luôn thắng.

## Cấp độ bot 1–10

- **Cấp 1–3:** phản ứng chậm hơn, ngắm có sai số lớn hơn, chạy vòng ngẫu nhiên và thoát kẹt cơ bản; chưa dùng bộ thử nhiều đường đi để né đạn. Thích hợp làm quen và thử chương trình AI mới.
- **Cấp 4–6:** ngắm đón đầu tốt hơn, xét nhiều hướng di chuyển hơn và né quỹ đạo đạn sớm hơn. Cấp 5 là mức mặc định để thử nghiệm.
- **Cấp 7–9:** tính đường đi xa hơn, cân nhắc tường che, hỏa lực từ nhiều đối thủ, tình trạng HP và đường trở lại vùng an toàn.
- **Cấp 10:** phản ứng ở nhịp nhanh nhất của game, sai số ngắm nhỏ nhất, ngắm đón đầu đầy đủ và thử tối đa 15 phương án với tầm dự đoán 1,8 giây.

Các thông số tăng dần theo từng cấp, gồm độ trễ phản ứng khoảng 0,6 xuống 0,1 giây, sai số ngắm giảm từ 0,26 xuống 0,006 radian và mức ngắm đón đầu tăng từ 0 lên 100%. Bộ thử đường đi bắt đầu ở cấp 4 với 6 phương án nhìn trước 0,65 giây, tăng dần đến 15 phương án và 1,8 giây ở cấp 10. Nhịp phản ứng được làm tròn theo vòng xử lý AI 0,1 giây của game.

Độ khó đến từ quyết định của AI. Mọi xe dùng cùng luật HP của chế độ, sát thương, giới hạn tốc độ và thời gian nạp đạn. Cấp bot không thay chương trình AI của xe bạn. Kết quả từng trận vẫn phụ thuộc vị trí, số đối thủ và diễn biến ngẫu nhiên; một cấp cao hơn không được bảo đảm thắng mọi trận.

Lập trình viên có thể xem cấu hình bằng `DauTruong.cauHinhCapBot(cap)` và chọn cấp khi tạo trận qua `capBot`. Cấu hình có các trường `trePhanUng`, `saiSoNgam`, `tyLeDonDau`, `chanTroi` và `soUngVien`.

## Thay AI của xe bạn

Các tệp được tách theo nhiệm vụ:

- `index.html`: cấu trúc giao diện.
- `style.css`: màu sắc, bố cục và giao diện trên màn hình nhỏ.
- `vat-ly.js`: tạo trận, chuyển động, đạn, va chạm và điều kiện kết thúc.
- `ai.js`: AI xe bạn, AI bot và điểm đăng ký chương trình thay thế.
- `game.js`: nút điều khiển, vòng lặp hiển thị, vẽ đấu trường và bảng trạng thái.
- `tests/`: các bài kiểm tra tự động tùy chọn, không cần thiết để mở game.

Tên biến, tên hàm và chú thích dùng tiếng Việt không dấu để dễ đọc và nhập trên nhiều bàn phím. API được đặt tại `window.DauTruong`.

Để thử một AI mới, thêm đoạn sau vào cuối `ai.js`, hoặc trong một tệp riêng được nạp sau `ai.js` và trước `game.js`:

```javascript
const D = window.DauTruong;

D.dangKyAI(function aiCuaToi(xe, tran) {
  // Đây là ví dụ đơn giản để minh họa cách thay AI.
  return {
    ga: 1,                 // -1: lùi; 0: dừng; 1: tiến.
    quay: 0.3,             // -1..1: tốc độ xoay thân theo hai chiều.
    gocNong: 0,            // Góc ngắm tuyệt đối, đơn vị radian.
    ban: true              // Xin bắn; súng vẫn phải chờ thời gian nạp.
  };
});
```

Hàm nhận `xe` là xe đang được điều khiển và `tran` là trạng thái trận hiện tại. Hàm cần trả kết quả nhanh, đọc trạng thái và trả lệnh; không tự thay vị trí, HP, đạn hoặc thời gian của trận. Có thể lưu thông tin quan sát riêng tại `xe.boNhoAI`. `ga` và `quay` nhận giá trị từ −1 đến 1; `gocNong` tính theo radian với góc 0 hướng sang phải, góc dương xoay theo chiều kim đồng hồ trên màn hình.

Các trường dữ liệu thường dùng:

- `xe.x`, `xe.y`: tọa độ; `xe.goc`: hướng thân; `xe.gocNong`: hướng nòng.
- `xe.vx`, `xe.vy`: vận tốc thực tế; `xe.hp`, `xe.hpToiDa`, `xe.conSong`: tình trạng xe.
- `xe.thoiGianNap`: số giây còn lại trước khi có thể bắn tiếp.
- `tran.capBot`: cấp bot đã chọn; `xe.capBot`: cấp của từng bot, bằng `null` ở xe của bạn.
- `tran.xe`: danh sách tất cả xe, kể cả xe đã bị loại; cần lọc bằng `conSong`.
- `tran.dan`: đạn hiện có, với tọa độ `x`, `y`, vận tốc `vx`, `vy` và mã xe bắn `chuId`.
- `tran.tuong`: các chướng ngại hình chữ nhật với `x`, `y`, `rong`, `cao`.
- `tran.thoiGian`: số giây đã trôi qua; `tran.vungAnToan`: khoảng lùi của biên an toàn từ mỗi mép đấu trường.
- `D.tinhVungAnToan(thoiGian)`: dự đoán đúng khoảng thu của bo tại thời điểm bất kỳ, luôn dừng ở sân cuối. Kích thước sân cuối nằm ở `D.hangSo.kichThuocBoToiThieu`.

AI gốc có tên `D.AINguoiChoi`; AI bot có tên `D.AIBot`. Lấy AI xe bạn đang được đăng ký bằng `D.layAINguoiChoi()`. Để trở lại AI gốc, gọi:

```javascript
window.DauTruong.dangKyAI(window.DauTruong.AINguoiChoi);
```

Cũng có thể gọi `window.DauTruong.dangKyAI(null)` để dùng lại AI gốc.

Các hàm phục vụ mở rộng hoặc thử nghiệm:

```javascript
const tran = D.taoTranDau({ soBot: 5, capBot: 7, hp: 3, hatGiong: 12345 });

// Tiến một bước mô phỏng và cung cấp bộ chọn lệnh cho từng xe.
D.buocMoPhong(tran, 1 / 60, function chonLenh(xe, tran) {
  return xe.laNguoiChoi ? D.layAINguoiChoi()(xe, tran) : D.AIBot(xe, tran);
});

// Dự đoán riêng chuyển động một xe mà không sửa trực tiếp xe đó.
const xeDuDoan = D.tinhBuocXe(xe, lenh, 0.1, tran.tuong);
```

Nên bắt đầu bằng việc sửa hàm chấm điểm trong `ai.js`, rồi so sánh số lần sống sót, số lần bị trúng và kết quả qua nhiều trận ngẫu nhiên. Một trận thắng riêng lẻ chưa đủ để kết luận AI mới tốt hơn. Khi viết bài kiểm tra bằng mã, bạn vẫn có thể truyền `hatGiong` cụ thể vào `D.taoTranDau()` để tái tạo lỗi; giao diện chơi bình thường luôn tự tạo trận mới.

## Chạy kiểm tra tự động (tùy chọn)

Nếu máy đã có Node.js, mở cửa sổ dòng lệnh tại thư mục dự án rồi chạy:

```text
node tests/kiem-tra.cjs
node tests/kiem-tra-giao-dien.cjs
node tests/kiem-tra-cap-bot.cjs
node tests/kiem-tra-ban-do.cjs
```

Không cần cài thêm gói thư viện. Bài thứ nhất kiểm tra vật lý, lịch quyết định AI, đường dự đoán, ngắm đón đầu, tạo trận ngẫu nhiên, các đợt đổi chiến thuật bot và các trận nhiều xe. Hạt giống cố định chỉ dùng trong bài kiểm tra để tái hiện lỗi. Bài thứ hai thực thi mã giao diện bằng các đối tượng DOM/Canvas giả lập để kiểm tra nút, thiết lập cấp độ, tốc độ, phím tắt, tạm dừng, toàn màn hình, kích thước sân theo cửa sổ và xác nhận Đặt lại/Đấu lại tạo trận mới. Bài thứ ba kiểm tra cấu hình và các hành vi chiến đấu theo cấp bot. Bài thứ tư kiểm tra bản đồ ngẫu nhiên qua nhiều hạt giống, khoảng trống xuất phát, lối đi nối thông và bo cuối. Bài kiểm tra giả lập không xác minh bố cục hoặc cách hiển thị trong trình duyệt thật.
