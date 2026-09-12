const fs = require('fs');

// 1. Update flutter.bat
const batPath = 'C:\\flutter\\bin\\flutter.bat';
if (fs.existsSync(batPath)) {
    let bat = fs.readFileSync(batPath, 'utf8');
    if (!bat.includes('C:\\Program Files\\Git\\cmd')) {
        const target = 'FOR %%i IN ("%~dp0..") DO SET FLUTTER_ROOT=%%~fi';
        const replacement = 'FOR %%i IN ("%~dp0..") DO SET FLUTTER_ROOT=%%~fi\r\n\r\nREM Ensure authentic Git executable takes priority over System32 dummy\r\nIF EXIST "C:\\Program Files\\Git\\cmd" SET PATH=C:\\Program Files\\Git\\cmd;%PATH%';
        if (bat.includes(target)) {
            bat = bat.replace(target, replacement);
            fs.writeFileSync(batPath, bat, 'utf8');
            console.log('✅ C:\\flutter\\bin\\flutter.bat patched to prioritize Git in PATH');
        } else {
            console.log('⚠️ Target line not found in flutter.bat');
        }
    } else {
        console.log('ℹ️ flutter.bat already patched with Git path');
    }
}

// 2. Update update_engine_version.ps1
const ps1Path = 'C:\\flutter\\bin\\internal\\update_engine_version.ps1';
if (fs.existsSync(ps1Path)) {
    let ps1 = fs.readFileSync(ps1Path, 'utf8');
    const oldCondition = 'git -C "$flutterRoot" ls-files bin/internal/engine.version';
    const newCondition = 'Test-Path "$flutterRoot/bin/internal/engine.version"';
    if (ps1.includes(oldCondition)) {
        ps1 = ps1.replace(oldCondition, newCondition);
        fs.writeFileSync(ps1Path, ps1, 'utf8');
        console.log('✅ update_engine_version.ps1 patched with reliable Test-Path');
    } else {
        console.log('ℹ️ update_engine_version.ps1 already has Test-Path');
    }
}

console.log('🚀 Environment diagnostic patch complete.');
