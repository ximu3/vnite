# 添加游戏

Vnite 目前支持三种添加游戏的方式。

1. 使用刮削器 - 批量添加
2. 使用刮削器 - 单个添加
3. 不使用刮削器

其中方法 1 和 3 需要电脑本地存在该游戏，方法 1 和 2 需要该游戏可被刮削器识别。

## 批量添加

选择一个库文件夹，Vnite 会读取所有一级子文件夹名作为游戏原名，用户可修改并附加 `对应数据源` 的 `游戏 ID` 来提高刮削准确性。每个游戏刮削进程独立，用户可对刮削失败的游戏进行调整和重试。

> [!TIP]
> 批量添加时用户无法选择背景图，默认使用第一张。

![gameBatchAdder](https://img.timero.xyz/i/2024/12/09/6756aa3c961e0.png)

## 单个添加

单个添加支持模糊搜索和精准刮削，模糊搜索准确度不同数据源会有所不同。精准刮削需提供 `对应数据源` 的 `游戏 ID` 。

![gameSingleAdder1](https://img.timero.xyz/i/2024/12/09/6756abba60f0a.png)

![gameSingleAdder2](https://img.timero.xyz/i/2024/12/09/6756abe2630a8.png)

![gameSingleAdder3](https://img.timero.xyz/i/2024/12/09/6756abf9dc435.png)

## 自定义添加

选择可执行文件路径即可完成添加，后续可自定义元数据或重新刮削。