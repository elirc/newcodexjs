import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import styles from './Pages.module.css';

/** Renders the login form and starts an authenticated session. */
export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('maya@example.com');
  const [password, setPassword] = useState('password123');

  async function submit(event: FormEvent) {
    event.preventDefault();
    await login(email, password);
    navigate('/mine');
  }

  return (
    <form className={styles.form} onSubmit={submit}>
      <h1>Login</h1>
      <input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email" />
      <input value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Password" type="password" />
      <Button>Login</Button>
    </form>
  );
}

/** Renders the registration form and signs in the new user. */
export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', email: '', password: '', displayName: '' });

  async function submit(event: FormEvent) {
    event.preventDefault();
    await register(form);
    navigate('/mine');
  }

  return (
    <form className={styles.form} onSubmit={submit}>
      <h1>Create account</h1>
      {Object.entries(form).map(([key, value]) => (
        <input
          key={key}
          value={value}
          type={key === 'password' ? 'password' : 'text'}
          placeholder={key}
          onChange={(event) => setForm((current) => ({ ...current, [key]: event.target.value }))}
        />
      ))}
      <Button>Register</Button>
    </form>
  );
}
