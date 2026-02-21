export class ParticleSystem {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.particles = [];
    this.maxParticles = 100;
    this.minDistance = 150;
    this.mouse = { x: null, y: null, radius: 200 };

    this.init();
    window.addEventListener('resize', () => this.resize());
    window.addEventListener('mousemove', (e) => this.mouseMove(e));
  }

  init() {
    this.resize();
    this.createParticles();
    this.animate();
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  createParticles() {
    this.particles = [];
    const count = (this.canvas.width * this.canvas.height) / 10000; // Density
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        vx: (Math.random() - 0.5) * 1.5,
        vy: (Math.random() - 0.5) * 1.5,
        size: Math.random() * 2 + 1,
        color: `rgba(255, 255, 255, ${Math.random() * 0.5})`
      });
    }
  }

  mouseMove(e) {
    this.mouse.x = e.x;
    this.mouse.y = e.y;
  }

  drawParticles() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    for (let i = 0; i < this.particles.length; i++) {
      let p = this.particles[i];

      // Update position
      p.x += p.vx;
      p.y += p.vy;

      // Wrap around screen
      if (p.x < 0) p.x = this.canvas.width;
      if (p.x > this.canvas.width) p.x = 0;
      if (p.y < 0) p.y = this.canvas.height;
      if (p.y > this.canvas.height) p.y = 0;

      // Draw particle
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      this.ctx.fillStyle = p.color;
      this.ctx.fill();

      // Connect lines
      for (let j = i + 1; j < this.particles.length; j++) {
        let p2 = this.particles[j];
        let dx = p.x - p2.x;
        let dy = p.y - p2.y;
        let distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < this.minDistance) {
          this.ctx.beginPath();
          this.ctx.strokeStyle = `rgba(255, 255, 255, ${1 - distance / this.minDistance})`;
          this.ctx.lineWidth = 0.5;
          this.ctx.moveTo(p.x, p.y);
          this.ctx.lineTo(p2.x, p2.y);
          this.ctx.stroke();
        }
      }

      // Interaction with mouse (repel slightly)
      if (this.mouse.x != null) {
        let dx = p.x - this.mouse.x;
        let dy = p.y - this.mouse.y;
        let distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < 100) {
           const forceDirectionX = dx / distance;
           const forceDirectionY = dy / distance;
           const force = (100 - distance) / 100;
           const directionX = forceDirectionX * force * 2;
           const directionY = forceDirectionY * force * 2;
           p.x += directionX;
           p.y += directionY;
        }
      }
    }
  }

  animate() {
    this.drawParticles();
    requestAnimationFrame(() => this.animate());
  }
}
