# Script tự động đẩy mã nguồn lên Hugging Face Space
param (
    [Parameter(Mandatory=$true)]
    [string]$HuggingFaceUsername,
    
    [Parameter(Mandatory=$true)]
    [string]$HuggingFaceToken
)

$SpaceName = "scholarship-ai-engine"
$RemoteUrl = "https://$($HuggingFaceUsername):$($HuggingFaceToken)@huggingface.co/spaces/$($HuggingFaceUsername)/$SpaceName"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "   BẮT ĐẦU ĐẨY MÃ NGUỒN LÊN HUGGING FACE SPACES          " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "Space: $SpaceName"
Write-Host "Username: $HuggingFaceUsername"

# Khởi tạo git nếu chưa có
if (-not (Test-Path ".git")) {
    git init
    git branch -M main
}

git config user.email "$HuggingFaceUsername@users.noreply.huggingface.co"
git config user.name "$HuggingFaceUsername"

git add .
git commit -m "feat: deploy BGE-M3 and Cross-Encoder engine to Hugging Face Spaces"

# Cấu hình remote
git remote remove space 2>$null
git remote add space $RemoteUrl

Write-Host "`nĐang đẩy code lên Hugging Face... Vui lòng đợi trong giây lát..." -ForegroundColor Yellow
git push space main --force

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n[✓] THÀNH CÔNG! Mã nguồn đã được tải lên Hugging Face Space!" -ForegroundColor Green
    Write-Host "Link kiểm tra Space của bạn:" -ForegroundColor Yellow
    Write-Host "https://huggingface.co/spaces/$HuggingFaceUsername/$SpaceName" -ForegroundColor Cyan
    Write-Host "URL API của AI Engine để kết nối sang Render:" -ForegroundColor Yellow
    Write-Host "https://$HuggingFaceUsername-$SpaceName.hf.space" -ForegroundColor Green
} else {
    Write-Host "`n[-] Đẩy code thất bại. Vui lòng kiểm tra lại Token hoặc tạo Space trước trên web." -ForegroundColor Red
}
