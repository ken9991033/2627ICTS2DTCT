# 深入科技｜ICT 選科講座網站

中三升中四選科講座用的沉浸式簡報網站（約 20 分鐘，共 20 站）。以 Prezi 式鏡頭轉場，由手機表面一層一層「Zoom 入去」（介面 → 程式 → 數據 → 硬件），再「Zoom 出去」（網絡 → 社會），之後介紹選修、SBA、評核及出路。全部由老師在台上示範，學生不需要使用裝置。

## 開啟方法

**網上版（建議）**：在 GitHub 打開 repository → **Settings → Pages** → Source 選 **Deploy from a branch** → Branch 選 `claude/hkdse-ict-presentation-n200cw`、資料夾 **/ (root)** → Save。一兩分鐘後開啟：

`https://ken9991033.github.io/2627ICTS2DTCT/ict-talk/`

（GitHub Pages 每個 repository 只可發佈一個 branch。如已用來發佈「花階磚設計工作室」，可把本分支合併到該分支，網址同樣是 `…/ict-talk/`。）

**本機播放**：網站使用 JavaScript 模組及 WebAssembly，不能直接雙擊 `index.html`。可在 repository 根目錄執行 `python -m http.server 8000`，再開啟 `http://localhost:8000/ict-talk/`。

## 講座前準備（建議提早 5 分鐘）

1. 用 **Chrome 或 Edge** 開啟網址，按 **F** 進入全螢幕。
2. 停留在第一站約 30 秒：網站會在背景載入 Python（約 13 MB），之後「程式層」及「數據庫」兩站可即場執行真正的 Python 程式。
3. 如需講者備註，按 **N** 開啟備註視窗，把它拖到手提電腦的螢幕（投影機設為「延伸」模式）。備註視窗有計時器及每站建議時間。
4. 如投影電腦較慢、動畫不流暢，按 **P** 開啟效能模式。
5. 音效預設開啟，可按 **M** 開關。

## 講者快捷鍵

| 按鍵 | 功能 |
|---|---|
| → ／ 空白鍵 ／ PageDown ／ Enter | 下一步（簡報筆的「下一頁」亦可） |
| ← ／ PageUp | 上一步 |
| O | 全景地圖（可點擊跳到任何一站） |
| 1–9、0 | 跳到第 1–10 站；Shift + 數字：第 11–20 站 |
| Home ／ End | 第一站 ／ 最後一站 |
| F | 全螢幕 |
| N | 講者備註視窗 |
| M | 音效開關 |
| B ／ . | 黑屏 |
| P | 效能模式 |
| ? | 顯示快捷鍵 |
| Esc | 離開程式編輯器 ／ 關閉視窗 |

在程式編輯器內打字時，方向鍵不會轉頁；按 Esc 離開編輯器即可繼續用鍵盤轉頁。

## 修改內容

- 每一站是一個檔案：`js/stations/<站名>.js`。檔案開頭是該站的標題、講者備註（`notes`）及文字內容。
- 站的次序在 `js/stations/index.js`。
- 課程數字（課時、評核比重）以《資訊及通訊科技課程及評估指引（中四至中六）》為準，請按學校使用的最新版本核對。

## 技術

- 簡報引擎：`js/core/app.js`（各站、步驟、轉場、HUD、全景地圖、鍵盤、備註同步）、`js/core/transitions.js`（鏡頭轉場）。
- 背景：`js/core/bg.js`（three.js 星空隧道及可組字的粒子）。
- 音效：`js/core/sfx.js`（Web Audio 即時合成，沒有音效檔）。
- Python：`js/core/python.js`（Pyodide，CPython 編譯成 WebAssembly）。
- 第三方程式庫（已放在 `vendor/`，不需上網下載）：GSAP 3.15（GreenSock 標準免費授權）、three.js r186（MIT）、Pyodide 314（MPL-2.0）、TopoJSON Client 及 world-atlas（ISC）、Noto Sans TC 及 JetBrains Mono 字型（SIL OFL）、Lucide 圖示（ISC）。
- 開發用截圖工具：`tools/shoot.mjs`（Playwright）。
