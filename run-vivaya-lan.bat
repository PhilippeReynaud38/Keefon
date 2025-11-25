@echo off
cd /d "%~dp0"

REM Adresse IP locale trouvée avec ipconfig (modifie-la si besoin)
set IP=192.168.1.14

echo =========================================
echo Vivaya en mode LAN (port 3001)
echo Ouvre sur ton mobile :  http://%IP%:3001
echo =========================================

npx next dev -H 0.0.0.0 -p 3001
pause
