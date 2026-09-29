import React, { useState } from 'react';
import { Loader2, Lock, Mail } from 'lucide-react';
import { HorizonteLogo } from '../common/HorizonteLogo';
import { signIn } from '../../services/api/auth';

export const LoginScreen: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await signIn(email.trim(), password);
      // Sucesso: o useAuth (via onAuthStateChange) detecta a sessão nova sozinho.
    } catch {
      setError('E-mail ou senha inválidos.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-6">
          <HorizonteLogo variant="full" size="md" />
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-6 space-y-4"
        >
          <div>
            <h1 className="text-sm font-bold text-[#0B1C30]">Entrar no sistema</h1>
            <p className="text-xs text-slate-500 mt-0.5">Torre de Controle Horizonte Logística</p>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">E-mail</label>
            <div className="relative">
              <Mail className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                required
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="voce@horizonte.com.br"
                className="w-full h-9 pl-8 pr-3 text-xs border border-slate-300 rounded-lg focus:border-[#004AC6] focus:ring-1 focus:ring-[#004AC6] outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">Senha</label>
            <div className="relative">
              <Lock className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full h-9 pl-8 pr-3 text-xs border border-slate-300 rounded-lg focus:border-[#004AC6] focus:ring-1 focus:ring-[#004AC6] outline-none"
              />
            </div>
          </div>

          {error && (
            <div className="text-[11px] text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-9 bg-[#004AC6] hover:bg-[#003899] disabled:opacity-60 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
};
