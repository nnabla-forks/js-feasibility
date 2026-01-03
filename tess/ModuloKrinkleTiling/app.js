/**
 * Modulo Krinkle Tiling - Single File Application
 * Combined for file:// protocol compatibility (avoiding CORS/Module issues)
 */

// ==========================================
// Renderer Class
// ==========================================
class Renderer {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;

        // Viewport state
        this.scale = 1.0;
        this.offsetX = 0;
        this.offsetY = 0;

        // Drag interaction state
        this.isDragging = false;
        this.lastX = 0;
        this.lastY = 0;

        this.initEvents();
        this.resize();
    }

    initEvents() {
        // Resize listener
        window.addEventListener('resize', () => this.resize());

        // Mouse events for panning
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
                this.draw(); // Redraw on drag
            }
        });

        window.addEventListener('mouseup', () => {
            this.isDragging = false;
            this.canvas.style.cursor = 'grab';
        });

        // Wheel event for zooming
        this.canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            const zoomSensitivity = 0.001;
            const delta = -e.deltaY * zoomSensitivity;
            // Limit zoom
            const newScale = Math.min(Math.max(0.1, this.scale + delta), 20);

            // Simple zoom (center based)
            // Ideally we zoom towards mouse, but keeping it simple for now
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
        this.draw();
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

        // Clear screen
        this.ctx.fillStyle = '#0d1117'; // Matches CSS background
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.save();

        // Apply transformations
        this.ctx.translate(this.offsetX, this.offsetY);
        this.ctx.scale(this.scale, this.scale);

        // Draw Axes (optional guide)
        this.ctx.strokeStyle = '#30363d';
        this.ctx.lineWidth = 1 / this.scale;
        this.ctx.beginPath();
        this.ctx.moveTo(-10000, 0);
        this.ctx.lineTo(10000, 0);
        this.ctx.moveTo(0, -10000);
        this.ctx.lineTo(0, 10000);
        this.ctx.stroke();

        // Draw Polygons
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

                // Debug: Draw vertices?
                /*
                this.ctx.fillStyle = 'white';
                poly.path.forEach(p => {
                    this.ctx.fillRect(p.x - 2/this.scale, p.y - 2/this.scale, 4/this.scale, 4/this.scale);
                });
                */
            });
        }

        this.ctx.restore();

        // Debug Overlay (Draw on top of transform? Or inside?)
        // Inside transform for correct positioning
        this.ctx.save();
        this.ctx.translate(this.offsetX, this.offsetY);
        this.ctx.scale(this.scale, this.scale);

        if (this.polygons) {
            this.polygons.forEach(poly => {
                if (!poly.path || poly.path.length === 0) return;

                // 1. Edge Indices (Only in Prototile Mode)
                if (this.mode === 'prototile') {
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
     * Generates a single Prototile (Wedge 0).
     * @param {number} m - Parameter m (Step size)
     * @param {number} k - Parameter k (Modulus)
     * @param {number} n - Parameter n (Symmetry)
     */
    generatePrototile(m, k, n) {
        console.log(`Generating Prototile with m=${m}, k=${k}, n=${n}`);
        let hasShortPeriod = false;
        this.polygons = [];

        if (n < k) {
            console.error("Parameter Error: n must be >= k");
        }

        // 1. Generate Sequences (Fixed Logic)
        // l_seq: [(j * m) % k for j in range(k)] + [k]
        const l_seq = [];
        for (let j = 0; j < k; j++) {
            if (j > 0 && ((j * m) % k) == 0) {
                hasShortPeriod = true;
                break;
            }
            l_seq.push((j * m) % k);
        }
        l_seq.push(k);

        // u_seq: [k] + [(j * m) % k for j in range(1, k)] + [0]
        const u_seq = [k];
        for (let j = 1; j < k; j++) {
            if (((j * m) % k) == 0) {
                hasShortPeriod = true;
                break;
            }
            u_seq.push((j * m) % k);
        }
        u_seq.push(0);

        // 2. Construct Path
        const path = [{ x: 0, y: 0 }];
        let current = { x: 0, y: 0 };

        // Helper: Direction to Vector
        const getVector = (dirIndex) => {
            const angle = (dirIndex * 2 * Math.PI) / n;
            const len = 100; // Arbitrary unit length
            return {
                x: Math.cos(angle) * len,
                y: Math.sin(angle) * len
            };
        };

        // Forward along Lower Boundary (l_seq)
        for (let d of l_seq) {
            const v = getVector(d);
            current = { x: current.x + v.x, y: current.y + v.y };
            path.push(current);
        }

        // Backward along Upper Boundary (u_seq)
        // Similar to before, we reverse u_seq to walk back to origin
        // IMPORTANT: In the python script, u_pts are generated from origin.
        // And then poly_pts = l_pts + u_pts[-2::-1].
        // This implies u_pts ends at the same point as l_pts.
        // So we can trace u_seq BACKWARDS from the current point (tip) to return to origin.
        const u_seq_rev = [...u_seq].reverse();

        for (let d of u_seq_rev) {
            const v = getVector(d);
            current = { x: current.x - v.x, y: current.y - v.y };
            path.push(current);
        }

        // Check closure
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
     * Generates a Wedge (Triangular arrangement of prototiles).
     * @param {number} m 
     * @param {number} k 
     * @param {number} n 
     * @param {number} rows - Number of rows (depth)
     */
    generateWedge(m, k, n, rows) {
        console.log(`Generating Wedge with m=${m}, k=${k}, n=${n}, rows=${rows}`);
        // First, generate the prototile to get sequences and base path
        const basePolygons = this.generatePrototile(m, k, n);
        const basePoly = basePolygons[0];

        // If error or empty
        if (!basePoly || basePoly.path.length === 0) {
            return basePolygons;
        }

        // Helper: Direction to Vector
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

        // Calculate d0 (Vector sum of l_seq - excluding the last element 'k')
        // Python: sum(get_v((j * m) % k) for j in range(k))
        let d0 = { x: 0, y: 0 };
        // l_seq has k+1 elements (the last one is k). We iterate 0 to k-1.
        for (let j = 0; j < k; j++) {
            if (j > 0 && ((j * m) % k) == 0) {
                break;
            }
            const v = getVector(l_seq[j]);
            d0.x += v.x;
            d0.y += v.y;
        }

        // Calculate d1 (v_k - v_0)
        const vk = getVector(k);
        const v0 = getVector(0);
        const d1 = {
            x: vk.x - v0.x,
            y: vk.y - v0.y
        };

        // Clear and rebuild for Wedge
        this.polygons = [];

        // Colors
        const colors = [
            'rgba(88, 166, 255, 0.6)',
            'rgba(255, 100, 100, 0.6)',
            'rgba(100, 200, 100, 0.6)'
        ];

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c <= r; c++) {
                const shiftX = r * d0.x + c * d1.x;
                const shiftY = r * d0.y + c * d1.y;

                // Clone path with shift
                const newPath = basePoly.path.map(p => ({
                    x: p.x + shiftX,
                    y: p.y + shiftY
                }));

                const colorIdx = (r + c) % 3;

                this.polygons.push({
                    path: newPath,
                    color: colors[colorIdx],
                    stroke: '#888',
                    meta: {
                        r, c,
                        hasShortPeriod: basePoly.meta.hasShortPeriod
                    }
                });
            }
        }

        return this.polygons;
    }

    /**
     * Generates a Full Tiling (Front Checking).
     * @param {number} m 
     * @param {number} k 
     * @param {number} n 
     * @param {number} n 
     * @param {number} rows - Reuse 'rows' as 'w_limit'
     * @param {boolean} isOffset - Whether offset mode is active
     */
    generateTiling(m, k, n, rows, isOffset) {
        // Offset Logic:
        // - No Offset: w_limit = n (fills circle)
        // - Offset: w_limit = n / 2. Then copy & rotate 180 deg around pivot.

        let w_limit = isOffset ? (n / 2) : n;

        console.log(`Generating Tiling with m=${m}, k=${k}, n=${n}, isOffset=${isOffset}, w_limit=${w_limit}`);


        // 1. Generate Base Wedges (Wedge 0)
        // We reuse logic but we need to know u_seq
        // Let's copy relevant logic from generatePrototile to get u_seq and path

        let hasShortPeriod = false;

        // u_seq generation
        const u_seq = [k];
        for (let j = 1; j < k; j++) {
            if (((j * m) % k) == 0) {
                hasShortPeriod = true;
                break;
            }
            u_seq.push((j * m) % k);
        }
        u_seq.push(0);

        // helper
        const getVector = (dirIndex) => {
            const angle = (dirIndex * 2 * Math.PI) / n;
            const len = 100;
            return {
                x: Math.cos(angle) * len,
                y: Math.sin(angle) * len
            };
        };

        // We need 'd0' and 'd1' for the internal wedge structure if we were drawing individual tiles
        // But here we are placing "Wedges" (groups of tiles).
        // Wait, Python script places *entire wedges*?
        // Ah, Step 1 in Python generates "Wedge 0" which consists of many tiles.
        // Step 2 places *copies* of Wedge 0.
        // So we need to call generateWedge(..., rows) to get the base group of tiles.

        // Let's generate Wedge 0 first.
        const wedge0Polys = this.generateWedge(m, k, n, rows);
        if (!wedge0Polys || wedge0Polys.length === 0) return [];

        // This clears this.polygons, so we should save it.
        const baseWedge = [...wedge0Polys];

        // Initialize Result
        this.polygons = []; // clear global list to fill with all wedges

        // Front Initialization
        // Python: front_directions = list(u_seq[:-1])
        const front_directions = u_seq.slice(0, u_seq.length - 1);

        // Constants
        const unit_angle = (2 * Math.PI) / n;
        const wedge_offsets = [];
        for (let i = 0; i < w_limit; i++) wedge_offsets.push(i % 3);

        // Helper to clone and transform a polygon
        const addTransformedWedge = (polys, offsetX, offsetY, rotationIndex, colorOffset) => {
            const rotAngle = rotationIndex * unit_angle;
            const flowColors = [
                'rgba(88, 166, 255, 0.6)',
                'rgba(255, 100, 100, 0.6)',
                'rgba(100, 200, 100, 0.6)'
            ];

            polys.forEach(p => {
                // Rotate then Translate
                // x' = x*cos - y*sin + tx
                // y' = x*sin + y*cos + ty
                const cos = Math.cos(rotAngle);
                const sin = Math.sin(rotAngle);

                const newPath = p.path.map(pt => ({
                    x: (pt.x * cos - pt.y * sin) + offsetX,
                    y: (pt.x * sin + pt.y * cos) + offsetY
                }));

                // Calculate color
                // Original was (r+c)%3. We add wedge offset.
                // We need to recover original r,c or just rotate color
                // p.meta has r, c
                const r = p.meta.r || 0;
                const c = p.meta.c || 0;
                const cIdx = (r + c + colorOffset) % 3;

                this.polygons.push({
                    path: newPath,
                    color: flowColors[cIdx],
                    stroke: '#888',
                    meta: p.meta
                });
            });
        };

        // Add Wedge 0 (at origin, rotation 0)
        addTransformedWedge(baseWedge, 0, 0, 0, wedge_offsets[0]);

        // Loop i from 1 to w_limit-1
        console.log(`Starting loop for ${w_limit} wedges. Front:`, front_directions);
        for (let i = 1; i < w_limit; i++) {
            // Find j_star where front_directions[j] == i
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

            // Calculate start_pos (sum of vectors up to j_star)
            let startX = 0, startY = 0;
            for (let idx = 0; idx < j_star; idx++) {
                const v = getVector(front_directions[idx]);
                startX += v.x;
                startY += v.y;
            }

            // Add transformed wedge
            addTransformedWedge(baseWedge, startX, startY, i, wedge_offsets[i]);

            // Update front
            front_directions[j_star] = i + k;
            console.log(`Updated front at ${j_star} to ${i + k}:`, front_directions);
        }

        // 3. (OFFSET MODE ONLY) 180-degree Rotation Copy
        if (isOffset) {
            console.log("Offset Mode: Applying 180-degree rotation copy...");
            // Pivot is the midpoint of the first edge of the first wedge (Wedge 0).
            // Wedge 0 starts at (0,0). First edge is direction 0.
            const v0 = getVector(0);
            const pivot = { x: v0.x / 2, y: v0.y / 2 };

            console.log("Pivot:", pivot);

            const initialCount = this.polygons.length;
            // Clone current polygons
            const currentPolys = JSON.parse(JSON.stringify(this.polygons));

            currentPolys.forEach(p => {
                // Rotate 180 around pivot
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
                    meta: { ...p.meta, isCopy: true }
                });
            });
            console.log(`Added ${this.polygons.length - initialCount} polygons via rotation.`);
        }

        return this.polygons;
    }
}

// ==========================================
// Main Application Logic
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

    // UI Elements
    const inputK = document.getElementById('param-mod');
    const inputM = document.getElementById('param-a');
    const inputT = document.getElementById('param-t') || document.getElementById('param-b');
    const inputOffset = document.getElementById('param-offset');
    const inputC = document.getElementById('param-c');

    // New UI Elements
    const inputMode = document.getElementById('display-mode');
    const inputRows = document.getElementById('param-rows');
    const groupRows = document.getElementById('group-rows');

    if (!inputK || !inputM || !inputT) {
        console.error("Critical Error: Missing UI inputs.", { inputK, inputM, inputT });
        const statusText = document.getElementById('status-text');
        if (statusText) statusText.textContent = "Error: UI initialization failed. Check console.";
        return;
    }

    // Disable unused parameter C
    if (inputC) {
        inputC.parentElement.style.opacity = '0.5';
        inputC.disabled = true;
    }

    const statusText = document.getElementById('status-text');

    function updateTiling() {
        const k = parseInt(inputK.value, 10);
        const m = parseInt(inputM.value, 10);
        const t = parseInt(inputT.value, 10);
        const isOffset = inputOffset ? inputOffset.checked : false;

        // Wedge Mode params
        const mode = inputMode ? inputMode.value : 'prototile';
        const rows = inputRows ? parseInt(inputRows.value, 10) : 5;

        // Toggle UI visibility
        if (groupRows) {
            groupRows.style.display = (mode === 'wedge' || mode === 'tiling') ? 'block' : 'none';
        }

        // Calculate n based on t and offset mode
        let n;
        if (!isOffset) {
            n = k * t;
        } else {
            // Offset logic from python: n = 2 * (t * k - m)
            n = 2 * (t * k - m);
        }

        // Validation display
        if (n < k) {
            statusText.textContent = "Error: n (k*t) must be >= k";
            statusText.style.color = "#ff6b6b";
            return;
        }

        statusText.style.color = "#8b949e";
        statusText.textContent = (mode === 'wedge') ? "Generating Wedge..." : "Generating Prototile...";

        // Use setTimeout to allow UI to update before heavy calculation
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

            // Auto-center on all polygons
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

    // Add real-time updates for inputs
    const inputs = [inputK, inputM, inputT, inputOffset, inputMode, inputRows];
    inputs.forEach(input => {
        if (input) {
            input.addEventListener('input', updateTiling);
            input.addEventListener('change', updateTiling);
        }
    });

    // Initial draw
    updateTiling();
});
