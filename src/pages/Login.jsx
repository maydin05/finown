import React, { useState } from "react";
import { supabase } from "../lib/supabase";
import { Icon } from "../components/ui/Icon";

export default function Login({ auth = supabase.auth }) {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (isSignUp) {
        const { error } = await auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        setMessage("Kayıt başarılı! Lütfen e-postanızı doğrulayın.");
      } else {
        const { error } = await auth.signInWithPassword({
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
    <main className="auth-page tone-overview">
      <div className="auth-content">
        <h1 className="wordmark" aria-label="FinOwn">
          <span className="brand-symbol">f</span>finown
        </h1>
        <div className="auth-intro">
          <span className="auth-eyebrow">Finansın, daha net.</span>
          <h2>
            {isSignUp ? "Takibe birlikte başlayalım." : "Yeniden merhaba."}
          </h2>
          <p>
            {isSignUp
              ? "Gelirlerini, ödemelerini ve kartlarını tek yerde takip et."
              : "Yaklaşan ödemelerin ve gelirlerin tek bir yerde."}
          </p>
        </div>
        <section
          className="auth-card"
          aria-label={isSignUp ? "Hesap oluştur" : "Hesabına giriş"}
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
                    minLength={6}
                    autoComplete={
                      isSignUp ? "new-password" : "current-password"
                    }
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    aria-describedby={isSignUp ? "password-hint" : undefined}
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
                {isSignUp && (
                  <p id="password-hint" className="form-hint">
                    En az 6 karakter kullan.
                  </p>
                )}
              </div>
            </div>
            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}
            {message && (
              <p className="auth-success" role="status">
                {message}
              </p>
            )}
            <button type="submit" className="primary-button" disabled={loading}>
              {loading ? "İşleniyor…" : isSignUp ? "Kayıt Ol" : "Giriş Yap"}
              <Icon name="arrow-right" size={18} />
            </button>
          </form>
          <p className="auth-switch">
            {isSignUp ? "Zaten hesabın var mı?" : "Henüz hesabın yok mu?"}{" "}
            <button
              type="button"
              disabled={loading}
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError(null);
                setMessage(null);
              }}
            >
              {isSignUp ? "Giriş yap" : "Hesap oluştur"}
            </button>
          </p>
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
