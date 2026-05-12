import { checkDbAuth } from "@/actions/db-explorer";
import { LoginForm } from "./LoginForm";
import { Dashboard } from "./Dashboard";

export default async function DbExplorerPage() {
  const isAuth = await checkDbAuth();

  if (!isAuth) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <LoginForm />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      <Dashboard />
    </div>
  );
}
