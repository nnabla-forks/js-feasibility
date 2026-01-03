export class Renderer {
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
            const newScale = Math.min(Math.max(0.1, this.scale + delta), 10);

            // Zoom towards mouse pointer logic could go here, 
            // for now center zoom for simplicity or implementation choice

            // Simple center zoom adjustment relative to screen center can be complex
            // without correct coordinate transformation, let's keep it simple first:
            // visual zoom.

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

    /**
     * @param {Array} polygons - Array of objects { path: [{x,y}...], color: string, stroke: string }
     */
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
        this.ctx.moveTo(-1000, 0);
        this.ctx.lineTo(1000, 0);
        this.ctx.moveTo(0, -1000);
        this.ctx.lineTo(0, 1000);
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
                    this.ctx.lineWidth = 2 / this.scale; // Keep stroke width constant screen-space? Or world space.
                    this.ctx.stroke();
                }
            });
        }

        this.ctx.restore();
    }
}
