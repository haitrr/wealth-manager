'use client';
import Image from 'next/image'
import styles from './page.module.css'
import { useEffect, useState } from 'react';
import { useQuery } from 'react-query';
import { getAuthUser } from '@/api';
import { useAuthContext } from '@/states/auth';
import Link from 'next/link';

export default function Home() {
  const [isLoading, setIsLoading] = useState(true);
  const [auth, setAuth] = useAuthContext();
  useQuery('auth', async () => {
    try {
    const data = await getAuthUser();
    if(data) {
      setAuth({isAuthenticated: true, user: data});
    }}
    finally{
      setIsLoading(false);
    }
  })
  if(isLoading) {
    return <div>
      Loading...
    </div>
  }
  if(auth.isAuthenticated) {
    return (
      <main className={styles.main}>
        <h1>Welcome logged in user {auth.user.id} {auth.user.name}</h1>
        <Link href="/logout">Logout</Link>
      </main>
    )
  }
  return (
    <main className={styles.main}>
      Welcome to wealth manager
      <Link href="/login">Login</Link>
    </main>
  )
}
