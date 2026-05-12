import { getAccountInfo } from "@/actions/auth";
import { redirect } from "next/navigation";
import { AccountForm } from "./AccountForm";

export default async function AccountPage() {
  const res = await getAccountInfo();
  
  if (res.error || !res.data) {
    redirect("/auth");
  }

  const user = res.data;

  return (
    <div className="max-w-3xl mx-auto p-6 pt-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800">Mon Compte</h1>
        <p className="text-slate-500 mt-2">
          Gérez vos informations personnelles et vos paramètres de sécurité.
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
        <AccountForm initialData={user} />
      </div>
    </div>
  );
}
