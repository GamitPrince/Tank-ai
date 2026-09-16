import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Logo } from '../components/Logo';
import { PasswordField, TextField } from '../components/FormField';
import { PillButton } from '../components/PillButton';
import { ThemeToggle } from '../components/ThemeToggle';
import { useApp } from '../store';

export function Login() {
  const { login } = useApp();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    login(name);
    navigate('/industries');
  };

  return (
    <div className="relative flex min-h-full w-full max-w-[430px] flex-col sm:min-h-0 sm:max-w-[460px] sm:rounded-2xl sm:bg-surface sm:px-10 sm:py-12 sm:shadow-soft-lg md:px-12 md:py-14">
      <div className="absolute right-0 top-0 sm:right-6 sm:top-6">
        <ThemeToggle compact />
      </div>
      <div className="flex flex-1 flex-col justify-center pt-6 sm:flex-none sm:pt-0">
        <div className="mb-16 flex justify-center sm:mb-12">
          <Logo variant="split" size="lg" />
        </div>
        <form className="flex flex-col gap-6" onSubmit={onSubmit}>
          <TextField
            label="Name"
            placeholder="User Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="username"
          />
          <PasswordField
            label="Password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
          <div className="flex justify-center pt-16 sm:pt-10">
            <PillButton type="submit">SUBMIT</PillButton>
          </div>
        </form>
      </div>
    </div>
  );
}
