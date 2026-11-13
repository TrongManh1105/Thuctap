export async function uploadAndExtractCV(file) {
  if (!file) {
    throw new Error("Vui lòng chọn file CV.");
  }
  const validExtensions = ['.pdf', '.docx'];
  const fileName = file.name.toLowerCase();
  const isValid = validExtensions.some(ext => fileName.endsWith(ext));
  if (!isValid) {
    throw new Error("Định dạng file không hỗ trợ. Vui lòng tải lên file .pdf hoặc .docx");
  }
  if (file.size > 10 * 1024 * 1024) {
    throw new Error("Dung lượng file vượt quá giới hạn 10MB.");
  }

  const formData = new FormData();
  formData.append('file', file); // Lưu ý: key 'file' phải khớp với tham số Backend

  try {
    const response = await fetch('/api/cv/extract', {
      method: 'POST',
      body: formData, // TUYỆT ĐỐI KHÔNG thêm header 'Content-Type': 'multipart/form-data' ở đây
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.detail || err.message || `Lỗi tải file (${response.status})`);
    }

    return await response.json();
  } catch (error) {
    console.error("Lỗi trích xuất CV:", error);
    throw error;
  }
}

