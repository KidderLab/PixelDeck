param(
  [Parameter(Mandatory = $true)]
  [string]$TargetRoot,
  [string]$ProjectRoot = (Resolve-Path $PSScriptRoot).Path,
  [switch]$RemoveOldStorage
)

$ErrorActionPreference = 'Stop'

function Get-EnvMap {
  param([string]$EnvPath)
  $map = @{}
  if (-not (Test-Path -LiteralPath $EnvPath)) {
    throw "Missing .env file at $EnvPath"
  }

  foreach ($line in Get-Content -LiteralPath $EnvPath) {
    if ($line -match '^\s*$' -or $line -match '^\s*#') { continue }
    $parts = $line -split '=', 2
    if ($parts.Length -eq 2) {
      $map[$parts[0].Trim()] = $parts[1].Trim()
    }
  }

  return $map
}

function Resolve-ProjectPath {
  param([string]$BasePath, [string]$Candidate)
  if ([string]::IsNullOrWhiteSpace($Candidate)) { return $null }
  if ([System.IO.Path]::IsPathRooted($Candidate)) { return [System.IO.Path]::GetFullPath($Candidate) }
  return [System.IO.Path]::GetFullPath((Join-Path $BasePath $Candidate))
}

function Get-DatabaseFilePath {
  param([string]$ProjectRootPath, [string]$DatabaseUrl)
  if (-not $DatabaseUrl.StartsWith('file:', [System.StringComparison]::OrdinalIgnoreCase)) {
    throw "Only SQLite file DATABASE_URL values are supported. Current value: $DatabaseUrl"
  }
  $relative = $DatabaseUrl.Substring(5)
  $projectRelative = Resolve-ProjectPath -BasePath $ProjectRootPath -Candidate $relative
  if ($projectRelative -and (Test-Path -LiteralPath $projectRelative)) {
    return $projectRelative
  }
  $prismaRelative = Resolve-ProjectPath -BasePath (Join-Path $ProjectRootPath 'prisma') -Candidate $relative
  if ($prismaRelative -and (Test-Path -LiteralPath $prismaRelative)) {
    return $prismaRelative
  }
  return $projectRelative
}

function Ensure-Dir {
  param([string]$PathToCreate)
  if (-not (Test-Path -LiteralPath $PathToCreate)) {
    New-Item -ItemType Directory -Force -Path $PathToCreate | Out-Null
  }
}

function Copy-Tree {
  param([string]$Source, [string]$Destination)
  if (-not (Test-Path -LiteralPath $Source)) { return }
  Ensure-Dir -PathToCreate $Destination
  Write-Host "Copying $Source -> $Destination"
  & robocopy $Source $Destination /E /R:1 /W:1 /NFL /NDL /NJH /NJS /NP | Out-Null
  $code = $LASTEXITCODE
  if ($code -ge 8) {
    throw "Robocopy failed for $Source -> $Destination with exit code $code"
  }
}

function Update-EnvValue {
  param([string]$Content, [string]$Key, [string]$Value)
  $escaped = [Regex]::Escape($Key)
  $replacement = "$Key=$Value"
  if ($Content -match "(?m)^$escaped=") {
    return [Regex]::Replace($Content, "(?m)^$escaped=.*$", [System.Text.RegularExpressions.MatchEvaluator]{ param($m) $replacement })
  }
  return ($Content.TrimEnd() + [Environment]::NewLine + $replacement + [Environment]::NewLine)
}

$projectRootResolved = (Resolve-Path -LiteralPath $ProjectRoot).Path
$envPath = Join-Path $projectRootResolved '.env'
$envMap = Get-EnvMap -EnvPath $envPath
$oldStorageRoot = Resolve-ProjectPath -BasePath $projectRootResolved -Candidate ($envMap['PIXELDECK_STORAGE_ROOT'])
if (-not $oldStorageRoot) {
  $oldStorageRoot = Join-Path $projectRootResolved 'storage'
}
$oldImportsRoot = Resolve-ProjectPath -BasePath $projectRootResolved -Candidate ($envMap['PIXELDECK_IMPORT_ROOT'])
$oldDbFile = Get-DatabaseFilePath -ProjectRootPath $projectRootResolved -DatabaseUrl $envMap['DATABASE_URL']
$targetRootResolved = [System.IO.Path]::GetFullPath($TargetRoot)
$targetDbDir = Join-Path $targetRootResolved 'db'
$targetDbFile = Join-Path $targetDbDir (Split-Path -Leaf $oldDbFile)
$targetImportsRoot = Join-Path $targetRootResolved 'imports'
$targetOriginalsRoot = Join-Path $targetRootResolved 'originals'
$targetThumbsRoot = Join-Path $targetRootResolved 'thumbs'
$targetPreviewsRoot = Join-Path $targetRootResolved 'previews'
$targetPostersRoot = Join-Path $targetRootResolved 'video-posters'
$targetZipsRoot = Join-Path $targetRootResolved 'zips'
$targetLogsRoot = Join-Path $targetRootResolved 'logs'

Write-Host "Project root: $projectRootResolved"
Write-Host "Current storage root: $oldStorageRoot"
Write-Host "New storage root: $targetRootResolved"
Write-Host "Current database file: $oldDbFile"
Write-Host "New database file: $targetDbFile"
Write-Host ""
Write-Host "Make sure PixelDeck app and worker are stopped before continuing."

Ensure-Dir -PathToCreate $targetRootResolved
Ensure-Dir -PathToCreate $targetDbDir
Ensure-Dir -PathToCreate $targetImportsRoot
Ensure-Dir -PathToCreate $targetOriginalsRoot
Ensure-Dir -PathToCreate $targetThumbsRoot
Ensure-Dir -PathToCreate $targetPreviewsRoot
Ensure-Dir -PathToCreate $targetPostersRoot
Ensure-Dir -PathToCreate $targetZipsRoot
Ensure-Dir -PathToCreate $targetLogsRoot

Copy-Tree -Source (Join-Path $oldStorageRoot 'imports') -Destination $targetImportsRoot
Copy-Tree -Source (Join-Path $oldStorageRoot 'originals') -Destination $targetOriginalsRoot
Copy-Tree -Source (Join-Path $oldStorageRoot 'thumbs') -Destination $targetThumbsRoot
Copy-Tree -Source (Join-Path $oldStorageRoot 'previews') -Destination $targetPreviewsRoot
Copy-Tree -Source (Join-Path $oldStorageRoot 'video-posters') -Destination $targetPostersRoot
Copy-Tree -Source (Join-Path $oldStorageRoot 'zips') -Destination $targetZipsRoot
Copy-Tree -Source (Join-Path $oldStorageRoot 'logs') -Destination $targetLogsRoot
Copy-Tree -Source (Split-Path -Parent $oldDbFile) -Destination $targetDbDir

$env:DATABASE_URL = ('file:' + $targetDbFile.Replace('\', '/'))
$env:PIXELDECK_STORAGE_OLD = $oldStorageRoot
$env:PIXELDECK_STORAGE_NEW = $targetRootResolved
$env:PIXELDECK_IMPORTS_OLD = $oldImportsRoot
$env:PIXELDECK_IMPORTS_NEW = $targetImportsRoot
$tempNodeScript = Join-Path $projectRootResolved '.pixeldeck-move-storage-v3.cjs'
$nodeScript = @'
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const oldStorage = process.env.PIXELDECK_STORAGE_OLD;
const newStorage = process.env.PIXELDECK_STORAGE_NEW;
const oldImports = process.env.PIXELDECK_IMPORTS_OLD;
const newImports = process.env.PIXELDECK_IMPORTS_NEW;

(async () => {
  const likeOldStorage = oldStorage + "%";
  const likeOldImports = oldImports + "%";
  await prisma.$executeRawUnsafe("UPDATE Asset SET originalPath = replace(originalPath, ?, ?) WHERE originalPath LIKE ?", oldStorage, newStorage, likeOldStorage);
  await prisma.$executeRawUnsafe("UPDATE Asset SET thumbnailPath = replace(thumbnailPath, ?, ?) WHERE thumbnailPath LIKE ?", oldStorage, newStorage, likeOldStorage);
  await prisma.$executeRawUnsafe("UPDATE Asset SET previewPath = replace(previewPath, ?, ?) WHERE previewPath LIKE ?", oldStorage, newStorage, likeOldStorage);
  await prisma.$executeRawUnsafe("UPDATE Asset SET posterPath = replace(posterPath, ?, ?) WHERE posterPath LIKE ?", oldStorage, newStorage, likeOldStorage);
  await prisma.$executeRawUnsafe("UPDATE ExportJob SET zipPath = replace(zipPath, ?, ?) WHERE zipPath IS NOT NULL AND zipPath LIKE ?", oldStorage, newStorage, likeOldStorage);
  await prisma.$executeRawUnsafe("UPDATE ImportJob SET sourceFolder = replace(sourceFolder, ?, ?) WHERE sourceFolder LIKE ?", oldImports, newImports, likeOldImports);
  console.log("Updated database paths to new storage root.");
})().catch((error) => {
  console.error(error);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
'@

[System.IO.File]::WriteAllText($tempNodeScript, $nodeScript, [System.Text.UTF8Encoding]::new($false))
Push-Location $projectRootResolved
try {
  node $tempNodeScript
  if ($LASTEXITCODE -ne 0) {
    throw 'Failed to update SQLite paths after copying storage.'
  }
} finally {
  Pop-Location
  Remove-Item -LiteralPath $tempNodeScript -Force -ErrorAction SilentlyContinue
}

$envContent = Get-Content -LiteralPath $envPath -Raw
$envContent = Update-EnvValue -Content $envContent -Key 'DATABASE_URL' -Value ('file:' + $targetDbFile.Replace('\', '/'))
$envContent = Update-EnvValue -Content $envContent -Key 'PIXELDECK_STORAGE_ROOT' -Value ($targetRootResolved.Replace('\', '/'))
$envContent = Update-EnvValue -Content $envContent -Key 'PIXELDECK_IMPORT_ROOT' -Value ($targetImportsRoot.Replace('\', '/'))
$envContent = Update-EnvValue -Content $envContent -Key 'PIXELDECK_ORIGINALS_ROOT' -Value ($targetOriginalsRoot.Replace('\', '/'))
$envContent = Update-EnvValue -Content $envContent -Key 'PIXELDECK_THUMBS_ROOT' -Value ($targetThumbsRoot.Replace('\', '/'))
$envContent = Update-EnvValue -Content $envContent -Key 'PIXELDECK_PREVIEWS_ROOT' -Value ($targetPreviewsRoot.Replace('\', '/'))
$envContent = Update-EnvValue -Content $envContent -Key 'PIXELDECK_POSTERS_ROOT' -Value ($targetPostersRoot.Replace('\', '/'))
$envContent = Update-EnvValue -Content $envContent -Key 'PIXELDECK_ZIPS_ROOT' -Value ($targetZipsRoot.Replace('\', '/'))
$envContent = Update-EnvValue -Content $envContent -Key 'PIXELDECK_LOG_ROOT' -Value ($targetLogsRoot.Replace('\', '/'))
[System.IO.File]::WriteAllText($envPath, $envContent, [System.Text.UTF8Encoding]::new($false))
if ($RemoveOldStorage) {
  if ($oldStorageRoot -and (Test-Path -LiteralPath $oldStorageRoot)) {
    Write-Host "Removing old storage root: $oldStorageRoot"
    Remove-Item -LiteralPath $oldStorageRoot -Recurse -Force
  }
}

Write-Host ''
Write-Host 'Storage migration completed.'
Write-Host "Updated .env to use: $targetRootResolved"
Write-Host 'Next steps:'
Write-Host '  1. Restart PixelDeck app and worker'
Write-Host '  2. Verify Settings shows the new storage root'
Write-Host '  3. Test opening an existing asset and exporting a ZIP'
