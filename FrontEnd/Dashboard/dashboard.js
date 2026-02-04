// PARTICLE ANIMATION BACKGROUND - ANTIGRAVITY EFFECT
(function initParticles() {
  const canvas = document.getElementById('particles');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  let particles = [];
  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;
  let mousePressed = false;
  const particleCount = 250;
  const repulsionStrength = 0.3;
  const connectionDistance = 150;
  const repulsionDistance = 200;

  class Particle {
    constructor() {
      this.x = Math.random() * canvas.width;
      this.y = Math.random() * canvas.height;
      this.vx = (Math.random() - 0.5) * 3;
      this.vy = (Math.random() - 0.5) * 3;
      this.size = Math.random() * 3 + 1.5;
      this.opacity = Math.random() * 0.6 + 0.3;
      this.maxOpacity = this.opacity;
    }

    update() {
      // Repel away from cursor with stronger force
      const dx = mouseX - this.x;
      const dy = mouseY - this.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance > 0 && distance < repulsionDistance) {
        const force = mousePressed ? 0.6 : 0.3;
        this.vx -= (dx / distance) * repulsionStrength * force;
        this.vy -= (dy / distance) * repulsionStrength * force;
      }

      // Particle-to-particle collision avoidance
      for (let other of particles) {
        if (other === this) continue;
        const pdx = other.x - this.x;
        const pdy = other.y - this.y;
        const pdist = Math.sqrt(pdx * pdx + pdy * pdy);
        const minDist = this.size + other.size + 10;

        if (pdist < minDist && pdist > 0) {
          this.vx -= (pdx / pdist) * 0.3;
          this.vy -= (pdy / pdist) * 0.3;
        }
      }

      // Add some random noise for organic movement
      this.vx += (Math.random() - 0.5) * 0.2;
      this.vy += (Math.random() - 0.5) * 0.2;

      // Apply velocity with drag
      this.vx *= 0.97;
      this.vy *= 0.97;

      // Limit velocity
      const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
      if (speed > 8) {
        this.vx = (this.vx / speed) * 8;
        this.vy = (this.vy / speed) * 8;
      }

      this.x += this.vx;
      this.y += this.vy;

      // Keep particles within bounds (no bounce, stay visible)
      if (this.x < 0) this.x = 0;
      if (this.x > canvas.width) this.x = canvas.width;
      if (this.y < 0) this.y = 0;
      if (this.y > canvas.height) this.y = canvas.height;

      // Update opacity based on distance from mouse
      const distToMouse = Math.sqrt((mouseX - this.x) ** 2 + (mouseY - this.y) ** 2);
      this.opacity = this.maxOpacity * (1 - Math.min(distToMouse / repulsionDistance, 1) * 0.5);
    }

    draw() {
      // Draw glowing particle
      const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size * 2);
      gradient.addColorStop(0, `rgba(0, 168, 255, ${this.opacity * 0.8})`);
      gradient.addColorStop(1, `rgba(0, 168, 255, 0)`);
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size * 2, 0, Math.PI * 2);
      ctx.fill();

      // Draw core
      ctx.fillStyle = `rgba(100, 200, 255, ${this.opacity})`;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  for (let i = 0; i < particleCount; i++) {
    particles.push(new Particle());
  }

  function drawConnections() {
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < connectionDistance) {
          // Lines are now invisible
        }
      }
    }
  }

  function animate() {
    // Clear canvas completely (no fade trail)
    ctx.fillStyle = 'rgba(10, 26, 47, 1)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    particles.forEach(p => {
      p.update();
      p.draw();
    });

    drawConnections();
    requestAnimationFrame(animate);
  }

  animate();

  // Track mouse movement
  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });

  document.addEventListener('mousedown', () => {
    mousePressed = true;
  });

  document.addEventListener('mouseup', () => {
    mousePressed = false;
  });

  document.addEventListener('mouseleave', () => {
    mousePressed = false;
  });

  window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  });
})();

// BUTTON ANIMATION (Get Started does not navigate — user requested no navigation)
const startBtn = document.getElementById("startBtn");
if (startBtn) {
  startBtn.addEventListener("click", () => {
    // keep the simple animation but do NOT redirect
    startBtn.style.transform = "scale(1.25)";
    setTimeout(() => (startBtn.style.transform = "scale(1)"), 300);
  });
}

// Login button: open the renamed login page
const loginBtn = document.getElementById("loginBtn");
if (loginBtn) {
  loginBtn.addEventListener("click", () => {
    // navigate to sibling login-page/login.html
    window.location.href = "../login-page/login.html";
  });
}

// WHY CARDS EXPAND
document.querySelectorAll(".why-card").forEach(card => {
  card.addEventListener("click", () => {
    let details = card.querySelector(".details");
    details.style.display =
      details.style.display === "block" ? "none" : "block";
  });
});

// SECURITY REVEAL ON SCROLL
const securityItems = document.querySelectorAll(".security-item");

function revealSecurity() {
  securityItems.forEach((item, i) => {
    const rect = item.getBoundingClientRect();
    if (rect.top < window.innerHeight - 100) {
      setTimeout(() => item.classList.add("show"), i * 200);
    }
  });
}

window.addEventListener("scroll", revealSecurity);
revealSecurity();
