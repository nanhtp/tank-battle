# Đấu trường xe tăng AI

Game mô phỏng đấu sinh tồn bằng HTML, CSS và JavaScript thuần. Xe có vòng tròn nét đứt là xe của bạn; chương trình tự điều khiển cả việc di chuyển, xoay nòng và bắn. Mục tiêu là trở thành xe cuối cùng còn sống. Trận dừng ngay khi xe của bạn thắng hoặc bị loại; nếu bạn vẫn sống và còn đối thủ sau 5 phút thì kết quả là hòa.

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
- **Tốc độ 1× / 2× / 5× / 8×:** thay đổi tốc độ xem trận; đồng hồ trận và mọi dự đoán vẫn tính theo thời gian trong game.
- **Hiện dự đoán AI:** bật hoặc tắt lớp hiển thị đường dự kiến và thông tin quyết định của xe bạn. Việc tắt lớp này không tắt AI.

Điểm nguy hiểm từ 0 đến 100 là **điểm đánh giá theo quy tắc**, không phải xác suất trúng đạn. Các đường dự kiến là xấp xỉ theo trạng thái hiện tại; AI sẽ tính lại khi xe khác đổi hướng, xuất hiện đạn mới hoặc xảy ra va chạm.

Bảng trạng thái cho biết số xe còn sống, thời gian, tình trạng xe bạn và kết quả trận. Các vạch HP trên xe giúp theo dõi sát thương trực tiếp.

## Luật mô phỏng

- Đấu trường hình vuông có tường biên và chướng ngại vật. Xe không đi xuyên tường hoặc xuyên xe khác.
- Chướng ngại vật được tạo ngẫu nhiên khi tạo trận và giữ nguyên trong suốt trận đấu. Bộ tạo bản đồ chừa khoảng trống quanh vị trí xuất phát, các lối di chuyển nối thông và sân đấu trong bo cuối **360 × 360**. Các lối trống luôn đủ cho tiết diện xe đi qua.
- Nòng súng xoay độc lập với thân xe. Xe có thể vừa chạy, vừa ngắm theo hướng khác.
- Đạn bay thẳng, biến mất khi chạm tường, chướng ngại vật hoặc một xe. Đạn không nảy lại.
- Sau **45 giây**, vùng an toàn bắt đầu thu hẹp và dừng hẳn ở **360 × 360**, đủ lối di chuyển và đấu súng dù khu giữa trống hoặc có vật cản nhỏ. Bảng trạng thái sẽ báo **Bo cuối · Đã dừng thu**. Xe ở ngoài vùng an toàn vẫn mất HP dần, kể cả trong chế độ 1 hit. Xe ở trong bo cuối tiếp tục giao chiến bình thường, không bị ép vào một điểm; trận có thể kéo dài khi các AI phòng thủ tốt.
- Xe bạn bị loại thì trận dừng ngay và tính thua, kể cả bị loại đồng thời với các xe khác. Xe bạn sống sót cuối cùng thì thắng. Sau 300 giây còn xe bạn và đối thủ thì hòa.

## AI của xe bạn hoạt động thế nào?

AI được tính lại mỗi **0,1 giây**. Vật lý chạy bằng bước cố định **1/60 giây** để đạn, va chạm và tốc độ xem hoạt động nhất quán.

Bản **AI chiến thuật 3** giữ 15 hành động cơ bản và thêm đường đổi hướng/đổi chiều khi có đạn hoặc đối thủ ở gần, cùng đường tới góc vật cản khi cần. Tổng cộng **15–44 phương án**, mỗi phương án dự đoán **1,5 giây**. Chuỗi hành động được xem xét lại sau mỗi 0,1 giây; không buộc xe thực hiện hết khi xuất hiện nguy hiểm mới. Các tiêu chí gồm:

1. Nguy cơ trúng đạn và mức an toàn của đường đi.
2. Khoảng cách tới tường, chướng ngại vật và vùng an toàn.
3. Vị trí so với các đối thủ và khả năng tạo góc bắn.
4. Cơ hội bắn trúng đối thủ, có dự đoán vị trí đối thủ khi đạn tới.

Xe chọn hành động có điểm tốt nhất và chỉ thực hiện phần đầu của kế hoạch. Sau 0,1 giây, xe quan sát lại và tính lại từ đầu. Cách này giúp xe điều chỉnh khi đối thủ đổi hướng hoặc xuất hiện đạn mới.

AI bot thay đổi theo cấp được chọn. Đây là AI theo luật và mô phỏng dự đoán, **không phải mô hình học máy**, không có quá trình huấn luyện và không bảo đảm xe bạn luôn thắng.

## Cấp độ bot 1–10 mới — bot-2

Thang cũ được thay bằng thang mạnh hơn. Vì bản trước chỉ có 1–10, mức 11–15 là **quy ước mở rộng sức mạnh** dùng để thiết kế cấp 1–5 mới, không phải năm cấu hình cũ đã tồn tại. Từ cấp 1, bot đã có tầm nhìn xa hơn, nhiều đường né hơn và sai số ngắm nhỏ hơn cấp 10 cũ. Cấp 5 vẫn là mặc định nhưng hiện khó hơn trước.

- **Cấp 1–5:** tương ứng mức sức mạnh mở rộng 11–15. Tất cả ngắm đón đầu đầy đủ, né đạn bằng nhiều chuỗi tiến/lùi/rẽ, cân nhắc HP và nhiều hướng bắn. Tầm nhìn 1,9–2,1 giây; 19–23 phương án cơ bản, có thể thêm một phương án tiếp tục kế hoạch.
- **Cấp 6:** thêm tìm điểm đi vòng vật cản và đường rút; kiểm tra lại nguy hiểm từ các đối thủ khi giữ điểm đến.
- **Cấp 7:** thêm giãn cách chủ động khi đối thủ gần và sắp bắn, dù bot vẫn đủ máu.
- **Cấp 8:** thêm chọn mô hình ngắm theo sai số đã quan sát khi đối thủ chạy cong; chỉ dùng thông tin hiện tại và lịch sử.
- **Cấp 9:** thêm tìm góc tiếp cận mới khi quá 6 giây không gây sát thương.
- **Cấp 10:** thêm xét ngắm thẳng/đón đầu của đối thủ sắp bắn ở cự ly gần và ưu tiên tránh tiếp xúc sát nòng. Tầm nhìn 2,4 giây; tối đa 38 phương án khi có điểm đến và kế hoạch cũ.

Mọi cấp phản ứng ở chu kỳ AI **0,1 giây**; cấp cao tăng độ khó bằng chất lượng quyết định, không ghi độ trễ thấp hơn nhịp game. Sai số ngắm giảm dần từ 0,005 xuống 0,0005 radian. Mọi xe giữ cùng luật HP, sát thương, tốc độ và nạp đạn. Xe người chơi vẫn dùng chiến thuật 3. Cấp cao hơn không bảo đảm thắng mọi trận.

Log mới ghi `cauHinh.phienBanBot = "bot-2"`, cấu hình chốt khi tạo trận và tóm tắt quyết định bot. Log cũ thiếu trường này thuộc thang trước; không gộp tỷ lệ thắng hai thang chỉ dựa vào cùng số cấp. Cách đọc log cũ vẫn hoạt động. Chi tiết cấu hình và kiểm tra nằm trong `CAP-BOT-MOI.md`.

Lập trình viên dùng `DauTruong.cauHinhCapBot(cap)` và `capBot` như trước; giá trị giao diện vẫn là 1–10. `soUngVien` là số phương án nền, `soUngVienToiDa` gồm đường đi tới điểm đích và tiếp tục kế hoạch khi có.

### AI chiến thuật 3: thực hiện kế hoạch và rút lui

- **Kế hoạch liên tục:** đưa phần chuỗi chưa thực hiện vào tập so sánh, giữ mốc bắt đầu và chỉ thay khi an toàn hơn hoặc điểm tốt hơn rõ rệt. Thưởng tiến bộ ở nhiều mốc gần, không chỉ ở cuối đường; phát hiện chạy lặp trong vùng nhỏ để đổi điểm đến.
- **Đi vòng phù hợp khi ít máu:** tìm nhiều vòng vị trí quanh mục tiêu ở bán kính 170/210/250, chấm mức lộ thiên và khoảng cách cùng với đường đi. Giữ cả các điểm trung gian của đường vòng; có thể chủ động đổi góc khi đấu tay đôi bế tắc, nhưng vẫn kiểm tra đạn thật và bo.
- **Rút theo hành lang:** tạo điểm rút có xét các đối thủ và bo; khi vừa mất máu, chỉ kết thúc trạng thái rút lui sau thời gian tối thiểu và mức an toàn ổn định. Ít máu tiếp tục tăng ưu tiên bảo toàn mạng.
- **Nguy cơ tức thời và log từng phát:** giải thời điểm tiếp xúc đầu tiên với đạn thật, thêm mức ga/rẽ khi nguy cấp. Ưu tiên giảm nguy cơ bị loại gần, giảm số đạn thật sắp chạm, trì hoãn nguy cơ không tránh được rồi so điểm. Log mỗi phát bắn ghi mô hình ngắm, điểm dự đoán, sai số khi tới mốc và kết quả đạn.

Số phương án phụ thuộc tình huống, thường 15–44; đường đi vẫn dự đoán 1,5 giây với bước 1/60. AI người chơi không đọc lệnh hay bộ nhớ riêng của bot. Bot và các chỉ số HP/tốc độ/sát thương không đổi. Log mới dùng `chien-thuat-3`, vẫn đọc được log cũ. Xem toàn bộ công thức, sơ đồ luồng và cách chuyển nền tảng trong `CHIEN-THUAT-TANK-HIEN-TAI.md`.

## Thay AI của xe bạn

Các tệp được tách theo nhiệm vụ:

- `index.html`: cấu trúc giao diện.
- `style.css`: màu sắc, bố cục và giao diện trên màn hình nhỏ.
- `vat-ly.js`: tạo trận, chuyển động, đạn, va chạm và điều kiện kết thúc.
- `ai.js`: AI xe bạn, AI bot và điểm đăng ký chương trình thay thế.
- `game.js`: nút điều khiển, vòng lặp hiển thị, vẽ đấu trường và bảng trạng thái.
- `nhip-nen.js`: luồng phát nhịp nền để tiếp tục trận và tự đấu lại khi chuyển tab.
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
node tests/kiem-tra-chien-thuat.cjs
node tests/kiem-tra-nhat-ky.cjs
node tests/kiem-tra-tu-luu.cjs
```

Không cần cài thêm gói thư viện. Bài thứ nhất kiểm tra vật lý, lịch quyết định AI, đường dự đoán, ngắm đón đầu, tạo trận ngẫu nhiên, các đợt đổi chiến thuật bot và các trận nhiều xe. Hạt giống cố định chỉ dùng trong bài kiểm tra để tái hiện lỗi. Bài thứ hai thực thi mã giao diện bằng các đối tượng DOM/Canvas giả lập để kiểm tra nút, thiết lập cấp độ, tốc độ, phím tắt, tạm dừng, toàn màn hình, kích thước sân theo cửa sổ và xác nhận Đặt lại/Đấu lại tạo trận mới. Bài thứ ba kiểm tra cấu hình và các hành vi chiến đấu theo cấp bot. Bài thứ tư kiểm tra bản đồ ngẫu nhiên qua nhiều hạt giống, khoảng trống xuất phát, lối đi nối thông và bo cuối. Bài kiểm tra giả lập không xác minh bố cục hoặc cách hiển thị trong trình duyệt thật.


## Lưu và đọc log để cải thiện chiến thuật

Trong bảng **Nhật ký trận đấu**:

- **Phân tích trận**: đọc kết quả và các lần xe bạn nhận sát thương, người bắn, vị trí, lệnh di chuyển và đánh giá nguy hiểm trước va chạm. Xem được khi đang đấu, tạm dừng, bị loại hoặc kết thúc.
- **Lưu log**: tải tệp JSON chứa báo cáo tiếng Việt và dữ liệu chi tiết tại thời điểm bấm. Lưu trước khi Đặt lại, Đấu lại hoặc đóng trang; khi mở index.html trực tiếp, game không tự lưu ra ổ đĩa. Chế độ khởi chạy tự lưu được hướng dẫn bên dưới. Tệp lưu giữa trận là dữ liệu một phần.
- **Đọc log**: chọn tệp JSON đã lưu (tối đa 50 MB), game dựng lại báo cáo mà không thay trận đang chơi. Có thể đọc trường `baoCao` bằng trình soạn thảo văn bản hoặc gửi cả tệp cho AI phân tích tiếp.

Log giữ toàn bộ sự kiện, ảnh trạng thái mỗi 0,25 giây, vị trí/vận tốc xe và đạn, lệnh AI, điểm ứng viên, đường được chọn, mục tiêu, điểm ngắm và khoảng dự đoán. Mỗi lần trúng đạn có bản ghi riêng trước khi trừ HP; sát thương bo liên tiếp được gộp theo giây. Dữ liệu không gửi đi đâu. Trận càng dài, tệp càng lớn.

Báo cáo nêu nguyên nhân bị loại trực tiếp (đạn hoặc bo) dựa trên mô phỏng. Gợi ý tăng ưu tiên né đạn, tránh đứng yên hay vào bo sớm là suy luận cần thử lại, không chứng minh rằng đổi một trọng số chắc chắn giúp thắng. AI thay thế không cung cấp `boNhoAI.phanTich` vẫn ghi được lệnh và sát thương nhưng sẽ thiếu giải thích nội bộ.

Để so sánh chiến thuật, giữ log và mã nguồn AI tương ứng, thử thay một yếu tố rồi đấu nhiều trận cùng cấu hình. Log là dữ liệu phân tích lấy mẫu, chưa có chức năng phát lại hoạt ảnh chính xác từng bước. Mã trận không đủ để tái tạo một AI tùy chỉnh.

Mô-đun `nhat-ky.js` xử lý ghi dữ liệu và tạo báo cáo. Chạy kiểm tra bằng `node tests/kiem-tra-nhat-ky.cjs`.


## Ba điều kiện kết thúc trận

1. **Thắng:** xe của bạn còn sống và toàn bộ đối thủ đã bị loại.
2. **Thua:** xe của bạn bị loại, kể cả khi các bot khác vẫn còn sống. Nếu tất cả xe bị loại trong cùng bước mô phỏng, bạn vẫn nhận kết quả thua.
3. **Hòa:** sau đúng **300 giây thời gian mô phỏng**, bạn và ít nhất một đối thủ còn sống. Thời gian tạm dừng không được tính; tốc độ xem 1× / 2× / 5× / 8× vẫn dùng cùng đồng hồ trận.

Nếu thắng hoặc thua trong bước chạm mốc 300 giây, kết quả thắng/thua được ưu tiên hơn hòa. Sau khi kết thúc, xe, đạn và đồng hồ ngừng cập nhật; bạn vẫn có thể xem phân tích, lưu log hoặc Đấu lại. Log ghi `ketQua` (`thang`, `thua`, `hoa`) và `lyDoKetThuc`. Tệp log cũ vẫn đọc được. Quy tắc này không thay đổi thuật toán AI.


## Vị trí chướng ngại vật

Mỗi trận mới tạo lại địa hình. Không còn bắt buộc có chướng ngại ở chính giữa sân: khoảng một nửa số trận để trống khu giữa, các trận còn lại đặt một vật cản nhỏ ở vị trí ngẫu nhiên có thể lệch tâm. Các vật cản còn lại phân bố ngẫu nhiên ở nhiều phía bản đồ. Vẫn giữ khoảng cách với điểm xuất phát, lối vòng giữa các vật cản và các hành lang di chuyển/bắn trong bo cuối. Bắn hoặc tạm dừng không đổi map.


## Tự lưu vào D:\Projects\tank-battle\LogTank

1. Máy cần có **Python 3**. Không cần cài thư viện thêm.
2. Nhấp đúp **MO-GAME-TU-LUU-LOG.cmd** trong thư mục game. Game tự mở trên trình duyệt. Giữ cửa sổ khởi chạy trong lúc chơi.
3. Trong Nhật ký trận đấu, kiểm tra dòng **Tự lưu khi kết thúc trận → D:\Projects\tank-battle\LogTank**.

Khi thắng, thua hoặc hòa, log JSON tự được ghi vào thư mục trên; chương trình tạo thư mục nếu chưa có. Nếu Đặt lại khi đang chơi, phần trận đã diễn ra cũng được gửi lưu. Mỗi tệp có tên riêng để không ghi đè các trận trước. Dòng **Đã tự lưu** cùng đường dẫn đầy đủ chỉ hiện sau khi ghi thành công. Nếu ghi thất bại, giao diện báo lỗi; giữ nguyên trận và dùng **Lưu log** để tải thủ công.

**F5 trên tab được tệp khởi chạy mở ra** vẫn dùng chức năng tự lưu. Nếu mở `index.html` trực tiếp bằng địa chỉ `file:///`, game vẫn chơi được nhưng không thể tự ghi vào đường dẫn cố định do giới hạn trình duyệt. Việc đóng tab ngay khi đang lưu có thể làm gián đoạn yêu cầu; chờ dòng **Đã tự lưu** trước khi đóng. Chức năng này không tự lưu khi tắt máy hoặc đóng tab giữa trận.

Chương trình chạy trên máy bạn, chỉ lắng nghe địa chỉ `127.0.0.1`, không gửi log ra Internet. Đóng cửa sổ khởi chạy hoặc nhấn Ctrl+C để dừng. Ổ D: phải tồn tại và tài khoản của bạn phải có quyền ghi.


### Lỗi trình khởi chạy trỏ tới Python đã bị xóa

Nếu gặp `Unable to create process ... pythoncore-3.14-64`, thay tệp `MO-GAME-TU-LUU-LOG.cmd` bằng bản mới. Tệp mới thử chạy trực tiếp các bản Python đã cài (trong PATH và các thư mục cài đặt thông dụng), chỉ dùng một bản sau khi kiểm tra chạy thành công. Nếu cần dùng `py`, chương trình thử từng phiên bản thay vì chỉ dùng mặc định `py -3`. Không cần gỡ bản Python đang dùng được. Có thể chạy `MO-GAME-TU-LUU-LOG.cmd --kiem-tra` để xem Python được chọn mà chưa mở game.


## Tiếp tục trận khi chuyển tab hoặc cửa sổ

Sau khi nhấn **Bắt đầu**, bạn có thể chuyển sang tab hay cửa sổ khác: game không tự tạm dừng. Khi chạy bằng `MO-GAME-TU-LUU-LOG.cmd`, luồng nền `nhip-nen.js` phát nhịp độc lập với vòng vẽ và hẹn giờ của tab, giúp tiếp tục mô phỏng và tự đấu lại ở nền. Nếu luồng nền không được hỗ trợ hoặc bị chặn (chẳng hạn khi mở tệp trực tiếp), game dùng hẹn giờ dự phòng. Bước vật lý vẫn giữ 1/60 giây; các nguồn nhịp dùng chung đồng hồ nên không cộng thời gian hai lần.

Nút **Tạm dừng** vẫn dừng trận theo yêu cầu của bạn. Thắng, thua hoặc đủ 5 phút vẫn kết thúc và gọi tự lưu log nếu chạy bằng `MO-GAME-TU-LUU-LOG.cmd`. Hãy giữ tab và chương trình khởi chạy mở. Trình duyệt đóng băng/hủy tab để tiết kiệm bộ nhớ hoặc máy vào chế độ ngủ vẫn có thể ngừng thực thi; game xử lý tiếp thời gian còn thiếu khi được chạy lại.


## Tự động đấu lại sau 5 giây

Đánh dấu **Tự động đấu lại (5s)** ở hàng điều khiển phía trên bản đồ. Mặc định tùy chọn này tắt. Sau mỗi trận thắng, thua hoặc hòa, bảng kết quả đếm ngược 5 giây thực rồi tự tạo và bắt đầu trận mới. Tốc độ mô phỏng 1× / 2× / 5× / 8× không đổi độ dài đếm ngược. Tên, màu xe, số bot, cấp bot, HP, tốc độ và checkbox được giữ qua các trận; bản đồ và diễn biến tạo mới.

Bỏ chọn checkbox để hủy đếm ngược. Nếu bật lại khi đang xem kết quả, bắt đầu một lượt đếm ngược 5 giây mới. Nhấn Đặt lại hoặc Đấu lại bằng tay cũng hủy lịch cũ. Tính năng vẫn hoạt động khi tab chạy nền, theo nhịp xử lý mà trình duyệt cho phép.

Nếu trình duyệt trì hoãn nhịp nền, game tính hạn đấu lại từ thời điểm trận kết thúc trong phần mô phỏng đã xử lý bù. Khi quá hạn, trận mới bắt đầu ngay khi game được chạy tiếp và log đã lưu xong; không đếm thêm 5 giây từ lúc quay lại tab. Sau khi cập nhật bản sửa này, đóng cửa sổ khởi chạy cũ và mở lại `MO-GAME-TU-LUU-LOG.cmd`, rồi nhấn **Ctrl + F5** để nạp mã mới cùng tệp luồng nền.

Khi chạy bằng chương trình tự lưu log, game chờ lưu thành công trước khi tự đấu lại. Nếu quá 5 giây mà vẫn đang ghi, bảng kết quả báo đang chờ. Nếu lưu thất bại, game giữ kết quả và báo lỗi để bạn lưu thủ công hoặc chủ động Đấu lại. Mở index.html trực tiếp vẫn tự đấu lại được nhưng không tự lưu vào ổ D:; muốn thu thập log nhiều trận, hãy dùng MO-GAME-TU-LUU-LOG.cmd.
