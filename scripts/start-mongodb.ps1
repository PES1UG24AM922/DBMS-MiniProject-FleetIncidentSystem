param(
    [Parameter(Mandatory = $true)]
    [string]$DataPath,

    [string]$MongodPath = 'mongod.exe',

    [ValidateRange(1, 65535)]
    [int]$Port = 27017
)

$ErrorActionPreference = 'Stop'
$databaseDirectory = Get-Item -LiteralPath $DataPath
if ($databaseDirectory -isnot [System.IO.DirectoryInfo]) {
    throw "MongoDB data path must be a directory: $DataPath"
}

$mongod = Get-Command -Name $MongodPath -CommandType Application -ErrorAction Stop
& $mongod.Source --dbpath $databaseDirectory.FullName --bind_ip 127.0.0.1 --port $Port
exit $LASTEXITCODE
