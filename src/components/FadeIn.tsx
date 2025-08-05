import React, { useEffect, useRef, useState, ElementType } from "react";

interface FadeInProps extends React.HTMLAttributes<HTMLElement> {
  /** Element type to render, defaults to div */
  as?: ElementType;
  /** Delay in milliseconds before animation starts */
  delay?: number;
  children: React.ReactNode;
}

/**
 * Fades and slides content into view when scrolled into the viewport.
 * Respects the user's `prefers-reduced-motion` setting.
 */
export default function FadeIn({
  as: Component = "div",
  delay = 0,
  children,
  className = "",
  ...rest
}: FadeInProps) {
  const ref = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) {
      setVisible(true);
      return;
    }

    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const baseClasses =
    "motion-safe:transition-all motion-safe:duration-700 motion-safe:ease-out motion-reduce:transition-none motion-reduce:transform-none";
  const hiddenClasses = "opacity-0 translate-y-6";
  const visibleClasses = "opacity-100 translate-y-0";

  return (
    <Component
      ref={ref as any}
      className={`${className} ${baseClasses} ${visible ? visibleClasses : hiddenClasses}`.trim()}
      style={{ transitionDelay: visible ? `${delay}ms` : undefined }}
      {...rest}
    >
      {children}
    </Component>
  );
}
