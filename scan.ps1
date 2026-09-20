$ErrorActionPreference = "Stop"

$GO_FILE = ".\importgo.txt"
$OS_FILE = ".\importos.txt"
$OUTPUT_FILE = ".\tizzyos-used-apis.txt"

Write-Host ""
Write-Host "===== TIZZYGO -> TIZZYOS API SCANNER =====" -ForegroundColor Cyan
Write-Host ""

if (-not (Test-Path $GO_FILE)) {
    Write-Host "ERROR: importgo.txt not found!" -ForegroundColor Red
    exit
}

if (-not (Test-Path $OS_FILE)) {
    Write-Host "ERROR: importos.txt not found!" -ForegroundColor Red
    exit
}

# ---------------------------------------------------------
# Extract prefixes from app.use(...)
# ---------------------------------------------------------

function Get-ApiPrefixes {
    param (
        [string]$File
    )

    Get-Content $File |
        ForEach-Object {
            if ($_ -match 'app\.use\s*\(\s*["'']([^"'']+)["'']') {
                $matches[1]
            }
        } |
        Where-Object {
            $_ -like "/api/*"
        } |
        Sort-Object -Unique
}

$goApis = @(Get-ApiPrefixes $GO_FILE)
$osApis = @(Get-ApiPrefixes $OS_FILE)

Write-Host "TizzyGo prefixes found : $($goApis.Count)"
Write-Host "TizzyOS prefixes found : $($osApis.Count)"
Write-Host ""

# ---------------------------------------------------------
# Frontend source files
# ---------------------------------------------------------

$files = Get-ChildItem -Recurse -File -Include *.ts,*.tsx,*.js,*.jsx |
    Where-Object {
        $_.FullName -notmatch "\\node_modules\\" -and
        $_.FullName -notmatch "\\.git\\" -and
        $_.FullName -notmatch "\\android\\build\\" -and
        $_.FullName -notmatch "\\android\\.gradle\\" -and
        $_.FullName -notmatch "\\ios\\Pods\\" -and
        $_.FullName -notmatch "\\ios\\build\\"
    }

Write-Host "Frontend files scanned : $($files.Count)"
Write-Host ""

# ---------------------------------------------------------
# Search frontend for each TizzyOS prefix
# ---------------------------------------------------------

$found = @()

foreach ($api in $osApis) {

    $escapedApi = [regex]::Escape($api)

    $matches = $files |
        Select-String -Pattern $escapedApi -AllMatches

    if (-not $matches) {
        continue
    }

    # -----------------------------------------------------
    # IMPORTANT:
    # Ignore broad parent prefixes when a more specific
    # TizzyOS prefix is also matched in the same location.
    #
    # Example:
    # /api/v0
    # /api/v0/seller
    # /api/v0/seller/forms/categories
    #
    # If frontend actually contains:
    # /api/v0/seller/forms/categories
    #
    # only the most specific matching API is reported.
    # -----------------------------------------------------

    foreach ($match in $matches) {

        $line = $match.Line

        # Find all TizzyOS prefixes present in this exact line
        $lineApis = @()

        foreach ($candidate in $osApis) {

            if ($line -match [regex]::Escape($candidate)) {
                $lineApis += $candidate
            }
        }

        # Keep the longest / most specific API
        if ($lineApis.Count -gt 0) {

            $specificApi = $lineApis |
                Sort-Object Length -Descending |
                Select-Object -First 1

            $found += [PSCustomObject]@{
                API      = $specificApi
                File     = $match.Path
                Line     = $match.LineNumber
                Text     = $line.Trim()
            }
        }
    }
}

# ---------------------------------------------------------
# Remove duplicates
# ---------------------------------------------------------

$found = $found |
    Sort-Object API, File, Line -Unique

# ---------------------------------------------------------
# Final unique APIs
# ---------------------------------------------------------

$usedApis = $found |
    Select-Object -ExpandProperty API |
    Sort-Object -Unique

# ---------------------------------------------------------
# Display
# ---------------------------------------------------------

Write-Host "=============================================" -ForegroundColor Cyan
Write-Host " TIZZYOS APIs ACTUALLY USED BY TIZZYGO"
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

if ($usedApis.Count -eq 0) {

    Write-Host "NO TIZZYOS API FOUND." -ForegroundColor Yellow

}
else {

    foreach ($api in $usedApis) {

        Write-Host $api -ForegroundColor Green

        $apiMatches = $found |
            Where-Object { $_.API -eq $api }

        foreach ($item in $apiMatches) {

            $relative = $item.File.Replace(
                (Get-Location).Path + "\",
                ""
            )

            Write-Host "   -> $relative : line $($item.Line)" -ForegroundColor DarkGray
        }

        Write-Host ""
    }
}

# ---------------------------------------------------------
# Save clean API list
# ---------------------------------------------------------

$usedApis | Set-Content $OUTPUT_FILE

Write-Host "=============================================" -ForegroundColor Cyan
Write-Host " CLEAN RESULT"
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

if ($usedApis.Count -gt 0) {

    $usedApis | ForEach-Object {
        Write-Host $_ -ForegroundColor Green
    }

}
else {

    Write-Host "No TizzyOS APIs found." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Saved to: $OUTPUT_FILE" -ForegroundColor Cyan
Write-Host ""
Write-Host "===== SCAN COMPLETE =====" -ForegroundColor Cyan