import type * as Monaco from "monaco-editor";

export const LANGUAGE_ID = "umichord";

const directives: [RegExp, string[]][] = [
  // !gradualTempoChange start length up|down
  [
    /^(!)(gradualTempoChange)(\s+\d+\/\d+)(\s+\d+\/\d+)(\s+)(up|down)$/,
    ["directive.excl", "directive.name", "fraction", "fraction", "", "directive.dir"],
  ],
  // !keyChange prevKey newKey
  [
    /^(!)(keyChange)(\s+[A-G][#b]?)(\s+[A-G][#b]?)$/,
    ["directive.excl", "directive.name", "keyname", "keyname"],
  ],
  // !key name
  [/^(!)(key)(\s+[A-G][#b]?)$/, ["directive.excl", "directive.name", "keyname"]],
  // !bar length tempo timeSig（全組み合わせ: 長いものから先）
  [
    /^(!)(bar)(\s+\d+\/\d+)(\s+\d+)(\s+\d+\/\d+)$/,
    ["directive.excl", "directive.name", "fraction", "tempo", "fraction"],
  ],
  // !bar length tempo
  [/^(!)(bar)(\s+\d+\/\d+)(\s+\d+)$/, ["directive.excl", "directive.name", "fraction", "tempo"]],
  // !bar length timeSig
  [
    /^(!)(bar)(\s+\d+\/\d+)(\s+\d+\/\d+)$/,
    ["directive.excl", "directive.name", "fraction", "fraction"],
  ],
  // !bar length
  [/^(!)(bar)(\s+\d+\/\d+)$/, ["directive.excl", "directive.name", "fraction"]],
  // 不明な指示 or 引数が足りない場合のフォールバック
  [/^(!)(\S*)/, ["directive.excl", "directive.name"]],
];

/**
 * Monarch トークナイザ定義
 *
 * トークン種別:
 *   root       - コードのルート音 (1-7 + 修飾子)
 *   variant    - コード種類 (m, M, dim, aug, sus*)
 *   tension1   - 7th/6th 表記 (7, M7, 6, b6)
 *   fifth      - 5th 変化 (b5, #5)
 *   omit       - 省略指示 (omit3, omit5, omit35)
 *   slash      - スラッシュベース (/N)
 *   bracket    - テンションブラケット ( )
 *   tension    - ブラケット内テンション (+, -, =, _)
 *   weight     - 分割比率 (:N)
 *   special    - _ ~ ノーコード・空白
 *   punct      - 行末約物 (, ,, . .. : ;)
 *   directive  - 特殊指示 (!bar など)
 *   keyname    - 調名 (C, C#, Db, ...)
 *   fraction   - 分数 (1/1, 3/4, ...)
 *   tempo      - BPM など数値
 *   comment    - コメント
 */
export const monarchTokens: Monaco.languages.IMonarchLanguage = {
  defaultToken: "",

  tokenizer: {
    root: [
      // コメント（# が行頭か空白直後）
      [/^\s*#.*$/, "comment"],
      [/\s#.*$/, "comment"],

      // ====== 特殊指示行（行全体をキャプチャグループで処理、サブ状態は使わない） ======
      ...directives,

      // ====== コード行 ======

      // ノーコード・空白（単独トークン）
      [/_/, "special"],
      [/~/, "special"],

      // レイアウトブラケット（透明）
      [/[[]]/, ""],

      // ルート音（1-7 + 修飾子）→ chord サブ状態へ
      [/[1-7][+-]?/, { token: "root", next: "@chord" }],

      // 重み (:N) ─ グループ後の ]:N など
      [/:\d+(?:\.\d+)?/, "weight"],

      // 行末約物（長いものから先）
      [/,,/, "punct"],
      [/,/, "punct"],
      [/\.\./, "punct"],
      [/\./, "punct"],
      [/;/, "punct"],
      // : は :\d+ の weight に該当しない場合のみ
      [/:(?!\d)/, "punct"],

      // その他の空白
      [/\s+/, ""],
    ],

    // ルート音の直後に続くコード修飾子をハイライトする状態
    // （lookbehind 不要で 7th/6th をルートと区別できる）
    chord: [
      // NOTE: chord 状態は行をまたいで持ち越される可能性があるため、directivesをここにも置く必要がある。
      ...directives.map(
        ([regex, tokenTypes]) => [regex, tokenTypes, "@pop"] as [RegExp, string[], string],
      ),

      // ── 行頭専用（^ は Monarch では pos=0 のみマッチ）──
      // 行をまたいで chord 状態が持ち越された場合、次の行の先頭を正しく処理する。
      // これらは 7/6 の tension1 ルールより前に置く必要がある。
      [/^\s*#.*$/, "comment"],
      // 行頭のルート音: 状態遷移なし（chord のまま後続の修飾子を受け付ける）
      [/^[1-7][+-]?/, "root"],
      // 行頭のノーコード・空白
      [/^~/, { token: "special", next: "@pop" }],
      [/^_/, { token: "special", next: "@pop" }],

      // インラインコメント（空白 + # + 残り）
      [/\s+#.*$/, "comment"],

      // バリアント（長いものから先）
      [/dim7/, "variant"],
      [/dim(?!7)/, "variant"],
      [/aug8/, "variant"],
      [/aug(?!8)/, "variant"],
      [/sus(?:b2|#4|b4|2|4)/, "variant"],

      // firstTension（M7 を先に）
      [/M7/, "tension1"],
      [/b6/, "tension1"],
      [/b5/, "fifth"],
      [/#5/, "fifth"],
      [/(?<![0-9])7/, "tension1"],
      [/(?<![0-9])6/, "tension1"],

      // バリアント M / m（単独）
      [/M/, "variant"],
      [/m/, "variant"],

      // omit（長いものから先）
      [/omit35|omit3|omit5/, "omit"],

      // テンションブラケット open
      [/\(/, { token: "bracket", next: "@tensions" }],

      // スラッシュベース
      [/\/[1-7][+-]?/, "slash"],

      // 重み後に終了
      [/:\d+(?:\.\d+)?/, { token: "weight", next: "@pop" }],

      // 約物で終了
      [/,,/, { token: "punct", next: "@pop" }],
      [/\.\./, { token: "punct", next: "@pop" }],
      [/,/, { token: "punct", next: "@pop" }],
      [/\./, { token: "punct", next: "@pop" }],
      [/;/, { token: "punct", next: "@pop" }],
      [/:/, { token: "punct", next: "@pop" }],

      // 空白・ブラケットで終了（pop して root へ戻る）
      [/[\s[]]/, { token: "", next: "@pop" }],

      // フォールバック終了
      [/./, { token: "", next: "@pop" }],
    ],

    tensions: [
      // テンション文字
      [/[+-]/, "tension.sharp"],
      [/=/, "tension.natural"],
      [/_/, "tension.null"],
      // close bracket
      [/\)/, { token: "bracket", next: "@pop" }],
    ],
  },
};

/** カスタムテーマ（ライトベース） */
export const themeData: Monaco.editor.IStandaloneThemeData = {
  base: "vs",
  inherit: true,
  rules: [
    // ルート音: プライマリカラー
    { token: "root", foreground: "c0415f", fontStyle: "bold" },
    // バリアント: セカンダリカラー
    { token: "variant", foreground: "7b6aa0" },
    // firstTension (7th/6th): アンバー
    { token: "tension1", foreground: "b07a10" },
    // 5th 変化: ティール
    { token: "fifth", foreground: "2e8c6a" },
    // omit: グレー
    { token: "omit", foreground: "888888" },
    // スラッシュベース: ペリウィンクル
    { token: "slash", foreground: "5060c8" },
    // ブラケット
    { token: "bracket", foreground: "555555" },
    // テンション文字
    { token: "tension.sharp", foreground: "2e8c6a", fontStyle: "bold" },
    { token: "tension.natural", foreground: "2e8c6a" },
    { token: "tension.null", foreground: "aaaaaa" },
    // 重み
    { token: "weight", foreground: "aaaaaa" },
    // ノーコード・空白
    { token: "special", foreground: "999999", fontStyle: "italic" },
    // 行末約物
    { token: "punct", foreground: "e05080", fontStyle: "bold" },
    // 特殊指示
    { token: "directive", foreground: "3a7fcc", fontStyle: "bold" },
    { token: "directive.excl", foreground: "3a7fcc", fontStyle: "bold" },
    { token: "directive.name", foreground: "3a7fcc", fontStyle: "bold" },
    { token: "directive.dir", foreground: "7b6aa0" },
    { token: "keyname", foreground: "c0415f" },
    { token: "fraction", foreground: "888888" },
    { token: "tempo", foreground: "888888" },
    // コメント
    { token: "comment", foreground: "aaaaaa", fontStyle: "italic" },
  ],
  colors: {
    "editor.background": "#fffbfc",
    "editor.foreground": "#333333",
    "editor.lineHighlightBackground": "#f8eef1",
    "editorCursor.foreground": "#ea7892",
    "editor.selectionBackground": "#f6849e44",
  },
};
