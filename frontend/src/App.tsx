import { useState, type FormEvent, type InputHTMLAttributes } from 'react';
import {
  ArrowLeft,
  BadgeCheck,
  IdCard,
  LockKeyhole,
  Mail,
  MapPin,
  PawPrint,
  Stethoscope,
  UserRound,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import './App.css';

type Screen = 'login' | 'register' | 'forgot';
type Role = 'Tutor' | 'Veterinario';
type Feedback = { kind: 'success' | 'error'; text: string } | null;

type ApiEnvelope<T> = {
  success?: boolean;
  message?: string;
  data?: T | null;
  errors?: unknown;
  error?: string;
};

type RegisterForm = {
  nome: string;
  email: string;
  senha: string;
  confirmarSenha: string;
  tipoUsuario: Role;
  cpf: string;
  crmv: string;
  especialidade: string;
  rg: string;
  cidade: string;
  estado: string;
  bairro: string;
  numero: string;
  cep: string;
};

type LoggedUser = { id?: number; email: string; name?: string };

async function postJson<T>(path: string, body: Record<string, string>): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`/api${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error('Não foi possível conectar ao servidor. Confira se o backend está rodando na porta 3000.');
  }

  let result: ApiEnvelope<T>;
  try {
    result = (await response.json()) as ApiEnvelope<T>;
  } catch {
    throw new Error('O servidor retornou uma resposta que não pôde ser lida.');
  }

  if (!response.ok || result.success === false) {
    let details = '';
    if (Array.isArray(result.errors)) {
      details = result.errors
        .map((item) => {
          if (typeof item === 'string') return item;
          if (item && typeof item === 'object') {
            const error = item as { campo?: string; mensagem?: string; message?: string };
            return [error.campo, error.mensagem || error.message].filter(Boolean).join(': ');
          }
          return '';
        })
        .filter(Boolean)
        .join(' · ');
    }
    throw new Error(details || result.message || result.error || `Não foi possível concluir a solicitação (${response.status}).`);
  }

  return (result.data ?? null) as T;
}

type FieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  icon: LucideIcon;
  wide?: boolean;
};

function Field({ label, icon: Icon, wide = false, ...inputProps }: FieldProps) {
  return (
    <label className={`field${wide ? ' field-wide' : ''}`}>
      <span className="sr-only">{label}</span>
      <span className="input-shell">
        <Icon size={19} strokeWidth={1.65} aria-hidden="true" />
        <input aria-label={label} placeholder={label} {...inputProps} />
      </span>
    </label>
  );
}

function VisualPanel() {
  return (
    <aside className="visual-column" aria-label="Imagem ilustrativa do VetOn">
      <div className="visual-frame">
        <div className="visual-placeholder">
          <PawPrint size={42} strokeWidth={1.2} />
          <span>VetOn</span>
          <small>Seu cuidado começa aqui</small>
          <small className="image-tip">Adicione uma foto em public/images/cachorro-veton.jpg</small>
        </div>
        <img
          src="/images/cachorro-veton.jpg"
          alt="Cachorro em uma consulta veterinária"
          onError={(event) => {
            event.currentTarget.style.display = 'none';
          }}
        />
        <div className="photo-tint" />
      </div>
    </aside>
  );
}

const initialRegisterForm: RegisterForm = {
  nome: '',
  email: '',
  senha: '',
  confirmarSenha: '',
  tipoUsuario: 'Tutor',
  cpf: '',
  crmv: '',
  especialidade: '',
  rg: '',
  cidade: '',
  estado: '',
  bairro: '',
  numero: '',
  cep: '',
};

export default function App() {
  const [screen, setScreen] = useState<Screen>('login');
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [busy, setBusy] = useState(false);

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [register, setRegister] = useState<RegisterForm>(initialRegisterForm);

  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotStage, setForgotStage] = useState<'email' | 'reset'>('email');
  const [recoveryCode, setRecoveryCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  const [loggedUser, setLoggedUser] = useState<LoggedUser | null>(() => {
    const token = localStorage.getItem('veton_token');
    const savedUser = localStorage.getItem('veton_user');
    if (!token || !savedUser) return null;
    try {
      return JSON.parse(savedUser) as LoggedUser;
    } catch {
      localStorage.removeItem('veton_token');
      localStorage.removeItem('veton_user');
      return null;
    }
  });

  function changeScreen(next: Screen) {
    setScreen(next);
    setFeedback(null);
    if (next === 'forgot') {
      setForgotStage('email');
      setRecoveryCode('');
      setNewPassword('');
      setConfirmNewPassword('');
    }
  }

  function updateRegister<K extends keyof RegisterForm>(key: K, value: RegisterForm[K]) {
    setRegister((current) => ({ ...current, [key]: value }));
  }

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setFeedback(null);
    try {
      const result = await postJson<{
        token: string;
        user: { id?: number; email: string; name?: string };
      }>('/auth/login', { email: loginEmail.trim(), senha: loginPassword });

      if (!result?.token || !result.user) {
        throw new Error('O servidor não retornou os dados de autenticação esperados.');
      }

      localStorage.setItem('veton_token', result.token);
      localStorage.setItem('veton_user', JSON.stringify(result.user));
      setLoggedUser(result.user);
    } catch (error) {
      setFeedback({ kind: 'error', text: error instanceof Error ? error.message : 'Erro ao entrar.' });
    } finally {
      setBusy(false);
    }
  }

  async function handleRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);

    if (register.senha !== register.confirmarSenha) {
      setFeedback({ kind: 'error', text: 'As senhas não são iguais.' });
      return;
    }

    setBusy(true);
    try {
      // Estes campos são enviados com os mesmos nomes usados pelo authController.ts.
      const payload: Record<string, string> = {
        nome: register.nome.trim(),
        email: register.email.trim(),
        senha: register.senha,
        tipoUsuario: register.tipoUsuario,
        situacao: 'Ativo',
        rg: register.rg.trim(),
        cidade: register.cidade.trim(),
        estado: register.estado.trim(),
        bairro: register.bairro.trim(),
        numero: register.numero.trim(),
        cep: register.cep.trim(),
      };

      if (register.tipoUsuario === 'Tutor') {
        payload.cpf = register.cpf.trim();
      } else {
        payload.crmv = register.crmv.trim();
        payload.especialidade = register.especialidade.trim();
      }

      await postJson<{ user: { id: number; email: string; nome: string } }>('/auth/register', payload);
      setLoginEmail(register.email.trim());
      setLoginPassword('');
      setRegister(initialRegisterForm);
      setScreen('login');
      setFeedback({ kind: 'success', text: 'Conta criada com sucesso! Entre com seu e-mail e sua senha.' });
    } catch (error) {
      setFeedback({ kind: 'error', text: error instanceof Error ? error.message : 'Erro ao criar a conta.' });
    } finally {
      setBusy(false);
    }
  }

  async function handleRequestCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setFeedback(null);
    try {
      await postJson<null>('/auth/esqueci-senha', { email: forgotEmail.trim() });
      setForgotStage('reset');
      setFeedback({ kind: 'success', text: 'Código enviado. Confira a caixa de entrada do e-mail informado.' });
    } catch (error) {
      setFeedback({ kind: 'error', text: error instanceof Error ? error.message : 'Erro ao solicitar recuperação.' });
    } finally {
      setBusy(false);
    }
  }

  async function handleResetPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);
    if (newPassword !== confirmNewPassword) {
      setFeedback({ kind: 'error', text: 'As novas senhas não são iguais.' });
      return;
    }
    setBusy(true);
    try {
      await postJson<null>('/auth/redefinir-senha', {
        email: forgotEmail.trim(),
        codigo: recoveryCode.trim(),
        novaSenha: newPassword,
      });
      setScreen('login');
      setLoginEmail(forgotEmail.trim());
      setLoginPassword('');
      setForgotStage('email');
      setRecoveryCode('');
      setNewPassword('');
      setConfirmNewPassword('');
      setFeedback({ kind: 'success', text: 'Senha redefinida! Agora você já pode entrar com a nova senha.' });
    } catch (error) {
      setFeedback({ kind: 'error', text: error instanceof Error ? error.message : 'Erro ao redefinir a senha.' });
    } finally {
      setBusy(false);
    }
  }

  function logout() {
    localStorage.removeItem('veton_token');
    localStorage.removeItem('veton_user');
    setLoggedUser(null);
    setLoginPassword('');
    setFeedback({ kind: 'success', text: 'Você saiu da sua conta.' });
    setScreen('login');
  }

  return (
    <main className="page-shell">
      <section className={`auth-card ${screen === 'register' ? 'register-card' : ''}`}>
        <div className="form-column">
          {loggedUser ? (
            <div className="logged-panel">
              <div className="success-mark"><BadgeCheck size={34} /></div>
              <p className="eyebrow">VETON</p>
              <h1>Login realizado!</h1>
              <p className="intro-text">Você entrou como <strong>{loggedUser.name || loggedUser.email}</strong>.</p>
              <p className="helper-text">Seu token de acesso foi salvo neste navegador. Quando a tela inicial do sistema estiver pronta, ela poderá utilizar essa autenticação.</p>
              <button className="primary-button" type="button" onClick={logout}>Sair da conta</button>
            </div>
          ) : (
            <>
              {screen === 'login' && (
                <>
                  <p className="eyebrow">VETON</p>
                  <h1>Conecte sua conta</h1>
                  <p className="intro-text">Acesse sua área e continue cuidando de quem você ama.</p>
                  <form className="auth-form login-form" onSubmit={handleLogin}>
                    <Field icon={Mail} label="Seu e-mail" type="email" autoComplete="email" value={loginEmail} onChange={(event) => setLoginEmail(event.target.value)} required />
                    <Field icon={LockKeyhole} label="Sua senha" type="password" autoComplete="current-password" value={loginPassword} onChange={(event) => setLoginPassword(event.target.value)} required />
                    {feedback && <p className={`feedback ${feedback.kind}`} role="status">{feedback.text}</p>}
                    <button className="primary-button" type="submit" disabled={busy}>{busy ? 'Entrando...' : 'Entrar'}</button>
                  </form>
                  <div className="form-links">
                    <button className="text-link" type="button" onClick={() => changeScreen('forgot')}>Esqueci minha senha</button>
                    <span className="link-separator">·</span>
                    <button className="text-link" type="button" onClick={() => changeScreen('register')}>Criar conta</button>
                  </div>
                </>
              )}

              {screen === 'register' && (
                <>
                  <button className="back-link" type="button" onClick={() => changeScreen('login')}><ArrowLeft size={17} /> Voltar ao login</button>
                  <p className="eyebrow">VETON</p>
                  <h1>Crie sua conta</h1>
                  <p className="intro-text">Preencha todos os campos para cadastrar seu acesso.</p>
                  <form className="auth-form register-form" onSubmit={handleRegister}>
                    <section className="form-section" aria-labelledby="personal-title">
                      <h2 id="personal-title">Dados pessoais e de acesso</h2>
                      <div className="field-grid">
                        <Field wide icon={UserRound} label="Nome completo" type="text" autoComplete="name" value={register.nome} onChange={(event) => updateRegister('nome', event.target.value)} required />
                        <Field wide icon={Mail} label="Seu e-mail" type="email" autoComplete="email" value={register.email} onChange={(event) => updateRegister('email', event.target.value)} required />
                        <label className="field field-wide">
                          <span className="sr-only">Tipo de usuário</span>
                          <span className="input-shell">
                            <PawPrint size={19} strokeWidth={1.65} aria-hidden="true" />
                            <select aria-label="Tipo de usuário" value={register.tipoUsuario} onChange={(event) => updateRegister('tipoUsuario', event.target.value as Role)} required>
                              <option value="Tutor">Tutor</option>
                              <option value="Veterinario">Veterinário</option>
                            </select>
                          </span>
                        </label>
                        {register.tipoUsuario === 'Tutor' ? (
                          <Field wide icon={IdCard} label="CPF" type="text" autoComplete="off" inputMode="numeric" value={register.cpf} onChange={(event) => updateRegister('cpf', event.target.value)} required />
                        ) : (
                          <>
                            <Field icon={IdCard} label="CRMV" type="text" autoComplete="off" value={register.crmv} onChange={(event) => updateRegister('crmv', event.target.value)} required />
                            <Field icon={Stethoscope} label="Especialidade" type="text" value={register.especialidade} onChange={(event) => updateRegister('especialidade', event.target.value)} required />
                          </>
                        )}
                        <Field icon={IdCard} label="RG" type="text" autoComplete="off" value={register.rg} onChange={(event) => updateRegister('rg', event.target.value)} required />
                        <Field icon={LockKeyhole} label="Sua senha" type="password" autoComplete="new-password" value={register.senha} onChange={(event) => updateRegister('senha', event.target.value)} required />
                        <Field wide icon={LockKeyhole} label="Confirme sua senha" type="password" autoComplete="new-password" value={register.confirmarSenha} onChange={(event) => updateRegister('confirmarSenha', event.target.value)} required />
                      </div>
                    </section>

                    <section className="form-section" aria-labelledby="address-title">
                      <h2 id="address-title">Endereço</h2>
                      <div className="field-grid">
                        <Field icon={MapPin} label="Cidade" type="text" autoComplete="address-level2" value={register.cidade} onChange={(event) => updateRegister('cidade', event.target.value)} required />
                        <Field icon={MapPin} label="Estado (UF)" type="text" autoComplete="address-level1" maxLength={2} value={register.estado} onChange={(event) => updateRegister('estado', event.target.value.toUpperCase())} required />
                        <Field icon={MapPin} label="Bairro" type="text" autoComplete="address-level3" value={register.bairro} onChange={(event) => updateRegister('bairro', event.target.value)} required />
                        <Field icon={MapPin} label="Número" type="text" autoComplete="address-line2" value={register.numero} onChange={(event) => updateRegister('numero', event.target.value)} required />
                        <Field wide icon={MapPin} label="CEP" type="text" autoComplete="postal-code" inputMode="numeric" value={register.cep} onChange={(event) => updateRegister('cep', event.target.value)} required />
                      </div>
                    </section>

                    {feedback && <p className={`feedback ${feedback.kind}`} role="status">{feedback.text}</p>}
                    <button className="primary-button" type="submit" disabled={busy}>{busy ? 'Criando conta...' : 'Criar conta'}</button>
                  </form>
                  <p className="bottom-note">Já possui uma conta? <button className="text-link" type="button" onClick={() => changeScreen('login')}>Entrar</button></p>
                </>
              )}

              {screen === 'forgot' && (
                <>
                  <button className="back-link" type="button" onClick={() => changeScreen('login')}><ArrowLeft size={17} /> Voltar ao login</button>
                  <p className="eyebrow">VETON</p>
                  <h1>{forgotStage === 'email' ? 'Recupere sua conta' : 'Redefina sua senha'}</h1>
                  <p className="intro-text">
                    {forgotStage === 'email'
                      ? 'Informe seu e-mail para receber um código de recuperação.'
                      : 'Digite o código enviado ao seu e-mail e escolha uma nova senha.'}
                  </p>

                  {forgotStage === 'email' ? (
                    <form className="auth-form forgot-form" onSubmit={handleRequestCode}>
                      <Field wide icon={Mail} label="Seu e-mail" type="email" autoComplete="email" value={forgotEmail} onChange={(event) => setForgotEmail(event.target.value)} required />
                      {feedback && <p className={`feedback ${feedback.kind}`} role="status">{feedback.text}</p>}
                      <button className="primary-button" type="submit" disabled={busy}>{busy ? 'Enviando...' : 'Enviar código'}</button>
                    </form>
                  ) : (
                    <form className="auth-form forgot-form" onSubmit={handleResetPassword}>
                      <div className="email-chip"><Mail size={17} /> {forgotEmail}</div>
                      <Field wide icon={IdCard} label="Código de 6 dígitos" type="text" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} value={recoveryCode} onChange={(event) => setRecoveryCode(event.target.value.replace(/\D/g, ''))} required />
                      <Field wide icon={LockKeyhole} label="Nova senha" type="password" autoComplete="new-password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} required />
                      <Field wide icon={LockKeyhole} label="Confirme a nova senha" type="password" autoComplete="new-password" value={confirmNewPassword} onChange={(event) => setConfirmNewPassword(event.target.value)} required />
                      {feedback && <p className={`feedback ${feedback.kind}`} role="status">{feedback.text}</p>}
                      <button className="primary-button" type="submit" disabled={busy || recoveryCode.length !== 6}>{busy ? 'Salvando...' : 'Redefinir senha'}</button>
                      <button className="text-link resend-link" type="button" onClick={() => { setForgotStage('email'); setFeedback(null); }}>Solicitar outro código</button>
                    </form>
                  )}
                </>
              )}
            </>
          )}
        </div>
        <VisualPanel />
      </section>
      <p className="page-footer">VetOn · Cuidado e gestão em um só lugar</p>
    </main>
  );
}
