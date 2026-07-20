/**
 * PetRenderer - Realistic 3D-style pet renderer using Canvas
 * @module pets/PetRenderer
 * 
 * Renders a detailed 3D-looking pet with smooth animations,
 * lighting effects, and interactive behaviors.
 */
class PetRenderer {
    /**
     * @param {HTMLCanvasElement} canvas
     * @param {Pet} pet 
     */
    constructor(canvas, pet) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.pet = pet;
        
        this.width = canvas.width;
        this.height = canvas.height;
        
        // Animation state
        this.time = 0;
        this.blinkTimer = 0;
        this.isBlinking = false;
        this.breathPhase = 0;
        
        // Interaction
        this.isPetting = false;
        this.petTimer = 0;
        this.happinessPulse = 0;
        
        // Tail wag
        this.tailWagSpeed = 0;
        this.tailWagPhase = 0;
        
        // Head tracking
        this.headTargetX = 0;
        this.headTargetY = 0;
        this.headX = 0;
        this.headY = 0;
        
        // Movement
        this.bobPhase = Math.random() * Math.PI * 2;
        
        // Colors based on pet species
        this.colors = this.#getSpeciesColors();
        
        this.#setupMouseTracking();
        this.#startAnimation();
    }
    
    /**
     * Get colors for the pet species
     */
    #getSpeciesColors() {
        const species = this.pet?.species || 'cat';
        const palettes = {
            cat: { fur: '#ff8c42', furDark: '#cc6e35', furLight: '#ffa366', belly: '#ffd4b3', nose: '#ff6b9d', eyes: '#4caf50', ears: '#ff8c42', earsInner: '#ffb3c6', paws: '#ffd4b3' },
            dog: { fur: '#8B4513', furDark: '#6b3410', furLight: '#a0522d', belly: '#d2a679', nose: '#2d1b3d', eyes: '#5c4033', ears: '#8B4513', earsInner: '#c4956a', paws: '#d2a679' },
            bunny: { fur: '#f5f5f5', furDark: '#d4d4d4', furLight: '#ffffff', belly: '#ffffff', nose: '#ffb3c6', eyes: '#ff6b9d', ears: '#f5f5f5', earsInner: '#ffb3c6', paws: '#ffffff' },
            penguin: { fur: '#2d3436', furDark: '#1a1a2e', furLight: '#636e72', belly: '#ffffff', nose: '#ffd700', eyes: '#ffffff', ears: '#2d3436', earsInner: '#636e72', paws: '#ffd700' },
            duck: { fur: '#ffd700', furDark: '#ccac00', furLight: '#ffe44d', belly: '#fff5cc', nose: '#ff8c42', eyes: '#2d3436', ears: '#ffd700', earsInner: '#ffe44d', paws: '#ff8c42' },
            dragon: { fur: '#6c5ce7', furDark: '#4a3cb5', furLight: '#a29bfe', belly: '#dfe6e9', nose: '#ff7675', eyes: '#ffd700', ears: '#6c5ce7', earsInner: '#a29bfe', paws: '#dfe6e9' },
            fox: { fur: '#e17055', furDark: '#d63031', furLight: '#fab1a0', belly: '#ffeaa7', nose: '#2d3436', eyes: '#ffd700', ears: '#e17055', earsInner: '#fab1a0', paws: '#ffeaa7' },
            meowl: { fur: '#8B5CF6', furDark: '#6D28D9', furLight: '#A78BFA', belly: '#DDD6FE', nose: '#F472B6', eyes: '#FFFBEB', ears: '#8B5CF6', earsInner: '#C4B5FD', paws: '#DDD6FE' }
        };
        return palettes[species] || palettes.meowl;
    }
    
    /**
     * Set up mouse tracking for head movement
     */
    #setupMouseTracking() {
        const updateTarget = (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = ((e.clientX || 0) - rect.left) / rect.width;
            const y = ((e.clientY || 0) - rect.top) / rect.height;
            this.headTargetX = (x - 0.5) * 20;
            this.headTargetY = (y - 0.5) * 15;
        };
        
        this.canvas.addEventListener('mousemove', updateTarget);
        this.canvas.addEventListener('touchmove', (e) => {
            updateTarget(e.touches[0]);
        });
        
        // Click to pet
        this.canvas.addEventListener('click', () => {
            this.isPetting = true;
            this.petTimer = 30;
            this.happinessPulse = 1;
        });
        
        this._cleanup = () => {
            this.canvas?.removeEventListener('mousemove', updateTarget);
        };
    }
    
    /**
     * Start the animation loop
     */
    #startAnimation() {
        const animate = () => {
            this.#update();
            this.#draw();
            this.animFrame = requestAnimationFrame(animate);
        };
        animate();
    }
    
    /**
     * Update animation state
     */
    #update() {
        const stats = this.pet?.stats || {};
        const avgHealth = (stats.health || 100) / 100;
        const avgEnergy = (stats.energy || 100) / 100;
        const avgHappiness = (stats.happiness || 100) / 100;
        
        this.time += 0.02 * (0.5 + avgEnergy * 0.5);
        this.blinkTimer++;
        
        // Blink every 3-5 seconds
        if (this.blinkTimer > 180 + Math.random() * 120 && !this.isBlinking) {
            this.isBlinking = true;
            this.blinkTimer = 0;
        }
        if (this.isBlinking && this.blinkTimer > 6) {
            this.isBlinking = false;
        }
        
        // Breathing
        this.breathPhase += 0.03 * (0.5 + avgHealth * 0.5);
        
        // Head tracking (smooth follow)
        this.headX += (this.headTargetX - this.headX) * 0.05;
        this.headY += (this.headTargetY - this.headY) * 0.05;
        
        // Bobbing
        this.bobPhase += 0.02 * (0.3 + avgHappiness * 0.7);
        
        // Tail wag - faster when happy
        this.tailWagSpeed = 0.05 + avgHappiness * 0.15;
        this.tailWagPhase += this.tailWagSpeed;
        
        // Petting animation
        if (this.isPetting) {
            this.petTimer--;
            this.happinessPulse *= 0.95;
            if (this.petTimer <= 0) {
                this.isPetting = false;
                this.happinessPulse = 0;
            }
        }
        
        // Sleep animation
        this.isAsleep = this.pet?.isSleeping || false;
    }
    
    /**
     * Draw the 3D-style pet
     */
    #draw() {
        const ctx = this.ctx;
        const w = this.width;
        const h = this.height;
        
        ctx.clearRect(0, 0, w, h);
        
        const cx = w / 2 + this.headX * 0.3;
        const cy = h / 2 + 20 + this.headY * 0.3;
        const scale = Math.min(w, h) / 250;
        
        const bob = Math.sin(this.bobPhase) * 3 * scale;
        const breath = Math.sin(this.breathPhase) * 2 * scale;
        
        ctx.save();
        ctx.translate(cx, cy + bob);
        
        // Shadow
        ctx.save();
        ctx.translate(0, 50 * scale);
        ctx.scale(1, 0.3);
        ctx.beginPath();
        ctx.ellipse(0, 0, 55 * scale, 15 * scale, 0, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0,0,0,0.15)';
        ctx.fill();
        ctx.restore();
        
        // Draw based on species
        this.#drawBody(scale, breath);
        this.#drawLegs(scale);
        this.#drawTail(scale);
        this.#drawHead(scale, breath);
        
        ctx.restore();
    }
    
    /**
     * Draw body with 3D shading
     */
    #drawBody(scale, breath) {
        const ctx = this.ctx;
        const c = this.colors;
        const s = scale;
        
        const bodyW = 60 * s;
        const bodyH = 45 * s + breath;
        
        // Body shadow (3D effect)
        ctx.save();
        ctx.translate(2 * s, 3 * s);
        
        // Main body with gradient for 3D look
        const gradient = ctx.createRadialGradient(
            -10 * s, -15 * s, 5 * s,
            0, 0, bodyW
        );
        gradient.addColorStop(0, c.furLight);
        gradient.addColorStop(0.5, c.fur);
        gradient.addColorStop(1, c.furDark);
        
        ctx.beginPath();
        ctx.ellipse(0, 0, bodyW, bodyH, 0, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
        
        // Belly (lighter area)
        const bellyGrad = ctx.createRadialGradient(0, 5 * s, 0, 0, 5 * s, bodyH * 0.6);
        bellyGrad.addColorStop(0, c.belly);
        bellyGrad.addColorStop(1, 'transparent');
        ctx.beginPath();
        ctx.ellipse(0, 5 * s, bodyW * 0.5, bodyH * 0.5, 0, 0, Math.PI * 2);
        ctx.fillStyle = bellyGrad;
        ctx.fill();
        
        // Highlight (top shine)
        ctx.beginPath();
        ctx.ellipse(-15 * s, -20 * s, bodyW * 0.3, bodyH * 0.3, -0.3, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,0.15)';
        ctx.fill();
        
        ctx.restore();
    }
    
    /**
     * Draw legs with 3D shading
     */
    #drawLegs(scale) {
        const ctx = this.ctx;
        const c = this.colors;
        const s = scale;
        
        const walkPhase = this.isAsleep ? 0 : Math.sin(this.time * 3) * 5 * s;
        
        const legs = [
            { x: -30 * s, y: 35 * s, offset: 0 },
            { x: -15 * s, y: 37 * s, offset: Math.PI },
            { x: 15 * s, y: 37 * s, offset: 0 },
            { x: 30 * s, y: 35 * s, offset: Math.PI }
        ];
        
        for (const leg of legs) {
            const legSwing = Math.sin(this.time * 3 + leg.offset) * 5 * s;
            const legH = 25 * s;
            
            ctx.save();
            ctx.translate(leg.x, leg.y);
            
            // Leg shadow
            ctx.fillStyle = c.furDark;
            ctx.shadowColor = 'rgba(0,0,0,0.2)';
            ctx.shadowBlur = 4 * s;
            
            ctx.beginPath();
            ctx.roundRect(-6 * s, 0, 12 * s, legH, 4 * s);
            ctx.fill();
            
            // Paw
            ctx.shadowBlur = 0;
            ctx.fillStyle = c.paws;
            ctx.beginPath();
            ctx.ellipse(0, legH, 7 * s, 4 * s, 0, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.restore();
        }
    }
    
    /**
     * Draw tail with wag animation
     */
    #drawTail(scale) {
        const ctx = this.ctx;
        const c = this.colors;
        const s = scale;
        
        const tailWag = Math.sin(this.tailWagPhase) * 15 * s;
        const tailX = -50 * s;
        const tailY = -30 * s + tailWag;
        
        ctx.save();
        ctx.translate(tailX, tailY);
        
        // Tail with gradient
        const gradient = ctx.createLinearGradient(0, 0, 20 * s, 0);
        gradient.addColorStop(0, c.furDark);
        gradient.addColorStop(0.5, c.fur);
        gradient.addColorStop(1, c.furLight);
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(15 * s, -20 * s - tailWag * 0.3, 35 * s, -5 * s);
        ctx.quadraticCurveTo(15 * s, 25 * s + tailWag * 0.3, 0, 0);
        ctx.fill();
        
        ctx.restore();
    }
    
    /**
     * Draw head with 3D features
     */
    #drawHead(scale, breath) {
        const ctx = this.ctx;
        const c = this.colors;
        const s = scale;
        
        const headX = 45 * s;
        const headY = -30 * s - breath * 0.5 + this.headY * 0.5;
        
        ctx.save();
        ctx.translate(headX, headY);
        
        // Head rotation toward cursor
        const headRot = this.headX * 0.01;
        ctx.rotate(headRot);
        
        // Head shadow
        ctx.shadowColor = 'rgba(0,0,0,0.2)';
        ctx.shadowBlur = 8 * s;
        
        // Main head shape
        const headW = 30 * s;
        const headH = 28 * s;
        
        const headGradient = ctx.createRadialGradient(
            -8 * s, -10 * s, 3 * s,
            0, 0, headW
        );
        headGradient.addColorStop(0, c.furLight);
        headGradient.addColorStop(0.6, c.fur);
        headGradient.addColorStop(1, c.furDark);
        
        ctx.shadowBlur = 8 * s;
        ctx.beginPath();
        ctx.ellipse(0, 0, headW, headH, 0, 0, Math.PI * 2);
        ctx.fillStyle = headGradient;
        ctx.fill();
        
        // Ears
        this.#drawEars(s);
        
        ctx.shadowBlur = 0;
        
        // Eyes
        this.#drawEyes(s);
        
        // Nose
        ctx.beginPath();
        ctx.ellipse(0, 5 * s, 4 * s, 3 * s, 0, 0, Math.PI * 2);
        ctx.fillStyle = c.nose;
        ctx.fill();
        
        // Nose highlight
        ctx.beginPath();
        ctx.ellipse(-1 * s, 4 * s, 1.5 * s, 1 * s, 0, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.fill();
        
        // Mouth
        ctx.strokeStyle = c.furDark;
        ctx.lineWidth = 1.5 * s;
        ctx.beginPath();
        ctx.arc(0, 8 * s, 5 * s, 0.1, Math.PI - 0.1);
        ctx.stroke();
        
        // Whiskers
        this.#drawWhiskers(s);
        
        // Happiness pulse glow
        if (this.happinessPulse > 0.05) {
            ctx.save();
            ctx.globalAlpha = this.happinessPulse * 0.3;
            ctx.shadowColor = '#ffd700';
            ctx.shadowBlur = 30 * s;
            ctx.beginPath();
            ctx.arc(0, 0, headW, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255,215,0,0.1)';
            ctx.fill();
            ctx.restore();
        }
        
        // Sleeping ZZZ
        if (this.isAsleep) {
            ctx.save();
            ctx.font = `${16 * s}px sans-serif`;
            ctx.fillStyle = 'rgba(100,100,100,0.5)';
            const zzz = ['z', 'Z', 'z'][Math.floor(this.time * 2) % 3];
            ctx.fillText(zzz + zzz + zzz, 25 * s, -30 * s);
            ctx.restore();
        }
        
        ctx.restore();
    }
    
    /**
     * Draw ears
     */
    #drawEars(scale) {
        const ctx = this.ctx;
        const c = this.colors;
        const s = scale;
        
        const earWag = this.isAsleep ? 0 : Math.sin(this.time * 2) * 2 * s;
        
        const ears = [
            { x: -20 * s, y: -20 * s, rot: -0.3 },
            { x: 20 * s, y: -20 * s, rot: 0.3 }
        ];
        
        for (const ear of ears) {
            ctx.save();
            ctx.translate(ear.x, ear.y + earWag);
            ctx.rotate(ear.rot);
            
            ctx.shadowColor = 'rgba(0,0,0,0.2)';
            ctx.shadowBlur = 4 * s;
            
            // Outer ear
            ctx.beginPath();
            ctx.moveTo(-12 * s, 5 * s);
            ctx.lineTo(0, -20 * s);
            ctx.lineTo(12 * s, 5 * s);
            ctx.closePath();
            const earGrad = ctx.createLinearGradient(0, -20 * s, 0, 5 * s);
            earGrad.addColorStop(0, c.ears);
            earGrad.addColorStop(1, c.earsInner);
            ctx.fillStyle = earGrad;
            ctx.fill();
            
            // Inner ear
            ctx.shadowBlur = 0;
            ctx.beginPath();
            ctx.moveTo(-6 * s, 3 * s);
            ctx.lineTo(0, -12 * s);
            ctx.lineTo(6 * s, 3 * s);
            ctx.closePath();
            ctx.fillStyle = c.earsInner;
            ctx.fill();
            
            ctx.restore();
        }
    }
    
    /**
     * Draw eyes with expression
     */
    #drawEyes(scale) {
        const ctx = this.ctx;
        const c = this.colors;
        const s = scale;
        
        const eyeY = -4 * s + this.headY * 0.3;
        const eyeOffset = this.headX * 0.1;
        
        const isHappy = this.pet?.stats?.happiness > 60;
        const isTired = this.pet?.stats?.energy < 30 || this.isAsleep;
        const isSad = this.pet?.stats?.happiness < 30;
        
        const eyes = [
            { x: -9 * s + eyeOffset, y: eyeY },
            { x: 9 * s + eyeOffset, y: eyeY }
        ];
        
        for (const eye of eyes) {
            // Eye white
            ctx.beginPath();
            ctx.ellipse(eye.x, eye.y, 7 * s, 5 * s, 0, 0, Math.PI * 2);
            ctx.fillStyle = '#ffffff';
            ctx.fill();
            ctx.strokeStyle = c.furDark;
            ctx.lineWidth = 1 * s;
            ctx.stroke();
            
            if (this.isBlinking || (this.isAsleep && Math.sin(this.time * 0.5) > 0)) {
                // Closed eye (happy curve)
                ctx.beginPath();
                ctx.arc(eye.x, eye.y, 6 * s, 0, Math.PI);
                ctx.strokeStyle = c.furDark;
                ctx.lineWidth = 2 * s;
                ctx.stroke();
                continue;
            }
            
            // Iris
            const irisX = eye.x + this.headX * 0.05;
            const irisY = eye.y;
            const irisR = 4 * s;
            
            ctx.beginPath();
            ctx.ellipse(irisX, irisY, irisR, irisR, 0, 0, Math.PI * 2);
            ctx.fillStyle = c.eyes;
            ctx.fill();
            
            // Pupil
            ctx.beginPath();
            ctx.ellipse(irisX, irisY, 2.5 * s, 3 * s, 0, 0, Math.PI * 2);
            ctx.fillStyle = '#1a1a2e';
            ctx.fill();
            
            // Eye shine
            ctx.beginPath();
            ctx.ellipse(irisX - 1.5 * s, irisY - 1.5 * s, 1.5 * s, 1.5 * s, 0, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255,255,255,0.8)';
            ctx.fill();
            
            // Second smaller shine
            ctx.beginPath();
            ctx.ellipse(irisX + 1 * s, irisY + 1 * s, 0.8 * s, 0.8 * s, 0, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255,255,255,0.4)';
            ctx.fill();
        }
        
        // Eyebrows for expression
        if (isSad) {
            ctx.strokeStyle = c.furDark;
            ctx.lineWidth = 1.5 * s;
            for (const eye of eyes) {
                ctx.beginPath();
                ctx.moveTo(eye.x - 6 * s, eye.y - 10 * s);
                ctx.lineTo(eye.x + 6 * s, eye.y - 8 * s);
                ctx.stroke();
            }
        }
    }
    
    /**
     * Draw whiskers
     */
    #drawWhiskers(scale) {
        const ctx = this.ctx;
        const c = this.colors;
        const s = scale;
        
        ctx.strokeStyle = c.furDark;
        ctx.lineWidth = 1 * s;
        ctx.globalAlpha = 0.5;
        
        const whiskers = [
            { x: -15 * s, y: 2 * s, x2: -35 * s, y2: -3 * s },
            { x: -15 * s, y: 5 * s, x2: -37 * s, y2: 5 * s },
            { x: -15 * s, y: 8 * s, x2: -35 * s, y2: 13 * s },
            { x: 15 * s, y: 2 * s, x2: 35 * s, y2: -3 * s },
            { x: 15 * s, y: 5 * s, x2: 37 * s, y2: 5 * s },
            { x: 15 * s, y: 8 * s, x2: 35 * s, y2: 13 * s }
        ];
        
        for (const w of whiskers) {
            ctx.beginPath();
            ctx.moveTo(w.x, w.y);
            ctx.lineTo(w.x2, w.y2);
            ctx.stroke();
        }
        
        ctx.globalAlpha = 1;
    }
    
    /**
     * Stop the animation loop
     */
    destroy() {
        if (this.animFrame) {
            cancelAnimationFrame(this.animFrame);
        }
        if (this._cleanup) {
            this._cleanup();
        }
    }
}

export default PetRenderer;