'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation'; 
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

export default function TambahUserPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const router = useRouter(); 

    const handleCreateUser = async (e: FormEvent) => {
        e.preventDefault();
        if (!username || !password) {
            toast.warning('Username dan password tidak boleh kosong.');
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await fetch('/api/user', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });

            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.error || 'Gagal membuat user baru');
            }

            toast.success(`User "${result.user.username}" berhasil dibuat!`);
            router.push('/dashboard/users');
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleCreateUser} className="space-y-6">
            <h1 className="text-3xl font-bold">Buat User Baru</h1>

            <Card className="max-w-2xl">
                <CardHeader>
                    <CardTitle>Formulir User</CardTitle>
                    <CardDescription>
                        Masukkan username dan password untuk user baru yang akan didaftarkan.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="username">Username</Label>
                        <Input
                            id="username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="cth: kasir_01"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <Input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                </CardContent>
                <CardFooter>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isSubmitting ? 'Menyimpan...' : 'Simpan User'}
                    </Button>
                </CardFooter>
            </Card>
        </form>
    );
}