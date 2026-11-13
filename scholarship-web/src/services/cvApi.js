export async function uploadAndExtractCV(file) {
  if (!file) {
    throw new Error("Chưa chọn file CV.");
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
  // Gửi cả 2 key để tương thích linh hoạt với mọi router ('file' và 'cv')
  formData.append('file', file);
  formData.append('cv', file);

  try {
    const response = await fetch('/api/cv/extract', {
      method: 'POST',
      body: formData, // Tuyệt đối không để header 'Content-Type': 'multipart/form-data'
    });

    const result = await response.json().catch(() => ({}));
    if (!response.ok || result.success === false) {
      const errorMsg = result.error || result.detail || `Lỗi tải file (${response.status})`;
      throw new Error(errorMsg);
    }

    return result.data || result;
  } catch (error) {
    console.error("Lỗi trích xuất CV:", error);
    throw error;
  }
}
