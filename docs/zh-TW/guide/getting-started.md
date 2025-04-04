# 快速開始

## 支援平台

目前 Vnite 只支援 Windows 平台，後續可能會支援 Android、iOS 等行動平台來遠端串流 Windows 上的遊戲，敬請期待。

## 下載並安裝

Vnite 託管於 Github，所有的版本更新都以 release 形式發布，可在此處獲取最新的安裝包。

- https://github.com/ximu3/vnite/releases

## 添加遊戲

Vnite 目前支援三種添加遊戲的方式。

1. 使用刮削器 - 單個添加（要求：可被刮削器識別）
2. 使用刮削器 - 批次添加（要求：可被刮削器識別、本機存在遊戲）
3. 不使用刮削器（要求：本機存在遊戲）

### 單個添加

單個添加支援模糊搜尋和精準刮削，模糊搜尋語言支援和準確度由資料來源決定。精準刮削需提供 `對應資料來源` 的 `遊戲 ID`。

![gameSingleAdder1](https://img.timero.xyz/i/2025/04/02/67ecf19c18a3c.webp)

![gameSingleAdder2](https://img.timero.xyz/i/2025/04/02/67ecf1b1b35d8.webp)

![gameSingleAdder3](https://img.timero.xyz/i/2025/04/02/67ecf1c222240.webp)

### 批次添加

選擇一個庫資料夾，Vnite 會讀取所有一級子資料夾名作為遊戲原名，使用者可修改並附加 `對應資料來源` 的 `遊戲 ID` 來提高刮削準確性。每個遊戲刮削行程獨立，使用者可對刮削失敗的遊戲進行調整和重試。

> [!TIP]
> 批次添加時使用者無法選擇背景圖，預設使用第一張。

![gameBatchAdder](https://img.timero.xyz/i/2025/04/02/67ecf1ec53201.webp)

### 自訂添加

選擇可執行檔案路徑即可完成添加，後續可自訂中繼資料或重新刮削。
