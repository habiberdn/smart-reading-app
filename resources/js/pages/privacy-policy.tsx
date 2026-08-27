import { Head, Link } from '@inertiajs/react';
import { Shield, ArrowLeft, Mail, Lock, UserCheck, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function PrivacyPolicy() {
    return (
        <div className="min-h-screen bg-muted/30 py-12 px-4 sm:px-6 lg:px-8">
            <Head title="Kebijakan Privasi - Smart Reading App" />

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
                                    <Shield className="h-6 w-6" />
                                </div>
                                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                                    Kebijakan Privasi
                                </h1>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                Kebijakan Privasi untuk platform <strong>Smart Reading App</strong> (smartreadingapp.my.id).
                            </p>
                        </div>

                        {/* Content Sections */}
                        <div className="space-y-6 text-sm leading-relaxed text-muted-foreground">
                            <section className="space-y-3">
                                <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                                    1. Pendahuluan
                                </h2>
                                <p>
                                    Selamat datang di <strong>Smart Reading App</strong>. Kami menghormati privasi Anda dan berkomitmen untuk melindungi data pribadi yang Anda bagikan kepada kami. Kebijakan Privasi ini menjelaskan bagaimana kami mengumpulkan, menggunakan, menyimpan, dan melindungi informasi Anda saat menggunakan aplikasi dan layanan kami, termasuk saat Anda masuk menggunakan akun Google (Google Sign-In).
                                </p>
                            </section>

                            <section className="space-y-3">
                                <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                                    <UserCheck className="h-4 w-4 text-primary" /> 2. Data yang Kami Kumpulkan dari Google Sign-In
                                </h2>
                                <p>
                                    Saat Anda memilih untuk masuk atau mendaftar menggunakan Akun Google Anda, kami hanya meminta akses ke data profil dasar yang bersifat publik dan esensial, yaitu:
                                </p>
                                <ul className="list-disc list-inside space-y-1.5 pl-2">
                                    <li><strong>Nama Lengkap:</strong> Digunakan untuk menampilkan identitas Anda pada akun dan kelas.</li>
                                    <li><strong>Alamat Email:</strong> Digunakan sebagai identitas autentikasi unik, pengiriman notifikasi akademik, dan verifikasi akun.</li>
                                    <li><strong>Foto Profil (Avatar):</strong> Digunakan untuk menampilkan foto pengguna pada profil aplikasi.</li>
                                    <li><strong>Google ID:</strong> Identifier acak untuk memverifikasi autentikasi sesi Anda dengan aman.</li>
                                </ul>
                                <p className="text-xs bg-muted p-3 rounded-md border text-muted-foreground">
                                    <strong>Catatan:</strong> Kami <em>tidak pernah</em> meminta atau memiliki akses ke kata sandi Google Anda, kontak, Google Drive, email pribadi Gmail, atau data sensitif Google lainnya.
                                </p>
                            </section>

                            <section className="space-y-3">
                                <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                                    3. Tujuan Penggunaan Data
                                </h2>
                                <p>Data yang dikumpulkan hanya digunakan untuk tujuan berikut:</p>
                                <ul className="list-disc list-inside space-y-1 pl-2">
                                    <li>Menyediakan layanan platform pembelajaran dan analitik membaca cerdas.</li>
                                    <li>Memverifikasi identitas pengguna (Dosen dan Mahasiswa) di dalam kelas.</li>
                                    <li>Menghubungkan akun dosen ke kelas akademik yang bersangkutan.</li>
                                    <li>Menjaga keamanan akun dan mencegah akses tidak sah.</li>
                                </ul>
                            </section>

                            <section className="space-y-3">
                                <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                                    <EyeOff className="h-4 w-4 text-primary" /> 4. Pembagian dan Pengungkapan Data
                                </h2>
                                <p>
                                    Kami <strong>tidak pernah menjual, menyewakan, memperdagangkan, atau membagikan</strong> data pribadi Anda kepada pihak ketiga atau pengiklan untuk tujuan komersial apapun. Data Anda hanya dapat diakses oleh sistem kami secara internal untuk kebutuhan operasional aplikasi akademik ini.
                                </p>
                            </section>

                            <section className="space-y-3">
                                <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                                    <Lock className="h-4 w-4 text-primary" /> 5. Penyimpanan dan Keamanan Data
                                </h2>
                                <p>
                                    Kami menerapkan langkah-langkah keamanan teknis dan organisasi yang ketat, termasuk enkripsi data saat transit (HTTPS/SSL), untuk melindungi data pribadi Anda dari akses yang tidak sah, perubahan, pengungkapan, atau penghancuran.
                                </p>
                            </section>

                            <section className="space-y-3">
                                <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                                    6. Hak Pengguna & Penghapusan Data (Data Deletion)
                                </h2>
                                <p>
                                    Anda memiliki hak penuh untuk mengakses, memperbarui, atau meminta penghapusan data pribadi Anda dari sistem kami. Jika Anda ingin menghapus akun Anda dan semua data terkait, Anda dapat menghubungi kami melalui kontak dukungan di bawah ini.
                                </p>
                            </section>

                            <section className="space-y-3">
                                <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                                    <Mail className="h-4 w-4 text-primary" /> 7. Kontak Kami
                                </h2>
                                <p>
                                    Jika Anda memiliki pertanyaan, saran, atau permintaan terkait Kebijakan Privasi ini, silakan hubungi tim pengembang Smart Reading App di:
                                </p>
                                <div className="rounded-lg border bg-muted/40 p-4 text-xs space-y-1">
                                    <p className="font-semibold text-foreground">Smart Reading App Support Team</p>
                                    <p>Email: <a href="mailto:support@smartreadingapp.my.id" className="text-primary hover:underline font-medium">support@smartreadingapp.my.id</a></p>
                                    <p>Website: <a href="https://smartreadingapp.my.id" className="text-primary hover:underline">https://smartreadingapp.my.id</a></p>
                                </div>
                            </section>
                        </div>
                    </CardContent>
                </Card>

                {/* Footer Links */}
                <div className="text-center text-xs text-muted-foreground space-x-4">
                    <Link href="/terms-of-service" className="hover:underline">
                        Ketentuan Layanan (Terms of Service)
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
