import type { MetaFunction } from "react-router";
import { LoginForm } from "~/features/auth/login-form";

export const meta: MetaFunction = () => {
  return [
    { title: "Sign In - Athena" },
    { name: "description", content: "Sign in to your Athena account" },
  ];
};

export default function Login() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground">Athena</h1>
          <p className="text-muted-foreground mt-2">AI Chat Application</p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}