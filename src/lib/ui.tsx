"use client";

import { useEffect } from "react";

// ---------------------------------------------------------------
// TopProgressBar — fixed pita progres tipis di paling atas viewport.
// Pakai `value` (0-100) untuk progres yang bisa diukur (misal upload),
// atau biarkan undefined untuk mode indeterminate (animasi geser).
// ---------------------------------------------------------------

interface TopProgressBarProps {
  active: boolean;
  value?: number; // 0-100
  label?: string;
}

export function TopProgressBar({ active, value, label }: TopProgressBarProps) {
  if (!active) return null;

  const determinate = typeof value === "number" && !Number.isNaN(value);
  const pct = determinate ? Math.max(2, Math.min(100, value as number)) : 100;

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] pointer-events-none">
      <div className="h-1 bg-accent/15 overflow-hidden">
        <div
          className={`h-full bg-accent ${determinate ? "transition-[width] duration-200 ease-out" : "top-progress-indeterminate"}`}
          style={determinate ? { width: `${pct}%` } : { width: "40%" }}
        />
      </div>
      {label && (
        <div className="px-4 py-1 bg-accent/95 text-white text-[11px] font-medium text-center shadow-sm pointer-events-auto">
          {label}
          {determinate ? ` · ${Math.round(pct)}%` : ""}
        </div>
      )}
    </div>
  );
}

// Hook untuk mencegah scroll body saat overlay aktif (opsional)
export function useBodyScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [active]);
}

// ---------------------------------------------------------------
// Skeleton building blocks
// ---------------------------------------------------------------

export function SkeletonLine({ className = "h-3 w-full" }: { className?: string }) {
  return <div className={`skeleton ${className}`} />;
}

export function SkeletonCard({ children }: { children?: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-border p-5 shadow-xs space-y-3">
      {children}
    </div>
  );
}

// Skeleton untuk halaman detail order
export function OrderDetailSkeleton() {
  return (
    <div className="px-4 py-5 max-w-lg mx-auto space-y-4 min-h-screen pb-24">
      <div className="flex items-center gap-3">
        <div className="skeleton w-9 h-9 rounded-xl" />
        <div className="flex-1 space-y-2">
          <SkeletonLine className="h-4 w-32" />
          <SkeletonLine className="h-3 w-20" />
        </div>
        <div className="skeleton h-6 w-20 rounded-full" />
      </div>
      <SkeletonCard>
        <div className="flex items-center gap-4">
          <div className="skeleton w-14 h-14 rounded-2xl" />
          <div className="flex-1 space-y-2">
            <SkeletonLine className="h-4 w-40" />
            <SkeletonLine className="h-3 w-24" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 pt-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-1.5">
              <SkeletonLine className="h-2.5 w-12" />
              <SkeletonLine className="h-3.5 w-20" />
            </div>
          ))}
        </div>
      </SkeletonCard>
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="bg-white rounded-2xl border border-border p-4 shadow-xs flex items-center gap-4"
        >
          <div className="skeleton w-10 h-10 rounded-xl" />
          <div className="flex-1 space-y-2">
            <SkeletonLine className="h-2.5 w-16" />
            <SkeletonLine className="h-3.5 w-40" />
          </div>
        </div>
      ))}
    </div>
  );
}

// Skeleton untuk checklist
export function ChecklistSkeleton() {
  return (
    <div className="min-h-screen bg-surface-secondary flex flex-col pb-24">
      <div className="bg-primary-dark px-4 pt-4 pb-5 space-y-3">
        <div className="flex items-center gap-3">
          <div className="skeleton w-7 h-7 rounded-lg bg-white/20" />
          <div className="flex-1 space-y-1.5">
            <div className="skeleton h-3 w-32 bg-white/20" />
            <div className="skeleton h-2 w-24 bg-white/10" />
          </div>
          <div className="skeleton h-6 w-16 rounded-full bg-white/20" />
        </div>
        <div className="skeleton h-1.5 w-full rounded-full bg-white/10" />
        <div className="flex gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton h-7 w-20 rounded-full bg-white/10" />
          ))}
        </div>
      </div>
      <div className="flex-1 px-4 py-4 max-w-lg mx-auto w-full space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-2xl border border-border shadow-xs p-4 space-y-3"
          >
            <SkeletonLine className="h-4 w-3/4" />
            <SkeletonLine className="h-3 w-1/2" />
            <div className="grid grid-cols-4 gap-2 pt-1">
              {Array.from({ length: 4 }).map((__, j) => (
                <div key={j} className="skeleton h-11 rounded-xl" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Skeleton untuk halaman ringkasan
export function SummarySkeleton() {
  return (
    <div className="min-h-screen bg-surface-secondary pb-24">
      <div className="bg-primary-dark px-4 h-14 flex items-center gap-3">
        <div className="skeleton w-7 h-7 rounded-lg bg-white/20" />
        <div className="flex-1 space-y-1.5">
          <div className="skeleton h-3 w-32 bg-white/20" />
          <div className="skeleton h-2 w-20 bg-white/10" />
        </div>
      </div>
      <div className="px-4 py-5 max-w-lg mx-auto space-y-4">
        <SkeletonCard>
          <div className="flex items-center gap-4">
            <div className="skeleton w-12 h-12 rounded-xl" />
            <div className="flex-1 space-y-2">
              <SkeletonLine className="h-4 w-40" />
              <SkeletonLine className="h-3 w-32" />
            </div>
          </div>
        </SkeletonCard>
        <div className="grid grid-cols-2 gap-3">
          <div className="skeleton h-24 rounded-xl" />
          <div className="skeleton h-24 rounded-xl" />
        </div>
        <SkeletonCard>
          <SkeletonLine className="h-4 w-32 mb-2" />
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonLine key={i} className="h-3 w-full mb-2" />
          ))}
        </SkeletonCard>
      </div>
    </div>
  );
}

export function ListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="bg-white rounded-2xl border border-border p-4 shadow-xs">
          <div className="flex items-start gap-3">
            <div className="skeleton w-11 h-11 rounded-xl flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <SkeletonLine className="h-3.5 w-2/3" />
              <SkeletonLine className="h-3 w-1/2" />
              <SkeletonLine className="h-2.5 w-1/3" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
