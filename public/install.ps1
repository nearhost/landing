# Nearhost installer for Windows. https://nearhost.dev
# Run it in PowerShell: irm https://nearhost.dev/install.ps1 | iex
# Downloads the latest release for this machine, verifies its checksum and installs nearhost.exe.
#
# It runs inside your own shell, so it never calls exit: a failure throws and your terminal stays
# open. Settings, all optional:
#   NEARHOST_VERSION          a release tag such as v0.13.0, instead of the latest
#   NEARHOST_INSTALL_DIR      the folder for nearhost.exe, instead of %LOCALAPPDATA%\Programs\nearhost
#   NEARHOST_NO_PATH=1        leave the user PATH alone
#   NEARHOST_INSTALL_DRY_RUN=1  print the download URL and stop
#   NEARHOST_BASE_URL         where to download from: an https URL, or a local folder for tests
#   NEARHOST_PATH_KEY         the registry key under HKCU holding the PATH to change, for tests

function Install-Nearhost {
  $ErrorActionPreference = 'Stop'
  $ProgressPreference = 'SilentlyContinue'
  $repo = 'nearhost/nearhost'

  if ([Environment]::OSVersion.Platform -ne 'Win32NT') {
    throw 'nearhost install: this installer is for Windows. On macOS and Linux, use https://nearhost.dev/install.sh.'
  }
  if ($PSVersionTable.PSVersion.Major -lt 6) {
    # Windows PowerShell 5.1 may still offer TLS 1.0 first, which GitHub refuses.
    [Net.ServicePointManager]::SecurityProtocol = [Net.ServicePointManager]::SecurityProtocol -bor [Net.SecurityProtocolType]::Tls12
  }

  # A 32-bit shell on 64-bit Windows reports the machine's architecture in PROCESSOR_ARCHITEW6432.
  $machine = $env:PROCESSOR_ARCHITEW6432
  if (-not $machine) { $machine = $env:PROCESSOR_ARCHITECTURE }
  switch ($machine) {
    'AMD64' { $arch = 'amd64' }
    'ARM64' { $arch = 'arm64' }
    default { throw "nearhost install: unsupported architecture: $machine. Nearhost ships amd64 and arm64 builds." }
  }

  $version = $env:NEARHOST_VERSION
  if (-not $version) {
    $latest = "https://github.com/$repo/releases/latest"
    $tag = ''
    try {
      $request = [Net.WebRequest]::Create($latest)
      $request.Method = 'HEAD'
      $response = $request.GetResponse()
      try {
        if ($response.ResponseUri.AbsoluteUri -match '/releases/tag/(v[0-9][^/?#]*)$') { $tag = $Matches[1] }
      } finally {
        $response.Close()
      }
    } catch {
      $tag = ''
    }
    if (-not $tag) {
      throw 'nearhost install: could not determine the latest release. Nearhost has no published release yet, or GitHub could not be reached.'
    }
    $version = $tag
  }
  if (-not $version.StartsWith('v')) { $version = 'v' + $version }

  $base = $env:NEARHOST_BASE_URL
  if (-not $base) { $base = "https://github.com/$repo/releases/download/$version" }
  $base = $base.TrimEnd('/')
  $remote = $base.StartsWith('https://', [StringComparison]::OrdinalIgnoreCase)
  if (-not $remote -and -not (Test-Path -LiteralPath $base -PathType Container)) {
    throw "nearhost install: NEARHOST_BASE_URL must be an https URL or a folder: $base"
  }
  $asset = "nearhost_$($version.TrimStart('v'))_windows_$arch.zip"

  if ($env:NEARHOST_INSTALL_DRY_RUN -eq '1') {
    Write-Output "$base/$asset"
    return
  }

  $dest = $env:NEARHOST_INSTALL_DIR
  if (-not $dest) { $dest = Join-Path $env:LOCALAPPDATA 'Programs\nearhost' }
  # Resolved against this shell's folder, since .NET would use the process's.
  $dest = $ExecutionContext.SessionState.Path.GetUnresolvedProviderPathFromPSPath($dest).TrimEnd('\')
  $target = Join-Path $dest 'nearhost.exe'

  $tmp = Join-Path ([IO.Path]::GetTempPath()) ('nearhost-install-' + [guid]::NewGuid().ToString('N'))
  New-Item -ItemType Directory -Path $tmp | Out-Null
  try {
    # Fetches one release file into $tmp.
    $fetch = {
      param($name)
      $file = Join-Path $tmp $name
      try {
        if ($remote) {
          Invoke-WebRequest -UseBasicParsing -Uri "$base/$name" -OutFile $file
        } else {
          Copy-Item -LiteralPath (Join-Path $base $name) -Destination $file
        }
      } catch {
        throw "nearhost install: download failed: $base/$name"
      }
      $file
    }

    # The checksums come first: they say whether this release has a Windows build at all.
    $sums = & $fetch 'checksums.txt'
    $expected = ''
    $windows = $false
    foreach ($line in [IO.File]::ReadAllLines($sums)) {
      $fields = $line.Trim() -split '\s+'
      if ($fields.Count -ne 2) { continue }
      if ($fields[1] -like 'nearhost_*_windows_*') { $windows = $true }
      if ($fields[1] -eq $asset) { $expected = $fields[0] }
    }
    if (-not $windows) {
      throw "nearhost install: Nearhost $version has no Windows build. Nothing was installed."
    }
    if (-not $expected) {
      throw "nearhost install: no checksum listed for $asset. Nothing was installed."
    }

    Write-Output "Downloading $asset"
    $zip = & $fetch $asset
    $actual = (Get-FileHash -Algorithm SHA256 -LiteralPath $zip).Hash
    if ($actual.ToLowerInvariant() -ne $expected.ToLowerInvariant()) {
      throw "nearhost install: checksum mismatch for $asset. Nothing was installed."
    }

    $unpacked = Join-Path $tmp 'unpacked'
    Expand-Archive -LiteralPath $zip -DestinationPath $unpacked
    $exe = Join-Path $unpacked 'nearhost.exe'
    if (-not (Test-Path -LiteralPath $exe -PathType Leaf)) {
      throw "nearhost install: $asset did not contain nearhost.exe. Nothing was installed."
    }

    try {
      New-Item -ItemType Directory -Path $dest -Force | Out-Null
    } catch {
      throw "nearhost install: could not create $dest`: $($_.Exception.Message)"
    }

    # Copied in beside the target first, so the swap below is two renames in one folder. A
    # running nearhost.exe can be renamed but not overwritten, so the old one steps aside.
    $suffix = [guid]::NewGuid().ToString('N').Substring(0, 8)
    $staged = "$target.new-$suffix"
    $old = ''
    try {
      [IO.File]::Copy($exe, $staged)
      if ([IO.File]::Exists($target)) {
        $old = "$target.old-$suffix"
        [IO.File]::Move($target, $old)
      }
      [IO.File]::Move($staged, $target)
    } catch {
      $reason = $_.Exception.Message
      Remove-Item -LiteralPath $staged -Force -ErrorAction SilentlyContinue
      if ($old -and -not [IO.File]::Exists($target)) {
        try {
          [IO.File]::Move($old, $target)
        } catch {
          throw "nearhost install: could not install $target ($reason), and could not put the old one back. It is at $old."
        }
      }
      throw "nearhost install: could not install $target ($reason). Nothing was installed."
    }
    # Old copies from this and earlier runs go now. One still running cannot be deleted yet; a
    # later run clears it.
    Get-ChildItem -LiteralPath $dest -Filter 'nearhost.exe.old-*' -File |
      Remove-Item -Force -ErrorAction SilentlyContinue
  } finally {
    Remove-Item -LiteralPath $tmp -Recurse -Force -ErrorAction SilentlyContinue
  }
  Write-Output "installed nearhost $version to $target"

  if ($env:NEARHOST_NO_PATH -eq '1') {
    $here = @($env:Path -split ';' | Where-Object { $_ -and $_.TrimEnd('\') -eq $dest })
    if (-not $here) { Write-Output "Note: $dest is not on your PATH." }
    return
  }

  # The user PATH is read and written raw, so entries such as %USERPROFILE%\bin stay unexpanded.
  $keyName = $env:NEARHOST_PATH_KEY
  if (-not $keyName) { $keyName = 'Environment' }
  $key = [Microsoft.Win32.Registry]::CurrentUser.CreateSubKey($keyName)
  try {
    $raw = [string]$key.GetValue('Path', '', [Microsoft.Win32.RegistryValueOptions]::DoNotExpandEnvironmentNames)
    $kind = [Microsoft.Win32.RegistryValueKind]::ExpandString
    if ($key.GetValueNames() -contains 'Path') { $kind = $key.GetValueKind('Path') }
    $listed = @($raw -split ';' | Where-Object {
        $_ -and [Environment]::ExpandEnvironmentVariables($_).TrimEnd('\') -eq $dest
      })
    if ($listed) { return }
    $value = $dest
    if ($raw.TrimEnd(';')) { $value = $raw.TrimEnd(';') + ';' + $dest }
    $key.SetValue('Path', $value, $kind)
  } finally {
    $key.Close()
  }
  if ($keyName -eq 'Environment') {
    # Setting a user variable through .NET tells Explorer the environment changed, so terminals
    # it starts from now on see the new PATH. This one is set and removed only for that.
    [Environment]::SetEnvironmentVariable('NEARHOST_INSTALL_REFRESH', '1', 'User')
    [Environment]::SetEnvironmentVariable('NEARHOST_INSTALL_REFRESH', $null, 'User')
  }
  Write-Output "Added $dest to your PATH. Open a new terminal to use nearhost."
}

try {
  Install-Nearhost
} finally {
  Remove-Item -LiteralPath Function:\Install-Nearhost -ErrorAction SilentlyContinue
}
