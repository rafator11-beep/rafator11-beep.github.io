$filePath = "c:\Users\Rafa\Desktop\App Final\app\src\data\gameContent.ts"
$content = [System.IO.File]::ReadAllText($filePath, [System.Text.Encoding]::UTF8)
# Remove U+FFFD Replacement Character
$cleanContent = $content -replace "\uFFFD", ""
[System.IO.File]::WriteAllText($filePath, $cleanContent, [System.Text.Encoding]::UTF8)
Write-Host "Cleanup complete."
