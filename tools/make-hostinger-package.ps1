# Builds deploy/avya-hostinger-update.zip - everything that changes on the live site, laid out like public_html:
#   powershell -ExecutionPolicy Bypass -File tools\make-hostinger-package.ps1
# Left out on purpose, so nothing on the server is overwritten: backend/.env (live settings), backend/vendor (unchanged),
# backend/storage and backend/public/uploads (live files and photos), assets/web (already live), phone originals (.heic/.mov).
$root = Split-Path $PSScriptRoot -Parent
$deploy = Join-Path $root 'deploy'
$stage = Join-Path $deploy 'stage'
$zip = Join-Path $deploy 'avya-hostinger-update.zip'
Remove-Item $deploy -Recurse -Force -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Force $stage | Out-Null

function Copy-Tree($from, $to, $xd = @(), $xf = @()) {
  $a = @($from, $to, '/E', '/NFL', '/NDL', '/NJH', '/NJS', '/NP')
  if ($xd.Count) { $a += '/XD'; $a += $xd }
  if ($xf.Count) { $a += '/XF'; $a += $xf }
  & robocopy @a | Out-Null
}

# root files
foreach ($f in '.htaccess', 'index.html', 'robots.txt', 'sitemap.xml', 'favicon.ico') { Copy-Item (Join-Path $root $f) $stage }

# the storefront (frontend/.env stays here)
Copy-Tree (Join-Path $root 'frontend') (Join-Path $stage 'frontend') @() @('.env', '.env.*', 'build-env.js', 'README.md')

# product photos (web-ready WebP only) and the brand files
foreach ($d in 'Bullion', 'kids kada', 'kids nazariya', 'Woman Bracelet', 'Woman Rings') {
  $src = Join-Path $root "assets\$d"
  if (Test-Path $src) { Copy-Tree $src (Join-Path $stage "assets\$d") @('_unassigned') @('*.heic', '*.mov', '*.jpg', '*.jpeg', '*.png') }
}
Copy-Tree (Join-Path $root 'assets\brand') (Join-Path $stage 'assets\brand')

# the backend code
$b = Join-Path $root 'backend'; $sb = Join-Path $stage 'backend'
foreach ($d in 'app', 'config', 'database', 'resources', 'routes') { Copy-Tree (Join-Path $b $d) (Join-Path $sb $d) }
Copy-Tree (Join-Path $b 'public') (Join-Path $sb 'public') @('uploads')
New-Item -ItemType Directory -Force (Join-Path $sb 'bootstrap') | Out-Null
foreach ($f in 'app.php', 'providers.php') { Copy-Item (Join-Path $b "bootstrap\$f") (Join-Path $sb 'bootstrap') }
foreach ($f in 'artisan', 'composer.json', 'composer.lock', '.htaccess', '.env.example') { Copy-Item (Join-Path $b $f) $sb }

Push-Location $stage
& tar -a -c -f $zip (Get-ChildItem -Force | Select-Object -ExpandProperty Name)
Pop-Location

$mb = [math]::Round((Get-Item $zip).Length / 1MB, 1)
$n = (& tar -tf $zip | Measure-Object).Count
"Built $zip - $n entries, $mb MB"
