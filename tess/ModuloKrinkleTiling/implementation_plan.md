# Modulo Krinkle Tiling エディタ 実装計画

本計画は、論文 "Modulo Krinkle Tiling" に基づくWebベースのエディタ開発の概要です。このエディタにより、ユーザーはモダンでインタラクティブなインターフェースを使用して、これらの非周期的なタイリングを探索および操作できるようになります。

## ユーザーレビューが必要な事項

> [!IMPORTANT]
> **ディレクトリ名**: 既存の空ディレクトリ `tess/ModuloKrinkleTiling.`（末尾にドットあり）を確認しました。リクエスト通り、新しいディレクトリ `tess/ModuloKrinkleTiling`（末尾ドットなし）を作成する計画です。これが正しいか確認してください。

> [!NOTE]
> **タイリングロジック**: 論文の要約からは、"remainder sequences"（余剰数列）やプロトタイル構築の正確な数式が完全には詳述されていません。ロジックの*構造*（入力、座標生成、レンダリング）は実装しますが、正確な `Krinkle` アルゴリズムを実装するには、具体的なガイダンスや疑似コードが必要になる場合があります。

## 提案される変更

### ディレクトリ構造
ターゲットディレクトリ: `tess/ModuloKrinkleTiling/`

- `index.html`: メインのエントリポイント。
- `style.css`: プレミアムなダークモードの美学に向けたスタイルの更新。
- `src/`:
    - `main.js`: アプリケーションの起動とイベント処理。
    - `renderer.js`: Canvas 2D レンダリングロジック（パン、ズーム、描画）。
    - `krinkle.js`: パラメータからタイリングジオメトリを生成するコアロジック。

### 1. プロジェクトセットアップ
#### [NEW] [index.html](file:///Users/buchio/Source/github.com/buchio/js-feasibility/tess/ModuloKrinkleTiling/index.html)
- 基本的なHTML5構造のセットアップ。
- CSSおよびJSモジュールのリンク。
- レイアウト: フローティングコントロールパネルを備えた全画面キャンバス。

#### [NEW] [style.css](file:///Users/buchio/Source/github.com/buchio/js-feasibility/tess/ModuloKrinkleTiling/style.css)
- **テーマ**: ダークモード、鮮やかなアクセントカラー。
- **UI要素**: コントロールパネルのグラスモーフィズム（半透明の背景、ぼかし効果）。
- **タイポグラフィ**: クリーンな外観のためのInterまたはシステムフォント。

### 2. コアアプリケーションロジック
#### [NEW] [main.js](file:///Users/buchio/Source/github.com/buchio/js-feasibility/tess/ModuloKrinkleTiling/src/main.js)
- コントロールパネルからのユーザー入力を処理。
- アプリケーションの状態（パラメータ `a`, `b`, `c` など）を管理。
- ロジックとレンダラー間の更新を調整。

#### [NEW] [renderer.js](file:///Users/buchio/Source/github.com/buchio/js-feasibility/tess/ModuloKrinkleTiling/src/renderer.js)
- レスポンシブなCanvasコンテキストの実装。
- 機能:
    - 無限のキャンバスパンとズーム。
    - 高DPIサポート。
    - 効率的なパス描画。

#### [NEW] [krinkle.js](file:///Users/buchio/Source/github.com/buchio/js-feasibility/tess/ModuloKrinkleTiling/src/krinkle.js)
- **責任**: タイリングジオメトリの生成。
- **入力**: 整数パラメータ（例：A, B, C, Modulo）。
- **出力**: 描画するポリゴン/パスのリスト。
- **プレースホルダー実装**: 正確な数式が利用できない場合、最初は単純なパラメトリックパターンを生成し、正しいアルゴリズムと簡単に置き換えられるように構造化します。

## 検証計画

### 自動テスト
- このビジュアルプロトタイプフェーズでは計画されていません。

### 手動検証
1. **目視検査**: ブラウザで `index.html` を開きます。
2. **UIインタラクション**: パネルのパラメータを変更してキャンバスが更新されることを確認します。
3. **UXチェック**: パンとズームがスムーズに機能することを確認します。
4. **美学**: ダークモードとグラスモーフィズムがプレミアムに見えることを確認します。
