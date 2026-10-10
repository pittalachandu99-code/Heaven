/**
 * 4K Luxury Intro Canvas & Particle Engine for "Heaven" Perfume
 * High DPI Retina support, procedural mist physics, vector logo sampling,
 * and cinematic animation orchestration.
 */

class HeavenIntroEngine {
  constructor() {
    this.canvas = document.getElementById('intro-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.dpr = Math.min(window.devicePixelRatio || 1, 2.5); // Crisp 4K / Retina scaling

    this.particles = [];
    this.ambientMotes = [];
    this.petals = [];
    this.logoPoints = [];
    this.sprayOrigin = { x: 0, y: 0 };

    this.state = 'idle'; // 'idle', 'arriving', 'spraying', 'coalescing', 'solidified', 'completed'
    this.startTime = 0;
    this.elapsed = 0;
    this.animId = null;

    // Element references
    this.introContainer = document.getElementById('intro-section');
    this.handLayer = document.getElementById('hand-layer');
    this.handReadyImg = document.getElementById('hand-ready-img');
    this.handSprayImg = document.getElementById('hand-spray-img');
    this.logoOverlay = document.getElementById('logo-vector-overlay');
    this.shimmerSweep = document.getElementById('shimmer-sweep');
    this.introControls = document.getElementById('intro-ui-controls');

    this.initDimensions();
    this.initAmbientDust();
    this.initPetals();
    this.generateLogoTargetPoints();
    this.bindEvents();
  }

  initDimensions() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = this.width * this.dpr;
    this.canvas.height = this.height * this.dpr;
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

    // Calculate nozzle position based on hand placement
    // Hand image rests on right side: nozzle is approx at 52.5% X, 23.5% Y inside the 16:9 container
    this.updateSprayOrigin();
  }

  updateSprayOrigin() {
    const handRect = this.handLayer.getBoundingClientRect();
    // Precise nozzle position relative to the viewport
    this.sprayOrigin = {
      x: handRect.left + handRect.width * 0.528,
      y: handRect.top + handRect.height * 0.236
    };
  }

  bindEvents() {
    window.addEventListener('resize', () => {
      this.initDimensions();
      this.generateLogoTargetPoints();
    });
  }

  /**
   * Generates target coordinates for the "Heaven" brand logo,
   * lotus symbol, underline flourish, and "jasmine" text
   */
  generateLogoTargetPoints() {
    const offscreen = document.createElement('canvas');
    const targetW = 900;
    const targetH = 500;
    offscreen.width = targetW;
    offscreen.height = targetH;
    const octx = offscreen.getContext('2d');

    octx.clearRect(0, 0, targetW, targetH);
    octx.fillStyle = '#ffffff';

    const cx = targetW / 2;
    const cy = targetH / 2;

    // 1. Draw Stylized Lotus Symbol (Crown above Heaven)
    this.drawLotusSymbol(octx, cx, cy - 110, 48);

    // 2. Draw "Heaven" Typography
    octx.textAlign = 'center';
    octx.textBaseline = 'middle';
    octx.font = 'bold 84px "Playfair Display", "Cinzel", "Cormorant Garamond", Georgia, serif';
    octx.fillText('Heaven', cx, cy - 20);

    // 3. Draw Flourish Underline with descending tick
    octx.lineWidth = 3.5;
    octx.strokeStyle = '#ffffff';
    octx.beginPath();
    // Swoop under 'eav'
    octx.moveTo(cx - 110, cy + 22);
    octx.bezierCurveTo(cx - 50, cy + 28, cx - 20, cy + 40, cx, cy + 40);
    octx.bezierCurveTo(cx + 20, cy + 40, cx + 50, cy + 28, cx + 110, cy + 22);
    octx.stroke();

    // Vertical accent tick
    octx.beginPath();
    octx.moveTo(cx, cy + 40);
    octx.lineTo(cx, cy + 58);
    octx.stroke();

    // 4. Draw "jasmine" Subtitle
    octx.font = '300 24px "Montserrat", "Lato", sans-serif';
    octx.letterSpacing = '8px';
    octx.fillText('j a s m i n e', cx, cy + 85);

    // Sample pixels to create particle targets
    const imgData = octx.getImageData(0, 0, targetW, targetH).data;
    const points = [];
    const step = 3; // Step sampling for high density

    for (let y = 0; y < targetH; y += step) {
      for (let x = 0; x < targetW; x += step) {
        const idx = (y * targetW + x) * 4;
        if (imgData[idx + 3] > 140) {
          points.push({
            // Normalize relative to center
            relX: (x - cx) / targetW,
            relY: (y - cy) / targetH,
            // Slight jitter for organic liquid feel
            jitterX: (Math.random() - 0.5) * 2,
            jitterY: (Math.random() - 0.5) * 2,
            size: Math.random() < 0.25 ? 2.8 : Math.random() < 0.6 ? 2.0 : 1.4,
            alpha: 0.7 + Math.random() * 0.3,
            colorHue: 42 + (Math.random() - 0.5) * 10 // Warm champagne gold
          });
        }
      }
    }

    // Shuffle points for organic assembly
    for (let i = points.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [points[i], points[j]] = [points[j], points[i]];
    }

    this.logoPoints = points;
  }

  drawLotusSymbol(ctx, x, y, size) {
    ctx.save();
    ctx.translate(x, y);

    // Center teardrop/flame petal
    ctx.beginPath();
    ctx.moveTo(0, size * 0.45);
    ctx.bezierCurveTo(size * 0.35, size * 0.2, size * 0.25, -size * 0.5, 0, -size * 0.65);
    ctx.bezierCurveTo(-size * 0.25, -size * 0.5, -size * 0.35, size * 0.2, 0, size * 0.45);
    ctx.fill();

    // Left curved petal
    ctx.beginPath();
    ctx.moveTo(-size * 0.08, size * 0.42);
    ctx.bezierCurveTo(-size * 0.4, size * 0.35, -size * 0.75, 0, -size * 0.65, -size * 0.32);
    ctx.bezierCurveTo(-size * 0.5, -size * 0.1, -size * 0.25, size * 0.15, -size * 0.08, size * 0.42);
    ctx.fill();

    // Right curved petal
    ctx.beginPath();
    ctx.moveTo(size * 0.08, size * 0.42);
    ctx.bezierCurveTo(size * 0.4, size * 0.35, size * 0.75, 0, size * 0.65, -size * 0.32);
    ctx.bezierCurveTo(size * 0.5, -size * 0.1, size * 0.25, size * 0.15, size * 0.08, size * 0.42);
    ctx.fill();

    // Small base crescent
    ctx.beginPath();
    ctx.ellipse(0, size * 0.46, size * 0.28, size * 0.08, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  initAmbientDust() {
    this.ambientMotes = [];
    const count = 90;
    for (let i = 0; i < count; i++) {
      this.ambientMotes.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: -0.2 - Math.random() * 0.3,
        size: 1.0 + Math.random() * 2.5,
        alpha: 0.15 + Math.random() * 0.45,
        baseAlpha: 0.15 + Math.random() * 0.45,
        phase: Math.random() * Math.PI * 2,
        color: Math.random() > 0.4 ? 'rgba(235, 205, 140,' : 'rgba(255, 240, 190,'
      });
    }
  }

  initPetals() {
    this.petals = [];
    const petalCount = 18;
    for (let i = 0; i < petalCount; i++) {
      this.petals.push({
        x: Math.random() * this.width,
        y: -50 - Math.random() * this.height,
        vx: -0.3 - Math.random() * 0.6,
        vy: 0.8 + Math.random() * 1.2,
        rotation: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 0.02,
        scale: 0.6 + Math.random() * 0.7,
        alpha: 0.2 + Math.random() * 0.5,
        swayPhase: Math.random() * Math.PI * 2
      });
    }
  }

  /**
   * Spawns physical mist droplets erupting from the atomizer nozzle
   */
  spawnSprayBurst() {
    this.updateSprayOrigin();
    const count = Math.min(this.logoPoints.length, 3200);
    this.particles = [];

    // Screen center where the logo will manifest
    const logoTargetCenterX = this.width * 0.42;
    const logoTargetCenterY = this.height * 0.48;
    const logoDisplayScale = Math.min(this.width * 0.7, 720);

    for (let i = 0; i < count; i++) {
      // Eruption angle: Conical spray pointed left-down-center from nozzle (approx 170° to 225°)
      const sprayAngle = Math.PI * (0.95 + (Math.random() - 0.5) * 0.48);
      // High initial velocity with natural dispersion
      const speed = 400 + Math.random() * 850;

      // Map to target logo point
      const pt = this.logoPoints[i % this.logoPoints.length];
      const targetX = logoTargetCenterX + pt.relX * logoDisplayScale + pt.jitterX;
      const targetY = logoTargetCenterY + pt.relY * (logoDisplayScale * 0.55) + pt.jitterY;

      this.particles.push({
        // Current position starting at nozzle
        x: this.sprayOrigin.x + (Math.random() - 0.5) * 8,
        y: this.sprayOrigin.y + (Math.random() - 0.5) * 8,
        // Velocity
        vx: Math.cos(sprayAngle) * speed,
        vy: Math.sin(sprayAngle) * speed,
        // Physics attributes
        drag: 0.91 + Math.random() * 0.03,
        size: pt.size,
        baseSize: pt.size,
        alpha: 0,
        targetAlpha: pt.alpha,
        // Target in logo
        targetX: targetX,
        targetY: targetY,
        // Transition timings
        attractDelay: 0.7 + (i / count) * 0.9, // Staggered attraction wave
        hasAttracted: false,
        coalesced: false,
        // Aesthetic
        colorHue: pt.colorHue,
        specular: Math.random() < 0.25,
        swirlAngle: Math.random() * Math.PI * 2,
        swirlRadius: 10 + Math.random() * 45
      });
    }
  }

  /**
   * Starts the luxury 4K intro sequence
   */
  start() {
    this.reset();
    this.state = 'arriving';
    this.startTime = performance.now();
    window.luxuryAudio.init();
    window.luxuryAudio.startAmbientDrone();

    // Trigger Hand entrance animation via CSS classes
    this.handLayer.classList.remove('exit-left', 'hidden');
    this.handLayer.classList.add('entering');
    this.handReadyImg.style.opacity = '1';
    this.handSprayImg.style.opacity = '0';

    this.runLoop();
  }

  reset() {
    if (this.animId) cancelAnimationFrame(this.animId);
    this.particles = [];
    this.state = 'idle';
    this.elapsed = 0;
    this.handLayer.className = 'hand-container';
    this.logoOverlay.classList.remove('active', 'solidified');
    this.shimmerSweep.classList.remove('active');
    this.ctx.clearRect(0, 0, this.width, this.height);
  }

  runLoop() {
    const loop = (timestamp) => {
      this.elapsed = (timestamp - this.startTime) / 1000;
      this.update(this.elapsed);
      this.render();

      if (this.state !== 'completed') {
        this.animId = requestAnimationFrame(loop);
      }
    };
    this.animId = requestAnimationFrame(loop);
  }

  update(t) {
    const dt = 0.016; // Approx 60fps delta

    // TIMELINE ORCHESTRATION:
    // 0.0s - 3.2s: Hand enters gracefully from right side
    // 3.2s: Finger depresses nozzle -> switch to hand_spray image, play spray audio, erupt particles
    // 3.2s - 5.0s: Spray mist expands into air
    // 5.0s - 7.8s: Attractor field pulls droplets into Heaven logo formation
    // 7.8s - 9.5s: Droplets solidify into gold, play golden chime, trigger specular shimmer sweep
    // 9.5s+: Hand slides back softly, intro controls allow exploration or replay

    if (t >= 3.2 && this.state === 'arriving') {
      this.state = 'spraying';
      // Depress nozzle!
      this.handReadyImg.style.opacity = '0';
      this.handSprayImg.style.opacity = '1';
      this.handLayer.classList.add('pressing');

      // Trigger realistic spray sound
      window.luxuryAudio.playSpraySound();

      // Launch particle mist
      this.spawnSprayBurst();
    }

    if (t >= 5.0 && this.state === 'spraying') {
      this.state = 'coalescing';
      // Finger gently relaxes
      this.handReadyImg.style.opacity = '1';
      this.handSprayImg.style.opacity = '0';
      this.handLayer.classList.remove('pressing');
      this.handLayer.classList.add('floating');

      // Play celestial chime as droplets assemble
      window.luxuryAudio.playLogoAssemblyChime();
    }

    if (t >= 7.8 && this.state === 'coalescing') {
      this.state = 'solidified';
      // Logo solidifies into liquid gold!
      this.logoOverlay.classList.add('active', 'solidified');
      this.shimmerSweep.classList.add('active');
      window.luxuryAudio.playGoldenShimmer();

      // Softly glide hand into background
      this.handLayer.classList.add('settle-back');
    }

    if (t >= 9.8 && this.state === 'solidified') {
      this.state = 'completed';
      this.introControls.classList.add('visible');
    }

    // UPDATE PARTICLES
    const sprayTime = Math.max(0, t - 3.2);

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];

      if (this.state === 'spraying') {
        // Aerosol dispersion phase: high speed damped by air resistance
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vx *= p.drag;
        p.vy *= p.drag;
        // Mild upward buoyant air curl
        p.vy -= 12 * dt;
        // Fade in
        p.alpha = Math.min(p.targetAlpha, p.alpha + 0.08);
      } else if (this.state === 'coalescing' || this.state === 'solidified' || this.state === 'completed') {
        // Attractor phase: Droplets are drawn magnetically toward the "Heaven" logo
        const dx = p.targetX - p.x;
        const dy = p.targetY - p.y;
        const dist = Math.hypot(dx, dy);

        if (dist > 1.5) {
          // Swirling vortex steering force
          const angle = Math.atan2(dy, dx);
          const pullForce = Math.min(dist * 6.5, 450);

          // Add gentle orbital swirl
          p.swirlAngle += 3.5 * dt;
          const swirlX = -Math.sin(angle) * Math.sin(p.swirlAngle) * 45 * Math.min(1, dist / 100);
          const swirlY = Math.cos(angle) * Math.sin(p.swirlAngle) * 45 * Math.min(1, dist / 100);

          p.vx = Math.cos(angle) * pullForce + swirlX;
          p.vy = Math.sin(angle) * pullForce + swirlY;

          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.alpha = Math.min(1, p.alpha + 0.04);
        } else {
          // Locked into logo position with subtle organic liquid breathing
          p.x = p.targetX + Math.sin(t * 2 + i) * 0.4;
          p.y = p.targetY + Math.cos(t * 2 + i) * 0.4;
          p.coalesced = true;
        }
      }
    }

    // UPDATE AMBIENT DUST
    for (let mote of this.ambientMotes) {
      mote.x += mote.vx;
      mote.y += mote.vy;
      mote.phase += 0.02;
      mote.alpha = mote.baseAlpha * (0.6 + Math.sin(mote.phase) * 0.4);

      if (mote.y < -20) {
        mote.y = this.height + 20;
        mote.x = Math.random() * this.width;
      }
      if (mote.x < -20) mote.x = this.width + 20;
      if (mote.x > this.width + 20) mote.x = -20;
    }

    // UPDATE JASMINE PETALS
    for (let petal of this.petals) {
      petal.swayPhase += 0.025;
      petal.x += petal.vx + Math.sin(petal.swayPhase) * 0.8;
      petal.y += petal.vy;
      petal.rotation += petal.vRot;

      if (petal.y > this.height + 60) {
        petal.y = -60;
        petal.x = Math.random() * this.width;
      }
    }
  }

  render() {
    this.ctx.clearRect(0, 0, this.width, this.height);

    // 1. Render Ambient Golden Motes & Depth Dust
    this.renderAmbientMotes();

    // 2. Render Droplet Particles
    if (this.particles.length > 0) {
      this.renderDroplets();
    }

    // 3. Render Drifting Jasmine Petals (Foreground depth)
    this.renderPetals();
  }

  renderAmbientMotes() {
    for (let mote of this.ambientMotes) {
      this.ctx.beginPath();
      this.ctx.arc(mote.x, mote.y, mote.size, 0, Math.PI * 2);
      this.ctx.fillStyle = `${mote.color}${mote.alpha})`;
      this.ctx.shadowColor = 'rgba(255, 215, 0, 0.5)';
      this.ctx.shadowBlur = 8;
      this.ctx.fill();
    }
    this.ctx.shadowBlur = 0;
  }

  renderDroplets() {
    // Additive blending for luminous luxury mist
    this.ctx.save();
    this.ctx.globalCompositeOperation = 'screen';

    for (let p of this.particles) {
      if (p.alpha <= 0.01) continue;

      const rad = p.size;
      const grad = this.ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, rad * 2.2);
      grad.addColorStop(0, `hsla(${p.colorHue}, 100%, 88%, ${p.alpha})`);
      grad.addColorStop(0.5, `hsla(${p.colorHue}, 85%, 62%, ${p.alpha * 0.75})`);
      grad.addColorStop(1, `hsla(${p.colorHue}, 70%, 45%, 0)`);

      this.ctx.fillStyle = grad;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, rad * 2.2, 0, Math.PI * 2);
      this.ctx.fill();

      // Specular highlight sparkle
      if (p.specular && p.alpha > 0.4) {
        this.ctx.fillStyle = `rgba(255, 255, 255, ${p.alpha * 0.9})`;
        this.ctx.beginPath();
        this.ctx.arc(p.x - rad * 0.2, p.y - rad * 0.2, rad * 0.4, 0, Math.PI * 2);
        this.ctx.fill();
      }
    }

    this.ctx.restore();
  }

  renderPetals() {
    for (let petal of this.petals) {
      this.ctx.save();
      this.ctx.translate(petal.x, petal.y);
      this.ctx.rotate(petal.rotation);
      this.ctx.scale(petal.scale, petal.scale);
      this.ctx.globalAlpha = petal.alpha;

      // Soft white jasmine petal silhouette
      this.ctx.beginPath();
      this.ctx.moveTo(0, -18);
      this.ctx.bezierCurveTo(12, -10, 14, 12, 0, 22);
      this.ctx.bezierCurveTo(-14, 12, -12, -10, 0, -18);

      const grad = this.ctx.createLinearGradient(0, -18, 0, 22);
      grad.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
      grad.addColorStop(0.7, 'rgba(250, 245, 235, 0.75)');
      grad.addColorStop(1, 'rgba(220, 200, 160, 0.4)');

      this.ctx.fillStyle = grad;
      this.ctx.shadowColor = 'rgba(255, 240, 200, 0.3)';
      this.ctx.shadowBlur = 10;
      this.ctx.fill();

      this.ctx.restore();
    }
  }

  skipIntro() {
    this.state = 'completed';
    this.handLayer.className = 'hand-container settle-back';
    this.handReadyImg.style.opacity = '1';
    this.handSprayImg.style.opacity = '0';
    this.logoOverlay.classList.add('active', 'solidified');
    this.shimmerSweep.classList.add('active');
    this.introControls.classList.add('visible');

    // Snap particles directly to their logo targets
    const logoTargetCenterX = this.width * 0.42;
    const logoTargetCenterY = this.height * 0.48;
    const logoDisplayScale = Math.min(this.width * 0.7, 720);

    this.particles = this.logoPoints.map((pt) => ({
      x: logoTargetCenterX + pt.relX * logoDisplayScale,
      y: logoTargetCenterY + pt.relY * (logoDisplayScale * 0.55),
      vx: 0,
      vy: 0,
      size: pt.size,
      alpha: pt.alpha,
      targetAlpha: pt.alpha,
      targetX: logoTargetCenterX + pt.relX * logoDisplayScale,
      targetY: logoTargetCenterY + pt.relY * (logoDisplayScale * 0.55),
      colorHue: pt.colorHue,
      specular: true,
      coalesced: true
    }));

    this.render();
  }
}

window.heavenIntro = null;
window.addEventListener('DOMContentLoaded', () => {
  window.heavenIntro = new HeavenIntroEngine();
});
