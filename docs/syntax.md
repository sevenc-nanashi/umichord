# 表記法

## コード単体

以下の順序で記述します：

```
<root><firstTension><variant><omit><fifth><tensions><slashBass>
<root><variant><firstTension><omit><fifth><tensions><slashBass>
```

それぞれ、

- `root`；コードのルート。`1`、`1+`、`2-`、`2`など
- `firstTension`；7th/6th。`7`、`M7`、`6`、`b6`
- `variant`；コードの種類。`M`、`m`、`dim`、`aug`、`aug8`、`dim7`、`sus2`、`sus4`、`susb2`、`susb4`
- `omit`；省略する音。`omit3`、`omit5`、`omit35`
- `fifth`；5thの変化。`b5`、`#5`
- `tensions`；テンション。`()`に囲み、9th、11th、13th...の順で列挙します。
  - `+`はシャープ、`-`はフラット、`=`はナチュラル、`_`はなしを表します。（`(+_=)`：9thがシャープ、11thがなし、13thがナチュラル）
- `slashBass`；分数コードのベース。`/3`、`/5`など

例：

- `1M7`：IMaj7
- `1m7`：Im7
- `1sus4`：Isus4
- `17sus2`：I7sus2
- `1dim7`：Idim7
- `1aug7`：IAug7
- `1m7b5`：Im7(b5)
- `1M7#5`：IMaj7(#5)
- `1M7(=)`：IMaj7(add9)
- `1M7(+_=)`：IMaj7(add#9,13)
- `1M7(+_+)`：IMaj7(add#9,#13)

## 譜面の書き方

TODO: いい説明を書く

- 区間を分割します
- 分割の比率は`:`の後に続く数字で指定します。例えば、`chord1:2 chord2`は、`chord1`が全体の3分の2、`chord2`が全体の3分の1を占めることを意味します。
- 外側から分割されます。つまり、`[chord1:2 chord2] chord3`は、まず一番外側の区間が`[chord1:2 chord2]`と`chord3`に分割され（chord3が1/2）、次に`[chord1:2 chord2]`が`chord1`と`chord2`に分割されます。

- `~`を指定するとノーコードになります。例えば、`chord1 ~ chord2`は、`chord1`と`chord2`の間にノーコードの区間が入ることを意味します。
- `_`を指定すると空白になります。例えば、`chord1 _ chord2`は、`chord1`と`chord2`の間に空白が入ることを意味します。

```
[chord1:2 chord2] chord3
```

の場合、

```
chord1| |--|--|  |  |  |  |
chord2| |  |  |--|  |  |  |
chord3| |  |  |  |--|--|--|
```

のようになります。

### コメント

`#`以降はコメントになり、無視されます。

### 特殊指示

`!`から始まる行は特殊指示になります。
以下の指示が定義されています：

- `!bar <range> [tempo?] [timeSignature?]`：１小節がどれくらいの長さかを指定します。rangeで指定した区間が1小節になります。
  - `tempo`はBPMを指定します。例えば、`!bar 1/1 120`は、横幅全体が120BPMの1小節であることを意味します。
  - `timeSignature`は拍子を指定します。例えば、`!bar 1/1 4/4`は、横幅全体が4/4拍子の1小節であることを意味します。
  - `!bar 1/1 120 4/4`のように同時に指定することもできます。
- `!gradualTempoChange <start> <length> <direction>`：徐々にテンポを変化させることを指定します。startからstart+lengthの区間でテンポが変化します。directionは`up`か`down`で、テンポを上げるか下げるかを指定します。
  - 例えば、`!gradualTempoChange 1/2 1/2 up`は、横幅の後半の1小節で徐々にテンポを上げることを意味します。
- `!key <keySignature>`：調を指定します。例えば、`!key C#`は、C#が調であることを意味します。
- `!keyChange <prevKey> <newKey>`：調の変更を指定します。prevKeyからnewKeyに変更します。例えば、`!keyChange C# D`は、C#からDに調が変わることを意味します。
- `!note <text>`：行の左上にテキストを表示します。例えば、`!note イントロ`は、行の左上に「イントロ」と表示することを意味します。

### 約物

約物はすべて行末に置きます。

- `,`：白抜きコンマ（音楽的に意味のあるまとまり）
- `,,`：黒塗りコンマ（曲の区間の区切り）
- `.`：ピリオド（曲の節の区切り）
- `..`：∴（曲の終わり）
- `:`：コロン（組曲などで曲が大きく変化する）
- `;`：セミコロン（メドレーのように滑らかに曲が変化する）
