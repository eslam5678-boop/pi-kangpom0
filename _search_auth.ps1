param(
  [string]$Pattern = "Pi\.authenticate|SDKLite|\.login\(|createPayment|makePurchase|payWithPi|usePurchase|Pi\.init"
)
$dirs = @('app','components','contexts','hooks','lib')
foreach ($d in $dirs) {
  $path = Join-Path 'e:/pi-kangpom-main' $d
  if (Test-Path $path) {
    Get-ChildItem -Path $path -Recurse -Include *.ts,*.tsx,*.js -File -ErrorAction SilentlyContinue |
      Select-String -Pattern $Pattern |
      ForEach-Object {
        "{0}:{1}: {2}" -f $_.Path.Replace('e:/pi-kangpom-main/',''), $_.LineNumber, $_.Line.Trim()
      }
  }
}
