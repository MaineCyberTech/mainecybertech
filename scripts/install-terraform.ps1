# Install Terraform to the project directory
$tempDir = "$env:TEMP\terraform-install"
New-Item -ItemType Directory -Force -Path $tempDir | Out-Null

$zipUrl = "https://releases.hashicorp.com/terraform/1.9.8/terraform_1.9.8_windows_amd64.zip"
$zipPath = "$tempDir\terraform.zip"

Write-Host "Downloading Terraform..."
Invoke-WebRequest -Uri $zipUrl -OutFile $zipPath

Write-Host "Extracting..."
Expand-Archive -Path $zipPath -DestinationPath $tempDir -Force

$destPath = "C:\temp\mainecybertech-portal\terraform.exe"
Copy-Item "$tempDir\terraform.exe" -Destination $destPath -Force

Write-Host "Terraform installed to $destPath"

# Clean up
Remove-Item $tempDir -Recurse -Force -ErrorAction SilentlyContinue
