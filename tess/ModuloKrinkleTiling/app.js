/**
 * Modulo Krinkle Tiling - シングルファイルアプリケーション
 * file:// プロトコルでの互換性を確保するために統合されています（CORS/Moduleの問題を回避するため）
 */

// ==========================================
// Renderer クラス
// キャンバスへの描画、ズーム、パン、インタラクションを管理します
// ==========================================
class Renderer {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;

        // ビューポート（表示領域）の状態
        this.scale = 1.0;
        this.offsetX = 0;
        this.offsetY = 0;

        // ドラッグ操作の状態
        this.isDragging = false;
        this.lastX = 0;
        this.lastY = 0;

        this.initEvents();
        this.resize();

        // ホバー（マウスオーバー）の状態
        this.hoveredWedgeIndex = null; // 現在ホバーしているWedgeのインデックス
        this.hoveredDepth = null;      // 現在ホバーしているタイルの深さ（Row Index）
        this.mouseX = 0;
        this.mouseY = 0;

        // 表示/非表示のフラグ
        this.showEdges = true;   // 辺番号の表示
        this.showWedges = true;  // Wedge番号の表示
        this.showTiles = true;   // タイル番号の表示
    }

    initEvents() {
        // リサイズ時のリスナー
        window.addEventListener('resize', () => this.resize());

        // パン（移動）操作のためのマウスイベント
        this.canvas.addEventListener('mousedown', (e) => {
            this.isDragging = true;
            this.lastX = e.clientX;
            this.lastY = e.clientY;
            this.canvas.style.cursor = 'grabbing';
        });

        window.addEventListener('mousemove', (e) => {
            if (this.isDragging) {
                const dx = e.clientX - this.lastX;
                const dy = e.clientY - this.lastY;
                this.offsetX += dx;
                this.offsetY += dy;
                this.lastX = e.clientX;
                this.lastY = e.clientY;
                this.draw(); // ドラッグ中は再描画
            }

            // ホバー判定の更新
            this.handleMouseMove(e.clientX, e.clientY);
        });

        window.addEventListener('mouseup', () => {
            this.isDragging = false;
            this.canvas.style.cursor = 'grab';
        });

        // ズーム操作（ホイールイベント）
        this.canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            const zoomSensitivity = 0.001;
            const delta = -e.deltaY * zoomSensitivity;
            // ズーム倍率の制限
            const newScale = Math.min(Math.max(0.1, this.scale + delta), 20);

            // 単純なズーム（画面中心基準）
            // ※本来はマウス位置基準が望ましいが、実装を簡単にするため中心基準としています
            this.scale = newScale;
            this.draw();
        }, { passive: false });
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        // Center initial view
        this.offsetX = this.canvas.width / 2;
        this.offsetY = this.canvas.height / 2;
        this.draw();
    }

    setDisplayData(polygons, mode = 'prototile') {
        this.polygons = polygons;
        this.mode = mode;
        if (mode === 'tiling') {
            this.calculateWedgeCenters();
            this.calculateTileCenters();
        } else if (mode === 'wedge') {
            this.calculateTileCenters();
        }
        this.draw();
    }

    setOptions(options) {
        if (typeof options.showEdges !== 'undefined') this.showEdges = options.showEdges;
        if (typeof options.showWedges !== 'undefined') this.showWedges = options.showWedges;
        if (typeof options.showTiles !== 'undefined') this.showTiles = options.showTiles;
        this.draw();
    }

    calculateTileCenters() {
        this.tileLabels = [];
        if (!this.polygons) return;

        this.polygons.forEach(poly => {
            if (poly.meta && typeof poly.meta.tileIndex !== 'undefined') {
                // 重心（Centroid）の計算
                let sumX = 0, sumY = 0;
                poly.path.forEach(p => {
                    sumX += p.x;
                    sumY += p.y;
                });

                this.tileLabels.push({
                    x: sumX / poly.path.length,
                    y: sumY / poly.path.length,
                    text: poly.meta.tileIndex.toString()
                });
            }
        });
    }

    calculateWedgeCenters() {
        this.wedgeCenters = {};
        if (!this.polygons) return;

        const sums = {};
        const counts = {};

        this.polygons.forEach(poly => {
            if (poly.meta && typeof poly.meta.wedgeIndex !== 'undefined') {
                const idx = poly.meta.wedgeIndex;
                if (!sums[idx]) {
                    sums[idx] = { x: 0, y: 0 };
                    counts[idx] = 0;
                }

                // 重心の計算（パスの頂点を使用）
                poly.path.forEach(p => {
                    sums[idx].x += p.x;
                    sums[idx].y += p.y;
                    counts[idx]++;
                });
            }
        });

        for (const idx in sums) {
            this.wedgeCenters[idx] = {
                x: sums[idx].x / counts[idx],
                y: sums[idx].y / counts[idx]
            };
        }
    }

    /**
     * Centers the view on a collection of polygons.
     * @param {Array|Object} polygons - Array of polygons or single polygon
     */
    autoCenter(polygons) {
        if (!polygons) return;
        const polyList = Array.isArray(polygons) ? polygons : [polygons];
        if (polyList.length === 0) return;

        let minX = Infinity, minY = Infinity;
        let maxX = -Infinity, maxY = -Infinity;
        let hasPoints = false;

        polyList.forEach(poly => {
            if (!poly.path || poly.path.length === 0) return;
            poly.path.forEach(p => {
                if (p.x < minX) minX = p.x;
                if (p.x > maxX) maxX = p.x;
                if (p.y < minY) minY = p.y;
                if (p.y > maxY) maxY = p.y;
                hasPoints = true;
            });
        });

        if (!hasPoints) return;

        const width = maxX - minX;
        const height = maxY - minY;

        // Add some padding
        const padding = 50;
        const targetW = width + padding * 2;
        const targetH = height + padding * 2;

        const scaleX = this.canvas.width / targetW;
        const scaleY = this.canvas.height / targetH;

        // Basic fit
        this.scale = Math.min(scaleX, scaleY, 5.0); // Limit max zoom

        // Center
        const cx = (minX + maxX) / 2;
        const cy = (minY + maxY) / 2;

        // Reset offset to center the polygon in the middle of the screen
        this.offsetX = (this.canvas.width / 2) - (cx * this.scale);
        this.offsetY = (this.canvas.height / 2) - (cy * this.scale);

        this.draw();
    }

    draw() {
        if (!this.ctx) return;

        // 画面のクリア
        this.ctx.fillStyle = '#0d1117'; // CSSの背景色と一致
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.save();

        // 変換行列の適用（パンとズーム）
        this.ctx.translate(this.offsetX, this.offsetY);
        this.ctx.scale(this.scale, this.scale);

        // 軸の描画（ガイドとして）
        this.ctx.strokeStyle = '#30363d';
        this.ctx.lineWidth = 1 / this.scale;
        this.ctx.beginPath();
        this.ctx.moveTo(-10000, 0);
        this.ctx.lineTo(10000, 0);
        this.ctx.moveTo(0, -10000);
        this.ctx.lineTo(0, 10000);
        this.ctx.stroke();

        // ポリゴンの描画
        if (this.polygons) {
            this.polygons.forEach(poly => {
                this.ctx.beginPath();
                if (poly.path.length > 0) {
                    this.ctx.moveTo(poly.path[0].x, poly.path[0].y);
                    for (let i = 1; i < poly.path.length; i++) {
                        this.ctx.lineTo(poly.path[i].x, poly.path[i].y);
                    }
                    this.ctx.closePath();
                }

                this.ctx.fillStyle = poly.color;
                this.ctx.fill();

                if (poly.stroke) {
                    this.ctx.strokeStyle = poly.stroke;
                    this.ctx.lineWidth = 2 / this.scale;
                    this.ctx.stroke();
                }
            });
        }

        this.ctx.restore();

        // デバッグオーバーレイ（変換行列の内側で描画して位置合わせ）
        this.ctx.save();
        this.ctx.translate(this.offsetX, this.offsetY);
        this.ctx.scale(this.scale, this.scale);

        if (this.polygons) {
            this.polygons.forEach(poly => {
                if (!poly.path || poly.path.length === 0) return;

                // 1. 辺番号の表示 (Prototileモードのみ)
                if (this.mode === 'prototile' && this.showEdges) {
                    this.ctx.fillStyle = '#ffffff';
                    this.ctx.font = `${14 / this.scale}px sans-serif`;
                    this.ctx.textAlign = 'center';
                    this.ctx.textBaseline = 'middle';

                    for (let i = 0; i < poly.path.length - 1; i++) {
                        const p1 = poly.path[i];
                        const p2 = poly.path[i + 1];

                        const midX = (p1.x + p2.x) / 2;
                        const midY = (p1.y + p2.y) / 2;

                        this.ctx.fillText(i.toString(), midX, midY);
                    }
                }

            });
        }

        this.ctx.restore();

        // 2. ホバーオーバーレイ (Tilingモード - Wedge単位)
        // 青色ハイライト（透過）
        if (this.mode === 'tiling' && this.hoveredWedgeIndex !== null && this.polygons) {
            this.ctx.save();
            this.ctx.translate(this.offsetX, this.offsetY);
            this.ctx.scale(this.scale, this.scale);

            this.ctx.fillStyle = 'rgba(0, 0, 192, 0.5)';

            this.polygons.forEach(poly => {
                if (poly.meta && poly.meta.wedgeIndex === this.hoveredWedgeIndex) {
                    this.ctx.beginPath();
                    if (poly.path.length > 0) {
                        this.ctx.moveTo(poly.path[0].x, poly.path[0].y);
                        for (let i = 1; i < poly.path.length; i++) {
                            this.ctx.lineTo(poly.path[i].x, poly.path[i].y);
                        }
                        this.ctx.closePath();
                    }
                    this.ctx.fill();
                }
            });

            this.ctx.restore();
        }

        // 3. 深度（Depth）オーバーレイ (Tilingモード - 同一の深さ)
        // 赤色ハイライト（透過）
        if (this.mode === 'tiling' && this.hoveredDepth !== null && this.polygons) {
            this.ctx.save();
            this.ctx.translate(this.offsetX, this.offsetY);
            this.ctx.scale(this.scale, this.scale);

            this.ctx.fillStyle = 'rgba(192, 0, 0, 0.5)';

            this.polygons.forEach(poly => {
                if (poly.meta && typeof poly.meta.r !== 'undefined' && poly.meta.r === this.hoveredDepth) {
                    this.ctx.beginPath();
                    if (poly.path.length > 0) {
                        this.ctx.moveTo(poly.path[0].x, poly.path[0].y);
                        for (let i = 1; i < poly.path.length; i++) {
                            this.ctx.lineTo(poly.path[i].x, poly.path[i].y);
                        }
                        this.ctx.closePath();
                    }
                    this.ctx.fill();
                }
            });

            this.ctx.restore();
        }

        // 4. ラベル描画
        this.ctx.save();
        this.ctx.translate(this.offsetX, this.offsetY);
        this.ctx.scale(this.scale, this.scale);

        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = `bold ${18 / this.scale}px sans-serif`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';

        // Tilingモード: Wedge番号の表示
        if (this.mode === 'tiling' && this.wedgeCenters && this.showWedges) {
            for (const idx in this.wedgeCenters) {
                const center = this.wedgeCenters[idx];
                // 視認性のためのシャドウ
                this.ctx.shadowColor = "black";
                this.ctx.shadowBlur = 4;
                this.ctx.fillStyle = '#aaffee';
                this.ctx.fillText(idx, center.x, center.y);
                this.ctx.shadowBlur = 0;
            }
        }

        // Wedge/Tilingモード: タイル番号の表示
        if ((this.mode === 'wedge' || this.mode === 'tiling') && this.tileLabels && this.showTiles) {
            this.ctx.font = `bold ${12 / this.scale}px sans-serif`;
            this.tileLabels.forEach(label => {
                // Simple shadow
                this.ctx.shadowColor = "black";
                this.ctx.shadowBlur = 3;
                this.ctx.fillStyle = '#ffffff';
                this.ctx.fillText(label.text, label.x, label.y);
                this.ctx.shadowBlur = 0;
            });
        }

        this.ctx.restore();
    }

    handleMouseMove(mx, my) {
        if (!this.polygons || this.mode !== 'tiling') return;

        // マウス座標をワールド座標に変換
        // screenX = worldX * scale + offsetX
        // worldX = (screenX - offsetX) / scale
        const worldX = (mx - this.offsetX) / this.scale;
        const worldY = (my - this.offsetY) / this.scale;

        // ホバーしているポリゴンを探す
        let foundIndex = null;
        let foundDepth = null;

        // 重なりがある場合に備えて逆順（上から）で探索
        for (let i = this.polygons.length - 1; i >= 0; i--) {
            const poly = this.polygons[i];
            if (this.isPointInPoly(worldX, worldY, poly.path)) {
                foundIndex = poly.meta ? poly.meta.wedgeIndex : null;
                if (poly.meta && typeof poly.meta.r !== 'undefined') {
                    foundDepth = poly.meta.r;
                }
                break;
            }
        }

        let needsRedraw = false;
        if (this.hoveredWedgeIndex !== foundIndex) {
            this.hoveredWedgeIndex = foundIndex;
            needsRedraw = true;
        }
        if (this.hoveredDepth !== foundDepth) {
            this.hoveredDepth = foundDepth;
            needsRedraw = true;
        }

        if (needsRedraw) {
            this.draw();
        }
    }

    isPointInPoly(x, y, path) {
        // レイキャスティングアルゴリズム（点包含判定）
        let inside = false;
        for (let i = 0, j = path.length - 1; i < path.length; j = i++) {
            const xi = path[i].x, yi = path[i].y;
            const xj = path[j].x, yj = path[j].y;

            const intersect = ((yi > y) !== (yj > y)) &&
                (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
            if (intersect) inside = !inside;
        }
        return inside;
    }
}

// ==========================================
// Krinkle Generator Class
// ==========================================
class KrinkleGenerator {
    constructor() {
        this.polygons = [];
    }

    /**
     * Prototile (Wedge 0) を生成します。
     * 論文における基本的なタイルの形状を定義します。
     * @param {number} m - パラメータ m (ステップサイズ)
     * @param {number} k - パラメータ k (モジュラス)
     * @param {number} n - パラメータ n (対称性 - 回転数)
     */
    generatePrototile(m, k, n) {
        console.log(`Generating Prototile with m=${m}, k=${k}, n=${n}`);
        let hasShortPeriod = false;
        this.polygons = [];

        if (n < k) {
            console.error("Parameter Error: n must be >= k");
        }

        if (n < k) {
            console.error("Parameter Error: n must be >= k");
        }

        // 1. 数列の生成 (論文に基づくロジック)
        // l_seq (下方境界): [(j * m) % k for j in range(k)] + [k]
        const l_seq = [];
        for (let j = 0; j < k; j++) {
            if (j > 0 && ((j * m) % k) == 0) {
                // 短周期の検出（閉じたループになる前にゼロに戻る場合）
                hasShortPeriod = true;
                break;
            }
            l_seq.push((j * m) % k);
        }
        l_seq.push(k);

        // u_seq (上方境界): [k] + [(j * m) % k for j in range(1, k)] + [0]
        const u_seq = [k];
        for (let j = 1; j < k; j++) {
            if (((j * m) % k) == 0) {
                hasShortPeriod = true;
                break;
            }
            u_seq.push((j * m) % k);
        }
        u_seq.push(0);

        // 2. パスの構築
        const path = [{ x: 0, y: 0 }];
        let current = { x: 0, y: 0 };

        // ヘルパー: 方向インデックスをベクトルに変換
        const getVector = (dirIndex) => {
            const angle = (dirIndex * 2 * Math.PI) / n;
            const len = 100; // 任意の単位長
            return {
                x: Math.cos(angle) * len,
                y: Math.sin(angle) * len
            };
        };

        // 下方境界（Lower Boundary）に沿って前進 (l_seq)
        for (let d of l_seq) {
            const v = getVector(d);
            current = { x: current.x + v.x, y: current.y + v.y };
            path.push(current);
        }

        // 上方境界（Upper Boundary）に沿って後退 (u_seq)
        // u_seqを逆順にして、現在の点（先端）から原点へ戻るパスを描く
        // Python版では u_pts を原点から生成して結合しているが、
        // ここでは先端から逆走することで閉路を作る
        const u_seq_rev = [...u_seq].reverse();

        for (let d of u_seq_rev) {
            const v = getVector(d);
            current = { x: current.x - v.x, y: current.y - v.y };
            path.push(current);
        }

        // 閉路確認（始点に戻っているか）
        const closureError = Math.hypot(current.x, current.y);
        console.log(`Prototile generated. Closure Error: ${closureError.toFixed(4)}`);

        this.polygons.push({
            path: path,
            color: 'rgba(88, 166, 255, 0.4)',
            stroke: '#58a6ff',
            meta: { closureError, hasShortPeriod }
        });

        return this.polygons;
    }

    /**
     * Wedge (Prototileの三角形配置) を生成します。
     * @param {number} m 
     * @param {number} k 
     * @param {number} n 
     * @param {number} rows - 行数 (深さ)
     */
    generateWedge(m, k, n, rows) {
        console.log(`Generating Wedge with m=${m}, k=${k}, n=${n}, rows=${rows}`);
        // まず、Prototile（基本タイル）を生成して、数列と基本パスを取得します
        const basePolygons = this.generatePrototile(m, k, n);
        const basePoly = basePolygons[0];

        // エラーまたは空の場合
        if (!basePoly || basePoly.path.length === 0) {
            return basePolygons;
        }

        // ヘルパー: 方向インデックスをベクトルに変換
        const getVector = (dirIndex) => {
            const angle = (dirIndex * 2 * Math.PI) / n;
            const len = 100;
            return {
                x: Math.cos(angle) * len,
                y: Math.sin(angle) * len
            };
        };

        const l_seq = [];
        for (let j = 0; j < k; j++) {
            if (j > 0 && ((j * m) % k) == 0) {
                break;
            }
            l_seq.push((j * m) % k);
        }
        l_seq.push(k);

        // d0 の計算 (l_seq のベクトル和 - 最後の要素 'k' を除く)
        // Python: sum(get_v((j * m) % k) for j in range(k))
        let d0 = { x: 0, y: 0 };
        // l_seq は k+1 要素ある (最後は k). 0 から k-1 までイテレート.
        for (let j = 0; j < k; j++) {
            if (j > 0 && ((j * m) % k) == 0) {
                break;
            }
            const v = getVector(l_seq[j]);
            d0.x += v.x;
            d0.y += v.y;
        }

        // d1 の計算 (v_k - v_0)
        // 基本タイルの「高さ」方向のシフトベクトル
        const vk = getVector(k);
        const v0 = getVector(0);
        const d1 = {
            x: vk.x - v0.x,
            y: vk.y - v0.y
        };

        // Wedge生成用にリストをクリア
        this.polygons = [];

        // 配色配列
        const colors = [
            'rgba(88, 166, 255, 0.6)',
            'rgba(255, 100, 100, 0.6)',
            'rgba(100, 200, 100, 0.6)'
        ];

        let tileIndex = 0;
        // 指定された行数(rows)だけループしてタイルを配置
        // r: 深さ(行), c: 列
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c <= r; c++) {
                // シフト位置の計算: r * d0 + c * d1
                const shiftX = r * d0.x + c * d1.x;
                const shiftY = r * d0.y + c * d1.y;

                // パスを複製してシフト
                const newPath = basePoly.path.map(p => ({
                    x: p.x + shiftX,
                    y: p.y + shiftY
                }));

                // 配色ロジック
                const colorIdx = (r + c) % 3;

                this.polygons.push({
                    path: newPath,
                    color: colors[colorIdx],
                    stroke: '#888',
                    meta: {
                        r, c,
                        hasShortPeriod: basePoly.meta.hasShortPeriod,
                        tileIndex: tileIndex++
                    }
                });
            }
        }

        return this.polygons;
    }

    /**
     * 完全なタイリング（Full Tiling）を生成します (Front Checkingアルゴリズム)。
     * @param {number} m 
     * @param {number} k 
     * @param {number} n 
     * @param {number} rows - ここでは 'w_limit' (Wedgeの制限数) として再利用される場合がありますが、基本はWedgeのサイズ指定です
     * @param {boolean} isOffset - オフセットモードが有効かどうか
     */
    generateTiling(m, k, n, rows, isOffset) {
        // オフセットモードのロジック:
        // - オフセットなし: w_limit = n (円全体をWedgeで埋める)
        // - オフセットあり: w_limit = n / 2 (半分だけ埋めて、残りは回転コピーで生成)
        let w_limit = isOffset ? (n / 2) : n;

        console.log(`Generating Tiling with m=${m}, k=${k}, n=${n}, isOffset=${isOffset}, w_limit=${w_limit}`);


        // 1. 基本Wedge (Wedge 0) の生成
        // generateWedgeのロジックを利用しますが、フロントチェックのために u_seq も必要です。
        // ここでは便宜上、generatePrototileの一部ロジックを再利用して sequences を取得します。

        let hasShortPeriod = false;

        // u_seq (上方境界) の生成
        const u_seq = [k];
        for (let j = 1; j < k; j++) {
            if (((j * m) % k) == 0) {
                hasShortPeriod = true;
                break;
            }
            u_seq.push((j * m) % k);
        }
        u_seq.push(0);

        // ヘルパー
        const getVector = (dirIndex) => {
            const angle = (dirIndex * 2 * Math.PI) / n;
            const len = 100;
            return {
                x: Math.cos(angle) * len,
                y: Math.sin(angle) * len
            };
        };

        // 基本となるWedge 0を生成
        // Pythonスクリプト同様、Wedge単位で配置を行います
        const wedge0Polys = this.generateWedge(m, k, n, rows);
        if (!wedge0Polys || wedge0Polys.length === 0) return [];

        // this.polygonsは後でクリアされるので、Wedge 0のデータを保存
        const baseWedge = [...wedge0Polys];

        // 結果配列の初期化
        this.polygons = []; // グローバルリストをクリアして、全Wedgeで埋めます

        // フロント（境界）の初期化
        // Python: front_directions = list(u_seq[:-1])
        // フロントは、次にWedgeを配置するための接続面（方向ベクトルのリスト）を表します
        const front_directions = u_seq.slice(0, u_seq.length - 1);

        // 定数
        const unit_angle = (2 * Math.PI) / n;
        const wedge_offsets = [];
        for (let i = 0; i < w_limit; i++) wedge_offsets.push(i % 3);

        // ヘルパー: ポリゴンのクローンと変換（回転・移動）
        const addTransformedWedge = (polys, offsetX, offsetY, rotationIndex, colorOffset) => {
            const rotAngle = rotationIndex * unit_angle;
            const flowColors = [
                'rgba(88, 166, 255, 0.6)',
                'rgba(255, 100, 100, 0.6)',
                'rgba(100, 200, 100, 0.6)'
            ];

            polys.forEach(p => {
                // 回転してから移動
                // x' = x*cos - y*sin + tx
                // y' = x*sin + y*cos + ty
                const cos = Math.cos(rotAngle);
                const sin = Math.sin(rotAngle);

                const newPath = p.path.map(pt => ({
                    x: (pt.x * cos - pt.y * sin) + offsetX,
                    y: (pt.x * sin + pt.y * cos) + offsetY
                }));

                // 色の計算
                // 元の色インデックス (r+c)%3 に、Wedgeごとのオフセットを加算
                const r = p.meta.r || 0;
                const c = p.meta.c || 0;
                const cIdx = (r + c + colorOffset) % 3;

                this.polygons.push({
                    path: newPath,
                    color: flowColors[cIdx],
                    stroke: '#888',
                    meta: { ...p.meta, wedgeIndex: rotationIndex }
                });
            });
        };

        // Wedge 0 を追加（原点、回転なし）
        addTransformedWedge(baseWedge, 0, 0, 0, wedge_offsets[0]);

        // 1 から w_limit-1 までループして残りのWedgeを配置
        console.log(`Starting loop for ${w_limit} wedges. Front:`, front_directions);
        for (let i = 1; i < w_limit; i++) {
            // j_star を探す: front_directions[j] == i となる場所
            // つまり、現在のフロントの中で、次に配置したいWedgeの方向と一致する場所を探す
            let j_star = -1;
            for (let idx = 0; idx < front_directions.length; idx++) {
                if (front_directions[idx] == i) {
                    j_star = idx;
                    break;
                }
            }

            console.log(`Wedge ${i}: Found j_star=${j_star} in front ` + JSON.stringify(front_directions));

            if (j_star === -1) {
                console.warn(`Warning: direction ${i} not found in front for wedge ${i}`);
                continue;
            }

            // 開始位置（start_pos）の計算
            // j_starまでのベクトルの和
            let startX = 0, startY = 0;
            for (let idx = 0; idx < j_star; idx++) {
                const v = getVector(front_directions[idx]);
                startX += v.x;
                startY += v.y;
            }

            // 変換されたWedgeを追加
            addTransformedWedge(baseWedge, startX, startY, i, wedge_offsets[i]);

            // フロントの更新
            // 配置したWedgeによって境界が更新される
            front_directions[j_star] = i + k;
            console.log(`Updated front at ${j_star} to ${i + k}:`, front_directions);
        }

        // 3. (OFFSET MODE ONLY) 180度回転コピー
        // オフセットモードでは、半分だけ生成し、残りを点対称の位置にコピーして埋める
        if (isOffset) {
            console.log("Offset Mode: Applying 180-degree rotation copy...");
            // ピボット（回転中心）は、最初のWedge（Wedge 0）の最初の辺の中点
            // Wedge 0は(0,0)から始まる。最初の辺は方向0。
            const v0 = getVector(0);
            const pivot = { x: v0.x / 2, y: v0.y / 2 };

            console.log("Pivot:", pivot);

            const initialCount = this.polygons.length;
            // 現在のポリゴンを複製
            const currentPolys = JSON.parse(JSON.stringify(this.polygons));

            currentPolys.forEach(p => {
                // ピボットを中心に180度回転
                // x' = 2*px - x
                // y' = 2*py - y
                const newPath = p.path.map(pt => ({
                    x: 2 * pivot.x - pt.x,
                    y: 2 * pivot.y - pt.y
                }));

                this.polygons.push({
                    path: newPath,
                    color: p.color,
                    stroke: p.stroke,
                    // オフセットによるコピーであることを識別するためのメタデータ
                    meta: { ...p.meta, isCopy: true, wedgeIndex: p.meta.wedgeIndex + 10000 }
                });
            });
            console.log(`Added ${this.polygons.length - initialCount} polygons via rotation.`);
        }

        return this.polygons;
    }
}

// ==========================================
// メインアプリケーションロジック
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('tiling-canvas');
    if (!canvas) {
        console.error("Canvas element not found!");
        return;
    }

    const ctx = canvas.getContext('2d');
    const renderer = new Renderer(canvas, ctx);
    const generator = new KrinkleGenerator();

    // UI要素の取得
    const inputK = document.getElementById('param-mod');
    const inputM = document.getElementById('param-a');
    const inputT = document.getElementById('param-t') || document.getElementById('param-b');
    const inputOffset = document.getElementById('param-offset');

    // 新しいUI要素
    const inputMode = document.getElementById('display-mode');
    const inputRows = document.getElementById('param-rows');
    const groupRows = document.getElementById('group-rows');

    // 表示切替（トグル）のコンテナ
    const toggleEdgesContainer = document.getElementById('toggle-edges-container');
    const toggleWedgesContainer = document.getElementById('toggle-wedges-container');
    const toggleTilesContainer = document.getElementById('toggle-tiles-container');

    // 各表示切替チェックボックス
    const inputShowEdges = document.getElementById('show-edges');
    const inputShowWedges = document.getElementById('show-wedges');
    const inputShowTiles = document.getElementById('show-tiles');

    if (!inputK || !inputM || !inputT) {
        console.error("Critical Error: Missing UI inputs.", { inputK, inputM, inputT });
        const statusText = document.getElementById('status-text');
        if (statusText) statusText.textContent = "Error: UI initialization failed. Check console.";
        return;
    }


    const statusText = document.getElementById('status-text');



    function updateTiling() {
        const k = parseInt(inputK.value, 10);
        const m = parseInt(inputM.value, 10);
        const t = parseInt(inputT.value, 10);
        const isOffset = inputOffset ? inputOffset.checked : false;

        // モードとパラメータの取得
        const mode = inputMode ? inputMode.value : 'prototile';
        const rows = inputRows ? parseInt(inputRows.value, 10) : 5;

        // depth入力欄（rows）の表示切替
        if (groupRows) {
            groupRows.style.display = (mode === 'wedge' || mode === 'tiling') ? 'block' : 'none';
        }

        // モードに応じた表示切替オプションの制御
        // Prototile: 辺番号
        // Wedge: タイル番号
        // Tiling: Wedge番号, タイル番号
        if (toggleEdgesContainer) toggleEdgesContainer.style.display = (mode === 'prototile') ? 'block' : 'none';
        if (toggleWedgesContainer) toggleWedgesContainer.style.display = (mode === 'tiling') ? 'block' : 'none';
        if (toggleTilesContainer) toggleTilesContainer.style.display = (mode === 'wedge' || mode === 'tiling') ? 'block' : 'none';

        // Rendererの設定更新
        renderer.setOptions({
            showEdges: inputShowEdges ? inputShowEdges.checked : true,
            showWedges: inputShowWedges ? inputShowWedges.checked : true,
            showTiles: inputShowTiles ? inputShowTiles.checked : true
        });

        // パラメータ n の計算
        let n;
        if (!isOffset) {
            n = k * t;
        } else {
            // オフセット時のロジック (Python互換): n = 2 * (t * k - m)
            n = 2 * (t * k - m);
        }

        // バリデーションエラー表示
        if (n < k) {
            statusText.textContent = "Error: n (k*t) must be >= k";
            statusText.style.color = "#ff6b6b";
            return;
        }

        statusText.style.color = "#8b949e";
        statusText.textContent = (mode === 'wedge') ? "Generating Wedge..." : "Generating Prototile...";

        // UI更新のために setTimeout を使用して処理を遅延実行
        setTimeout(() => {
            let polygons = [];

            try {
                if (mode === 'wedge') {
                    if (typeof generator.generateWedge === 'function') {
                        polygons = generator.generateWedge(m, k, n, rows);
                    } else {
                        throw new Error("generateWedge method missing");
                    }
                } else if (mode === 'tiling') {
                    if (typeof generator.generateTiling === 'function') {
                        polygons = generator.generateTiling(m, k, n, rows, isOffset);
                    } else {
                        throw new Error("generateTiling method missing");
                    }
                } else {
                    polygons = generator.generatePrototile(m, k, n);
                }
            } catch (e) {
                console.error("Generation failed:", e);
                statusText.textContent = "Error: " + e.message;
                statusText.style.color = "#ff6b6b";
                return;
            }

            if (!polygons) {
                console.error("Generator returned undefined");
                polygons = [];
            }

            renderer.setDisplayData(polygons, mode);

            // 初回や変更時に自動的に中心に揃える
            if (polygons.length > 0) {
                renderer.autoCenter(polygons);
            }
            statusText.textContent = `(m, k, n) = (${m}, ${k}, ${n}) [${mode}]`;

            const hasShortPeriod = polygons[0]?.meta?.hasShortPeriod || false;
            if (hasShortPeriod) {
                statusText.style.color = "#ff6b6b";
            } else {
                statusText.style.color = "#8b949e";
            }
        }, 10);
    }

    // 入力値変更時のリアルタイム更新リスナーを追加
    const inputs = [inputK, inputM, inputT, inputOffset, inputMode, inputRows, inputShowEdges, inputShowWedges, inputShowTiles];
    inputs.forEach(input => {
        if (input) {
            input.addEventListener('input', updateTiling);
            input.addEventListener('change', updateTiling);
        }
    });

    // 初期描画
    updateTiling();
});
