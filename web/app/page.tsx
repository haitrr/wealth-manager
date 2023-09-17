'use client';
import Image from 'next/image'
import styles from './page.module.css'
import { useEffect, useState } from 'react';
import { useQuery } from 'react-query';
import { getAuthUser } from '@/api';
import { useAuthContext } from '@/states/auth';
import Link from 'next/link';
import Transactions from './transactions';

export default function Home() {
  const [auth] = useAuthContext();
  if(auth.isLoading) {
    return <div>
      Loading...
    </div>
  }
  if(auth.isAuthenticated) {
    return (
      <main className={styles.main}>
        <h1>Welcome logged in user {auth.user.id} {auth.user.name}</h1>
        <Link href="/logout">Logout</Link>
      <Transactions/>
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
