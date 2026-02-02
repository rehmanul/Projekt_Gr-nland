import { useEffect } from 'react';
import { useLocation } from 'wouter';

/**
 * ScrollToTop component - scrolls to top on route changes
 */
export function ScrollToTop() {
    const [location] = useLocation();

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [location]);

    return null;
}

export default ScrollToTop;
