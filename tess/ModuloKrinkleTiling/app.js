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

    setDisplayData(polygons) {
        this.polygons = polygons;
        this.draw();
    }

    /**
     * Centers the view on a specific polygon.
     * @param {Object} polygon 
     */
    autoCenter(polygon) {
        if (!polygon || !polygon.path || polygon.path.length === 0) return;

        let minX = Infinity, minY = Infinity;
        let maxX = -Infinity, maxY = -Infinity;

        polygon.path.forEach(p => {
            if (p.x < minX) minX = p.x;
            if (p.x > maxX) maxX = p.x;
            if (p.y < minY) minY = p.y;
            if (p.y > maxY) maxY = p.y;
        });

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
        // Transformation: ScreenX = (WorldX * scale) + offsetX
        // We want ScreenX = CanvasWidth/2 when WorldX = cx
        // CanvasWidth/2 = (cx * scale) + offsetX
        // offsetX = CanvasWidth/2 - (cx * scale)
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

                // 1. Edge Indices
                this.ctx.fillStyle = '#ffffff';
                this.ctx.font = `${14 / this.scale}px sans-serif`;
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';

                for (let i = 0; i < poly.path.length - 1; i++) {
                    const p1 = poly.path[i];
                    const p2 = poly.path[i + 1];

                    const midX = (p1.x + p2.x) / 2;
                    const midY = (p1.y + p2.y) / 2;

                    // Offset text slightly perpendicular to edge?
                    // For now, just draw at midpoint
                    this.ctx.fillText(i.toString(), midX, midY);
                }

                // 2. Start Point (Red Circle)
                const start = poly.path[0];
                this.ctx.beginPath();
                this.ctx.arc(start.x, start.y, 6 / this.scale, 0, Math.PI * 2);
                this.ctx.fillStyle = '#ff4d4d'; // Red
                this.ctx.fill();
                this.ctx.strokeStyle = '#ffffff';
                this.ctx.lineWidth = 1 / this.scale;
                this.ctx.stroke();

                // 3. End Point (Blue Circle)
                const end = poly.path[poly.path.length - 1];
                this.ctx.beginPath();
                this.ctx.arc(end.x, end.y, 6 / this.scale, 0, Math.PI * 2);
                this.ctx.fillStyle = '#4d94ff'; // Blue
                this.ctx.fill();
                this.ctx.stroke();
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
        this.polygons = [];

        if (n < k) {
            console.error("Parameter Error: n must be >= k");
        }

        // 1. Generate Sequences (Fixed Logic)
        // l_seq: [(j * m) % k for j in range(k)] + [k]
        const l_seq = [];
        for (let j = 0; j < k; j++) {
            l_seq.push((j * m) % k);
        }
        l_seq.push(k);

        // u_seq: [k] + [(j * m) % k for j in range(1, k)] + [0]
        const u_seq = [k];
        for (let j = 1; j < k; j++) {
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
            meta: { closureError }
        });

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
        statusText.textContent = "Generating Prototile...";

        // Use setTimeout to allow UI to update before heavy calculation (though this is light)
        setTimeout(() => {
            const polygons = generator.generatePrototile(m, k, n);
            renderer.setDisplayData(polygons);

            // Auto-center on the first polygon
            if (polygons.length > 0) {
                renderer.autoCenter(polygons[0]);
            }

            const error = polygons[0]?.meta?.closureError || 0;
            statusText.textContent = `(m, k, n) = (${m}, ${k}, ${n}) | Closure Error: ${error.toFixed(2)}`;
        }, 10);
    }

    // Add real-time updates for inputs
    [inputK, inputM, inputT, inputOffset].forEach(input => {
        if (input) {
            input.addEventListener('input', updateTiling);
        }
    });

    // Initial draw
    updateTiling();
});
