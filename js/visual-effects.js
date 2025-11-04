// Visual Effects using GSAP
// Elegant scroll animations and interactions for TN Legal Services

(function() {
  'use strict';

  // Check for reduced motion preference
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Check if GSAP is loaded
  if (typeof gsap === 'undefined') {
    console.warn('GSAP not loaded, visual effects disabled');
    return;
  }

  // Register ScrollTrigger plugin
  if (typeof ScrollTrigger !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);
  }

  // ========== VIDEO SHOWCASE ANIMATIONS ==========

  const showcaseVideo = document.querySelector('.showcase-video');
  if (showcaseVideo && !prefersReducedMotion && typeof ScrollTrigger !== 'undefined') {
    // Fade in video as it scrolls into view
    gsap.from('.showcase-video', {
      opacity: 0,
      y: 50,
      scrollTrigger: {
        trigger: '.video-showcase',
        start: 'top 80%',
        end: 'top 30%',
        scrub: 1
      }
    });

    // Subtle scale effect on video container
    gsap.to('.video-showcase-container', {
      scale: 1.02,
      scrollTrigger: {
        trigger: '.video-showcase',
        start: 'top 60%',
        end: 'bottom 40%',
        scrub: 1
      }
    });
  }

  // ========== PAGE LOAD ANIMATIONS ==========

  window.addEventListener('load', () => {
    if (prefersReducedMotion) return;

    // Fade in hero video section
    gsap.from('.hero', {
      duration: 1.2,
      opacity: 0,
      ease: 'power3.out',
      delay: 0.3
    });
  });

  // ========== SCROLL-TRIGGERED ANIMATIONS ==========

  if (!prefersReducedMotion && typeof ScrollTrigger !== 'undefined') {

    // Service cards staggered reveal
    gsap.from('.service-card', {
      scrollTrigger: {
        trigger: '.services-grid',
        start: 'top 80%',
        toggleActions: 'play none none none'
      },
      duration: 0.8,
      opacity: 0,
      y: 40,
      stagger: 0.15,
      ease: 'power2.out'
    });

    // Stats counter animation
    const stats = document.querySelectorAll('.stat-number');
    stats.forEach(stat => {
      const text = stat.textContent;
      const hasPlus = text.includes('+');
      const number = parseInt(text.replace(/\D/g, ''));

      if (!isNaN(number)) {
        ScrollTrigger.create({
          trigger: stat,
          start: 'top 80%',
          once: true,
          onEnter: () => {
            gsap.from(stat, {
              duration: 2,
              textContent: 0,
              snap: { textContent: 1 },
              ease: 'power1.out',
              onUpdate: function() {
                const current = Math.ceil(this.targets()[0].textContent);
                stat.textContent = hasPlus ? current + '+' : current;
              }
            });
          }
        });
      }
    });

    // About section parallax
    gsap.to('.about-image', {
      y: -30,
      scrollTrigger: {
        trigger: '.about',
        start: 'top bottom',
        end: 'bottom top',
        scrub: 1
      }
    });

    // Section fade-in on scroll
    gsap.utils.toArray('.services, .about, .contact').forEach(section => {
      gsap.from(section, {
        scrollTrigger: {
          trigger: section,
          start: 'top 85%',
          toggleActions: 'play none none none'
        },
        duration: 1,
        opacity: 0,
        y: 30,
        ease: 'power2.out'
      });
    });
  }

  // ========== ENHANCED HOVER EFFECTS ==========

  // 3D card tilt effect on service cards
  const serviceCards = document.querySelectorAll('.service-card');
  serviceCards.forEach(card => {
    card.addEventListener('mouseenter', function() {
      if (prefersReducedMotion) return;
      gsap.to(this, {
        duration: 0.3,
        scale: 1.02,
        ease: 'power2.out'
      });
    });

    card.addEventListener('mouseleave', function() {
      if (prefersReducedMotion) return;
      gsap.to(this, {
        duration: 0.3,
        scale: 1,
        rotateX: 0,
        rotateY: 0,
        ease: 'power2.out'
      });
    });

    // 3D tilt based on mouse position
    card.addEventListener('mousemove', function(e) {
      if (prefersReducedMotion) return;

      const rect = this.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const rotateX = (y - centerY) / centerY * -5; // Max 5 degrees
      const rotateY = (x - centerX) / centerX * 5;

      gsap.to(this, {
        duration: 0.3,
        rotateX: rotateX,
        rotateY: rotateY,
        transformPerspective: 1000,
        ease: 'power1.out'
      });
    });
  });

  // Button hover effects
  const buttons = document.querySelectorAll('.btn');
  buttons.forEach(button => {
    button.addEventListener('mouseenter', function() {
      if (prefersReducedMotion) return;
      gsap.to(this, {
        duration: 0.3,
        scale: 1.05,
        ease: 'power2.out'
      });
    });

    button.addEventListener('mouseleave', function() {
      if (prefersReducedMotion) return;
      gsap.to(this, {
        duration: 0.3,
        scale: 1,
        ease: 'power2.out'
      });
    });
  });

  // ========== SMOOTH NAVIGATION SCROLL ==========

  // Enhance smooth scroll behavior
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));

      if (target) {
        if (prefersReducedMotion) {
          target.scrollIntoView();
        } else {
          gsap.to(window, {
            duration: 1,
            scrollTo: {
              y: target,
              offsetY: 80
            },
            ease: 'power2.inOut'
          });
        }
      }
    });
  });

  // ========== PARALLAX BACKGROUND ==========

  // Subtle parallax on background elements
  if (!prefersReducedMotion && typeof ScrollTrigger !== 'undefined') {
    gsap.to('body::before', {
      y: 100,
      scrollTrigger: {
        start: 'top top',
        end: 'bottom top',
        scrub: 1
      }
    });
  }

  console.log('Visual effects initialized');

})();
