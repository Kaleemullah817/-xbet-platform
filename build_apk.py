#!/usr/bin/env python3
import os
import sys
import shutil
import subprocess
import zipfile

PROJECT_DIR = os.path.dirname(os.path.abspath(__file__))
ANDROID_DIR = os.path.join(PROJECT_DIR, 'android')
SRC_DIR = os.path.join(ANDROID_DIR, 'src', 'main')
JAVA_SRC = os.path.join(SRC_DIR, 'java', 'com', 'xbet', 'global', 'MainActivity.java')
MANIFEST = os.path.join(SRC_DIR, 'AndroidManifest.xml')
RES_DIR = os.path.join(SRC_DIR, 'res')
BUILD_DIR = os.path.join(PROJECT_DIR, 'build_output')
CLASSES_DIR = os.path.join(BUILD_DIR, 'classes')
APP_JAR = os.path.join(BUILD_DIR, 'app_classes.jar')
KEYSTORE = os.path.join(PROJECT_DIR, 'debug.keystore')
OUTPUT_APK = os.path.join(PROJECT_DIR, '1X-BET_Global.apk')

ANDROID_JAR = "/home/cyber/.gradle/caches/transforms-3/7d9efa6a11ca8143d2cb9d78a776cf19/transformed/android.jar"
BUILDER_JAR = "/home/cyber/.gradle/caches/modules-2/files-2.1/com.android.tools.build/builder/8.3.0/8e1c898e72837e1e5c74f6f4bf7c37ce838b57a9/builder-8.3.0.jar"
ANDROID_FRAMEWORK = "/usr/share/android-framework-res/framework-res.apk"

print("==================================================")
print("🚀 Building 1X-BET Global Android Standalone APK")
print("==================================================")

# Generate Keystore if missing
if not os.path.exists(KEYSTORE):
    print("[0/6] Generating Android Debug Keystore...")
    cmd_ks = f'keytool -genkey -v -keystore "{KEYSTORE}" -storepass android -alias androiddebugkey -keypass android -keyalg RSA -keysize 2048 -validity 10000 -deststoretype JKS -dname "CN=1X-BET Debug, O=1X-BET Global, C=PK"'
    subprocess.run(cmd_ks, shell=True, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

os.makedirs(BUILD_DIR, exist_ok=True)
if os.path.exists(CLASSES_DIR): shutil.rmtree(CLASSES_DIR)
os.makedirs(CLASSES_DIR, exist_ok=True)

compiled_res_zip = os.path.join(BUILD_DIR, 'compiled_res.zip')
unaligned_apk = os.path.join(BUILD_DIR, 'unaligned.apk')
aligned_apk = os.path.join(BUILD_DIR, 'aligned.apk')
classes_dex = os.path.join(BUILD_DIR, 'classes.dex')

print("[1/6] Compiling Java code (MainActivity.java)...")
cmd_javac = f'javac -cp "{ANDROID_JAR}" "{JAVA_SRC}" -d "{CLASSES_DIR}"'
subprocess.run(cmd_javac, shell=True, check=True)

print("[2/6] Packaging classes into JAR & Dexing with D8...")
if os.path.exists(APP_JAR): os.remove(APP_JAR)
cmd_jar = f'jar cf "{APP_JAR}" -C "{CLASSES_DIR}" .'
subprocess.run(cmd_jar, shell=True, check=True)

cmd_d8 = f'java -cp "{BUILDER_JAR}" com.android.tools.r8.D8 --lib "{ANDROID_JAR}" --min-api 21 --output "{BUILD_DIR}" "{APP_JAR}"'
subprocess.run(cmd_d8, shell=True, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

print("[3/6] Compiling Android resources with aapt2...")
if os.path.exists(compiled_res_zip): os.remove(compiled_res_zip)
cmd_compile = f'aapt2 compile --dir "{RES_DIR}" -o "{compiled_res_zip}"'
subprocess.run(cmd_compile, shell=True, check=True)

print("[4/6] Linking APK resources & manifest...")
if os.path.exists(unaligned_apk): os.remove(unaligned_apk)
cmd_link = f'aapt2 link -o "{unaligned_apk}" -I "{ANDROID_FRAMEWORK}" --manifest "{MANIFEST}" "{compiled_res_zip}" --auto-add-overlay'
subprocess.run(cmd_link, shell=True, check=True)

print("[5/6] Packaging classes.dex into APK bundle...")
with zipfile.ZipFile(unaligned_apk, 'a') as zip_ref:
    zip_ref.write(classes_dex, 'classes.dex')

print("[6/6] Zip-aligning & Signing APK with Android Keystore...")
if os.path.exists(aligned_apk): os.remove(aligned_apk)
cmd_align = f'zipalign -v 4 "{unaligned_apk}" "{aligned_apk}"'
subprocess.run(cmd_align, shell=True, check=True, stdout=subprocess.DEVNULL)

cmd_sign = f'apksigner sign --ks "{KEYSTORE}" --ks-pass pass:android "{aligned_apk}"'
subprocess.run(cmd_sign, shell=True, check=True)

shutil.copy2(aligned_apk, OUTPUT_APK)
WORKSPACE_APK = "/home/cyber/Desktop/antigravity/1X-BET_Global.apk"
shutil.copy2(aligned_apk, WORKSPACE_APK)

file_size_kb = os.path.getsize(OUTPUT_APK) / 1024
print(f"\n==================================================")
print(f"🎉 SUCCESS! 1X-BET Android APK Generated!")
print(f"👉 Project APK: {OUTPUT_APK}")
print(f"👉 Workspace APK: {WORKSPACE_APK}")
print(f"Package: com.xbet.global")
print(f"Version: 1.0.0 (Code 1)")
print(f"File Size: {file_size_kb:.1f} KB")
print(f"==================================================")
