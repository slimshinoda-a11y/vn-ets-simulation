# Nền Tảng Mô Phỏng Hệ Thống Giao Dịch Hạn Ngạch Phát Thải Việt Nam (VN ETS)
## Vietnam Emission Trading System & Carbon Credit Simulation Platform

Nền tảng mô phỏng thị trường các-bon trực tuyến đa người chơi (Full-stack, Real-time Multiplayer) được thiết kế và hiệu chuẩn bám sát **Nghị định 06/2022/NĐ-CP** và **Quyết định 01/2022/QĐ-TTg** của Thủ tướng Chính phủ, kết hợp các thông lệ quốc tế tốt nhất từ **CarbonSim**.

Hệ thống cho phép các nhà hoạch định chính sách, doanh nghiệp phát thải trọng điểm, chuyên gia và học viên tham gia trải nghiệm thực tế các quyết định tuân thủ hạn ngạch, đầu tư khử các-bon công nghệ và mua bán tín chỉ trên thị trường giao dịch tập trung và thỏa thuận song phương (OTC).

---

## 🌟 Các Tính Năng Nổi Bật

### 1. Trao Đổi Hạn Ngạch & Tín Chỉ (Trading Floor)
- **Sổ lệnh thị trường trực tiếp (Order Book)**: Khớp lệnh thời gian thực theo nguyên tắc ưu tiên giá và thời gian. Giao diện thể hiện rõ ràng **Lệnh chào mua (Bid)** và **Lệnh chào bán (Ask)**.
- **Thị trường kép (Dual Instruments)**:
  - **Hạn ngạch phát thải**: Giá tham chiếu ~$5.00/tCO2e (tương đương ~125.000 ₫/t).
  - **Tín chỉ các-bon bù trừ (Carbon Credits / VCM)**: Giá tham chiếu ~$3.00/tCO2e, áp dụng theo hạn mức luật định.
- **Giao dịch Thỏa thuận Trực tiếp giữa Doanh nghiệp (OTC)**:
  - Cho phép 2 doanh nghiệp gửi đề xuất mua/bán trực tiếp cho nhau.
  - **Bảo mật số dư**: Không hiển thị số tiền hay hạn ngạch của đối tác trong thời gian thực.
  - **Quy trình xác nhận 2 bước**: Giao dịch chỉ được thực thi sau khi bên nhận xác nhận đồng ý và hệ thống tự động kiểm tra đối soát đầy đủ tiền mặt và hàng khả dụng.

### 2. Cơ Chế Tạo Lập Thị Trường & AI Bots Đa Dạng Hóa Chiến Lược
- **Mục tiêu tuân thủ toàn thị trường ~95%/kỳ**: AI Bots tự động điều tiết thanh khoản sổ lệnh và các danh mục tuân thủ để thị trường đạt tỷ lệ tuân thủ mục tiêu một cách ổn định, tự nhiên.
- **4 Chiến lược tuân thủ độc lập của AI Bots**:
  1. 🌿 **Tiên phong Giảm phát thải nội bộ (Abatement-Driven)**: Ưu tiên đầu tư các giải pháp công nghệ khử các-bon (WHR, đồng đốt sinh khối, pin lưu trữ BESS) theo đường cong chi phí giảm phát thải biên (MAC), giảm trực tiếp lượng phát thải thực tế và bán hạn ngạch dôi dư ra thị trường.
  2. 🌲 **Tối ưu Tín chỉ Các-bon bù trừ (Offset-Driven)**: Tận dụng mua tín chỉ giá rẻ trên sàn bù trừ tới kịch trần 30% nghĩa vụ theo quy định VN ETS, sau đó mới dùng hạn ngạch.
  3. 🏛️ **Giao dịch Hạn ngạch Thị trường (Allowance-Driven)**: Tập trung 100% vào việc mua bán hạn ngạch trên sàn tập trung, không đầu tư công nghệ hay dùng tín chỉ.
  4. ⚖️ **Chiến lược Kết hợp Đa phương thức (Hybrid Balanced)**: Tối ưu hóa danh mục chi phí biên (đầu tư 1 dự án công nghệ chi phí thấp, mua 15–20% tín chỉ, và phần còn lại mua hạn ngạch).
- **Tùy chỉnh định hướng giá của Bots**:
  - 📈 **Đẩy giá tăng (Khan hiếm / Bullish)**: Bên bán nâng giá chào, bên mua chủ động đặt giá cao gom hàng.
  - ⚖️ **Cân bằng (Neutral - Mặc định)**: Thanh khoản ổn định quanh mức tham chiếu $5.00.
  - 📉 **Đẩy giá giảm (Dư thừa / Bearish)**: Bên bán xả hàng giá rẻ, bên mua chỉ chờ giá chiết khấu.
- **Mô phỏng áp lực khan hiếm cuối kỳ (Late-Period Scarcity Squeeze)**: Khi thời gian giao dịch bước vào nửa cuối, các bot thiếu hụt chạy đua gom vét hạn ngạch trước giờ G (tránh mức phạt), đồng thời bên dư thừa nâng mạnh giá chào bán, tạo hiệu ứng giá bùng nổ chân thực sát thực tế.

### 3. Bàn Điều Hành Cơ Quan Quản Lý (Admin Console)
- **Tùy chỉnh thời lượng phiên linh hoạt**: Mặc định **10 phút** (600 giây), kèm các nút chọn nhanh 15, 20, 30, 45, 60 phút, tối đa lên tới 3.600 giây.
- **Hệ số lãi phạt khi vay hạn ngạch (Borrowing Ratio)**: Mặc định **1.0** (tỷ lệ 1:1, không phát sinh phụ phí lãi phạt khi hoàn trả ở kỳ sau).
- **Cơ sở dữ liệu 110 nhà máy phát thải trọng điểm**: Bao gồm đầy đủ 3 ngành then chốt của Việt Nam (Nhiệt điện, Xi măng, Thép) với các phân tầng công nghệ Tiên tiến (Surplus), Tiêu chuẩn (Parity) và Lạc hậu (Deficit).
- **Kích hoạt các Cú sốc Chính sách & Thị trường (Market Shocks)**:
  - ⚡ *Bùng nổ tăng trưởng kinh tế (+15% phát thải)*
  - 🌿 *Gói trợ cấp Capex công nghệ xanh 25%*
  - 🌲 *Cung ứng 100.000 tín chỉ các-bon rừng giá rẻ*
  - ⚖️ *Siết chặt mức phạt tuân thủ lên $18.00/t*

### 4. Giao Diện Tinh Tế & Đa Ngôn Ngữ
- **Chuyển đổi giao diện Sáng / Tối**:
  - 🌙 **Giao diện Tối (Obsidian Neon)**: Hiện đại, trực quan cho các phòng giao dịch.
  - ☀️ **Giao diện Sáng (Pastel Tone)**: Màu sắc pastel dịu mắt, đồng nhất 100% không loá hay lẫn mảng tối.
- **Song ngữ 🇻🇳 Tiếng Việt & 🇬🇧 English**: Chuẩn hóa thuật ngữ chuyên ngành kinh tế môi trường và thị trường các-bon.
- **Đa tiền tệ**: Chuyển đổi tức thì giữa Đô la Mỹ ($ USD) và Việt Nam Đồng (₫, tỷ VNĐ).

---

## 🏛️ Thông Số Chuẩn Thí Điểm VN ETS (Nghị định 06/2022/NĐ-CP)

| Tham Số Chính Sách | Giá Trị Mặc Định | Cơ Sở Pháp Lý / Ý Nghĩa Kinh Tế |
| :--- | :--- | :--- |
| **Kỳ Tuân Thủ** | **2 Năm / Kỳ (2025–2026, 2027–2028...)** | Chu kỳ tuân thủ 2 năm theo lộ trình thí điểm thị trường các-bon Việt Nam. |
| **Phân Bổ Ban Đầu** | **100% Miễn Phí** | Giai đoạn thí điểm ban đầu cấp phát hạn ngạch miễn phí dựa trên suất phát thải/hạn mức cơ sở. |
| **Hạn Mức Tín Chỉ Bù Trừ** | **Tối Đa 30% Phát Thải Thực Tế** | Nghị định 06 cho phép bù trừ tối đa 30% nghĩa vụ bằng tín chỉ các-bon trong nước hợp lệ. |
| **Lưu Giữ (Banking)** | **100% Cho Phép** | Được bảo lưu nguyên vẹn hạn ngạch dôi dư sang các kỳ tuân thủ tiếp theo. |
| **Vay Hạn Ngạch (Borrowing)** | **Tối đa 15% hạn ngạch kỳ sau** | Hệ số lãi phạt 1.0 (hoàn trả đúng 1:1, không tính lãi suất). |
| **Mức Phạt Vi Phạm** | **$12.00 / tCO2e** | Mức phạt tài chính đối với mỗi tấn CO2e thiếu hụt khi kết thúc kỳ tuân thủ. |
| **Thời Lượng Phiên Giao Dịch**| **10 Phút / Kỳ** | Thời gian chuẩn để người chơi phân tích, đàm phán và giao dịch trước khi đóng sổ nộp hạn ngạch. |
| **Mật Khẩu Quản Trị (Admin)**| `admin123` | Mã khóa bảo mật dành riêng cho Bàn Điều hành Cơ quan Quản lý / Giảng viên. |

---

## 🚀 Hướng Dẫn Cài Đặt & Khởi Chạy

### 1. Chạy Cục Bộ (Local Machine)

#### Yêu Cầu:
- Đã cài đặt **Node.js (phiên bản 20 hoặc mới hơn)**.

#### Các bước khởi chạy:
```bash
# 1. Cài đặt toàn bộ thư viện cho Server và Client
npm run install:all

# 2. Biên dịch giao diện Client (React + Vite + Tailwind CSS)
npm run build:client

# 3. Khởi động máy chủ ETS
npm start
```
Mở trình duyệt và truy cập: **`http://localhost:3001`**

---

### 2. Triển Khai Chạy 24/7 Miễn Phí Trên Cloud (Render.com)

Dự án đã tích hợp sẵn file cấu hình tự động `render.yaml` (Infrastructure as Code).

1. Đăng ký/Đăng nhập tại **[render.com](https://render.com)** bằng tài khoản GitHub.
2. Bấm **New +** $\rightarrow$ Chọn **Blueprint**.
3. Chọn kho lưu trữ **`vn-ets-simulation`** $\rightarrow$ Bấm **Apply**.
4. Render sẽ tự động dựng dịch vụ tại cụm máy chủ **Singapore** (tốc độ cao nhất cho Việt Nam), cấp chứng chỉ SSL HTTPS vĩnh viễn và duy trì hoạt động 24/7.

---

## 🛠️ Công Nghệ Sử Dụng

- **Backend**: Node.js, Express 5, Socket.IO (Khớp lệnh In-Memory siêu tốc, đồng bộ trạng thái thời gian thực).
- **Frontend**: React 19, Tailwind CSS v4, Vite 8, Lucide Icons.
- **Deployment**: Render Cloud Blueprint (`render.yaml`), Docker/Node runtime.
- **Tiêu chuẩn dữ liệu**: Hỗ trợ xuất nhập khẩu hạn ngạch và cấu hình qua tệp Excel (`.xlsx`).

---

## 📄 Bản Quyền & Giấy Phép
Dự án được phát hành theo giấy phép **MIT License**. Phục vụ mục đích đào tạo, nghiên cứu chính sách và nâng cao năng lực triển khai thị trường các-bon tại Việt Nam.
