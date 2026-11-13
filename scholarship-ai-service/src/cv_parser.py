import fitz  # PyMuPDF
import re

def extract_clean_text_from_pdf(file_bytes: bytes) -> str:
    extracted_text = []
    try:
        with fitz.open(stream=file_bytes, filetype="pdf") as doc:
            if len(doc) == 0:
                raise ValueError("File PDF rỗng, không có trang nào.")
            for page_num in range(len(doc)):
                page = doc[page_num]
                blocks = page.get_text("blocks")
                # Lọc các block là văn bản (block_type == 0)
                text_blocks = [b for b in blocks if b[6] == 0]
                # Sắp xếp theo toạ độ dòng y0 trước, cột x0 sau để không bị trộn lẫn 2 cột
                text_blocks.sort(key=lambda b: (round(b[1] / 10) * 10, b[0]))
                for b in text_blocks:
                    content = b[4].strip()
                    if content:
                        extracted_text.append(content)
    except Exception as e:
        raise ValueError(f"Không thể đọc file PDF: {str(e)}")

    full_text = "\n\n".join(extracted_text)
    # Loại bỏ ký tự điều khiển không in được và thu gọn khoảng trắng thừa
    # Giữ nguyên toàn bộ ký tự tiếng Việt Unicode (C0: 00-1f trừ \t \n \r; C1: 7f-9f)
    full_text = re.sub(r'[\x00-\x08\x0b-\x0c\x0e-\x1f\x7f-\x9f]', '', full_text)
    full_text = re.sub(r'[ \t]+', ' ', full_text)
    return full_text

