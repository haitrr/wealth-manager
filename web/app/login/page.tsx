'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from 'react-query';
import { login } from '../../api';
import { setJwtCookie } from '@/token';
import { useAuthContext } from '@/states/auth';

export default function LoginPage() {
  const router = useRouter();
  const [auth] = useAuthContext();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const { mutate } = useMutation('login', async () => {
    const response = await login(formData.username, formData.password);
    // setJwtCookie(response.token);
    router.push('/');
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    mutate();
  };

  useEffect(() => {
    
  if(auth.isAuthenticated) {
    router.push('/');
  }
  }, [auth.isAuthenticated, router])

  return (
    <div>
      <h1>Login</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Email:</label>
          <input
            type="username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label>Password:</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
          />
        </div>
        <button type="submit">Login</button>
      </form>
    </div>
  );
}