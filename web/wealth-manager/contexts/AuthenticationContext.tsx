import { createContext } from "react";

const AuthenticationContext = createContext({isAuthenticated: false, setIsAuthenticated: (_: boolean) => {}})

export default AuthenticationContext;