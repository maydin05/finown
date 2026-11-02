import React, { useRef, useState } from "react";
import { supabase } from "../lib/supabase";
import { Icon } from "../components/ui/Icon";

export default function Login({ auth = supabase.auth }) {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  const submitting = useRef(false);
  const handleAuth = async (e) => {
    e.preventDefault();
    if (submitting.current) return;
    submitting.current = true;
    setLoading(true);
    setError(null);

    try {
      const { error } = await auth.signInWithPassword({email: email.trim(), password});
      if (error) throw error;
    } catch (err) {
      setError(err.code === 'invalid_credentials' ? 'E-posta veya şifre hatalı.' : err.status === 429 ? 'Çok fazla deneme yapıldı. Biraz sonra tekrar dene.' : 'Giriş yapılamadı. Bilgilerini kontrol edip tekrar dene.');
    } finally {
      submitting.current = false;
      setLoading(false);
    }
  };

  return (
    <main className="auth-page tone-overview">
      <div className="auth-content">
        <h1 className="wordmark" aria-label="FinOwn">
          <span className="brand-symbol">f</span>finown
        </h1>
        <div className="auth-intro">
          <span className="auth-eyebrow">Finansın, daha net.</span>
          <h2>Yeniden merhaba.</h2>
          <p>Yaklaşan ödemelerin ve gelirlerin tek bir yerde.</p>
        </div>
        <section
          className="auth-card"
          aria-label="Hesabına giriş"
        >
          <form onSubmit={handleAuth}>
            <div className="auth-fields">
              <div>
                <label htmlFor="auth-email">E-posta</label>
                <input
                  id="auth-email"
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="E-posta adresin"
                  disabled={loading}
                />
              </div>
              <div>
                <label htmlFor="auth-password">Şifre</label>
                <div className="password-field">
                  <input
                    id="auth-password"
                    type={showPassword ? "text" : "password"}
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className="icon-button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={
                      showPassword ? "Şifreyi gizle" : "Şifreyi göster"
                    }
                    aria-pressed={showPassword}
                  >
                    <Icon name={showPassword ? "eye-off" : "eye"} size={19} />
                  </button>
                </div>
              </div>
            </div>
            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}
            <button type="submit" className="primary-button" disabled={loading}>
              {loading ? "Giriş yapılıyor…" : "Giriş Yap"}
              <Icon name="arrow-right" size={18} />
            </button>
          </form>
        </section>
        <div className="auth-highlights" aria-label="Takip alanları">
          <span>
            <Icon name="arrow-up-right" size={15} />
            Gelirler
          </span>
          <span>
            <Icon name="receipt" size={15} />
            Ödemeler
          </span>
          <span>
            <Icon name="repeat" size={15} />
            Abonelikler
          </span>
        </div>
      </div>
    </main>
  );
}
