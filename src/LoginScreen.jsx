import React, { useState } from "react";
import { ShieldCheck, ArrowRight, Loader2 } from "lucide-react";

const LoginScreen = ({ onLogin, loading, error }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [localError, setLocalError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    setLocalError("");
    if (!email.trim() || !password) {
      setLocalError("メールアドレスとパスワードを入力してください。");
      return;
    }
    onLogin(email.trim(), password);
  };

  const displayError = error || localError;

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 font-black">
      <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl p-8 w-full max-w-md">
        {/* ヘッダー */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center mb-4 shadow-lg">
            <ShieldCheck size={32} className="text-white" />
          </div>
          <h1 className="text-white text-xl font-black tracking-widest">税理士法人アストラスト</h1>
          <p className="text-white/40 tracking-[0.3em] uppercase text-[10px] mt-1">STAFF LOGIN</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* メールアドレス */}
          <div className="flex flex-col gap-1.5">
            <label className="text-white/40 text-[10px] uppercase tracking-widest">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@astrust.jp"
              disabled={loading}
              className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-blue-500 transition-colors text-sm disabled:opacity-50"
            />
          </div>

          {/* パスワード */}
          <div className="flex flex-col gap-1.5">
            <label className="text-white/40 text-[10px] uppercase tracking-widest">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              disabled={loading}
              className={`bg-white/5 border rounded-2xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-blue-500 transition-colors text-sm disabled:opacity-50 ${
                displayError ? "border-rose-500" : "border-white/10"
              }`}
            />
          </div>

          {/* エラー表示 */}
          {displayError && (
            <div className="bg-rose-500/10 text-rose-200 border border-rose-500/30 rounded-xl px-4 py-2.5 text-xs">
              {displayError}
            </div>
          )}

          {/* ログインボタン */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 active:scale-95 disabled:opacity-60 rounded-2xl px-6 py-3.5 text-white font-black text-sm flex items-center justify-center gap-2 transition-all mt-1"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                認証中...
              </>
            ) : (
              <>
                ログイン
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginScreen;
