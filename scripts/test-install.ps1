# Exercises public/install.ps1 on Windows without touching the user PATH or a real release.
# Each case runs the script the way users do, piped into Invoke-Expression, in a child shell of
# the same kind as this one (Windows PowerShell 5.1 or PowerShell 7), against a release folder
# built here. Run it under both: powershell -File scripts/test-install.ps1, pwsh -File ...
# Keep this file ASCII: Windows PowerShell 5.1 reads a file without a BOM as ANSI.

$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'

$script:fails = 0
$installer = Join-Path (Split-Path -Parent $PSScriptRoot) 'public\install.ps1'
$shell = (Get-Process -Id $PID).Path
$work = Join-Path ([IO.Path]::GetTempPath()) ('nearhost-install-test-' + [guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $work | Out-Null

$version = 'v0.13.0-rc.1'
$arch = 'amd64'
if ("$env:PROCESSOR_ARCHITEW6432$env:PROCESSOR_ARCHITECTURE" -match 'ARM64') { $arch = 'arm64' }
$asset = "nearhost_0.13.0-rc.1_windows_$arch.zip"

# A throwaway registry key stands in for HKCU\Environment, so no case can reach the real PATH.
$pathKey = 'Software\NearhostInstallTest-' + [guid]::NewGuid().ToString('N') + '\Environment'
$userEnv = [Microsoft.Win32.Registry]::CurrentUser.OpenSubKey('Environment')
$realPathBefore = $userEnv.GetValue('Path', '', 'DoNotExpandEnvironmentNames')
$userEnv.Close()

# C:\...\Jos<e acute> N<u acute><n tilde>ez\bin, built from char codes to keep this file ASCII.
$person = 'Jos' + [char]0x00E9 + ' N' + [char]0x00FA + [char]0x00F1 + 'ez'

function Write-Result {
  param([string]$Name, [bool]$Passed, [string]$Detail)
  if ($Passed) {
    Write-Output "ok   $Name"
  } else {
    Write-Output "FAIL $Name"
    Write-Output $Detail
    $script:fails++
  }
}

# A release folder holding the Windows zip (unless Missing) and a checksums.txt that lists it
# with its real sum, a wrong one (Bad), or not at all (NoWindows).
function Build-Release {
  param([string]$Name, [string]$Payload, [string]$Mode = 'Good')
  $dir = Join-Path $work $Name
  $stage = Join-Path $work "$Name-payload"
  New-Item -ItemType Directory -Path $dir, $stage | Out-Null
  [IO.File]::WriteAllText((Join-Path $stage 'nearhost.exe'), $Payload)
  [IO.File]::WriteAllText((Join-Path $stage 'LICENSE'), 'MIT')
  [IO.File]::WriteAllText((Join-Path $stage 'README.md'), 'readme')
  $zip = Join-Path $dir $asset
  Compress-Archive -Path (Join-Path $stage '*') -DestinationPath $zip
  $sum = (Get-FileHash -Algorithm SHA256 -LiteralPath $zip).Hash.ToLowerInvariant()
  if ($Mode -eq 'Bad') { $sum = '0' * 64 }
  if ($Mode -eq 'Missing') { Remove-Item -LiteralPath $zip }
  $lines = @(
    ('1' * 64) + '  nearhost_0.13.0-rc.1_darwin_arm64.tar.gz',
    ('2' * 64) + '  nearhost_0.13.0-rc.1_linux_amd64.tar.gz'
  )
  if ($Mode -ne 'NoWindows') { $lines += "$sum  $asset" }
  [IO.File]::WriteAllText((Join-Path $dir 'checksums.txt'), (($lines -join "`n") + "`n"))
  return $dir
}

# Runs the installer in a child shell with these environment variables (a $null value unsets
# one), after any Prelude commands, and returns its output lines. The install is wrapped so a
# throw is caught and printed; the lines after it show the shell is still alive and its error
# preference is untouched.
function Invoke-Installer {
  param([hashtable]$Environment, [string]$Prelude = '')
  # Windows PowerShell 5.1 turns a child's stderr into errors, which Stop would make fatal here.
  $ErrorActionPreference = 'Continue'
  $out = Join-Path $work ('out-' + [guid]::NewGuid().ToString('N') + '.txt')
  $vars = @{
    NEARHOST_VERSION          = $version
    NEARHOST_BASE_URL         = $null
    NEARHOST_INSTALL_DIR      = $null
    NEARHOST_INSTALL_DRY_RUN  = $null
    NEARHOST_NO_PATH          = '1'
    NEARHOST_PATH_KEY         = $pathKey
    NEARHOST_TEST_SCRIPT      = $installer
    NEARHOST_TEST_OUT         = $out
  }
  foreach ($k in $Environment.Keys) { $vars[$k] = $Environment[$k] }
  $saved = @{}
  foreach ($k in $vars.Keys) {
    $saved[$k] = [Environment]::GetEnvironmentVariable($k)
    [Environment]::SetEnvironmentVariable($k, $vars[$k])
  }
  $command = '& { ' + $Prelude + ' try { Get-Content -Raw -LiteralPath $env:NEARHOST_TEST_SCRIPT | Invoke-Expression } ' +
    'catch { ''ERROR: '' + $_.Exception.Message }; ''still-alive''; ''eap='' + $ErrorActionPreference } ' +
    '*>&1 | Out-File -LiteralPath $env:NEARHOST_TEST_OUT -Encoding utf8'
  try {
    $console = & $shell -NoProfile -NonInteractive -Command $command 2>&1 | Out-String
  } finally {
    foreach ($k in $saved.Keys) { [Environment]::SetEnvironmentVariable($k, $saved[$k]) }
  }
  $lines = @()
  if (Test-Path -LiteralPath $out) { $lines = @(Get-Content -LiteralPath $out -Encoding UTF8) }
  if ($console.Trim()) { $lines += "console: $console" }
  return $lines
}

function Test-Alive {
  param([string[]]$Lines)
  return ($Lines -contains 'still-alive') -and ($Lines -contains 'eap=Continue')
}

function Get-FileBase64 {
  param([string]$Path)
  return [Convert]::ToBase64String([IO.File]::ReadAllBytes($Path))
}

function Get-TestPath {
  $key = [Microsoft.Win32.Registry]::CurrentUser.OpenSubKey($pathKey)
  if (-not $key) { return $null }
  try {
    return [pscustomobject]@{
      Value = $key.GetValue('Path', $null, 'DoNotExpandEnvironmentNames')
      Kind  = $key.GetValueKind('Path')
    }
  } finally {
    $key.Close()
  }
}

try {
  # 1. A dry run prints the Windows asset URL and stops.
  $lines = Invoke-Installer @{ NEARHOST_INSTALL_DRY_RUN = '1' }
  $want = "https://github.com/nearhost/nearhost/releases/download/$version/$asset"
  Write-Result 'dry run url' (($lines -contains $want) -and (Test-Alive $lines)) ($lines -join "`n")

  # 2. Without NEARHOST_VERSION the latest release is found from GitHub's redirect.
  $lines = Invoke-Installer @{ NEARHOST_VERSION = $null; NEARHOST_INSTALL_DRY_RUN = '1' }
  $pattern = '^https://github\.com/nearhost/nearhost/releases/download/v(\d+\.\d+\.\d+[^/]*)/nearhost_\1_windows_' + $arch + '\.zip$'
  Write-Result 'dry run latest' (@($lines -match $pattern).Count -eq 1) ($lines -join "`n")

  # 3. An unsupported architecture is refused.
  # Set in the child only: under PowerShell 7, changing PROCESSOR_ARCHITECTURE in this process
  # neither reached the child nor came back afterwards.
  $lines = Invoke-Installer @{ NEARHOST_INSTALL_DRY_RUN = '1' } -Prelude '$env:PROCESSOR_ARCHITECTURE = ''x86''; $env:PROCESSOR_ARCHITEW6432 = $null;'
  Write-Result 'unsupported arch' ((($lines -join "`n") -match 'ERROR: nearhost install: unsupported architecture: x86') -and (Test-Alive $lines)) ($lines -join "`n")

  # 4. A release with no Windows asset fails clearly and installs nothing.
  $release = Build-Release 'nowin' 'new' 'NoWindows'
  $dest = Join-Path $work 'nowin-dest'
  $lines = Invoke-Installer @{ NEARHOST_BASE_URL = $release; NEARHOST_INSTALL_DIR = $dest }
  Write-Result 'no windows build' ((($lines -join "`n") -match 'ERROR: .*has no Windows build') -and -not (Test-Path -LiteralPath $dest) -and (Test-Alive $lines)) ($lines -join "`n")

  # 5. A checksum mismatch fails and leaves an existing nearhost.exe byte-identical.
  $release = Build-Release 'bad' 'new' 'Bad'
  $dest = Join-Path $work 'bad-dest'
  New-Item -ItemType Directory -Path $dest | Out-Null
  [IO.File]::WriteAllText((Join-Path $dest 'nearhost.exe'), 'old nearhost')
  $before = Get-FileBase64 (Join-Path $dest 'nearhost.exe')
  $lines = Invoke-Installer @{ NEARHOST_BASE_URL = $release; NEARHOST_INSTALL_DIR = $dest }
  $ok = (($lines -join "`n") -match 'ERROR: nearhost install: checksum mismatch .*Nothing was installed\.') -and
    ((Get-FileBase64 (Join-Path $dest 'nearhost.exe')) -eq $before) -and
    (@(Get-ChildItem -LiteralPath $dest).Count -eq 1) -and (Test-Alive $lines)
  Write-Result 'checksum mismatch' $ok ($lines -join "`n")

  # 6. A download that fails leaves an existing nearhost.exe byte-identical.
  $release = Build-Release 'missing' 'new' 'Missing'
  $lines = Invoke-Installer @{ NEARHOST_BASE_URL = $release; NEARHOST_INSTALL_DIR = $dest }
  $ok = (($lines -join "`n") -match 'ERROR: nearhost install: download failed') -and
    ((Get-FileBase64 (Join-Path $dest 'nearhost.exe')) -eq $before) -and
    (@(Get-ChildItem -LiteralPath $dest).Count -eq 1) -and (Test-Alive $lines)
  Write-Result 'download failure' $ok ($lines -join "`n")

  # 7. A good release installs into a folder with spaces and non-ASCII characters.
  $release = Build-Release 'good' 'new nearhost'
  $dest = Join-Path (Join-Path $work $person) 'bin'
  $target = Join-Path $dest 'nearhost.exe'
  $lines = Invoke-Installer @{ NEARHOST_BASE_URL = $release; NEARHOST_INSTALL_DIR = $dest }
  $ok = ($lines -contains "installed nearhost $version to $target") -and
    (Test-Path -LiteralPath $target) -and ([IO.File]::ReadAllText($target) -eq 'new nearhost') -and
    (@(Get-ChildItem -LiteralPath $dest).Count -eq 1) -and (Test-Alive $lines)
  Write-Result 'install ok' $ok ($lines -join "`n")

  # 8. Installing over a nearhost.exe that is running replaces it.
  $release = Build-Release 'running' 'replaced nearhost'
  $dest = Join-Path $work 'running-dest'
  $target = Join-Path $dest 'nearhost.exe'
  New-Item -ItemType Directory -Path $dest | Out-Null
  Copy-Item -LiteralPath (Join-Path $env:SystemRoot 'System32\PING.EXE') -Destination $target
  $proc = Start-Process -FilePath $target -ArgumentList '-n', '60', '127.0.0.1' -WindowStyle Hidden -PassThru
  try {
    $lines = Invoke-Installer @{ NEARHOST_BASE_URL = $release; NEARHOST_INSTALL_DIR = $dest }
    $ok = ($lines -contains "installed nearhost $version to $target") -and -not $proc.HasExited -and
      ([IO.File]::ReadAllText($target) -eq 'replaced nearhost') -and (Test-Alive $lines)
    Write-Result 'install over running' $ok ($lines -join "`n")
  } finally {
    Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
    $proc.WaitForExit()
  }

  # 9. With NEARHOST_NO_PATH=1 the PATH is left alone.
  $seed = '%USERPROFILE%\tools;C:\Other'
  $key = [Microsoft.Win32.Registry]::CurrentUser.CreateSubKey($pathKey)
  $key.SetValue('Path', $seed, 'ExpandString')
  $key.Close()
  $release = Build-Release 'nopath' 'nopath nearhost'
  $dest = Join-Path $work 'nopath-dest'
  $lines = Invoke-Installer @{ NEARHOST_BASE_URL = $release; NEARHOST_INSTALL_DIR = $dest }
  $after = Get-TestPath
  $ok = ($lines -contains "installed nearhost $version to $(Join-Path $dest 'nearhost.exe')") -and
    ($after.Value -eq $seed) -and -not (($lines -join "`n") -match 'new terminal')
  Write-Result 'no path' $ok (($lines -join "`n") + "`nPATH: $($after.Value)")

  # 10. Without it the folder is added to the PATH once, keeping %VARS% unexpanded.
  $dest = Join-Path (Join-Path $work $person) 'path-bin'
  $lines = Invoke-Installer @{ NEARHOST_BASE_URL = $release; NEARHOST_INSTALL_DIR = $dest; NEARHOST_NO_PATH = $null }
  $after = Get-TestPath
  $ok = ($after.Value -eq "$seed;$dest") -and ($after.Kind -eq 'ExpandString') -and
    (($lines -join "`n") -match 'Open a new terminal') -and (Test-Alive $lines)
  Write-Result 'adds to path' $ok (($lines -join "`n") + "`nPATH: $($after.Value) ($($after.Kind))")
  $lines = Invoke-Installer @{ NEARHOST_BASE_URL = $release; NEARHOST_INSTALL_DIR = "$dest\"; NEARHOST_NO_PATH = $null }
  $after = Get-TestPath
  $ok = ($after.Value -eq "$seed;$dest") -and -not (($lines -join "`n") -match 'new terminal')
  Write-Result 'path added once' $ok (($lines -join "`n") + "`nPATH: $($after.Value)")
} finally {
  Remove-Item -LiteralPath $work -Recurse -Force -ErrorAction SilentlyContinue
  Remove-Item -LiteralPath ('HKCU:\' + (Split-Path -Parent $pathKey)) -Recurse -Force -ErrorAction SilentlyContinue
}

# The runner's own user PATH must be exactly as it was.
$userEnv = [Microsoft.Win32.Registry]::CurrentUser.OpenSubKey('Environment')
$realPathAfter = $userEnv.GetValue('Path', '', 'DoNotExpandEnvironmentNames')
$userEnv.Close()
Write-Result 'real user path untouched' ($realPathAfter -eq $realPathBefore) "before: $realPathBefore`nafter:  $realPathAfter"

if ($script:fails -gt 0) {
  Write-Output "$($script:fails) install.ps1 check(s) failed under PowerShell $($PSVersionTable.PSVersion)"
  exit 1
}
Write-Output "all install.ps1 checks passed under PowerShell $($PSVersionTable.PSVersion)"
