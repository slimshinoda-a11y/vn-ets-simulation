@echo off
chcp 65001 >nul
echo ========================================================
echo       ĐẨY MÃ NGUỒN ETS SIM LÊN GITHUB ĐỂ DEPLOY RENDER
echo ========================================================
echo.

set GIT_EXE="%LOCALAPPDATA%\Programs\MinGit\cmd\git.exe"

if not exist %GIT_EXE% (
    echo [!] Khong tim thay Git tai %GIT_EXE%
    echo Vui long kiem tra lai.
    pause
    exit /b 1
)

echo [1/3] Git da san sang.
echo.
echo Vui long dan duong link GitHub Repository cua ban vao day.
echo Vi du: https://github.com/ten-cua-ban/ets-simulation.git
echo.
set /p REPO_URL="Link GitHub Repo: "

if "%REPO_URL%"=="" (
    echo [!] Ban chua nhap link GitHub. Vui long chay lai file.
    pause
    exit /b 1
)

echo.
echo [2/3] Dang lien ket Remote Origin...
%GIT_EXE% remote remove origin >nul 2>&1
%GIT_EXE% remote add origin %REPO_URL%

echo [3/3] Dang day ma nguon len GitHub (nhanh 5-10 giay)...
echo Neu co cua so dang nhap GitHub hien ra, vui long xac nhan dang nhap.
echo.
%GIT_EXE% push -u origin main

if %ERRORLEVEL% equ 0 (
    echo.
    echo ========================================================
    echo  [THANH CONG!] Ma nguon da duoc day len GitHub hoan tat!
    echo ========================================================
    echo.
    echo Bay gio ban chi can:
    echo 1. Vao trang https://render.com va dang nhap bang GitHub.
    echo 2. Bam "New +" -> "Blueprint".
    echo 3. Chon Repository vua tao -> Bam "Apply".
    echo 4. He thong Render se tu dong chay 24/7 va cap link cho ban!
    echo.
) else (
    echo.
    echo [!] Co loi xay ra khi day len GitHub. Vui long kiem tra lai quyen truy cap hoac link repo.
)

pause
