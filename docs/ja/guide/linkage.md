# 連携

Vniteは、Locale Emulatorなどの他のビジュアルノベル関連ソフトウェアと連携して、プレイヤーのゲーム体験を向上させることができます。

## Locale Emulator

> [!NOTE]
> Locale Emulatorはシステム地域と言語をシミュレートするツールで、システム全体の地域設定を変更せずに、特定のプログラムに対して異なる言語環境をシミュレートすることができます

パソコンにLocale Emulatorがインストールされていることを確認してください。下記リンクからダウンロードしてインストールできます。

- https://github.com/xupefei/Locale-Emulator/releases

インストール後、Vniteの`設定-詳細-連携-Locale Emulator`で`LEProc.exe`のパスをバインドする必要があります。

![linkage](https://img.timero.xyz/i/2025/04/02/67ed2009304c4.webp)

その後、LE地域変換で起動する必要があるゲームの`設定-プロパティ-実行-プリセット構成`で`LE地域起動`を選択するとプリセットが生成されます。

![linkage-le](https://img.timero.xyz/i/2025/04/02/67ed1cd13faeb.webp)

これにより、Vniteでゲームを起動すると、自動的にLEを使用して地域変換が行われます。

## Visual Boy Advance

> [!NOTE]
> Visual Boy Advance (VBA)は人気のゲームエミュレータで、主にGame BoyとGame Boy Advanceゲームシステム上のゲームをエミュレートするために使用されます

パソコンにVisual Boy Advanceがインストールされていることを確認してください。下記リンクからダウンロードしてインストールできます。

- https://visualboyadvance.org

インストール後、Vniteの`設定-詳細-連携-Visual Boy Advance`で`visualboyadvance-m.exe`のパスをバインドする必要があります。

![linkage](https://img.timero.xyz/i/2025/04/02/67ed2009304c4.webp)

その後、VBAエミュレーションで起動する必要があるゲームの`設定-プロパティ-実行-プリセット構成`で`VBA起動`を選択するとプリセットが生成されます。

![linkage-vba](https://img.timero.xyz/i/2025/04/02/67ed1e8c3657c.webp)

これにより、Vniteでゲームを起動すると、自動的にVisual Boy Advanceを使用してエミュレーションが行われます。

## Magpie

> [!NOTE]
> Magpieは軽量のウィンドウスケーリングツールで、様々な効率的なスケーリングアルゴリズムとフィルターを備えています

パソコンにMagpieがインストールされていることを確認してください。下記リンクからダウンロードしてインストールできます。

- https://github.com/Blinue/Magpie/releases

インストール後、Vniteの`設定-詳細-連携-Magpie`で`Magpie.exe`のパスとスケーリングショートカットをバインドする必要があります。

![linkage](https://img.timero.xyz/i/2025/04/02/67ed2009304c4.webp)

![linkage-magpie1](https://img.timero.xyz/i/2025/04/02/67ed1fda7f0e3.webp)

その後、Magpieスケーリングが必要なゲームの`設定-プロパティ-実行`で`Magpieスケーリング`スイッチをオンにします。

![linkage-magpie2](https://img.timero.xyz/i/2025/04/02/67ed1fe474d9c.webp)

これにより、Vniteでゲームを起動すると、自動的にMagpieを使用してスケーリングが行われます。
