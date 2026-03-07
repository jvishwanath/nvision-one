import { useRef, useCallback, useEffect, useState } from "react";

interface UsePullToRefreshOptions {
    onRefresh: () => Promise<void>;
    threshold?: number;
}

export function usePullToRefresh({ onRefresh, threshold = 80 }: UsePullToRefreshOptions) {
    const [pulling, setPulling] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [pullDistance, setPullDistance] = useState(0);
    const startYRef = useRef<number | null>(null);

    const onTouchStart = useCallback((e: TouchEvent) => {
        if (window.scrollY === 0) {
            startYRef.current = e.touches[0].clientY;
        }
    }, []);

    const onTouchMove = useCallback(
        (e: TouchEvent) => {
            if (startYRef.current === null || refreshing) return;
            const delta = e.touches[0].clientY - startYRef.current;
            if (delta > 0) {
                setPulling(true);
                setPullDistance(Math.min(delta * 0.5, threshold * 1.5));
            }
        },
        [refreshing, threshold]
    );

    const onTouchEnd = useCallback(async () => {
        if (startYRef.current === null) return;
        startYRef.current = null;

        if (pullDistance >= threshold && !refreshing) {
            setRefreshing(true);
            setPullDistance(threshold * 0.5);
            try {
                await onRefresh();
            } finally {
                setRefreshing(false);
            }
        }
        setPulling(false);
        setPullDistance(0);
    }, [pullDistance, threshold, refreshing, onRefresh]);

    useEffect(() => {
        document.addEventListener("touchstart", onTouchStart, { passive: true });
        document.addEventListener("touchmove", onTouchMove, { passive: true });
        document.addEventListener("touchend", onTouchEnd);
        return () => {
            document.removeEventListener("touchstart", onTouchStart);
            document.removeEventListener("touchmove", onTouchMove);
            document.removeEventListener("touchend", onTouchEnd);
        };
    }, [onTouchStart, onTouchMove, onTouchEnd]);

    return { pulling, refreshing, pullDistance };
}
