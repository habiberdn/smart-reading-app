// Polyfills for modern ECMAScript features (required for compatibility with PDF.js and modern modules)
if (typeof globalThis.Iterator === 'undefined') {
    (globalThis as unknown as { Iterator: unknown }).Iterator = class Iterator {};
}
if (!(globalThis as unknown as { Iterator: { prototype?: object } }).Iterator.prototype) {
    (globalThis as unknown as { Iterator: { prototype: object } }).Iterator.prototype = {};
}
if (!Promise.withResolvers) {
    Promise.withResolvers = function <T>() {
        let resolve!: (value: T | PromiseLike<T>) => void;
        let reject!: (reason?: unknown) => void;
        const promise = new Promise<T>((res, rej) => {
            resolve = res;
            reject = rej;
        });
        return { promise, resolve, reject };
    };
}
if (!('getOrInsertComputed' in Map.prototype)) {
    // @ts-expect-error polyfill stage 3 proposal
    Map.prototype.getOrInsertComputed = function <K, V>(key: K, callback: (key: K) => V): V {
        if (this.has(key)) {
            return this.get(key) as V;
        }
        const value = callback(key);
        this.set(key, value);
        return value;
    };
}

import { createInertiaApp } from '@inertiajs/react';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import AuthLayout from '@/layouts/auth-layout';
import BaseLayout from '@/layouts/base-layout';
import SettingsLayout from '@/layouts/settings/layout';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

createInertiaApp({
    title: (title) => (title ? `${title} - ${appName}` : appName),
    layout: (name) => {
        switch (true) {
            case name === 'welcome':
                return null;
            case name === 'dosen/classroom/reading_workspace':
                return null;
            case name.startsWith('auth/'):
                return AuthLayout;
            case name.startsWith('settings/'):
                return [BaseLayout, SettingsLayout];
            default:
                return BaseLayout;
        }
    },
    strictMode: true,
    withApp(app) {
        return (
            <TooltipProvider delayDuration={0}>
                {app}
                <Toaster />
            </TooltipProvider>
        );
    },
    progress: {
        color: '#3B82F6',
    },
});
