# 快速开始

## 支持平台

目前 Vnite 只支持 Windows 平台，后续可能会支持 Android、iOS 等移动平台来远程串流 Windows 上的游戏，敬请期待。

## 下载并安装

Vnite 托管于 Github，所有的版本更新都以 release 形式发布，可在此处获取最新的安装包。

- https://github.com/ximu3/vnite/releases

## 导入游戏

Vnite 目前支持三种导入方式。

1. 批量添加
2. 单个添加
3. 自定义添加

其中方法 1 和 3 需要电脑本地存在该游戏，方法 1 和 2 需要该游戏可被刮削器识别。

### 批量添加

选择一个库文件夹，Vnite 会读取所有一级子文件夹名作为游戏原名，用户可修改并附加 gid、vid 来提高刮削准确性。每个游戏刮削进程独立，用户可对刮削失败的游戏进行调整和重试。

>[!TIP]
>批量添加时用户无法选择背景图，默认使用第一张。

![batch_add](https://img.timero.xyz/i/2024/10/06/67022a28eec1f.webp)

### 单个添加

单个添加支持模糊搜索和精准刮削，模糊搜索支持日文名、中文名、别名。精准刮削需提供 gid 和 vid。

![single_add_1](https://img.timero.xyz/i/2024/10/06/6701fa2c20966.webp)

![single_add_2](https://img.timero.xyz/i/2024/10/06/6701fa5da6454.webp)

### 自定义添加

直接将游戏启动程序拖入 Vnite 中即可完成添加，后续可自定义元数据或重新刮削。

