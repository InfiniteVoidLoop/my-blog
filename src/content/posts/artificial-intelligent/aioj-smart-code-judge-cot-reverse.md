---
author: DangVoHongPhuc
pubDatetime: 2026-11-06T14:15:00+07:00
title: "AIOJ: Chấm Bài Lập Trình Tự Động Nhanh và Thông Minh Hơn Nhờ AI"
slug: aioj-smart-code-judge-cot-reverse
featured: true
draft: false
tags:
  - aioj
  - code-judge
  - ai
  - llm
description: "Cách chúng tôi xây dựng AIOJ — hệ thống AI chấm code siêu nhẹ, an toàn và trả kết quả tức thì mà không cần chạy server mạo hiểm hay tốn tiền API đắt đỏ."
series: "Artificial Intelligent"
seriesOrder: 6
---

Chấm bài tập lập trình tự động cho học sinh, sinh viên chưa bao giờ là bài toán dễ dàng. Cho chạy trực tiếp code của sinh viên trên máy chủ thì tiềm ẩn nguy cơ bị hack, còn nhờ các mô hình AI khổng lồ như GPT-4 chấm thì lại quá chậm và tốn kém. Trong dự án này, chúng tôi phát triển **AIOJ**, một hệ thống AI nhỏ gọn có thể đọc hiểu code, bắt đúng bệnh và trả kết quả chấm ngay lập tức trên máy tính thông thường.

![Kiến trúc AIOJ](/posts/artificial-intelligent/aioj-smart-code-judge-cot-reverse/index.png)

## Table of contents

## Bối cảnh & Đặt vấn đề (Introduction)

Trong giáo dục tin học hiện đại và các nền tảng lập trình thi đấu trực tuyến (như LeetCode, Codeforces), việc chấm bài tự động đóng vai trò sống còn. Khi số lượng sinh viên học lập trình ngày càng đông, việc giảng viên ngồi chấm thủ công từng bài là bất khả thi. Các hệ thống bắt buộc phải có khả năng xử lý hàng chục nghìn bài nộp một cách nhanh chóng, công bằng và có phản hồi chi tiết.

Tuy nhiên, các giải pháp hiện tại đều đang đứng trước ngõ cụt:

### 1. Cách truyền thống: Chạy thử code trên máy chủ (Sandbox)
Hệ thống ném code của người học vào một môi trường cách ly (sandbox) rồi chạy thử với danh sách câu hỏi kiểm tra (test cases):
- **Dễ chấm sót lỗi:** Nếu người ra đề quên một vài trường hợp đặc biệt (như số 0, số âm, mảng rỗng), bài nộp dù sai logic nghiêm trọng vẫn có thể "ăn may" vượt qua hết test và được 100 điểm.
- **Rủi ro bảo mật:** Cho phép code lạ chạy trực tiếp trên máy chủ rất nguy hiểm. Kẻ xấu có thể nộp code chứa vòng lặp vô tận đốt cháy CPU, cố tình đọc trộm dữ liệu hệ thống, hoặc tìm cách hack máy chủ.

### 2. Cách dùng AI lớn trên đám mây (như GPT-4, Claude)
Gần đây, các mô hình ngôn ngữ lớn (LLM) mở ra một hướng đi mới: **Đọc hiểu code tĩnh** mà không cần chạy file thực thi, từ đó loại bỏ hoàn toàn nguy cơ bảo mật. Nhưng cách này cũng vấp phải rào cản lớn:
- **Quá tốn tiền:** Mỗi lần sinh viên nộp bài lại phải trả phí API cho OpenAI hay Google. Với hàng chục nghìn lượt nộp mỗi kỳ thi, chi phí sẽ trở thành gánh nặng khổng lồ.
- **Phản hồi quá chậm:** Mô hình AI lớn mất từ 5 đến 15 giây để "suy nghĩ" và viết cả đoạn văn dài trước khi đưa ra điểm số. Khi cả trăm sinh viên cùng nộp bài một lúc vào cuối giờ, hệ thống sẽ bị treo cứng.
- **Hay đoán nhầm loại lỗi:** AI lớn thông thường rất hay nhầm lẫn lý do code thất bại — ví dụ không phân biệt rõ code bị chạy chậm (hết giờ TLE) hay do bị lỗi bộ nhớ (RE).

### 3. Đóng góp cốt lõi của nghiên cứu AIOJ
Để giải quyết bài toán trên, nghiên cứu này mang lại 3 đóng góp quan trọng:
1. **Chấm bài tĩnh toàn diện:** Biến việc chấm code thành bài toán vừa đoán kết quả vừa giải thích lý do, loại bỏ hoàn toàn việc phải chạy thử code thật lúc triển khai.
2. **Chưng cất tri thức sang AI nhỏ (Knowledge Distillation):** Lấy chuỗi tư duy từng bước (CoT) của mô hình lớn (DeepSeek) truyền cho mô hình nhỏ (Qwen 1.5B) bằng kỹ thuật LoRA siêu tiết kiệm phần cứng.
3. **Thực nghiệm chứng minh:** Mô hình 1.5B đạt độ chính xác tương đương các AI khổng lồ nhưng tốn cực ít bộ nhớ và phản hồi gần như tức thì.

---

## Điểm khác biệt của AIOJ là gì?

AIOJ sử dụng một mô hình AI rất nhỏ gọn (chỉ 1.5 tỷ tham số - 1.5B) được huấn luyện theo một mẹo đảo ngược suy luận rất thực tế gọi là **CoT-Reverse (Chốt kết quả trước, Giải thích sau)**.

### So sánh AI thông thường và AIOJ:

- **AI thông thường (Giải thích trước $\to$ Kết quả sau):**  
  AI bị ép phải viết ra một bài văn dài hàng trăm từ giải thích chi tiết rồi mới nói bài này Đúng hay Sai.  
  *Hậu quả:* Sinh viên phải ngồi chờ rất lâu mới biết mình đậu hay rớt.

- **AIOJ (Kết quả trước $\to$ Giải thích sau):**  
  AIOJ chốt ngay kết quả (Đúng/Sai/Hết giờ...) trong tích tắc, sau đó mới viết lời giải thích nếu sinh viên bấm xem chi tiết.

```
AI thông thường:  [Đọc code] ---> [Ngồi viết giải thích 500 từ...] ---> Kết quả: Sai! (Chờ rất lâu)
AIOJ:             [Đọc code] ---> Kết quả: Sai! (Tức thì) ---> [Giải thích lý do tại sao sai]
```

Sự thay đổi thứ tự này giúp học sinh biết điểm ngay lập tức mà không phải chờ đợi trong các kỳ thi căng thẳng.

---

## Bắt đúng 9 nhóm lỗi chi tiết

Thay vì chỉ thông báo chung chung là "Đậu" hay "Rớt", AIOJ phân loại chính xác nguyên nhân lỗi cho người học dựa trên bộ tiêu chí CodeJudge-Eval:

| Ký hiệu | Tên lỗi | Giải thích bằng từ ngữ đời thường |
| :---: | :--- | :--- |
| **A** | Accepted (AC) | Code đúng hoàn toàn, thuật toán tối ưu. |
| **B** | Compilation Error (CE) | Lỗi cú pháp, gõ sai chính tả khiến code không biên dịch được. |
| **C** | Wrong Answer (WA) | Code chạy suôn sẻ nhưng ra đáp án sai logic. |
| **D** | Time Limit Exceeded (TLE) | Code chạy đúng nhưng thuật toán quá chậm, hết thời gian cho phép. |
| **E - I** | Lỗi kết hợp (Mixed) | Bị nhiều lỗi cùng lúc (ví dụ vừa chạy chậm vừa ra kết quả sai). |

---

## Hiệu quả thực tế ấn tượng

Khi thử nghiệm trên các đề thi lập trình thi đấu thực tế:

1. **Vượt mặt cả mô hình lớn:** Mô hình 1.5B tí hon của AIOJ đạt điểm nhận diện lỗi khó (**F1-score 20.6%**), vượt trội hơn hẳn các mô hình mã nguồn mở to hơn gấp nhiều lần như **Llama-3.1-8B (7.6%)**, và áp sát cả các mô hình thương mại hàng đầu như **GPT-4o (13.6%)**.
2. **Không còn đoán mò:** Các AI nhỏ thông thường khi gặp code khó thường có xu hướng "đoán bừa là Đúng". AIOJ khắc phục hoàn toàn nhược điểm này và bắt chính xác các ca lỗi chồng chéo phức tạp.
3. **Chạy ngon lành trên máy tính thường:** Không cần đến các dàn máy chủ AI triệu đô, các trường học hoàn toàn có thể tự triển khai AIOJ trên máy tính cá nhân hoặc máy chủ nội bộ thông thường.

---

## Tóm lại 3 điểm cốt lõi

- **An toàn tuyệt đối:** Chấm bài bằng cách đọc logic tĩnh, không cần chạy code thật nên không lo virus hay hack máy chủ.
- **Tốc độ cực nhanh:** Trả điểm số cho sinh viên trong chớp mắt nhờ cơ chế chốt kết quả trước.
- **Tiết kiệm chi phí:** Mô hình 1.5B chạy mượt mà trên phần cứng bình dân, cắt giảm hoàn toàn hóa đơn thuê API đám mây.
