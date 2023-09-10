import {createContext, useContext, useState} from "react";

const Context = createContext({});

export function AuthProvider({children}) {
  const [auth, setAuth] = useState({isAuthenticated: false});
  return (
    <Context.Provider value={[auth, setAuth]}>{children}</Context.Provider>
  );
}

export function useAuthContext() {
  return useContext(Context);
}
