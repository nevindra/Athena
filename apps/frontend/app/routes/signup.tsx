import type { MetaFunction } from "react-router";
import { SignupForm } from "~/features/auth/signup-form";

export const meta: MetaFunction = () => {
  return [
    { title: "Sign Up - Athena" },
    { name: "description", content: "Create a new Athena account" },
  ];
};

export default function Signup() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground">Athena</h1>
          <p className="text-muted-foreground mt-2">AI Chat Application</p>
        </div>
        <SignupForm />
      </div>
    </div>
  );
}