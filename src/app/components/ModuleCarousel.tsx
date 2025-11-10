'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { CourseModule } from '@/app/types/course';
import { Star, Trophy, Zap, ChevronRight } from 'lucide-react';
import { Space_Grotesk } from 'next/font/google';

const bodyFont = Space_Grotesk({ subsets: ['latin'], weight: ['400', '500', '600'] });

interface ModuleCarouselProps {
  modules: CourseModule[];
  onModuleSelect?: (moduleId: string, index: number) => void;
  autoplayInterval?: number;
  loop?: boolean;
}

const DRAG_BUFFER = 0;
const VELOCITY_THRESHOLD = 500;
const GAP = 24;
const SPRING_OPTIONS = { type: 'spring', stiffness: 300, damping: 30 };

export default function ModuleCarousel({
  modules,
  onModuleSelect,
  autoplayInterval = 0,
  loop = true
}: ModuleCarouselProps) {
  const baseWidth = 900;
  const containerPadding = 24;
  const itemWidth = baseWidth - containerPadding * 2;
  const trackItemOffset = itemWidth + GAP;

  const carouselModules = loop ? [...modules, modules[0]] : modules;
  const [currentIndex, setCurrentIndex] = useState(0);
  const x = useMotionValue(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      const container = containerRef.current;
      const handleMouseEnter = () => setIsHovered(true);
      const handleMouseLeave = () => setIsHovered(false);
      container.addEventListener('mouseenter', handleMouseEnter);
      container.addEventListener('mouseleave', handleMouseLeave);
      return () => {
        container.removeEventListener('mouseenter', handleMouseEnter);
        container.removeEventListener('mouseleave', handleMouseLeave);
      };
    }
  }, []);

  useEffect(() => {
    if (autoplayInterval > 0 && !isHovered) {
      const timer = setInterval(() => {
        setCurrentIndex(prev => {
          if (prev === modules.length - 1 && loop) {
            return prev + 1;
          }
          if (prev === carouselModules.length - 1) {
            return loop ? 0 : prev;
          }
          return prev + 1;
        });
      }, autoplayInterval);
      return () => clearInterval(timer);
    }
  }, [autoplayInterval, isHovered, loop, modules.length, carouselModules.length]);

  const effectiveTransition = isResetting ? { duration: 0 } : SPRING_OPTIONS;

  const handleAnimationComplete = () => {
    if (loop && currentIndex === carouselModules.length - 1) {
      setIsResetting(true);
      x.set(0);
      setCurrentIndex(0);
      setTimeout(() => setIsResetting(false), 50);
    }
  };

  const handleDragEnd = (_: any, info: any) => {
    const offset = info.offset.x;
    const velocity = info.velocity.x;
    if (offset < -DRAG_BUFFER || velocity < -VELOCITY_THRESHOLD) {
      if (loop && currentIndex === modules.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else {
        setCurrentIndex(prev => Math.min(prev + 1, carouselModules.length - 1));
      }
    } else if (offset > DRAG_BUFFER || velocity > VELOCITY_THRESHOLD) {
      if (loop && currentIndex === 0) {
        setCurrentIndex(modules.length - 1);
      } else {
        setCurrentIndex(prev => Math.max(prev - 1, 0));
      }
    }
  };

  const handleModuleClick = (moduleId: string, index: number) => {
    if (onModuleSelect) {
      onModuleSelect(moduleId, index);
    }
  };

  const getModuleIcon = (index: number, total: number) => {
    if (index === 0) return <Star className="w-6 h-6 text-[#a95757]" fill="#a95757" />;
    if (index === total - 1) return <Trophy className="w-6 h-6 text-[#c1b6a4]" />;
    return <Zap className="w-6 h-6 text-[#a95757]" />;
  };

  const dragProps = loop
    ? {}
    : {
        dragConstraints: {
          left: -trackItemOffset * (carouselModules.length - 1),
          right: 0
        }
      };

  return (
    <div className={`${bodyFont.className} w-full max-w-5xl mx-auto`}>
      <div className="mb-6 flex items-center justify-between">
        <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#fff5ef] to-[#f2e7d9] rounded-full border border-[#a95757]/20 shadow-sm">
          <Zap className="w-5 h-5 text-[#a95757]" />
          <span className="text-sm uppercase tracking-[0.2em] text-[#a95757] font-semibold">
            Course Modules
          </span>
        </div>
        <div className="text-sm text-[#666]">
          {modules.length} {modules.length === 1 ? 'Module' : 'Modules'}
        </div>
      </div>

      <div
        ref={containerRef}
        className="relative overflow-hidden rounded-3xl border border-[#f2e7d9] shadow-2xl bg-gradient-to-br from-white to-[#fffcf9]"
        style={{
          width: '100%',
          maxWidth: `${baseWidth}px`,
          margin: '0 auto',
          padding: `${containerPadding}px`
        }}
      >
        <motion.div
          className="flex"
          drag="x"
          {...dragProps}
          style={{
            width: itemWidth,
            gap: `${GAP}px`,
            perspective: 1000,
            perspectiveOrigin: `${currentIndex * trackItemOffset + itemWidth / 2}px 50%`,
            x,
            cursor: 'grab'
          }}
          whileTap={{ cursor: 'grabbing' }}
          onDragEnd={handleDragEnd}
          animate={{ x: -(currentIndex * trackItemOffset) }}
          transition={effectiveTransition}
          onAnimationComplete={handleAnimationComplete}
        >
          {carouselModules.map((module, index) => {
            const range = [
              -(index + 1) * trackItemOffset,
              -index * trackItemOffset,
              -(index - 1) * trackItemOffset
            ];
            const outputRange = [15, 0, -15];
            const rotateY = useTransform(x, range, outputRange, { clamp: false });

            const actualIndex = index % modules.length;

            return (
              <motion.div
                key={`${module.id}-${index}`}
                className="relative flex flex-shrink-0 flex-col justify-between bg-gradient-to-br from-white to-[#fffcf9] border-2 border-[#f2e7d9] rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all hover:border-[#a95757]/40"
                style={{
                  width: itemWidth,
                  minHeight: '420px',
                  rotateY: rotateY
                }}
                transition={effectiveTransition}
                onClick={() => handleModuleClick(module.id, actualIndex)}
              >
                {/* Header */}
                <div className="p-8 pb-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[#fff5ef] to-[#f2e7d9] border-2 border-[#a95757]/30 shadow-md">
                      {getModuleIcon(actualIndex, modules.length)}
                    </div>
                    <div className="text-sm font-bold text-[#a95757] bg-[#fff5ef] px-4 py-2 rounded-full border border-[#a95757]/20 shadow-sm">
                      Module {actualIndex + 1}
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-[#262626] mb-3 line-clamp-2">
                    {module.title}
                  </h3>
                  <p className="text-base text-[#666] line-clamp-3 leading-relaxed">
                    {module.description || `Explore ${module.topics?.length || 0} essential topics in this module.`}
                  </p>
                </div>

                {/* Topics Preview */}
                <div className="px-8 pb-6 flex-1">
                  <div className="mb-3">
                    <h4 className="text-xs uppercase tracking-[0.2em] text-[#c1b6a4] font-semibold mb-3">
                      Topics Covered
                    </h4>
                  </div>
                  <div className="space-y-3">
                    {module.topics?.slice(0, 5).map((topic, topicIndex) => (
                      <div
                        key={topic.id}
                        className="flex items-start gap-3 text-sm text-[#4a4a4a] p-2 rounded-lg hover:bg-[#fff5ef]/50 transition-colors"
                      >
                        <div className="w-2 h-2 rounded-full bg-[#a95757] mt-1.5 flex-shrink-0" />
                        <span className="line-clamp-2 flex-1">{topic.title}</span>
                      </div>
                    ))}
                    {(module.topics?.length || 0) > 5 && (
                      <div className="text-sm text-[#a95757] font-semibold flex items-center gap-1 pl-5 pt-1">
                        +{(module.topics?.length || 0) - 5} more topics
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer */}
                <div className="px-8 py-5 bg-gradient-to-r from-[#fff5ef] to-[#f2e7d9] border-t-2 border-[#f2e7d9]">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#666] font-medium">
                      {module.topics?.length || 0} {(module.topics?.length || 0) === 1 ? 'Topic' : 'Topics'}
                    </span>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i <= Math.min(Math.ceil((module.topics?.length || 0) / 2), 5)
                              ? 'text-amber-400 fill-amber-400'
                              : 'text-gray-300 fill-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Indicators */}
        <div className="flex justify-center mt-4">
          <div className="flex gap-2">
            {modules.map((_, index) => (
              <motion.button
                key={index}
                className={`h-2 rounded-full transition-all ${
                  currentIndex % modules.length === index
                    ? 'w-8 bg-[#a95757]'
                    : 'w-2 bg-[#e8d6c9]'
                }`}
                animate={{
                  scale: currentIndex % modules.length === index ? 1.1 : 1
                }}
                onClick={() => setCurrentIndex(index)}
                transition={{ duration: 0.15 }}
                aria-label={`Go to module ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Helper Text */}
      <p className="text-sm text-[#999] text-center mt-4 flex items-center justify-center gap-2">
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#a95757] animate-pulse" />
        Drag or swipe to explore all modules
      </p>
    </div>
  );
}
