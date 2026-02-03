import clsx from 'clsx'

interface SkeletonProps {
  className?: string
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={clsx(
        'bg-gradient-to-r from-slate-700 via-slate-600 to-slate-700 bg-[length:200%_100%] animate-pulse rounded',
        className
      )}
    />
  )
}

export function CardSkeleton() {
  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
      <Skeleton className="h-5 w-32 mb-3" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </div>
  )
}

export function LineSkeleton() {
  return (
    <div className="flex justify-between items-center py-2">
      <Skeleton className="h-4 w-24" />
      <div className="flex gap-4">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-16" />
      </div>
    </div>
  )
}

export function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  }

  return (
    <div className="flex justify-center items-center py-8">
      <div
        className={clsx(
          'border-2 border-slate-600 border-t-blue-500 rounded-full animate-spin',
          sizeClasses[size]
        )}
      />
    </div>
  )
}
