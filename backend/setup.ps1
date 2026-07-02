# Folders
$folders = @(
    "src/config",
    "src/controllers",
    "src/services",
    "src/services/ai",
    "src/models",
    "src/routes",
    "src/middleware",
    "src/validators",
    "src/utils",
    "src/types",
    "tests/controllers",
    "tests/services",
    "tests/models",
    "swagger"
)

foreach ($folder in $folders) {
    New-Item -ItemType Directory -Force -Path $folder | Out-Null
}