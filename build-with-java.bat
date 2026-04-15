@echo off
echo ========================================
echo   Building APK with Java 21
echo ========================================
echo.

echo Setting JAVA_HOME...
set JAVA_HOME=C:\Program Files\Eclipse Adoptium\jdk-21.0.10.7-hotspot
set PATH=%JAVA_HOME%\bin;%PATH%

echo Java version:
java -version

echo.
echo Building APK...
cd /d C:\water-utility-dashboard\mobile-web-app\android
call gradlew clean
call gradlew assembleDebug

if exist app\build\outputs\apk\debug\app-debug.apk (
    echo.
    echo ========================================
    echo   SUCCESS! APK created!
    echo   Location: app\build\outputs\apk\debug\app-debug.apk
    echo ========================================
    explorer app\build\outputs\apk\debug
) else (
    echo.
    echo ========================================
    echo   Build failed. Check errors above.
    echo ========================================
)
pause