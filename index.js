document.addEventListener('DOMContentLoaded', () => {
  initCustomCursor();
  initCanvasBackground();
  initScrollReveals();
  initTiltCards();
  initSpotlight();
  initRecipeDrawer();
  initAudioSynth();
});

/* ==========================================================================
   1. Custom Liquid Cursor
   ========================================================================== */
function initCustomCursor() {
  // Create cursor elements dynamically
  const cursorDot = document.createElement('div');
  cursorDot.className = 'custom-cursor';
  const cursorFollower = document.createElement('div');
  cursorFollower.className = 'custom-cursor-follower';

  document.body.appendChild(cursorDot);
  document.body.appendChild(cursorFollower);

  let mouseX = 0;
  let mouseY = 0;
  let followerX = 0;
  let followerY = 0;

  // Track mouse coordinates
  window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    
    // Immediate position for inner dot
    cursorDot.style.left = `${mouseX}px`;
    cursorDot.style.top = `${mouseY}px`;
  });

  // Lerp loop for follower ring (runs on requestAnimationFrame)
  function renderFollower() {
    // Linear Interpolation: Move 15% closer to destination every frame
    followerX += (mouseX - followerX) * 0.15;
    followerY += (mouseY - followerY) * 0.15;

    cursorFollower.style.left = `${followerX}px`;
    cursorFollower.style.top = `${followerY}px`;

    requestAnimationFrame(renderFollower);
  }
  requestAnimationFrame(renderFollower);

  // Hover states detection
  const interactiveSelector = 'a, button, .recipe-card, .message-envelope-wrapper, .gallery-card, .audio-toggle-btn, .spotlight-btn';
  
  function addHoverClass() {
    document.body.classList.add('hovering-interactive');
  }

  function removeHoverClass() {
    document.body.classList.remove('hovering-interactive');
  }

  // Listen globally to capture dynamic elements
  document.body.addEventListener('mouseover', (e) => {
    if (e.target.closest(interactiveSelector)) {
      addHoverClass();
    }
  });

  document.body.addEventListener('mouseout', (e) => {
    if (!e.target.closest(interactiveSelector)) {
      removeHoverClass();
    }
  });
}

/* ==========================================================================
   2. Interactive Floating Particle Canvas
   ========================================================================== */
function initCanvasBackground() {
  const canvas = document.getElementById('background-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let width = (canvas.width = window.innerWidth);
  let height = (canvas.height = window.innerHeight);

  window.addEventListener('resize', () => {
    width = (canvas.width = window.innerWidth);
    height = (canvas.height = window.innerHeight);
  });

  // Track mouse for canvas interaction
  let mouse = { x: null, y: null, radius: 140 };
  window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  });

  window.addEventListener('mouseleave', () => {
    mouse.x = null;
    mouse.y = null;
  });

  // Particle Class
  class Particle {
    constructor() {
      this.reset(true);
    }

    reset(initial = false) {
      this.x = Math.random() * width;
      // Start below screen if not initial, else random height
      this.y = initial ? Math.random() * height : height + Math.random() * 20;
      this.size = Math.random() * 6 + 2;
      this.speedY = -(Math.random() * 0.8 + 0.3); // Rise upwards
      this.speedX = Math.random() * 0.4 - 0.2; // Gentle horizontal drift
      this.opacity = Math.random() * 0.3 + 0.1;
      this.colorType = Math.floor(Math.random() * 3); // 0 = Pink, 1 = Blue, 2 = White
      
      // Floating wave parameters
      this.waveOffset = Math.random() * 100;
      this.waveFrequency = Math.random() * 0.01 + 0.005;

      // Particle shape (0 = circle, 1 = heart, 2 = star)
      this.shape = Math.floor(Math.random() * 3);
    }

    update() {
      // Basic movement
      this.y += this.speedY;
      // Apply sinus wave movement to horizontal drift
      this.x += this.speedX + Math.sin(this.y * this.waveFrequency + this.waveOffset) * 0.2;

      // Mouse repulsion physics
      if (mouse.x !== null && mouse.y !== null) {
        let dx = this.x - mouse.x;
        let dy = this.y - mouse.y;
        let distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < mouse.radius) {
          // Calculate push force based on distance
          let force = (mouse.radius - distance) / mouse.radius;
          let pushX = (dx / distance) * force * 3;
          let pushY = (dy / distance) * force * 3;
          
          this.x += pushX;
          this.y += pushY;
        }
      }

      // Recycle particles that go off the top of the screen
      if (this.y < -30 || this.x < -30 || this.x > width + 30) {
        this.reset(false);
      }
    }

    draw() {
      ctx.save();
      ctx.globalAlpha = this.opacity;
      
      // Set Color Palette
      if (this.colorType === 0) {
        ctx.fillStyle = '#ff85a2'; // Pink
        ctx.strokeStyle = '#ff85a2';
      } else if (this.colorType === 1) {
        ctx.fillStyle = '#a8dadc'; // Light blue
        ctx.strokeStyle = '#a8dadc';
      } else {
        ctx.fillStyle = '#ffffff'; // White
        ctx.strokeStyle = '#ffffff';
      }

      // Draw Shapes
      if (this.shape === 0) {
        // Circle
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
      } else if (this.shape === 1) {
        // Heart
        drawHeart(ctx, this.x, this.y, this.size * 1.5);
      } else {
        // Star / Sparkle
        drawSparkle(ctx, this.x, this.y, this.size * 1.5);
      }

      ctx.restore();
    }
  }

  // Draw heart helper
  function drawHeart(c, x, y, size) {
    c.beginPath();
    c.moveTo(x, y - size / 4);
    c.bezierCurveTo(x + size / 2, y - size, x + size, y - size / 3, x, y + size);
    c.bezierCurveTo(x - size, y - size / 3, x - size / 2, y - size, x, y - size / 4);
    c.fill();
  }

  // Draw 4-point sparkle helper
  function drawSparkle(c, x, y, size) {
    c.beginPath();
    c.moveTo(x, y - size);
    c.quadraticCurveTo(x, y, x + size, y);
    c.quadraticCurveTo(x, y, x, y + size);
    c.quadraticCurveTo(x, y, x - size, y);
    c.quadraticCurveTo(x, y, x, y - size);
    c.fill();
  }

  // Populate particles
  const particleCount = 85;
  const particles = [];
  for (let i = 0; i < particleCount; i++) {
    particles.push(new Particle());
  }

  // Canvas loop
  function animate() {
    ctx.clearRect(0, 0, width, height);
    
    // Draw romantic background mesh/gradient grid overlay
    drawSoftVignette();

    // Update and draw particles
    particles.forEach(p => {
      p.update();
      p.draw();
    });

    requestAnimationFrame(animate);
  }

  // Vignette effect to keep layout elegant
  function drawSoftVignette() {
    const grad = ctx.createRadialGradient(width/2, height/2, width/4, width/2, height/2, width * 0.8);
    grad.addColorStop(0, 'rgba(9, 9, 11, 0)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0.45)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);
  }

  animate();
}

/* ==========================================================================
   3. Scroll Reveal Engine (Intersection Observer)
   ========================================================================== */
function initScrollReveals() {
  const options = {
    threshold: 0.15,
    rootMargin: '0px 0px -50px 0px'
  };

  const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        // If we want cascade triggers for elements inside
        const animItems = entry.target.querySelectorAll('.gallery-card, .info-bubble, .message-envelope-wrapper');
        animItems.forEach((item, index) => {
          setTimeout(() => {
            item.style.opacity = '1';
            item.style.transform = 'translateY(0) scale(1)';
          }, index * 100);
        });
        
        // Stop observing once revealed
        observer.unobserve(entry.target);
      }
    });
  }, options);

  const sections = document.querySelectorAll('.reveal-in-view');
  sections.forEach(s => observer.observe(s));
  
  // Sticky Navbar shadow trigger
  const nav = document.querySelector('.nav-header');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 40) {
      nav.classList.add('scrolled');
    } else {
      nav.classList.remove('scrolled');
    }
  });
}

/* ==========================================================================
   4. 3D Card Parallax Tilt (For Hero Photo)
   ========================================================================== */
function initTiltCards() {
  const cards = document.querySelectorAll('.main-photo-card');
  
  cards.forEach(card => {
    const parent = card.parentElement;
    
    parent.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left; // x position inside card
      const y = e.clientY - rect.top;  // y position inside card
      
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      
      // Calculate rotation angles (-15 to 15 degrees)
      const rotateX = -((y - centerY) / centerY) * 15;
      const rotateY = ((x - centerX) / centerX) * 15;
      
      // Dynamic glare/glow direction based on cursor
      const glow = card.querySelector('.photo-card-glow');
      if (glow) {
        const glowX = (x / rect.width) * 100;
        const glowY = (y / rect.height) * 100;
        glow.style.background = `radial-gradient(circle at ${glowX}% ${glowY}%, rgba(255, 255, 255, 0.18), transparent 60%)`;
      }

      card.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.04, 1.04, 1.04)`;
    });
    
    parent.addEventListener('mouseleave', () => {
      card.style.transform = 'rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
      const glow = card.querySelector('.photo-card-glow');
      if (glow) {
        glow.style.background = 'radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.1), transparent 60%)';
      }
    });
  });
}

/* ==========================================================================
   5. Virtual Spotlight Effect (For Acting/Singing Card)
   ========================================================================== */
function initSpotlight() {
  const stage = document.querySelector('.spotlight-stage');
  if (!stage) return;

  stage.addEventListener('mousemove', (e) => {
    const rect = stage.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    stage.style.setProperty('--mouse-x', `${x}px`);
    stage.style.setProperty('--mouse-y', `${y}px`);
  });
}

/* ==========================================================================
   6. Chef Interactive Drawer
   ========================================================================== */
function initRecipeDrawer() {
  const recipeCards = document.querySelectorAll('.recipe-card');
  
  recipeCards.forEach(card => {
    card.addEventListener('click', () => {
      const isActive = card.classList.contains('active');
      
      // Close other active cards
      recipeCards.forEach(c => {
        c.classList.remove('active');
      });
      
      // Toggle current
      if (!isActive) {
        card.classList.add('active');
      }
    });
  });
}

/* ==========================================================================
   7. Web Audio Ambient Synthesizer
   ========================================================================== */
function initAudioSynth() {
  const audioToggle = document.getElementById('audio-toggle');
  if (!audioToggle) return;

  const waves = audioToggle.querySelector('.music-waves');
  const toggleText = audioToggle.querySelector('.toggle-text');
  
  let audioCtx = null;
  let isPlaying = false;
  let synthLoopId = null;

  // Romantic Chord Progression Frequencies (Hz)
  // Cmaj9 -> Fmaj9 -> Am9 -> G6/9
  const chords = [
    // Cmaj9: C3, G3, E4, B4, D5
    [130.81, 196.00, 329.63, 493.88, 587.33],
    // Fmaj9: F3, C4, A4, E5, G5
    [174.61, 261.63, 440.00, 659.25, 783.99],
    // Am9: A3, E4, C5, G5, B5
    [220.00, 329.63, 523.25, 783.99, 987.77],
    // G6/9: G3, D4, B4, E5, A5
    [196.00, 293.66, 493.88, 659.25, 880.00]
  ];

  let currentChordIndex = 0;
  let activeNodes = [];

  function startSynthesizer() {
    // Create AudioContext on click (browsers restrict autoplay)
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    isPlaying = true;
    waves.classList.add('playing');
    toggleText.textContent = 'Melody: On';
    audioToggle.style.background = 'var(--color-pink-primary)';
    audioToggle.style.color = 'var(--color-bg-dark)';
    audioToggle.style.boxShadow = 'var(--glow-pink)';

    // Play initial chord
    playCurrentChord();

    // Start chord looper (every 4.5 seconds)
    synthLoopId = setInterval(() => {
      currentChordIndex = (currentChordIndex + 1) % chords.length;
      playCurrentChord();
    }, 4500);
  }

  function stopSynthesizer() {
    isPlaying = false;
    waves.classList.remove('playing');
    toggleText.textContent = 'Melody: Off';
    audioToggle.style.background = 'rgba(255, 133, 162, 0.1)';
    audioToggle.style.color = 'var(--color-pink-light)';
    audioToggle.style.boxShadow = '0 0 10px rgba(255, 133, 162, 0.1)';

    if (synthLoopId) {
      clearInterval(synthLoopId);
      synthLoopId = null;
    }
    
    fadeOutChords();
  }

  function playCurrentChord() {
    const now = audioCtx.currentTime;
    const chord = chords[currentChordIndex];
    
    // Smoothly fade out active notes from previous chord first
    fadeOutChords(1.2);

    // Filter nodes for a lush, warm synth pad sound
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    // Slowly sweep filter frequency between 400Hz and 700Hz
    filter.frequency.setValueAtTime(450, now);
    filter.frequency.exponentialRampToValueAtTime(750, now + 2.0);
    filter.Q.setValueAtTime(1.5, now);

    // Gain node for overall chord volume envelope
    const masterGain = audioCtx.createGain();
    masterGain.gain.setValueAtTime(0, now);
    // Smooth attack: 1.5 seconds to fade in
    masterGain.gain.linearRampToValueAtTime(0.12, now + 1.5);
    
    // Connect filter and master gain to output
    filter.connect(masterGain);
    masterGain.connect(audioCtx.destination);

    // Keep track of master volume node to fade it out later
    const chordObj = {
      gainNode: masterGain,
      oscillators: []
    };

    // Spawn oscillators for each note in the chord
    chord.forEach((freq, i) => {
      const osc = audioCtx.createOscillator();
      // Triangle wave gives a soft, flute-like vintage pad tone
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);

      // Microtonal detuning to make the pad sound thick and warm
      // Detune odds and evens slightly
      osc.detune.setValueAtTime(i % 2 === 0 ? 8 : -8, now);

      // Connect to filter
      osc.connect(filter);
      osc.start(now);
      
      chordObj.oscillators.push(osc);
    });

    activeNodes.push(chordObj);
  }

  function fadeOutChords(fadeDuration = 0.8) {
    const now = audioCtx ? audioCtx.currentTime : 0;
    
    activeNodes.forEach(nodeObj => {
      // Ramp gain to 0 smoothly
      try {
        nodeObj.gainNode.gain.cancelScheduledValues(now);
        nodeObj.gainNode.gain.setValueAtTime(nodeObj.gainNode.gain.value, now);
        nodeObj.gainNode.gain.exponentialRampToValueAtTime(0.0001, now + fadeDuration);
        
        // Stop oscillators after fadeout completes
        nodeObj.oscillators.forEach(osc => {
          try {
            osc.stop(now + fadeDuration + 0.1);
          } catch(e) {}
        });
      } catch(e) {}
    });

    // Clear reference array after fade completes
    setTimeout(() => {
      if (activeNodes.length > 5) {
        // Clean up old elements
        activeNodes = activeNodes.slice(-2);
      }
    }, (fadeDuration + 0.2) * 1000);
  }

  audioToggle.addEventListener('click', () => {
    if (isPlaying) {
      stopSynthesizer();
    } else {
      startSynthesizer();
    }
  });

  // Spotlight trigger music backdrop button
  const spotlightBtn = document.querySelector('.spotlight-btn');
  if (spotlightBtn) {
    spotlightBtn.addEventListener('click', () => {
      if (!isPlaying) {
        startSynthesizer();
      }
    });
  }
}
