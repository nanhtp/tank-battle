@echo off
setlocal DisableDelayedExpansion
cd /d "%~dp0"
set "TANK_PYTHON="
set "TANK_PY_VERSION="
if not exist "%~dp0khoi-chay.py" (
  echo Khong tim thay khoi-chay.py. Hay giai nen TOAN BO thu muc game truoc khi mo.
  goto :loi
)

rem Thu truc tiep python.exe truoc, khong phu thuoc vao py launcher bi hong.
for /f "delims=" %%P in ('where python.exe 2^>nul') do (
  call :thu_python "%%P"
  if defined TANK_PYTHON goto :chay
)
rem Tim ca cac ban Python da cai nhung chua them vao PATH.
for /d %%D in ("%LOCALAPPDATA%\Programs\Python\Python*" "%USERPROFILE%\AppData\Local\Programs\Python\Python*" "%LOCALAPPDATA%\Python\pythoncore-*" "%USERPROFILE%\AppData\Local\Python\pythoncore-*" "%ProgramFiles%\Python*") do (
  call :thu_python "%%~D\python.exe"
  if defined TANK_PYTHON goto :chay
)
rem Neu chi co py launcher, kiem tra tung phien ban thay vi tin vao mac dinh.
for %%V in (3.14 3.13 3.12 3.11 3.10 3.9 3.8 3) do (
  py -%%V -c "import sys; sys.exit(0 if sys.version_info.major == 3 and sys.version_info.minor >= 8 else 1)" >nul 2>nul
  if not errorlevel 1 (
    set "TANK_PY_VERSION=%%V"
    goto :chay
  )
)
echo Khong tim thay Python 3.8 tro len co the chay duoc.
echo Hay cai hoac sua Python, sau do mo lai tep nay.
goto :loi

:thu_python
if not exist "%~1" exit /b 0
rem Bo qua alias Windows Store; alias co the mo Store thay vi chay Python.
if /i "%~dp1"=="%LOCALAPPDATA%\Microsoft\WindowsApps\" exit /b 0
"%~1" -c "import sys; sys.exit(0 if sys.version_info.major == 3 and sys.version_info.minor >= 8 else 1)" >nul 2>nul
if not errorlevel 1 set "TANK_PYTHON=%~1"
exit /b 0

:chay
if defined TANK_PYTHON (
  echo Python dang dung: "%TANK_PYTHON%"
) else (
  echo Python dang dung: py -%TANK_PY_VERSION%
)
if /i "%~1"=="--kiem-tra" exit /b 0
if defined TANK_PYTHON (
  "%TANK_PYTHON%" "%~dp0khoi-chay.py"
) else (
  py -%TANK_PY_VERSION% "%~dp0khoi-chay.py"
)
if errorlevel 1 (
  echo.
  echo Python da duoc tim thay nhung game chay gap loi. Xem thong bao ngay phia tren.
  echo Kiem tra o D: ton tai, quyen ghi thu muc LogTank va cac tep game da giai nen du.
  goto :loi
)
exit /b 0

:loi
if /i not "%~1"=="--kiem-tra" pause
exit /b 1
