import { Head } from '@inertiajs/react';
import { GraduationCap, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
    kampus: string;
}

export default function InvitationAccept({ kampus }: Props) {
    return (
        <>
            <Head title="Undangan Dosen">
                <meta
                    name="description"
                    content={`Anda telah diundang untuk bergabung sebagai dosen di ${kampus}.`}
                />
            </Head>

            <div className="flex min-h-svh flex-col items-center justify-center bg-gradient-to-b from-background to-muted/30 p-6 md:p-10">
                <div className="w-full max-w-md">
                    <div className="flex flex-col items-center gap-6 rounded-2xl border bg-card p-8 shadow-lg">
                        {/* Icon */}
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                            <GraduationCap className="h-8 w-8 text-primary" />
                        </div>

                        {/* Heading */}
                        <div className="space-y-2 text-center">
                            <h1 className="text-2xl font-bold text-foreground">
                                Undangan Dosen
                            </h1>
                            <p className="text-sm text-muted-foreground">
                                Anda telah diundang untuk bergabung sebagai{' '}
                                <span className="font-semibold text-foreground">
                                    Dosen
                                </span>{' '}
                                di
                            </p>
                            <div className="inline-flex items-center gap-2 rounded-lg bg-primary/5 px-4 py-2 text-lg font-bold text-primary">
                                <ShieldCheck className="h-5 w-5" />
                                {kampus}
                            </div>
                        </div>

                        {/* Divider */}
                        <div className="w-full border-t" />

                        {/* Info */}
                        <p className="text-center text-sm text-muted-foreground">
                            Untuk melanjutkan, silakan login menggunakan akun
                            Google Anda. Akun dosen akan otomatis dibuat dan
                            terhubung ke kampus{' '}
                            <span className="font-medium text-foreground">
                                {kampus}
                            </span>
                            .
                        </p>

                        {/* Google Login Button */}
                        <Button
                            type="button"
                            className="w-full gap-3 py-6 text-base font-medium shadow-sm"
                            size="lg"
                            onClick={() => {
                                window.location.replace('/auth/google/redirect');
                            }}
                        >
                            <svg
                                className="h-5 w-5"
                                viewBox="0 0 24 24"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path
                                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                                    fill="#4285F4"
                                />
                                <path
                                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                    fill="#34A853"
                                />
                                <path
                                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                    fill="#FBBC05"
                                />
                                <path
                                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                    fill="#EA4335"
                                />
                            </svg>
                            Login dengan Google
                        </Button>

                        {/* Footer note */}
                        <p className="text-center text-xs text-muted-foreground/70">
                            Dengan melanjutkan, Anda menyetujui bahwa data
                            profil Google Anda (nama dan email) akan digunakan
                            untuk membuat akun dosen.
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
}
