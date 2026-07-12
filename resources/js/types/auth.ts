export type Role = 'mahasiswa' | 'dosen' | 'admin';

export type User = {
    id: number;
    name: string;
    username: string;
    role: Role;
    avatar?: string;
    two_factor_enabled?: boolean;
    nim?: string | null;
    nidn?: string | null;
    program_studi?: string | null;
    created_at: string;
    updated_at: string;
};

export type Auth = {
    user: User;
};

/* @chisel-passkeys */
export type Passkey = {
    id: number;
    name: string;
    authenticator: string | null;
    created_at_diff: string;
    last_used_at_diff: string | null;
};
/* @end-chisel-passkeys */

export type TwoFactorSetupData = {
    svg: string;
    url: string;
};

export type TwoFactorSecretKey = {
    secretKey: string;
};
