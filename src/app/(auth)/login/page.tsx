'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { createClient } from '@/utils/supabase/client';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        toast.error(authError.message);
        setLoading(false);
        return;
      }

      if (authData.user) {
        // Fetch user role from public.users
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('role')
          .eq('id', authData.user.id)
          .single();

        if (userError || !userData) {
          toast.error('Gagal mengambil data pengguna.');
          await supabase.auth.signOut();
          setLoading(false);
          return;
        }

        const role = userData.role;
        const userId = authData.user.id;

        if (role === 'COMPETITION' || role === 'MANAGER' || role === 'RECEPTIONIST') {
          toast.success('Login berhasil!');
          router.push(`/${userId}/dashboard`);
        } else if (role === 'MC') {
          toast.success('Login berhasil!');
          router.push(`/${userId}/competitions`);
        } else {
          // Role is 'USER' or something else
          toast.error('Anda tidak memiliki akses ke modul ini (hanya untuk Panitia/Kompetisi).');
          await supabase.auth.signOut();
        }
      }
    } catch (error: any) {
      toast.error('Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-black p-4">
      <Card className="w-full max-w-md border-zinc-200 dark:border-white/10 shadow-lg">
        <CardHeader className="space-y-1 text-center">
          <h2 className="text-sm font-semibold text-[#10B981] dark:text-[#34D399] uppercase tracking-wider mb-1">Competition GameForSmart</h2>
          <CardTitle className="text-2xl font-bold tracking-tight">Login</CardTitle>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="example@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="focus-visible:ring-[#10B981] dark:focus-visible:ring-[#34D399]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="focus-visible:ring-[#10B981] dark:focus-visible:ring-[#34D399]"
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button
              type="submit"
              className="w-full bg-[#10B981] hover:bg-[#059669] text-white dark:bg-[#34D399] dark:hover:bg-[#10B981] dark:text-black"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Memproses...
                </>
              ) : (
                'Masuk'
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
