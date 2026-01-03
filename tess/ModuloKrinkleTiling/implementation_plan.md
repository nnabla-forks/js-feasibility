# Modulo Krinkle Tiling 実装計画 (フェーズ1)

ユーザーの要望により、まずは**プロトタイル（Prototile）の作成と表示**のみに焦点を絞ったアプリケーションを構築します。

## 目標
パラメータ $m, k, n$ に基づいて、単一の「ウェッジ（Wedge）」形状＝プロトタイルを正しく生成し、Canvas上に描画する。

## ユーザーレビューが必要な事項
- `l_seq` と `u_seq` の定義の再確認。
- プロトタイルが閉じた図形になるかの検証（始点と終点が一致するか）。

## 提案される変更

### 1. ロジック (`krinkle.js`)
- `generate(Math, A, B)` を `generatePrototile(m, k, n)` に変更（またはラップ）。
- **アルゴリズム**:
    1. `l_seq` (Lower Boundary): 論文の定義通り $l_j = (j \times m) \pmod k$ ($j=0 \dots k-1$)。
    2. `u_seq` (Upper Boundary): `l_seq` の中の $0$ を $k$ に置換したもの（論文 Observation 6.6）。
    3. **パス生成**:
        - 原点 $(0,0)$ からスタート。
        - `l_seq` の各方向 $d$ についてベクトルを加算（Lower Path）。
        - 到達点から、`u_seq` の各方向 $d$ についてベクトルを**減算**（Upper Path を逆走して原点に戻る）。
    4. **デバッグ情報**:
        - パスの始点と終点の座標誤差をコンソール出力。
        - 各エッジに方向インデックスを表示（オプション）。

### 2. UI (`index.html`, `main.js`)
- **モード**: "Prototile Viewer" モードとして動作。
- **操作**: パラメータ変更時に即座にプロトタイルを再描画。
- **表示**:
    - 単一のポリゴンを画面中央に大きく表示。
    - 頂点やエッジの情報を可視化（デバッグ用）。

### 3. レンダラー (`renderer.js`)
- 自動センタリング・ズーム機能を追加（単一図形が画面に収まるように）。

## 検証方法
- $k=7, m=3, n=14$ 等のパラメータで実行し、図形が閉じているか（始点＝終点）を確認する。
- 論文の図2（Figure 2）と比較する。

# Phase 2: Wedge Mode Implementation

## Goal
Enable "Wedge Mode" to visualize how prototiles are assembled into a wedge-shaped region, as described in Section 4 of the paper.

## UI Changes
- Add **Mode Selector**: [Prototile, Wedge].
- Add **Wedge Depth Input**: Parameter to control how many layers of tiles to generate (e.g., `rows`).

## Logic Changes (`app.js`)
1. **Renderer Update**: 
   - Update `autoCenter` to calculate bounding box of *all* polygons, not just the first one.
   
2. **Generator Update**:
   - Implement `generateWedge(m, k, n, rows)`.
   - Calculate basic vectors:
     - `d0`: Translation vector for row shift (sum of lower boundary vectors).
     - `d1`: Translation vector for in-row shift (`v_k - v_0`).
   - Loop `r` from 0 to `rows-1` and `c` from 0 to `r` (triangular structure).
   - Calculate position: `pos = r * d0 + c * d1`.
   - Generate prototile path shifted by `pos`.
   - Apply 3-coloring logic: `(r + c + offset) % 3` with palette.

3. **Controller Update**:
   - Handle mode switch.
   - Pass `rows` parameter.

## Verification
- Compare simple case (m=3, k=7) with Figure 4 in the paper.
- Ensure tiles align perfectly without gaps (visual check).
