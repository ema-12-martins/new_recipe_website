# Renders the made-up benchmark recipes as photo-like page images, using handwriting-style
# fonts with rotation, uneven light and noise. Windows PowerShell 5.1 + System.Drawing only.
# Text comes from recipes.json (read as UTF-8), so this file stays ASCII.
#
#   powershell -NoProfile -ExecutionPolicy Bypass -File render.ps1 -Recipes recipes.json -Out <dir>

param(
  [Parameter(Mandatory = $true)][string]$Recipes,
  [Parameter(Mandatory = $true)][string]$Out
)

$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Drawing

$data = [IO.File]::ReadAllText((Resolve-Path $Recipes), [Text.Encoding]::UTF8) | ConvertFrom-Json

$Width = 1500
$Height = 2000
$Margin = 140

function New-Font([string]$family, [single]$size, [System.Drawing.FontStyle]$style) {
  $font = New-Object System.Drawing.Font($family, $size, $style, [System.Drawing.GraphicsUnit]::Pixel)
  if ($font.Name -ne $family) { throw "Font '$family' is not installed." }
  return $font
}

# Largest font size (down to 26 px) at which every line fits the page width.
function Get-FittingSize([string]$family, [string[]]$lines, [single]$start) {
  $probe = New-Object System.Drawing.Bitmap(10, 10)
  $g = [System.Drawing.Graphics]::FromImage($probe)
  try {
    for ($size = $start; $size -ge 26; $size -= 2) {
      $font = New-Font $family $size ([System.Drawing.FontStyle]::Regular)
      $widest = ($lines | ForEach-Object { $g.MeasureString($_, $font).Width } | Measure-Object -Maximum).Maximum
      $font.Dispose()
      if ($widest -le ($Width - 2 * $Margin)) { return $size }
    }
    throw "Lines do not fit the page in font '$family'."
  } finally {
    $g.Dispose()
    $probe.Dispose()
  }
}

function Save-Jpeg([System.Drawing.Bitmap]$bitmap, [string]$path, [long]$quality) {
  $codec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq "image/jpeg" }
  $params = New-Object System.Drawing.Imaging.EncoderParameters(1)
  $params.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, $quality)
  $bitmap.Save($path, $codec, $params)
}

function Render-Page($recipe, [object[]]$blocks, [string]$path, [int]$seed) {
  $random = New-Object System.Random($seed)
  $style = $recipe.style
  $bitmap = New-Object System.Drawing.Bitmap($Width, $Height)
  $g = [System.Drawing.Graphics]::FromImage($bitmap)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAlias
  $g.Clear([System.Drawing.Color]::FromArgb(247, 241, 227))

  # Faint ruled lines, like a notebook page.
  $rule = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(70, 120, 150, 200), 2)
  for ($y = 220; $y -lt $Height - 60; $y += 74) { $g.DrawLine($rule, 60, $y, $Width - 60, $y) }
  $rule.Dispose()

  $g.TranslateTransform($Width / 2, $Height / 2)
  $g.RotateTransform([single]$style.rotation)
  $g.TranslateTransform(-$Width / 2, -$Height / 2)

  $ink = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml($style.ink))
  $allLines = @($blocks | ForEach-Object { $_.text })
  $size = Get-FittingSize $recipe.font $allLines 56
  $y = [single]$Margin

  foreach ($block in $blocks) {
    $scale = switch ($block.kind) { "title" { 1.3 } "heading" { 1.05 } default { 1.0 } }
    $font = New-Font $recipe.font ([single]($size * $scale)) ([System.Drawing.FontStyle]::Regular)
    if ($block.kind -eq "heading") { $y += $size * 0.5 }
    # A little wobble so lines are not perfectly aligned.
    $x = $Margin + $random.Next(-12, 13)
    $g.DrawString($block.text, $font, $ink, [single]$x, $y)
    $y += $font.GetHeight($g) * 1.35
    if ($block.kind -eq "title") { $y += $size * 0.6 }
    $font.Dispose()
    if ($y -gt $Height - 80) { throw "Recipe $($recipe.folder) does not fit on the page." }
  }
  $g.ResetTransform()
  $ink.Dispose()

  # Lighting: dim pages are darker overall; uneven pages fall into shadow towards one corner.
  if ($style.light -eq "dim") {
    $shade = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(95, 20, 15, 10))
    $g.FillRectangle($shade, 0, 0, $Width, $Height)
    $shade.Dispose()
  } elseif ($style.light -eq "uneven") {
    $rect = New-Object System.Drawing.Rectangle(0, 0, $Width, $Height)
    $gradient = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
      $rect,
      [System.Drawing.Color]::FromArgb(0, 0, 0, 0),
      [System.Drawing.Color]::FromArgb(120, 25, 20, 10),
      [single]35
    )
    $g.FillRectangle($gradient, $rect)
    $gradient.Dispose()
  }

  # Sensor noise.
  $dots = [int]($Width * $Height * [double]$style.noise / 100)
  for ($i = 0; $i -lt $dots; $i++) {
    $v = $random.Next(60, 200)
    $bitmap.SetPixel($random.Next(0, $Width), $random.Next(0, $Height), [System.Drawing.Color]::FromArgb($v, $v, $v))
  }

  $g.Dispose()
  Save-Jpeg $bitmap $path 78
  $bitmap.Dispose()
}

$seed = 1
foreach ($recipe in $data.recipes) {
  $folder = Join-Path $Out $recipe.folder
  [void][IO.Directory]::CreateDirectory($folder)
  $headings = $data.headings.($recipe.language)

  $steps = @($recipe.steps)
  $split = if ($recipe.pageBreakAfterStep) { [int]$recipe.pageBreakAfterStep } else { $steps.Count }

  $page1 = @(@{ kind = "title"; text = $recipe.title }, @{ kind = "heading"; text = $headings.ingredients })
  $page1 += @($recipe.ingredients | ForEach-Object { @{ kind = "line"; text = "$_" } })
  $page1 += @{ kind = "heading"; text = $headings.steps }
  for ($i = 0; $i -lt $split; $i++) { $page1 += @{ kind = "line"; text = "$($i + 1). $($steps[$i])" } }
  Render-Page $recipe $page1 (Join-Path $folder "page-1.jpg") ($seed++)

  if ($split -lt $steps.Count) {
    $page2 = @()
    for ($i = $split; $i -lt $steps.Count; $i++) { $page2 += @{ kind = "line"; text = "$($i + 1). $($steps[$i])" } }
    Render-Page $recipe $page2 (Join-Path $folder "page-2.jpg") ($seed++)
  }
  Write-Output "rendered $($recipe.folder)"
}
