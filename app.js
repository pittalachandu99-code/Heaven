/**
 * HEAVEN HAUTE PARFUMERIE - Application Controller
 * Handles UI interactions, 3D card tilt parallax, sound toggles, and intro orchestration.
 */

document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const startModal = document.getElementById('start-modal');
  const btnBegin = document.getElementById('btn-begin-experience');
  const btnReplayIntro = document.getElementById('btn-replay-intro');
  const replayNavBtn = document.getElementById('replay-nav-btn');
  const soundToggleBtn = document.getElementById('sound-toggle-btn');
  const soundIconOn = document.getElementById('sound-icon-on');
  const soundIconOff = document.getElementById('sound-icon-off');
  const fullscreenBtn = document.getElementById('fullscreen-btn');
  const bottleCard = document.getElementById('bottle-card');
  const btnAcquire = document.getElementById('btn-acquire-now');
  const btnSample = document.getElementById('btn-sample-coffret');

  // Start Experience Trigger
  if (btnBegin) {
    btnBegin.addEventListener('click', () => {
      startModal.classList.add('hidden');
      if (window.heavenIntro) {
        window.heavenIntro.start();
      }
    });
  }

  // Replay Intro Triggers
  const triggerReplay = () => {
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (window.heavenIntro) {
      window.heavenIntro.start();
    }
  };

  if (btnReplayIntro) btnReplayIntro.addEventListener('click', triggerReplay);
  if (replayNavBtn) replayNavBtn.addEventListener('click', triggerReplay);

  // Sound Toggle
  if (soundToggleBtn) {
    soundToggleBtn.addEventListener('click', () => {
      if (window.luxuryAudio) {
        const isMuted = window.luxuryAudio.toggleMute();
        if (isMuted) {
          soundIconOn.style.display = 'none';
          soundIconOff.style.display = 'block';
        } else {
          soundIconOn.style.display = 'block';
          soundIconOff.style.display = 'none';
        }
      }
    });
  }

  // 4K Fullscreen Toggle
  if (fullscreenBtn) {
    fullscreenBtn.addEventListener('click', () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
          console.warn('Fullscreen request failed:', err);
        });
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen();
        }
      }
    });
  }

  // 3D Parallax Bottle Tilt Effect
  if (bottleCard) {
    const stage = document.querySelector('.bottle-stage');
    if (stage) {
      stage.addEventListener('mousemove', (e) => {
        const rect = stage.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const rotateX = ((y - centerY) / centerY) * -12;
        const rotateY = ((x - centerX) / centerX) * 14;

        bottleCard.style.transform = `rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) scale3d(1.02, 1.02, 1.02)`;
      });

      stage.addEventListener('mouseleave', () => {
        bottleCard.style.transform = 'rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
      });
    }
  }

  // Toast feedback helper
  const showToast = (message) => {
    const existing = document.querySelector('.luxury-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'luxury-toast';
    toast.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 100 100" fill="#d4af37">
        <path d="M50 15 C58 35 62 55 50 78 C38 55 42 35 50 15 Z" />
        <path d="M42 75 C25 72 10 50 15 32 C25 45 35 60 42 75 Z" />
        <path d="M58 75 C75 72 90 50 85 32 C75 45 65 60 58 75 Z" />
      </svg>
      <span>${message}</span>
    `;
    document.body.appendChild(toast);

    // Styling
    Object.assign(toast.style, {
      position: 'fixed',
      bottom: '30px',
      right: '30px',
      background: 'rgba(18, 14, 10, 0.92)',
      border: '1px solid rgba(212, 175, 55, 0.4)',
      backdropFilter: 'blur(15px)',
      color: '#fbeac4',
      padding: '14px 24px',
      borderRadius: '30px',
      fontSize: '0.85rem',
      letterSpacing: '1.5px',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      zIndex: '9999',
      boxShadow: '0 10px 40px rgba(0, 0, 0, 0.7), 0 0 20px rgba(212, 175, 55, 0.2)',
      transform: 'translateY(20px)',
      opacity: '0',
      transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
    });

    requestAnimationFrame(() => {
      toast.style.transform = 'translateY(0)';
      toast.style.opacity = '1';
    });

    setTimeout(() => {
      toast.style.transform = 'translateY(20px)';
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 400);
    }, 3500);
  };

  if (btnAcquire) {
    btnAcquire.addEventListener('click', () => {
      showToast('Heaven Jasmine Eau de Parfum (100ml) added to your personal vanity.');
    });
  }

  if (btnSample) {
    btnSample.addEventListener('click', () => {
      showToast('Discovery Sample (5ml) reserved with bespoke presentation box.');
    });
  }

  // Navbar blur background adjustment on scroll
  const nav = document.getElementById('main-nav');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 80) {
      nav.style.background = 'rgba(7, 6, 5, 0.95)';
      nav.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.6)';
    } else {
      nav.style.background = 'linear-gradient(180deg, rgba(7, 6, 5, 0.85) 0%, rgba(7, 6, 5, 0) 100%)';
      nav.style.boxShadow = 'none';
    }
  });
});
