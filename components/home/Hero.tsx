"use client";

import React, { useEffect, useRef } from "react";
import Link from "next/link";
import * as THREE from "three";
import {
  ArrowRight,
  Sparkles,
  Palette,
} from "lucide-react";
import { useAuth } from "@/lib/firebase/authContext";

export const Hero: React.FC = () => {
  const { memberProfile } = useAuth();
  const isExistingMember =
    !!memberProfile && memberProfile.status === "active";

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Check reduced motion preference
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const container = containerRef.current;
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(
      75,
      width / height,
      0.1,
      1000
    );

    camera.position.z = 15;

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
    });

    renderer.setSize(width, height);
    renderer.setPixelRatio(
      Math.min(window.devicePixelRatio, 2)
    );

    container.appendChild(renderer.domElement);

    // -----------------------------
    // Lighting
    // -----------------------------

    const ambientLight = new THREE.AmbientLight(
      0xffffff,
      0.5
    );

    scene.add(ambientLight);

    const pointLight1 = new THREE.PointLight(
      0x5ff3e8,
      2.5,
      50
    );

    pointLight1.position.set(10, 10, 10);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(
      0x7c3aed,
      2.5,
      50
    );

    pointLight2.position.set(-10, -10, 10);
    scene.add(pointLight2);

    // -----------------------------
    // Floating spheres
    // -----------------------------

    const spheresGroup = new THREE.Group();
    scene.add(spheresGroup);

    const geometry = new THREE.SphereGeometry(
      1,
      32,
      32
    );

    const colors = [
      0x5ff3e8,
      0x39d6cc,
      0x7c3aed,
      0xd2bbff,
      0xffffff,
    ];

    const sphereInstances: THREE.Mesh[] = [];

    for (let i = 0; i < 28; i++) {
      const material = new THREE.MeshPhongMaterial({
        color:
          colors[
            Math.floor(
              Math.random() * colors.length
            )
          ],
        shininess: 100,
        transparent: true,
        opacity: 0.8,
        specular: 0xffffff,
      });

      const sphere = new THREE.Mesh(
        geometry,
        material
      );

      const scale =
        Math.random() * 1.6 + 0.4;

      sphere.scale.set(
        scale,
        scale,
        scale
      );

      sphere.position.set(
        (Math.random() - 0.5) * 36,
        (Math.random() - 0.5) * 26,
        (Math.random() - 0.5) * 18
      );

      sphere.userData = {
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 0.018,
          (Math.random() - 0.5) * 0.018,
          (Math.random() - 0.5) * 0.018
        ),
        floatOffset:
          Math.random() * Math.PI * 2,
        baseScale: scale,
      };

      spheresGroup.add(sphere);
      sphereInstances.push(sphere);
    }

    // -----------------------------
    // Mouse interaction
    // -----------------------------

    let mouseX = 0;
    let mouseY = 0;

    let targetX = 0;
    let targetY = 0;

    const handleMouseMove = (
      event: MouseEvent
    ) => {
      mouseX =
        event.clientX /
          window.innerWidth -
        0.5;

      mouseY =
        event.clientY /
          window.innerHeight -
        0.5;
    };

    // -----------------------------
    // Resize
    // -----------------------------

    const handleResize = () => {
      if (!container) return;

      const w =
        container.clientWidth ||
        window.innerWidth;

      const h =
        container.clientHeight ||
        window.innerHeight;

      camera.aspect = w / h;
      camera.updateProjectionMatrix();

      renderer.setSize(w, h);
    };

    window.addEventListener(
      "mousemove",
      handleMouseMove
    );

    window.addEventListener(
      "resize",
      handleResize
    );

    let animationFrameId: number;

    // -----------------------------
    // Animation
    // -----------------------------

    const animate = (time: number) => {
      animationFrameId =
        requestAnimationFrame(animate);

      if (!prefersReducedMotion) {
        targetX +=
          (mouseX - targetX) * 0.05;

        targetY +=
          (mouseY - targetY) * 0.05;

        spheresGroup.rotation.y =
          targetX * 0.35;

        spheresGroup.rotation.x =
          -targetY * 0.35;

        const elapsed =
          time * 0.001;

        sphereInstances.forEach(
          (sphere) => {
            sphere.position.y +=
              Math.sin(
                elapsed +
                  sphere.userData
                    .floatOffset
              ) * 0.008;

            sphere.position.add(
              sphere.userData.velocity
            );

            // Boundary bouncing
            if (
              Math.abs(
                sphere.position.x
              ) > 22
            ) {
              sphere.userData.velocity.x *=
                -1;
            }

            if (
              Math.abs(
                sphere.position.y
              ) > 16
            ) {
              sphere.userData.velocity.y *=
                -1;
            }

            if (
              Math.abs(
                sphere.position.z
              ) > 12
            ) {
              sphere.userData.velocity.z *=
                -1;
            }

            // Mouse proximity reaction
            const distToMouse =
              Math.sqrt(
                Math.pow(
                  sphere.position.x /
                    18 -
                    mouseX,
                  2
                ) +
                  Math.pow(
                    sphere.position.y /
                      14 -
                      mouseY,
                    2
                  )
              );

            const scaleFactor =
              1 +
              Math.max(
                0,
                (1 - distToMouse) *
                  0.4
              );

            sphere.scale.set(
              sphere.userData.baseScale *
                scaleFactor,
              sphere.userData.baseScale *
                scaleFactor,
              sphere.userData.baseScale *
                scaleFactor
            );

            sphere.rotation.x +=
              0.004;

            sphere.rotation.y +=
              0.004;
          }
        );
      }

      renderer.render(
        scene,
        camera
      );
    };

    animate(0);

    // -----------------------------
    // Cleanup
    // -----------------------------

    return () => {
      cancelAnimationFrame(
        animationFrameId
      );

      window.removeEventListener(
        "mousemove",
        handleMouseMove
      );

      window.removeEventListener(
        "resize",
        handleResize
      );

      if (
        container &&
        renderer.domElement
      ) {
        container.removeChild(
          renderer.domElement
        );
      }

      renderer.dispose();
      geometry.dispose();
    };
  }, []);

  return (
    <section className="relative min-h-screen flex flex-col justify-center items-center px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto pt-32 pb-20 overflow-hidden">

      {/* =========================================
          3D CANVAS BACKGROUND
      ========================================== */}

      <div
        ref={containerRef}
        className="absolute inset-0 w-full h-full pointer-events-none z-0"
        aria-hidden="true"
      />

      {/* =========================================
          DECORATIVE BLUR BACKDROPS
      ========================================== */}

      <div className="absolute top-1/4 left-1/10 w-72 h-72 rounded-full bg-primary/15 blur-[120px] pointer-events-none" />

      <div className="absolute bottom-1/4 right-1/10 w-96 h-96 rounded-full bg-secondary/15 blur-[140px] pointer-events-none" />

      {/* =========================================
          HERO CONTENT
      ========================================== */}

      <div className="relative z-10 text-center max-w-5xl mx-auto space-y-8">

        {/* =========================================
            TOP BADGE
        ========================================== */}

        <div className="inline-flex items-center gap-2 bg-[#111111]/80 backdrop-blur-md border border-white/15 px-5 py-2 rounded-full shadow-[0_0_20px_rgba(95,243,232,0.2)] animate-float">

          <Sparkles className="w-4 h-4 text-primary animate-pulse" />

          <span className="font-label-caps text-xs text-primary tracking-widest uppercase font-bold">
            The Premier UI/UX & Creative Tech Club
          </span>

        </div>

        {/* =========================================
            NITTE + DEPARTMENT
        ========================================== */}

        <div className="flex flex-col items-center gap-5 pt-2">

          {/* Nitte Institution */}

          <div className="flex items-center justify-center gap-4">

            {/* Nitte Logo Style */}

            <div className="flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-xl border border-white/30 bg-white/5 backdrop-blur-sm">

              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-white flex items-center justify-center">

                <span className="text-white text-xl sm:text-2xl font-bold">
                  N
                </span>

              </div>

            </div>

            {/* Divider */}

            <div className="h-12 sm:h-14 w-px bg-white/40" />

            {/* Institution Name */}

            <div className="text-left">

              <p className="text-white font-bold text-base sm:text-xl leading-tight tracking-wide">
                NITTE MEENAKSHI
              </p>

              <p className="text-white font-bold text-base sm:text-xl leading-tight tracking-wide">
                INSTITUTE OF TECHNOLOGY
              </p>

              <p className="text-white/60 text-[8px] sm:text-[9px] mt-1 tracking-wider">
                Deemed-to-be University
              </p>

            </div>

          </div>

          {/* =====================================
              DEPARTMENT
          ====================================== */}

          <p className="text-white text-xs sm:text-sm md:text-base tracking-[0.16em] sm:tracking-[0.2em] uppercase font-medium max-w-3xl mx-auto leading-relaxed">

            Department of Artificial Intelligence
            <span className="hidden sm:inline">
              {" "}
            </span>
            <span className="sm:hidden">
              {" "}
            </span>
            &amp; Machine Learning

          </p>

        </div>

        {/* =========================================
            CLUB LABEL
        ========================================== */}

        <div className="pt-2">

          <p className="text-primary text-sm sm:text-base tracking-[0.25em] uppercase font-medium">

            The UI/UX Club

          </p>

        </div>

        {/* =========================================
            MAIN TITLE
        ========================================== */}

        <h1 className="font-display text-5xl sm:text-7xl md:text-8xl lg:text-[96px] font-extrabold text-white leading-[0.95] tracking-tight">

          Diseño
          <br />

          <span className="text-primary drop-shadow-[0_0_35px_rgba(95,243,232,0.6)]">

            Divino.

          </span>

        </h1>

        {/* =========================================
            DESCRIPTION
        ========================================== */}

        <p className="font-body text-lg sm:text-xl text-[#bbcac7] max-w-2xl mx-auto leading-relaxed">

          Where creativity meets craft. We design,
          prototype, and build divine digital
          experiences — one pixel at a time.

        </p>

        {/* =========================================
            ACTION BUTTONS
        ========================================== */}

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">

          {/* Existing Member / Join Button */}

          {isExistingMember ? (

            <Link
              href="/dashboard"
              className="w-full sm:w-auto px-8 py-4 rounded-full bg-primary text-[#003734] font-bold text-base hover:shadow-[0_0_35px_rgba(95,243,232,0.6)] hover:scale-105 transition-all flex items-center justify-center gap-2 group"
            >

              <span>
                Go to Member Portal
              </span>

              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />

            </Link>

          ) : (

            <Link
              href="#join"
              className="w-full sm:w-auto px-8 py-4 rounded-full bg-primary text-[#003734] font-bold text-base hover:shadow-[0_0_35px_rgba(95,243,232,0.6)] hover:scale-105 transition-all flex items-center justify-center gap-2 group"
            >

              <span>
                Request to Join Club
              </span>

              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />

            </Link>

          )}

          {/* Explore Domains */}

          <Link
            href="#domains"
            className="w-full sm:w-auto px-8 py-4 rounded-full bg-[#111111] border border-white/20 text-white font-medium text-base hover:border-primary hover:bg-white/5 transition-all flex items-center justify-center gap-2"
          >

            <Palette className="w-5 h-5 text-secondary" />

            <span>
              Explore Domains
            </span>

          </Link>

        </div>

        {/* =========================================
            QUICK HIGHLIGHTS
        ========================================== */}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-12 max-w-3xl mx-auto text-left">

          {/* Active Domains */}

          <div className="glass-card p-4 rounded-2xl border border-white/10">

            <p className="font-display text-2xl font-bold text-primary">
              6+
            </p>

            <p className="text-xs text-on-surface-variant">
              Active Domains
            </p>

          </div>

          {/* Core Creators */}

          <div className="glass-card p-4 rounded-2xl border border-white/10">

            <p className="font-display text-2xl font-bold text-secondary">
              50+
            </p>

            <p className="text-xs text-on-surface-variant">
              Core Creators
            </p>

          </div>

          {/* Hackathon */}

          <div className="glass-card p-4 rounded-2xl border border-white/10">

            <p className="font-display text-2xl font-bold text-[#ffd6ad]">
              24h
            </p>

            <p className="text-xs text-on-surface-variant">
              Annual Hackathon
            </p>

          </div>

          {/* Student Driven */}

          <div className="glass-card p-4 rounded-2xl border border-white/10">

            <p className="font-display text-2xl font-bold text-white">
              100%
            </p>

            <p className="text-xs text-on-surface-variant">
              Student Driven
            </p>

          </div>

        </div>

      </div>
    </section>
  );
};