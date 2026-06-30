@echo off
setlocal
set "REPO=C:\Users\pmandel.ATTAIN\GitHub\pigtown-sanctuary"
powershell -NoProfile -ExecutionPolicy Bypass -File "%REPO%\scripts\pryce-site.ps1" %*
endlocal
