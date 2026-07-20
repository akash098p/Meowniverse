/**
 * MeowlRenderer - Ultra-realistic owl-cat hybrid renderer
 * @module pets/MeowlRenderer
 * 
 * Specialized renderer for the legendary Meowl pet with
 * detailed feathers, large luminous eyes, and hybrid features.
 */
class MeowlRenderer {
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
        
        // Animation
        this.time = 0;
        this.blinkTimer = 0;
        this.isBlinking = false;
        this.breathPhase = 0;
        this.wingFlapPhase = 0;
        
        // Interaction
        this.isPetting = false;
        this.petTimer = 0;
        this.happinessPulse = 0;
        this.headTilt = 0;
        
        // Head tracking
        this.headTargetX = 0;
        this.headTargetY = 0;
        this.headX = 0;
        this.headY = 0;
        
        // Movement
        this.bobPhase = Math.random() * Math.PI * 2;
        this.tailWagPhase = 0;
        
        // Glow effect for wisdom ability
        this.wisdomGlow = 0;
        
        this.#setupMouseTracking();
        this.#startAnimation();
    }
    
    #setupMouseTracking() {
        const updateTarget = (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = ((e.clientX || 0) - rect.left) / rect.width;
            const y = ((e.clientY || 0) - rect.top) / rect.height;
            this.headTargetX = (x - 0.5) * 25;
            this.headTargetY = (y - 0.5) * 20;
        };
        
        this.canvas.addEventListener('mousemove', updateTarget);
        this.canvas.addEventListener('touchmove', (e) => {
            updateTarget(e.touches[0]);
        });
        
        this.canvas.addEventListener('click', () => {
            this.isPetting = true;
            this.petTimer = 40;
            this.happinessPulse = 1;
        });
        
        this._cleanup = () => {
            this.canvas?.removeEventListener('mousemove', updateTarget);
        };
    }
    
    #startAnimation() {
        const animate = () => {
            this.#update();
            this.#draw();
            this.animFrame = requestAnimationFrame(animate);
        };
        animate();
    }
    
    #update() {
        const stats = this.pet?.stats || {};
        const avgHealth = (stats.health || 100) / 100;
        const avgEnergy = (stats.energy || 100) / 100;
        const avgHappiness = (stats.happiness || 100) / 100;
        
        this.time += 0.018 * (0.5 + avgEnergy * 0.5);
        this.blinkTimer++;
        
        if (this.blinkTimer > 200 + Math.random() * 150 && !this.isBlinking) {
            this.isBlinking = true;
            this.blinkTimer = 0;
        }
        if (this.isBlinking && this.blinkTimer > 8) {
            this.isBlinking = false;
        }
        
        this.breathPhase += 0.025 * (0.5 + avgHealth * 0.5);
        this.wingFlapPhase += 0.03;
        
        this.headX += (this.headTargetX - this.headX) * 0.04;
        this.headY += (this.headTargetY - this.headY) * 0.04;
        
        this.bobPhase += 0.015 * (0.3 + avgHappiness * 0.7);
        this.tailWagPhase += 0.04 + avgHappiness * 0.12;
        
        if (this.isPetting) {
            this.petTimer--;
            this.happinessPulse *= 0.94;
            if (this.petTimer <= 0) {
                this.isPetting = false;
                this.happinessPulse = 0;
            }
        }
        
        this.isAsleep = this.pet?.isSleeping || false;
        
        // Wisdom glow when intelligence is high
        this.wisdomGlow = stats.intelligence > 80 ? 0.3 : 0;
    }
    
    #draw() {
        const ctx = this.ctx;
        const w = this.width;
        const h = this.height;
        
        ctx.clearRect(0, 0, w, h);
        
        const cx = w / 2 + this.headX * 0.2;
        const cy = h / 2 + 25 + this.headY * 0.2;
        const scale = Math.min(w, h) / 280;
        
        const bob = Math.sin(this.bobPhase) * 4 * scale;
        const breath = Math.sin(this.breathPhase) * 3 * scale;
        
        ctx.save();
        ctx.translate(cx, cy + bob);
        
        // Ground shadow
        ctx.save();
        ctx.translate(0, 65 * scale);
        ctx.scale(1, 0.25);
        ctx.beginPath();
        ctx.ellipse(0, 0, 70 * scale, 18 * scale, 0, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0,0,0,0.18)';
        ctx.fill();
        ctx.restore();
        
        // Draw Meowl parts
        this.#drawWings(scale, breath);
        this.#drawTail(scale);
        this.#drawLegs(scale);
        this.#drawBody(scale, breath);
        this.#drawHead(scale, breath);
        
        ctx.restore();
    }
    
    #drawBody(scale, breath) {
        const ctx = this.ctx;
        const s = scale;
        
        // Fluffy body
        ctx.save();
        ctx.translate(2 * s, 3 * s);
        
        const bodyW = 65 * s;
        const bodyH = 55 * s + breath;
        
        // Main body gradient
        const gradient = ctx.createRadialGradient(
            -12 * s, -18 * s, 8 * s,
            0, 0, bodyW * 1.2
        );
        gradient.addColorStop(0, '#A78BFA');
        gradient.addColorStop(0.4, '#8B5CF6');
        gradient.addColorStop(0.8, '#6D28D9');
        gradient.addColorStop(1, '#4C1D95');
        
        ctx.beginPath();
        ctx.ellipse(0, 0, bodyW, bodyH, 0, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
        
        // Fluffy texture (multiple overlapping circles)
        ctx.globalAlpha = 0.3;
        for (let i = 0; i < 12; i++) {
            const fx = (Math.cos(i * 0.8) * 35) * s;
            const fy = (Math.sin(i * 1.2) * 30) * s;
            const fr = (15 + Math.random() * 10) * s;
            ctx.beginPath();
            ctx.arc(fx, fy, fr, 0, Math.PI * 2);
            ctx.fillStyle = i % 2 === 0 ? '#A78BFA' : '#DDD6FE';
            ctx.fill();
        }
        ctx.globalAlpha = 1;
        
        // Belly
        const bellyGrad = ctx.createRadialGradient(0, 8 * s, 0, 0, 8 * s, bodyH * 0.55);
        bellyGrad.addColorStop(0, '#DDD6FE');
        bellyGrad.addColorStop(0.6, '#C4B5FD');
        bellyGrad.addColorStop(1, 'transparent');
        ctx.beginPath();
        ctx.ellipse(0, 8 * s, bodyW * 0.45, bodyH * 0.45, 0, 0, Math.PI * 2);
        ctx.fillStyle = bellyGrad;
        ctx.fill();
        
        // Highlight
        ctx.beginPath();
        ctx.ellipse(-18 * s, -25 * s, bodyW * 0.25, bodyH * 0.25, -0.4, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        ctx.fill();
        
        ctx.restore();
    }
    
    #drawWings(scale, breath) {
        const ctx = this.ctx;
        const c = this.colors || { fur: '#8B5CF6', furDark: '#6D28D9', furLight: '#A78BFA' };
        const s = scale;
        
        const wingFlap = this.isAsleep ? 0 : Math.sin(this.wingFlapPhase) * 3 * s;
        
        const wings = [
            { x: -55 * s, y: -10 * s, rot: -0.4 + wingFlap * 0.02 },
            { x: 55 * s, y: -10 * s, rot: 0.4 - wingFlap * 0.02 }
        ];
        
        for (const wing of wings) {
            ctx.save();
            ctx.translate(wing.x, wing.y);
            ctx.rotate(wing.rot);
            
            // Wing shape (feathered)
            const wingGrad = ctx.createLinearGradient(0, 0, 40 * s, 0);
            wingGrad.addColorStop(0, c.furDark);
            wingGrad.addColorStop(0.5, c.fur);
            wingGrad.addColorStop(1, c.furLight);
            
            ctx.fillStyle = wingGrad;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.quadraticCurveTo(20 * s, -30 * s - wingFlap, 50 * s, -10 * s);
            ctx.quadraticCurveTo(35 * s, 10 * s + wingFlap, 0, 0);
            ctx.fill();
            
            // Feather details
            ctx.strokeStyle = c.furDark;
            ctx.lineWidth = 1 * s;
            ctx.globalAlpha = 0.3;
            for (let i = 0; i < 4; i++) {
                ctx.beginPath();
                ctx.moveTo(5 * s + i * 8 * s, -2 * s);
                ctx.quadraticCurveTo(15 * s + i * 8 * s, -15 * s - wingFlap, 25 * s + i * 8 * s, -5 * s);
                ctx.stroke();
            }
            ctx.globalAlpha = 1;
            
            ctx.restore();
        }
    }
    
    #drawLegs(scale) {
        const ctx = this.ctx;
        const s = scale;
        
        const legs = [
            { x: -22 * s, y: 45 * s },
            { x: -8 * s, y: 48 * s },
            { x: 8 * s, y: 48 * s },
            { x: 22 * s, y: 45 * s }
        ];
        
        for (const leg of legs) {
            ctx.save();
            ctx.translate(leg.x, leg.y);
            
            // Leg
            ctx.fillStyle = '#DDD6FE';
            ctx.shadowColor = 'rgba(0,0,0,0.15)';
            ctx.shadowBlur = 3 * s;
            ctx.beginPath();
            ctx.roundRect(-5 * s, 0, 10 * s, 22 * s, 3 * s);
            ctx.fill();
            
            // Talon/feet
            ctx.shadowBlur = 0;
            ctx.fillStyle = '#C4B5FD';
            ctx.beginPath();
            ctx.ellipse(0, 22 * s, 6 * s, 3.5 * s, 0, 0, Math.PI * 2);
            ctx.fill();
            
            // Toe details
            ctx.fillStyle = '#8B5CF6';
            for (let i = -1; i <= 1; i++) {
                ctx.beginPath();
                ctx.arc(i * 3 * s, 23 * s, 1.2 * s, 0, Math.PI * 2);
                ctx.fill();
            }
            
            ctx.restore();
        }
    }
    
    #drawTail(scale) {
        const ctx = this.ctx;
        const s = scale;
        
        const tailWag = Math.sin(this.tailWagPhase) * 12 * s;
        
        ctx.save();
        ctx.translate(-35 * s, 20 * s);
        
        // Fluffy tail
        const tailGrad = ctx.createLinearGradient(0, 0, 30 * s, 0);
        tailGrad.addColorStop(0, '#6D28D9');
        tailGrad.addColorStop(0.5, '#8B5CF6');
        tailGrad.addColorStop(1, '#A78BFA');
        
        ctx.fillStyle = tailGrad;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(15 * s, -15 * s - tailWag, 35 * s, 5 * s);
        ctx.quadraticCurveTo(20 * s, 20 * s + tailWag, 0, 0);
        ctx.fill();
        
        // Tail rings (like a cat)
        ctx.strokeStyle = '#6D28D9';
        ctx.lineWidth = 1.5 * s;
        ctx.globalAlpha = 0.4;
        for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.arc(10 * s + i * 8 * s, 5 * s, 4 * s, 0, Math.PI);
            ctx.stroke();
        }
        ctx.globalAlpha = 1;
        
        ctx.restore();
    }
    
    #drawHead(scale, breath) {
        const ctx = this.ctx;
        const s = scale;
        
        const headX = 50 * s;
        const headY = -35 * s - breath * 0.4 + this.headY * 0.4;
        
        ctx.save();
        ctx.translate(headX, headY);
        
        // Head tilt based on mouse
        const headRot = this.headX * 0.008 + Math.sin(this.time * 0.5) * 0.02;
        ctx.rotate(headRot);
        
        // Wisdom glow
        if (this.wisdomGlow > 0) {
            ctx.save();
            ctx.shadowColor = '#FFD700';
            ctx.shadowBlur = 40 * s * this.wisdomGlow;
            ctx.beginPath();
            ctx.arc(0, 0, 50 * s, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 215, 0, ${this.wisdomGlow * 0.15})`;
            ctx.fill();
            ctx.restore();
        }
        
        // Head shadow
        ctx.shadowColor = 'rgba(0,0,0,0.25)';
        ctx.shadowBlur = 10 * s;
        
        // Main head (more rounded like an owl)
        const headGradient = ctx.createRadialGradient(
            -10 * s, -12 * s, 6 * s,
            0, 0, 38 * s
        );
        headGradient.addColorStop(0, '#A78BFA');
        headGradient.addColorStop(0.5, '#8B5CF6');
        headGradient.addColorStop(1, '#6D28D9');
        
        ctx.beginPath();
        ctx.ellipse(0, 0, 32 * s, 30 * s, 0, 0, Math.PI * 2);
        ctx.fillStyle = headGradient;
        ctx.fill();
        
        ctx.shadowBlur = 0;
        
        // Face disc (owl feature)
        ctx.save();
        ctx.globalAlpha = 0.2;
        const faceGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, 28 * s);
        faceGrad.addColorStop(0, '#DDD6FE');
        faceGrad.addColorStop(1, 'transparent');
        ctx.beginPath();
        ctx.ellipse(0, 0, 28 * s, 26 * s, 0, 0, Math.PI * 2);
        ctx.fillStyle = faceGrad;
        ctx.fill();
        ctx.restore();
        
        // Ear tufts (cat-like)
        this.#drawEarTufts(s);
        
        // Eyes (large and luminous like an owl)
        this.#drawEyes(s);
        
        // Beak (small, cat-like)
        this.#drawBeak(s);
        
        // Whiskers
        this.#drawWhiskers(s);
        
        // Happiness pulse
        if (this.happinessPulse > 0.05) {
            ctx.save();
            ctx.globalAlpha = this.happinessPulse * 0.35;
            ctx.shadowColor = '#FFD700';
            ctx.shadowBlur = 35 * s;
            ctx.beginPath();
            ctx.arc(0, 0, 40 * s, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255, 215, 0, 0.12)';
            ctx.fill();
            ctx.restore();
        }
        
        // Sleeping ZZZ
        if (this.isAsleep) {
            ctx.save();
            ctx.font = `bold ${18 * s}px sans-serif`;
            ctx.fillStyle = 'rgba(100, 100, 120, 0.6)';
            const zzz = ['z', 'Z', 'Z'][Math.floor(this.time * 1.5) % 3];
            ctx.fillText(zzz + zzz + zzz, 30 * s, -35 * s);
            ctx.restore();
        }
        
        ctx.restore();
    }
    
    #drawEarTufts(scale) {
        const ctx = this.ctx;
        const s = scale;
        
        const tuftWag = this.isAsleep ? 0 : Math.sin(this.time * 1.8) * 2 * s;
        
        const tufts = [
            { x: -25 * s, y: -22 * s, rot: -0.5 },
            { x: 25 * s, y: -22 * s, rot: 0.5 }
        ];
        
        for (const tuft of tufts) {
            ctx.save();
            ctx.translate(tuft.x, tuft.y + tuftWag);
            ctx.rotate(tuft.rot);
            
            ctx.shadowColor = 'rgba(0,0,0,0.2)';
            ctx.shadowBlur = 4 * s;
            
            // Tuft shape
            const tuftGrad = ctx.createLinearGradient(0, -25 * s, 0, 5 * s);
            tuftGrad.addColorStop(0, '#A78BFA');
            tuftGrad.addColorStop(1, '#8B5CF6');
            
            ctx.fillStyle = tuftGrad;
            ctx.beginPath();
            ctx.moveTo(-8 * s, 5 * s);
            ctx.quadraticCurveTo(-4 * s, -15 * s, 0, -28 * s);
            ctx.quadraticCurveTo(4 * s, -15 * s, 8 * s, 5 * s);
            ctx.closePath();
            ctx.fill();
            
            ctx.restore();
        }
    }
    
    #drawEyes(scale) {
        const ctx = this.ctx;
        const s = scale;
        
        const eyeY = -2 * s + this.headY * 0.25;
        const eyeOffset = this.headX * 0.08;
        
        const eyes = [
            { x: -11 * s + eyeOffset, y: eyeY },
            { x: 11 * s + eyeOffset, y: eyeY }
        ];
        
        for (const eye of eyes) {
            // Eye socket shadow
            ctx.beginPath();
            ctx.ellipse(eye.x, eye.y, 9 * s, 8 * s, 0, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(75, 29, 122, 0.3)';
            ctx.fill();
            
            if (this.isBlinking || (this.isAsleep && Math.sin(this.time * 0.4) > 0)) {
                // Closed eye (content curve)
                ctx.beginPath();
                ctx.arc(eye.x, eye.y, 7 * s, 0.1, Math.PI - 0.1);
                ctx.strokeStyle = '#6D28D9';
                ctx.lineWidth = 2.5 * s;
                ctx.stroke();
                continue;
            }
            
            // Large owl eye white
            ctx.beginPath();
            ctx.ellipse(eye.x, eye.y, 8.5 * s, 7.5 * s, 0, 0, Math.PI * 2);
            ctx.fillStyle = '#FFFBEB';
            ctx.fill();
            ctx.strokeStyle = '#6D28D9';
            ctx.lineWidth = 1.2 * s;
            ctx.stroke();
            
            // Iris (luminous yellow)
            const irisX = eye.x + this.headX * 0.04;
            const irisY = eye.y;
            
            const irisGrad = ctx.createRadialGradient(
                irisX, irisY, 0,
                irisX, irisY, 5.5 * s
            );
            irisGrad.addColorStop(0, '#FFFBEB');
            irisGrad.addColorStop(0.3, '#FEF3C7');
            irisGrad.addColorStop(0.7, '#FCD34D');
            irisGrad.addColorStop(1, '#F59E0B');
            
            ctx.beginPath();
            ctx.ellipse(irisX, irisY, 5.5 * s, 5.5 * s, 0, 0, Math.PI * 2);
            ctx.fillStyle = irisGrad;
            ctx.fill();
            
            // Large pupil (vertical slit like a cat)
            ctx.beginPath();
            ctx.ellipse(irisX, irisY, 1.8 * s, 4.5 * s, 0, 0, Math.PI * 2);
            ctx.fillStyle = '#1a1a2e';
            ctx.fill();
            
            // Eye shine (multiple for realism)
            ctx.beginPath();
            ctx.ellipse(irisX - 2 * s, irisY - 2 * s, 2 * s, 2 * s, 0, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.fill();
            
            ctx.beginPath();
            ctx.ellipse(irisX + 1.5 * s, irisY + 1.5 * s, 1 * s, 1 * s, 0, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.fill();
        }
    }
    
    #drawBeak(scale) {
        const ctx = this.ctx;
        const s = scale;
        
        // Small cat-like nose/mouth
        ctx.fillStyle = '#F472B6';
        ctx.beginPath();
        ctx.ellipse(0, 6 * s, 3.5 * s, 2.5 * s, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Nose highlight
        ctx.beginPath();
        ctx.ellipse(-1 * s, 5 * s, 1.2 * s, 0.8 * s, 0, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.fill();
        
        // Mouth (cat-like)
        ctx.strokeStyle = '#6D28D9';
        ctx.lineWidth = 1.5 * s;
        ctx.beginPath();
        ctx.moveTo(0, 8.5 * s);
        ctx.lineTo(-4 * s, 11 * s);
        ctx.moveTo(0, 8.5 * s);
        ctx.lineTo(4 * s, 11 * s);
        ctx.stroke();
    }
    
    #drawWhiskers(scale) {
        const ctx = this.ctx;
        const s = scale;
        
        ctx.strokeStyle = '#6D28D9';
        ctx.lineWidth = 1.2 * s;
        ctx.globalAlpha = 0.6;
        
        const whiskers = [
            { x: -18 * s, y: 4 * s, x2: -40 * s, y2: 0 },
            { x: -18 * s, y: 7 * s, x2: -42 * s, y2: 7 * s },
            { x: -18 * s, y: 10 * s, x2: -40 * s, y2: 14 * s },
            { x: 18 * s, y: 4 * s, x2: 40 * s, y2: 0 },
            { x: 18 * s, y: 7 * s, x2: 42 * s, y2: 7 * s },
            { x: 18 * s, y: 10 * s, x2: 40 * s, y2: 14 * s }
        ];
        
        for (const w of whiskers) {
            ctx.beginPath();
            ctx.moveTo(w.x, w.y);
            ctx.lineTo(w.x2, w.y2);
            ctx.stroke();
        }
        
        ctx.globalAlpha = 1;
    }
    
    destroy() {
        if (this.animFrame) {
            cancelAnimationFrame(this.animFrame);
        }
        if (this._cleanup) {
            this._cleanup();
        }
    }
}

export default MeowlRenderer;