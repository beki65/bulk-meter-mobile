@echo off
echo Building APK...

cd C:\water-utility-dashboard\mobile-web-app

echo Building React app...
call npm run build

echo Syncing Capacitor...
call npx cap sync

echo Opening Android Studio...
echo Click: Build -> Build Bundle(s) / APK(s) -> Build APK(s)
call npx cap open android

echo APK will be at: android\app\build\outputs\apk\debug\app-debug.apk
pause