"use client";

import { useState, useEffect, useTransition } from "react";
import { getTableData, deleteRecord, updateRecord, logoutFromDbExplorer } from "@/actions/db-explorer";
import { Database, LogOut, Loader2, Trash2, RefreshCw, Edit2, X, Save } from "lucide-react";
import { useRouter } from "next/navigation";

const TABLES = [
  { id: "property", label: "Logements (Property)" },
  { id: "user", label: "Utilisateurs (User)" },
  { id: "candidate", label: "Candidats (Candidate)" },
  { id: "visitSlot", label: "Créneaux (VisitSlot)" },
  { id: "document", label: "Documents (Document)" },
];

export function Dashboard() {
  const [activeTable, setActiveTable] = useState(TABLES[0].id);
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Edit State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editJson, setEditJson] = useState<string>("");
  
  const router = useRouter();

  const loadData = async (table: string) => {
    setLoading(true);
    setError("");
    setData([]);
    setEditingId(null);
    try {
      const res = await getTableData(table);
      if (res.error) setError(res.error);
      else setData(res.data || []);
    } catch (err) {
      setError("Erreur système");
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData(activeTable);
  }, [activeTable]);

  const handleDelete = async (id: string) => {
    if (!confirm("Voulez-vous vraiment supprimer cet enregistrement ? C'est irréversible !")) return;
    
    setLoading(true);
    const res = await deleteRecord(activeTable, id);
    if (res.error) {
      alert(res.error);
      setLoading(false);
    } else {
      await loadData(activeTable);
    }
  };

  const handleEdit = (row: any) => {
    setEditingId(row.id);
    const { id, createdAt, updatedAt, ...rest } = row;
    setEditJson(JSON.stringify(rest, null, 2));
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;
    try {
      const parsedData = JSON.parse(editJson);
      setLoading(true);
      const res = await updateRecord(activeTable, editingId, parsedData);
      if (res.error) {
        alert(res.error);
        setLoading(false);
      } else {
        await loadData(activeTable);
      }
    } catch (e) {
      alert("Le format JSON est invalide ! Vérifiez les virgules et les guillemets.");
    }
  };

  const handleLogout = async () => {
    await logoutFromDbExplorer();
    router.refresh();
  };

  // Extract columns dynamically from the first item
  const columns = data.length > 0 ? Object.keys(data[0]).filter(k => k !== "password") : [];

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 relative">
      {/* Sidebar */}
      <div className="w-64 bg-slate-900 text-slate-300 flex flex-col z-10">
        <div className="p-6 border-b border-slate-800 flex items-center gap-3">
          <Database className="text-primary w-6 h-6" />
          <h1 className="text-xl font-bold text-white">DB Console</h1>
        </div>
        <div className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-3">
            {TABLES.map((t) => (
              <li key={t.id}>
                <button
                  onClick={() => setActiveTable(t.id)}
                  className={`w-full text-left px-4 py-2.5 rounded-lg transition-colors font-medium text-sm ${
                    activeTable === t.id 
                      ? "bg-primary text-white" 
                      : "hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  {t.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div className="p-4 border-t border-slate-800">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
          >
            <LogOut className="w-4 h-4" /> Déconnexion
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8">
          <h2 className="text-xl font-bold text-slate-800 capitalize">
            Table : {activeTable}
          </h2>
          <button 
            onClick={() => loadData(activeTable)}
            className="flex items-center gap-2 text-sm text-slate-600 hover:text-primary transition-colors bg-slate-100 px-3 py-1.5 rounded-md"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Rafraîchir
          </button>
        </header>

        {/* Table Area */}
        <div className="flex-1 overflow-auto p-8 relative">
          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6 border border-red-100 font-medium">
              {error}
            </div>
          )}

          {loading && data.length === 0 ? (
            <div className="flex items-center justify-center h-64 text-slate-400 gap-3">
              <Loader2 className="w-6 h-6 animate-spin" /> Chargement des données...
            </div>
          ) : data.length === 0 ? (
            <div className="flex items-center justify-center h-64 text-slate-500 bg-white rounded-xl border border-dashed border-slate-300">
              Aucune donnée dans cette table.
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                    <tr>
                      <th className="px-6 py-3 whitespace-nowrap w-24">Actions</th>
                      {columns.map(col => (
                        <th key={col} className="px-6 py-3 whitespace-nowrap">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.map((row, i) => (
                      <tr key={row.id || i} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-3 flex gap-2">
                          <button 
                            onClick={() => handleEdit(row)}
                            className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 p-1.5 rounded transition-colors"
                            title="Modifier"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDelete(row.id)}
                            className="text-red-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded transition-colors"
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                        {columns.map(col => {
                          const val = row[col];
                          const displayVal = 
                            val === null ? <span className="text-slate-300 italic">null</span> :
                            typeof val === 'boolean' ? (val ? 'Oui' : 'Non') :
                            val instanceof Date ? val.toLocaleString() :
                            typeof val === 'object' ? JSON.stringify(val) :
                            String(val);
                            
                          return (
                            <td key={col} className="px-6 py-3 whitespace-nowrap text-slate-700 max-w-[200px] truncate" title={String(displayVal)}>
                              {displayVal}
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Editor Modal */}
      {editingId && (
        <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h3 className="font-bold text-lg text-slate-800">Éditer l'enregistrement</h3>
              <button onClick={() => setEditingId(null)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 flex-1">
              <p className="text-sm text-slate-500 mb-4">Modifiez les valeurs au format JSON. Attention à respecter la syntaxe JSON stricte (guillemets pour les clés).</p>
              <textarea
                value={editJson}
                onChange={(e) => setEditJson(e.target.value)}
                className="w-full h-[400px] font-mono text-sm p-4 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                spellCheck={false}
              />
            </div>
            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <button
                onClick={() => setEditingId(null)}
                className="px-4 py-2 rounded-lg font-medium text-slate-600 hover:bg-slate-200 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={loading}
                className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-70"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Sauvegarder
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
