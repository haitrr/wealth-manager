import Head from "next/head";
import {useContext, useEffect} from "react";
import AuthenticationContext from "../contexts/AuthenticationContext";
import {useRouter} from "next/router";


export default function Home() {
  const {isAuthenticated} = useContext(AuthenticationContext);
  const router = useRouter();
  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
    }
  }, [router, isAuthenticated]);

  return (
    <>
      <Head>
        <title>Wealth Manager</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
    </>
  );
}
