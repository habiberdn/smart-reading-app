import { Head, Link } from '@inertiajs/react';
import { FileText, ArrowLeft, Mail, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function TermsOfService() {
    return (
        <div className="min-h-screen bg-muted/30 py-12 px-4 sm:px-6 lg:px-8">
            <Head title="Ketentuan Layanan - Smart Reading App" />

            <div className="mx-auto max-w-4xl space-y-8">
                {/* Header Navigation */}
                <div className="flex items-center justify-between">
                    <Button variant="ghost" size="sm" asChild className="gap-2">
                        <Link href="/login">
                            <ArrowLeft className="h-4 w-4" /> Kembali ke Login
                        </Link>
                    </Button>
                    <span className="text-xs text-muted-foreground">
                        Terakhir Diperbarui: 23 Agustus 2026
                    </span>
                </div>

                {/* Main Card */}
                <Card className="border-border/60 shadow-sm">
                    <CardContent className="p-6 sm:p-10 space-y-8">
                        {/* Title Section */}
                        <div className="border-b pb-6 space-y-2">
                            <div className="flex items-center gap-3">
                                <div className="rounded-lg bg-primary/10 p-2 text-primary">
                                    <FileText className="h-6 w-6" />
                                </div>
                                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                                    Ketentuan Layanan (Terms of Service)
                                </h1>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                Syarat dan Ketentuan Penggunaan Platform <strong>Smart Reading App</strong> (smartreadingapp.my.id).
                            </p>
                        </div>

                        {/* Content Sections */}
                        <div className="space-y-6 text-sm leading-relaxed text-muted-foreground">
                            <section className="space-y-3">
                                <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                                    1. Penerimaan Ketentuan
                                </h2>
                                <p>
                                    Dengan mengakses atau menggunakan platform <strong>Smart Reading App</strong>, Anda menyatakan bahwa Anda telah membaca, memahami, dan menyetujui untuk terikat oleh Ketentuan Layanan ini serta Kebijakan Privasi kami. Jika Anda tidak menyetujui ketentuan ini, Anda tidak diperkenankan menggunakan platform kami.
                                </p>
                            </section>

                            <section className="space-y-3">
                                <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-primary" /> 2. Deskripsi Layanan
                                </h2>
                                <p>
                                    Smart Reading App adalah platform pembelajaran digital yang menyediakan analitik membaca berbasis NLP (Natural Language Processing), pelacakan fokus membaca cerdas, manajemen materi kuliah, dan pengujian pemahaman bacaan untuk Dosen dan Mahasiswa.
                                </p>
                            </section>

                            <section className="space-y-3">
                                <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                                    <ShieldCheck className="h-4 w-4 text-primary" /> 3. Akun Pengguna dan Autentikasi Google
                                </h2>
                                <ul className="list-disc list-inside space-y-1.5 pl-2">
                                    <li><strong>Keamanan Akun:</strong> Anda bertanggung jawab untuk menjaga kerahasiaan kredensial akun Anda.</li>
                                    <li><strong>Google Sign-In:</strong> Pengguna (Dosen) yang masuk menggunakan akun Google memberikan izin kepada Smart Reading App untuk mengakses profil publik dan alamat email yang sah untuk keperluan verifikasi akun.</li>
                                    <li><strong>Ketepatan Data:</strong> Anda setuju untuk memberikan informasi yang akurat dan lengkap saat mendaftar.</li>
                                </ul>
                            </section>

                            <section className="space-y-3">
                                <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                                    4. Pedoman Penggunaan dan Hak Cipta Materi
                                </h2>
                                <p>
                                    Semua materi dokumen, buku, artikel, dan materi pembelajaran yang diunggah oleh Dosen sepenuhnya merupakan tanggung jawab pengguna yang bersangkutan. Pengguna dilarang:
                                </p>
                                <ul className="list-disc list-inside space-y-1.5 pl-2">
                                    <li>Mengunggah dokumen atau konten yang melanggar hak cipta, hukum, atau norma kesusilaan.</li>
                                    <li>Menggunakan platform untuk tujuan peretasan, manipulasi data analitik, atau tindakan ilegal lainnya.</li>
                                    <li>Menyalahgunakan fitur pelacak membaca dengan bot atau skrip otomatis.</li>
                                </ul>
                            </section>

                            <section className="space-y-3">
                                <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                                    <AlertTriangle className="h-4 w-4 text-primary" /> 5. Batasan Tanggung Jawab
                                </h2>
                                <p>
                                    Layanan ini disediakan &quot;sebagaimana adanya&quot; (<em>as-is</em>). Kami berusaha menjaga ketersediaan layanan 24/7, namun kami tidak bertanggung jawab atas kerugian tidak langsung yang timbul akibat gangguan jaringan, pemeliharaan server, atau kehilangan data di luar kendali wajar kami.
                                </p>
                            </section>

                            <section className="space-y-3">
                                <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                                    6. Perubahan Ketentuan
                                </h2>
                                <p>
                                    Kami berhak mengubah atau memperbarui Ketentuan Layanan ini sewaktu-waktu. Setiap perubahan akan dicantumkan pada halaman ini dengan tanggal pembaruan terbaru.
                                </p>
                            </section>

                            <section className="space-y-3">
                                <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                                    <Mail className="h-4 w-4 text-primary" /> 7. Kontak Layanan
                                </h2>
                                <p>
                                    Jika Anda memiliki pertanyaan mengenai Ketentuan Layanan ini, silakan hubungi kami di:
                                </p>
                                <div className="rounded-lg border bg-muted/40 p-4 text-xs space-y-1">
                                    <p className="font-semibold text-foreground">Smart Reading App Administrator</p>
                                    <p>Email: <a href="mailto:support@smartreadingapp.my.id" className="text-primary hover:underline font-medium">support@smartreadingapp.my.id</a></p>
                                    <p>Website: <a href="https://smartreadingapp.my.id" className="text-primary hover:underline">https://smartreadingapp.my.id</a></p>
                                </div>
                            </section>
                        </div>
                    </CardContent>
                </Card>

                {/* Footer Links */}
                <div className="text-center text-xs text-muted-foreground space-x-4">
                    <Link href="/privacy-policy" className="hover:underline">
                        Kebijakan Privasi (Privacy Policy)
                    </Link>
                    <span>•</span>
                    <Link href="/login" className="hover:underline">
                        Halaman Login
                    </Link>
                </div>
            </div>
        </div>
    );
}
