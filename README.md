スイッチの情報をキーボード入力として伝えるやつ
==============================================

[Seeeduino XIAO](https://wiki.seeedstudio.com/Seeeduino-XIAO/) を利用して、スイッチの状態をキーボード入力としてパソコンなどに伝えます。

## 受信デモ

[スイッチの情報をキーボード入力として伝えるやつ 受信デモ](https://mikecat.github.io/switch_as_keyboard/)

## 開発環境のセットアップ

[Arduino IDE](https://www.arduino.cc/en/software) を用います。

[Seeeduino XIAO で入力の変化をUSBキーボードのキー押下として伝える #Arduino - Qiita](https://qiita.com/mikecat_mixc/items/c3f5e39e54b36b1a538a)

## 想定ハードウェア

### sak6 (スイッチ6個)

![完成品](sak6_phy.jpg)

![設計図](sak6_board.png)

Seeeduino XIAOを奥にしたとき、左端のスイッチが1番目、右端のスイッチが6番目です。

基板は[秋月電子通商](https://akizukidenshi.com/catalog/default.aspx)のC基板、スイッチは秋月電子通商の販売コード 100300 です。

## プロトコル

スイッチの状態が変化したとき、全スイッチの状態を送信します。

まず、空白 (ASCII 0x20) を1個送信します。  
空白は受信状態のリセットの指示であり、空白を受信したら受信状態を初期状態に戻します。

次に、データを[Base64](https://ja.wikipedia.org/wiki/Base64)風にエンコードして送信します。  
データをBase64と同様に分割し、3バイトごとに4文字で送信します。  
62番目の文字は `,` を、63番目の文字は `.` を用います。  
パディングは入れません。

送信するデータは、以下の形式です。

1. スイッチの数から1を引いた値 (1バイト)
2. 各スイッチのデータ
3. チェック用データ (1バイト)

「各スイッチのデータ」は、「最初」のスイッチの情報から「最後」のスイッチの情報に向かって並べます。  
1バイトに8個のスイッチの情報を格納し、必要十分なバイト数を用います。  
すなわち、バイト数はスイッチの数を8で割って切り上げた数になります。  
各バイトでは、LSB側に「最初」に近いスイッチの情報を、MSB側に「最後」に近いスイッチの情報を配置します。  
ビット「0」が「OFF」を、「1」が「ON」を表します。  
スイッチの数が8で割り切れない場合、余りの分は最後のバイトのMSB側に対応させ、これらのビットは未定義 (無視、ただしチェック用データには反映) です。

「チェック用データ」は、送信するデータのバイトを全て足して 0x100 で割った余りが 0x00 になるように設定します。

例として、スイッチが10個あり、1番目、6番目、7番目、10番目がON、2番目～5番目および8～9番目がOFFの場合、以下のデータで表すことができます。

```
09 61 02 94
```

これをエンコードすると

```
CWEClA
```

となります。

受信側は、まず、スイッチの数の情報をもとに受信するべきデータの長さを決定します。  
受信するべき分データを受信したら、受信 (してデコード) したバイト列の和を 0x100 で割った余りが 0x00 になっているかを確認します。  
なっていれば、正常なデータを受信したので、データを処理し、受信状態を初期状態に戻します。  
なっていなければ、エラー状態に入り、空白を受信するまで空白以外のデータを無視します。
