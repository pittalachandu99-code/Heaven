'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Volume2, VolumeX, SkipForward, ArrowRight, Sparkles } from 'lucide-react';
import Image from 'next/image';

interface IntroVideoModalProps {
  videoSrc?: string;
  onFinish?: () => void;
  allowSkip?: boolean;
}

export default function IntroVideoModal({
  videoSrc = '/assets/heaven_reference.mp4',
  onFinish,
  allowSkip = true,
}: IntroVideoModalProps) {
  const [videoError, setVideoError] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [progress, setProgress] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          setIsPlaying(true);
        })
        .catch(() => {
          // Autoplay was prevented or format not supported; continue gracefully
          setIsPlaying(false);
        });
    }
  }, [videoSrc]);

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const current = videoRef.current.currentTime;
      const duration = videoRef.current.duration || 1;
      setProgress((current / duration) * 100);
    }
  };

  const handleVideoEnded = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('heaven_intro_watched', 'true');
    }
    if (onFinish) onFinish();
  };

  const handleSkip = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('heaven_intro_watched', 'true');
    }
    if (onFinish) onFinish();
  };

  const toggleSound = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex items-center justify-center overflow-hidden">
      {/* If video fails or is missing, show luxury fallback screen */}
      {videoError ? (
        <div className="relative w-full h-full flex flex-col items-center justify-center p-6 text-center bg-[#070707] text-white">
          <div className="relative mb-8">
            <div className="w-24 h-24 rounded-full border border-neutral-700/80 flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-[#C5A059] animate-pulse" />
            </div>
          </div>

          <h1 className="heaven-wordmark text-4xl sm:text-5xl tracking-[0.4em] font-normal text-white mb-4">
            HEAVEN
          </h1>
          <p className="text-xs uppercase tracking-[0.3em] text-[#C5A059] mb-6 font-light">
            Jasmine Eau De Parfum &bull; Haute Parfumerie
          </p>
          <p className="text-sm text-neutral-400 max-w-md mx-auto mb-10 leading-relaxed font-light">
            Welcome to the sensory sanctuary of rare nocturnal absolutes, liquid gold amber, and timeless French artisanship.
          </p>

          <button
            onClick={handleSkip}
            className="group inline-flex items-center gap-3 bg-white text-black px-10 py-4 text-xs font-semibold tracking-[0.25em] uppercase transition-all duration-300 hover:bg-[#C5A059] hover:text-white"
          >
            <span>Enter The Boutique</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      ) : (
        <div className="relative w-full h-full flex items-center justify-center">
          {/* 4K Video Element */}
          <video
            ref={videoRef}
            src={videoSrc}
            playsInline
            autoPlay
            preload="auto"
            muted={isMuted}
            onTimeUpdate={handleTimeUpdate}
            onEnded={handleVideoEnded}
            onError={() => setVideoError(true)}
            className="w-full h-full object-cover"
          >
            <source src={videoSrc} type="video/mp4" />
            <source src="/assets/heaven_intro_4k.mp4" type="video/mp4" />
            <source src="/assets/heaven_intro_4k.webm" type="video/webm" />
          </video>

          {/* Top Controls Overlay */}
          <div className="absolute top-8 left-8 right-8 flex items-center justify-between z-20">
            <div className="flex items-center gap-3">
              <span className="heaven-wordmark text-xl text-white tracking-[0.3em] drop-shadow-md">
                HEAVEN
              </span>
              <span className="text-[10px] uppercase tracking-widest text-[#C5A059] font-medium border border-[#C5A059]/40 px-2 py-0.5 rounded-full backdrop-blur-sm bg-black/30">
                4K Experience
              </span>
            </div>

            <div className="flex items-center gap-4">
              {/* Sound Toggle */}
              <button
                onClick={toggleSound}
                className="flex items-center gap-2 bg-black/60 hover:bg-black/90 text-white border border-neutral-700/60 px-3.5 py-2 rounded-full text-xs tracking-wider uppercase transition-colors backdrop-blur-md"
                title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
              >
                {isMuted ? (
                  <>
                    <VolumeX className="w-3.5 h-3.5 text-neutral-400" />
                    <span className="text-[11px] text-neutral-400">Unmute</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-3.5 h-3.5 text-[#C5A059]" />
                    <span className="text-[11px] text-[#C5A059]">Sound On</span>
                  </>
                )}
              </button>

              {/* Skip Intro */}
              {allowSkip && (
                <button
                  onClick={handleSkip}
                  className="flex items-center gap-2 bg-white/90 hover:bg-white text-black px-4 py-2 rounded-full text-xs font-semibold tracking-[0.2em] uppercase transition-all shadow-lg backdrop-blur-md"
                >
                  <span>Skip Intro</span>
                  <SkipForward className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Bottom Progress Bar */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20 z-20">
            <div
              className="h-full bg-[#C5A059] transition-all duration-100 ease-linear"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
