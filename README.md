# Nền Tảng Mô Phỏng Hệ Thống Giao Dịch Hạn Ngạch Phát Thải Việt Nam (VN ETS)
## Vietnam Emission Trading System & Carbon Credit Simulation Platform

Nền tảng mô phỏng thị trường các-bon trực tuyến đa người chơi (Full-stack, Real-time Multiplayer) được thiết kế và hiệu chuẩn bám sát **Nghị định 06/2022/NĐ-CP** và **Nghị định 119/2025/NĐ-CP**.

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
  - **Quy trình xác nhận 2 bước**: Giao dịch chỉ được thực thi sau khi bên nhận xác nhận đồng ý và hệ thống tự động kiểm tra đối soát đầy đủ tiền mặt và hàng khả dụng.

### 2. Cơ Chế Tạo Lập Thị Trường & AI Bots Đa Dạng Hóa Chiến Lược
- **Mục tiêu tuân thủ toàn thị trường: AI Bots tự động điều tiết thanh khoản sổ lệnh và các danh mục tuân thủ để thị trường đạt tỷ lệ tuân thủ mục tiêu một cách ổn định, tự nhiên.
- **4 Chiến lược tuân thủ độc lập của AI Bots**:
  1. 🌿 **Tiên phong Giảm phát thải nội bộ (Abatement-Driven)**
  2. 🌲 **Tối ưu Tín chỉ Các-bon bù trừ (Offset-Driven)**
  3. 🏛️ **Giao dịch Hạn ngạch Thị trường (Allowance-Driven)**
  4. ⚖️ **Chiến lược Kết hợp Đa phương thức (Hybrid Balanced)**:

### 3. Bàn Điều Hành Cơ Quan Quản Lý (Admin Console)
- **Tùy chỉnh thời lượng phiên linh hoạt**: Mặc định **10 phút** (600 giây), kèm các nút chọn nhanh 15, 20, 30, 45, 60 phút, tối đa lên tới 3.600 giây.
- **Hệ số lãi phạt khi vay hạn ngạch (Borrowing Ratio)**: Mặc định **1.0** (tỷ lệ 1:1, không phát sinh phụ phí lãi phạt khi hoàn trả ở kỳ sau).
- **Cơ sở dữ liệu 110 nhà máy phát thải trọng điểm**: Bao gồm đầy đủ 3 ngành then chốt của Việt Nam (Nhiệt điện, Xi măng, Thép) với các phân tầng công nghệ Tiên tiến (Surplus), Tiêu chuẩn (Parity) và Lạc hậu (Deficit).

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

---

## 📄 Bản Quyền & Giấy Phép
Dự án được phát hành theo giấy phép **MIT License**. Phục vụ mục đích đào tạo, nghiên cứu chính sách và nâng cao năng lực triển khai thị trường các-bon tại Việt Nam.
