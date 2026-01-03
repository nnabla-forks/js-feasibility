/**
 * Modulo Krinkle Tiling Logic
 * Based on "Modulo Krinkle Tiling" (arXiv:2506.07638)
 */

export class KrinkleGenerator {
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

        // Validation
        if (n < k) {
            console.error("Parameter Error: n must be >= k");
            // We can return early or generate what we can
        }

        // 1. Generate Sequences
        // l_seq (Lower Boundary): l_j = (j * m) % k
        const l_seq = [];
        for (let j = 0; j < k; j++) {
            l_seq.push((j * m) % k);
        }

        // u_seq (Upper Boundary): obtained from l_seq by replacing 0 with k
        const u_seq = l_seq.map(dir => dir === 0 ? k : dir);

        // 2. Construct Path
        const path = [{ x: 0, y: 0 }];
        let current = { x: 0, y: 0 };

        // Helper: Direction to Vector
        const getVector = (dirIndex) => {
            const angle = (dirIndex * 2 * Math.PI) / n;
            // Note: Paper defines angle 2*pi*i / n.
            // Coordinate system: Standard math (0 is right, CCW).
            // Canvas Y is down. We might need to flip Y or just render as is.
            return {
                x: Math.cos(angle) * 50, // Scale factor 50 for visibility
                y: Math.sin(angle) * 50
            };
        };

        // Forward along Lower Boundary
        for (let d of l_seq) {
            const v = getVector(d);
            current = { x: current.x + v.x, y: current.y + v.y };
            path.push(current);
        }

        // Store endpoint (tip of the wedge)
        const tip = { ...current };

        // Backward along Upper Boundary
        // u_seq defines edges from Origin outwards.
        // To close the loop back to Origin, we subtract u_seq vectors in reverse order.
        const u_seq_rev = [...u_seq].reverse();

        for (let d of u_seq_rev) {
            const v = getVector(d);
            current = { x: current.x - v.x, y: current.y - v.y };
            path.push(current);
        }

        // Check closure
        const closureError = Math.hypot(current.x, current.y);
        console.log(`Prototile generated. Closure Error: ${closureError.toFixed(4)}`);

        if (closureError > 1e-4) {
            console.warn("Prototile did not close perfectly! Parameters might be invalid for closed tile.");
            // We still push the polygon to visualize the gap
        }

        this.polygons.push({
            path: path,
            color: 'rgba(88, 166, 255, 0.4)', // Translucent blue
            stroke: '#58a6ff',
            meta: {
                closureError: closureError
            }
        });

        // Add axes/origin marker for debug
        // (Handled by renderer usually, but we could add debug shapes here if needed)

        return this.polygons;
    }
}
