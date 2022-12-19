import React from "react";
import {useContext} from "react";
import AuthenticationContext from "../contexts/AuthenticationContext";
import {useRouter} from "next/router";
import {useEffect} from "react";
import {useForm} from "react-hook-form";

const LoginPage = () => {
  const router = useRouter();
  const {isAuthenticated, setIsAuthenticated} = useContext(
    AuthenticationContext,
  );
  const {register, handleSubmit} = useForm();

  useEffect(() => {
    if (isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, router]);

  const onSubmit = (values: any) => {
    console.log(values);
  };

  return (
    <div className="flex flex-col items-center justify-center m-auto">
      <h1>Login</h1>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="flex flex-col">
          <label>Username</label>
          <input {...register("username")}></input>
          <label>Password</label>
          <input {...register("password")}></input>
          <button className="bg-primary">Submit</button>
        </div>
      </form>
    </div>
  );
};
export default LoginPage;
