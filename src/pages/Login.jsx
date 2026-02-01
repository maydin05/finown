import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Icon } from '../components/ui/Icon';

export default function Login() {
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSignUp, setIsSignUp] = useState(false);
    const [error, setError] = useState(null);
    const [message, setMessage] = useState(null);

    const handleAuth = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setMessage(null);

        try {
            if (isSignUp) {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                });
                if (error) throw error;
                setMessage('Kayıt başarılı! Lütfen e-postanızı doğrulayın.');
            } else {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
                // Redirect handled by onAuthStateChange in App.jsx
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center text-white p-6">
            <div className="mb-8 flex flex-col items-center">
                <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-blue-900/50">
                    <Icon name="wallet" size={32} className="text-white" />
                </div>
                <h1 className="text-2xl font-bold tracking-tight">FinOwn</h1>
                <p className="text-gray-400 text-sm mt-1">Hoş Geldiniz</p>
            </div>

            <div className="w-full max-w-sm bg-gray-800 p-8 rounded-2xl shadow-xl border border-gray-700">
                <form onSubmit={handleAuth} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">E-posta</label>
                        <input
                            type="email"
                            required
                            className="w-full p-3 rounded-xl bg-gray-900 border border-gray-700 text-white focus:border-blue-500 focus:outline-none transition-colors"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Şifre</label>
                        <input
                            type="password"
                            required
                            minLength={6}
                            className="w-full p-3 rounded-xl bg-gray-900 border border-gray-700 text-white focus:border-blue-500 focus:outline-none transition-colors"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>

                    {error && <div className="text-red-400 text-sm bg-red-900/20 p-3 rounded-lg border border-red-900/50">{error}</div>}
                    {message && <div className="text-green-400 text-sm bg-green-900/20 p-3 rounded-lg border border-green-900/50">{message}</div>}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-blue-600 hover:bg-blue-700 rounded-xl font-bold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'İşleniyor...' : (isSignUp ? 'Kayıt Ol' : 'Giriş Yap')}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <button
                        onClick={() => setIsSignUp(!isSignUp)}
                        className="text-sm text-gray-400 hover:text-white transition-colors"
                    >
                        {isSignUp ? 'Zaten hesabınız var mı? Giriş Yap' : 'Hesabınız yok mu? Kayıt Ol'}
                    </button>
                </div>
            </div>
        </div>
    );
}
