import type { ImgHTMLAttributes } from 'react';

export default function AppLogoIcon({ className, alt = "Logo", ...props }: ImgHTMLAttributes<HTMLImageElement>) {
    return (
        <img
            src="/storage/logo.png"
            alt={alt}
            className={`object-contain ${className || ''}`}
            {...props}
        />
    );
}
