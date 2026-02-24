
import React from 'react';
import { User } from '../types';
import { Lock, User as UserIcon, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';
import { loadUsersFromDB, hashPassword, initializeDefaultUsers } from '../services/dataService';

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState('');
  const [isAuthenticating, setIsAuthenticating] = React.useState(false);
  
  const passwordInputRef = React.useRef<HTMLInputElement>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsAuthenticating(true);

    try {
        const users = await loadUsersFromDB();
        // Se por algum motivo não houver utilizadores, tenta inicializar
        const finalUsers = users.length > 0 ? users : await initializeDefaultUsers();

        const inputHash = await hashPassword(password);
        const user = finalUsers.find(u => u.username.toLowerCase() === username.toLowerCase() && u.passwordHash === inputHash);

        if (user) {
            onLogin(user);
        } else {
            setError('Credenciais inválidas. Tente novamente.');
        }
    } catch (err) {
        console.error(err);
        setError('Erro ao aceder à base de dados de utilizadores.');
    } finally {
        setIsAuthenticating(false);
    }
  };
  
  const handleUsernameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      passwordInputRef.current?.focus();
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-8 bg-slate-50 border-b border-slate-100 flex flex-col items-center">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-blue-600/20">
                <span className="text-white font-black text-2xl">TF</span>
            </div>
            <h1 className="text-2xl font-black text-slate-800">TexFlow</h1>
            <p className="text-sm text-slate-500 font-medium">Gestão de Produção Têxtil</p>
        </div>

        <form onSubmit={handleLogin} className="p-8 space-y-6">
          {error && (
            <div className="bg-rose-50 border border-rose-100 text-rose-600 p-3 rounded-xl flex items-center gap-2 text-sm font-bold animate-in fade-in">
                <AlertCircle size={16} /> {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-black uppercase text-slate-400 tracking-wider ml-1">Utilizador</label>
            <div className="relative">
                <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                    type="text" 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    onKeyDown={handleUsernameKeyDown}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-11 pr-4 text-slate-800 font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    placeholder="Nome de utilizador"
                    autoFocus
                />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black uppercase text-slate-400 tracking-wider ml-1">Palavra-passe</label>
            <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                    ref={passwordInputRef}
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-11 pr-4 text-slate-800 font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    placeholder="••••••••"
                />
            </div>
          </div>

          <button 
            type="submit"
            disabled={isAuthenticating}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isAuthenticating ? (
                <>A verificar... <Loader2 size={18} className="animate-spin" /></>
            ) : (
                <>Entrar no Sistema <ArrowRight size={18} /></>
            )}
          </button>
        </form>
        
        <div className="bg-slate-50 p-4 text-center border-t border-slate-100">
            <p className="text-[10px] text-slate-400 font-medium">© 2026 TexFlow Lasa. Todos os direitos reservados.</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
