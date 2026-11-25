# Vietnam Emission Trading System (VN ETS) Simulation Platform
## Sàn Mô Phỏng Thị Trường Các-bon Việt Nam

A full-stack, real-time multiplayer simulation platform for an **Emission Trading System (ETS) / Cap-and-Trade**, aligned with **Vietnam's Decree 06/2022/ND-CP** and industry best practices from **CarbonSim**.

---

## 🌐 Quick Start

### 1. Launch the Server
```bash
npm start
```
Open **[http://localhost:3001](http://localhost:3001)** in your browser!

---

## 🇻🇳 New: Bilingual Support & Currency Options

1. **Language Switcher (Tiếng Việt 🇻🇳 / English 🇬🇧)**:
   - Click the language button in the top navigation bar to toggle between English and Vietnamese.
   - All modules (Facility Dashboard, Order Book, MAC Curve, Compliance Surrender, Market Board, Admin Console, and Glossary) are fully translated into Vietnamese terminology.
2. **Dual Currency Display ($ USD / ₫ VNĐ)**:
   - One-click toggle between US Dollars ($) and Vietnamese Đồng (₫, with compact billion-đồng display `tỷ ₫`).

---

## 📘 CarbonSim Specifications Enhancements

Based on the **CarbonSim Specs** document, the platform has been enhanced with:

### 1. Cố Vấn Chiến Lược Tuân Thủ Các-bon AI (AI Carbon Portfolio Advisor)
- Located on the Facility Dashboard.
- Algorithmic portfolio analysis tailored to the facility's liabilities, comparing:
  1. **In-House Abatement Strategy**: Identifies clean technologies that are cheaper than buying allowances.
  2. **Optimal Blended Strategy (Recommended)**: Fulfills the maximum allowable 30% offset limit using discounted domestic credits (CER), and only purchases remaining allowances on the spot exchange.
  3. **Pure Spot Market Strategy**: Baseline cost of purchasing 100% of compliance deficits at current market prices.

### 2. Cú Sốc Thị Trường & Chính Sách (Regulatory & Market Shocks)
The Admin / Regulator can inject unexpected economic and policy shocks into live trading rounds to test participant resilience:
- ⚡ **Bùng Nổ Tăng Trưởng GDP (Economic Boom)**: Production surges, baseline emissions jump +15% across all facilities, creating carbon scarcity.
- 🌿 **Gói Trợ Cấp Công Nghệ Xanh (Clean Tech Subsidy)**: State funds subsidize 25% Capex for all green technologies, lowering abatement unit costs.
- 🌲 **Nguồn Cung Tín Chỉ Rừng Ồ Ạt (Forestry Carbon Supply)**: 50,000 new certified domestic forest credits injected at a high discount ($14.00/t).
- ⚖️ **Siết Chặt Chế Tài & Phạt Nặng (Enforcement Crackdown)**: Penalty fine hiked to $90.00/t to drive decarbonization urgency.

### 3. Cẩm Nang Thuật Ngữ ETS (Interactive Glossary)
- Accessible anytime from the top bar.
- Explains key concepts in Vietnamese & English: Hạn ngạch (EUA), Tín chỉ bù trừ (CER), Hệ số hiệu chỉnh $K$, Chi phí giảm phát thải biên (MAC Curve), Lưu giữ (Banking), Vay mượn (Borrowing), và Biên độ giá (Floor & Ceiling).

### 4. Cảnh Báo Sắp Dừng Giao Dịch (Stop-Trade Warning)
- When fewer than 30 seconds remain in a trading round, an animated warning banner alerts all participants to finalize their market orders before the compliance settlement deadline.

---

## 🏛️ Vietnam ETS Parameters (Nghị định 06/2022/NĐ-CP)

| Tham Số | Thiết Lập Thí Điểm VN ETS | Ý Nghĩa / Quy Định Pháp Lý |
| :--- | :--- | :--- |
| **Kỳ Tuân Thủ** | **Chu kỳ 2 năm (2025–2026...)** | Kỳ 1: 2025–2026, Kỳ 2: 2027–2028, Kỳ 3: 2029–2030. |
| **Phân Bổ Hạn Ngạch** | **100% Miễn Phí** | 100% hạn ngạch được phân bổ miễn phí trong giai đoạn thí điểm ban đầu. |
| **Đấu Giá Sơ Cấp** | **0% (Không Đấu Giá)** | Chưa áp dụng đấu giá hạn ngạch sơ cấp trong giai đoạn thí điểm. |
| **Hạn Mức Tín Chỉ Bù Trừ** | **Tối Đa 30%** | Nghị định 06 cho phép bù trừ tối đa 30% nghĩa vụ bằng tín chỉ các-bon trong nước. |
| **Hệ Số Hiệu Chỉnh ($K$)** | **Tăng Trần +4.0%/Kỳ** | Thay thế mức giảm tuyến tính; hạn mức trần tăng dần để đồng hành cùng tăng trưởng kinh tế & PDP8. |
| **Lưu Giữ (Banking)** | **100% Cho Phép** | Được bảo lưu hạn ngạch dôi dư sang các kỳ tuân thủ 2 năm tiếp theo. |
| **Mức Phạt Thiếu Hụt** | **$60.00 / tCO2e** | Phạt hành chính đối với lượng thiếu hụt phát thải tại thời điểm quyết toán. |
| **Admin Passkey** | `admin123` | Mật khẩu truy cập bàn điều hành chính sách của Cơ quan Quản lý. |
