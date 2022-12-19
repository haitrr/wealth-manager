import '../styles/globals.css'
import type { AppProps } from 'next/app'
import { useState } from 'react';
import AuthenticationContext from '../contexts/AuthenticationContext';
import Layout from '../components/layout';

export default function App({ Component, pageProps }: AppProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  return <AuthenticationContext.Provider value={{isAuthenticated, setIsAuthenticated}}>
    <Layout>
    <Component {...pageProps} />
    </Layout>
</AuthenticationContext.Provider> 
}
