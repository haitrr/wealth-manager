import { getAuthUser } from "@/api";
import {createContext, useContext, useState} from "react";
import { useQuery } from "react-query";

const Context = createContext({});

export function AuthProvider({children}) {
  const [auth, setAuth] = useState({isAuthenticated: false,isLoading: true});
  useQuery('auth', async () => {
    try {
    const data = await getAuthUser();
    if(data) {
      setAuth({isAuthenticated: true, user: data, isLoading: false});
    }}
    catch(e) {
      setAuth({isAuthenticated: false, user: null, isLoading: false})
        }
  }, {refetchOnMount: "always"})
  if(auth.isLoading) {
    return <div>Loading</div>
  }
  return (
    <Context.Provider value={[auth, setAuth]}>{children}</Context.Provider>
  );
}

export function useAuthContext() {
  return useContext(Context);
}
