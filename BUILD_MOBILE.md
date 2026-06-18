# 移动端构建和分发指南

## 你已有

- ✅ Capacitor Android 项目已在 `android/` 目录
- ✅ 6 个原生插件已配置（通知、触觉、启动画面、状态栏、App 生命周期、推送）
- ✅ Web 代码已适配 Capacitor（base: './' + 安全区域 + 返回键 + 状态栏）
- ✅ 旧版 TWA 签名密钥 `release.keystore` 可复用

## 前置条件

### Android（Windows / macOS / Linux 均可）

1. **安装 Android Studio** → https://developer.android.com/studio
   - 安装时勾选 Android SDK、Android SDK Platform-Tools、Android Emulator
2. **JDK 17+** — Android Studio 自带，或单独安装
3. **Android SDK** — 默认安装在 `%LOCALAPPDATA%\Android\Sdk` (Windows) 或 `~/Library/Android/sdk` (macOS)
4. **设置环境变量**（Windows 可选，Android Studio 会自动配置）：
   ```
   ANDROID_HOME=C:\Users\你的用户名\AppData\Local\Android\Sdk
   ```

### iOS（仅 macOS）

1. **Xcode 16+** → Mac App Store
2. **Apple Developer Program** → $99/年 → https://developer.apple.com
3. **CocoaPods** → `sudo gem install cocoapods`（Capacitor iOS 依赖管理）

---

## Android 构建步骤

### 1. 构建前端代码

```bash
npm run build
npx cap sync android
```

### 2. 配置签名密钥

如果你已经有旧版 TWA 的 `release.keystore`，直接复用：

```bash
# 将 release.keystore 复制到 android/ 目录
copy android-twa\release.keystore android\release.keystore
```

然后在 `android/variables.gradle` 或 `android/app/build.gradle` 中配置签名。

### 3. 用 Android Studio 打开

```bash
npx cap open android
```

或者在 Android Studio 中打开 `android/` 目录。

### 4. 构建 APK（测试用）

在 Android Studio 中：
- Build → Build Bundle(s) / APK(s) → Build APK(s)
- 输出路径：`android/app/build/outputs/apk/debug/app-debug.apk`

### 5. 构建签名 APK / AAB（发布用）

**配置签名：** 在 `android/app/build.gradle` 中添加：

```gradle
android {
    signingConfigs {
        release {
            storeFile file("release.keystore")
            storePassword "你的密钥密码"
            keyAlias "你的key别名"
            keyPassword "你的key密码"
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
        }
    }
}
```

**构建：**
- APK：Build → Build Bundle(s) / APK(s) → Build APK(s)（选择 release）
- AAB（Google Play 推荐）：Build → Generate Signed Bundle / APK → Android App Bundle

### 6. Google Play 发布

1. 打开 https://play.google.com/console → 创建应用
2. 应用名称：认知工作台
3. 包名：`site.leizhangphy.workbench`（与已有 TWA 一致）
4. 上传 AAB，填写描述、截图、隐私政策 URL
5. 提交审核

---

## iOS 构建步骤（仅 macOS）

### 1. 初始化 iOS 平台

```bash
npm run build
npx cap add ios
npx cap sync ios
```

### 2. 配置 Xcode 项目

```bash
npx cap open ios
```

### 3. 配置签名

在 Xcode 中：
1. 选择项目 → Signing & Capabilities
2. Team 选择你的 Apple Developer 账号
3. Bundle Identifier：`site.leizhangphy.workbench`
4. 确保 Automatically manage signing 已勾选

### 4. 添加推送通知能力

在 Xcode → Signing & Capabilities → + Capability → Push Notifications

### 5. 构建 IPA

- Product → Archive
- 在 Organizer 窗口中 → Distribute App → App Store Connect → Upload

### 6. TestFlight 分发

1. 在 App Store Connect 中创建 App
2. 上传构建版本后，在 TestFlight 中添加内部测试员
3. 测试员通过 TestFlight App 安装测试

### 7. App Store 发布

1. 填写 App 信息（描述、截图、隐私政策、年龄分级）
2. 提交审核
3. 审核通过后发布

---

## 启动画面和图标

### Android

替换以下文件：
- 图标：`android/app/src/main/res/mipmap-*/ic_launcher.png`（各尺寸）
- 启动画面：由 `@capacitor/splash-screen` 插件自动处理

使用 Android Studio 的 Image Asset Studio 生成各尺寸图标：
- 右键 `res` → New → Image Asset → 选择你的 `icon.svg`

### iOS

在 Xcode 中：
- 图标：Assets.xcassets → AppIcon → 拖入各尺寸图标（1024x1024 源文件）
- 启动画面：Assets.xcassets → 由 Capacitor 自动处理

---

## 快速命令参考

```bash
# 开发阶段（Web 预览）
npm run dev

# 构建 Web + 同步到 Android
npm run cap:build:android

# 构建 Web + 同步到 iOS（仅 Mac）
npm run cap:build:ios

# 仅同步（代码修改后）
npm run cap:sync
```

---

## 与旧版 TWA 的关系

| | TWA（旧） | Capacitor（新） |
|---|---|---|
| 用途 | Web 快速安装 | App Store 主力分发 |
| 功能 | 纯 WebView 外壳 | WebView + 原生通知/触觉/启动画面 |
| 分发 | 直接下 APK | Google Play + App Store |
| 签名 | `release.keystore` | 复用相同密钥 |
| 是否保留 | ✅ 保留 | ✅ 主力 |

**TWA 保留用途：** 用户访问 `leizhangphy.site` 时可以"安装"到桌面（PWA 安装），适合不想上应用商店的用户。

---

## 注意事项

- **签名密钥**必须保管好，丢了无法更新已发布 App
- **包名** `site.leizhangphy.workbench` 不要改，改了就是另一个 App
- **中国区 Android**：Google Play 不在国内可用，可以同时分发到酷安等国内渠道
- **App 备案**：中国区 App Store 和国内安卓渠道需要在工信部备案，准备 ICP 备案号和隐私政策 URL
