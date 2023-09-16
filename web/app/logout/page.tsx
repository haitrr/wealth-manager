'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from 'react-query';
import { logout } from '../../api';

export default function LogoutPage() {
  const router = useRouter();

  const { mutate } = useMutation('login', async () => {
    try {
    await logout();
    }
    finally{
    router.push('/');
    }
  });

  useEffect(() => {
    mutate();
  }, [])

  return (
    <div>
      <h1>Logging you out .....</h1>
    </div>
  );
}