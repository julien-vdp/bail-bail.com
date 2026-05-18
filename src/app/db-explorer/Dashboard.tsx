"use client";

import { useState, useEffect, useTransition } from "react";
import { getTableData, deleteRecord, updateRecord, logoutFromDbExplorer, getDatabaseMetrics } from "@/actions/db-explorer";
import { Database, LogOut, Loader2, Trash2, RefreshCw, Edit2, X, Save, Activity, Users, Home, FileText, Calendar } from "lucide-react";
import { useRouter } from "next/navigation";

const TABLES = [
  { id: "overview", label: "Vue d'ensemble", icon: Activity },
  { id: "property", label: "Logements", icon: Home },
  { id: "user", label: "Utilisateurs", icon: Users },
  { id: "candidate", label: "Candidats", icon: Users },
  { id: "application", label: "Dossiers", icon: FileText },
  { id: "visitSlot", label: "Créneaux", icon: Calendar },
  { id: "document", label: "Documents", icon: FileText },
  { id: "auditLog", label: "Audit Logs", icon: Activity },
];
export function Dashboard() {
  const [activeTable, setActiveTable] = useState(TABLES[0].id);
  const [currentFilter, setCurrentFilter] = useState<{field: string, value: string} | undefined>(undefined);
  const [data, setData] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Edit State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editJson, setEditJson] = useState<string>("");
  
  const router = useRouter();

  const loadData = async (table: string, filter?: {field: string, value: string}) => {
    setLoading(true);
    setError("");
    setData([]);
    setMetrics(null);
    setEditingId(null);
    try {
      if (table === "overview") {
        const res = await getDatabaseMetrics();
        if (res.error) setError(res.error);
        else setMetrics(res.data);
      } else {
        const res = await getTableData(table, filter);
        if (res.error) setError(res.error);
        else setData(res.data || []);
      }
    } catch (err) {
      setError("Erreur système");
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData(activeTable, currentFilter);
  }, [activeTable, currentFilter]);

  const handleSidebarClick = (tableId: string) => {
    setActiveTable(tableId);
    setCurrentFilter(undefined);
  };

  const handleRelationClick = (colKey: string, val: any) => {
    if (!val || !val.id) return;
    let targetTable = colKey;
    if (colKey === "owner") targetTable = "user";
    
    setActiveTable(targetTable);
    setCurrentFilter({ field: 'id', value: val.id });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Voulez-vous vraiment supprimer cet enregistrement ? C'est irréversible !")) return;
    
    setLoading(true);
    const res = await deleteRecord(activeTable, id);
    if (res.error) {
      alert(res.error);
      setLoading(false);
    } else {
      await loadData(activeTable, currentFilter);
    }
  };

  const handleEdit = (row: any) => {
    setEditingId(row.id);
    const cleanRow = { ...row };
    delete cleanRow.id;
    delete cleanRow.createdAt;
    delete cleanRow.updatedAt;
    
    Object.keys(cleanRow).forEach(key => {
      if (typeof cleanRow[key] === 'object' && cleanRow[key] !== null && !(cleanRow[key] instanceof Date)) {
        delete cleanRow[key];
      }
    });

    setEditJson(JSON.stringify(cleanRow, null, 2));
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
        setEditingId(null);
        await loadData(activeTable, currentFilter);
      }
    } catch (e) {
      alert("Le format JSON est invalide ! Vérifiez les virgules et les guillemets.");
    }
  };

  const handleLogout = async () => {
    await logoutFromDbExplorer();
    router.refresh();
  };

  let columns: string[] = [];
  if (data.length > 0) {
    const rawKeys = Object.keys(data[0]).filter(k => k !== "password");
    columns = rawKeys.filter(key => {
      if (key.endsWith('Id')) {
        const relationName = key.replace('Id', '');
        if (rawKeys.includes(relationName)) return false;
      }
      return true;
    });
  }

  const renderCell = (colKey: string, val: any) => {
    if (val === null) return <span className="text-slate-300 italic">null</span>;
    if (typeof val === 'boolean') return val ? 'Oui' : 'Non';
    if (val instanceof Date || (typeof val === 'string' && val.includes('T') && val.endsWith('Z') && val.length === 24)) {
      return new Date(val).toLocaleString('fr-FR');
    }
    if (typeof val === 'object') {
      let label = "";
      if (val.title) label = `🏠 ${val.title}`;
      else if (val.firstName && val.lastName) label = `👤 ${val.firstName} ${val.lastName}`;
      else if (val.name) label = `👑 ${val.name}`;
      else if (val.candidate && val.property) label = `📁 Dossier de ${val.candidate.firstName} pour ${val.property.title}`;
      else label = JSON.stringify(val);
      
      return (
        <button 
          onClick={() => handleRelationClick(colKey, val)}
          className="inline-flex items-center px-2 py-1 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 hover:border-primary/40 rounded-md text-xs font-medium whitespace-nowrap transition-colors cursor-pointer"
        >
          {label}
        </button>
      );
    }
    return String(val);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 relative">
      <div className="w-64 bg-slate-900 text-slate-300 flex flex-col z-10 shadow-xl shrink-0">
        <div className="p-6 border-b border-slate-800 flex items-center gap-3">
          <Database className="text-primary w-6 h-6" />
          <h1 className="text-xl font-bold text-white tracking-tight">DB Console</h1>
        </div>
        <div className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-3">
            {TABLES.map((t) => (
              <li key={t.id}>
                <button
                  onClick={() => handleSidebarClick(t.id)}
                  className={`w-full flex items-center gap-3 text-left px-4 py-2.5 rounded-lg transition-all font-medium text-sm ${
                    activeTable === t.id && !currentFilter
                      ? "bg-primary text-white shadow-md" 
                      : activeTable === t.id && currentFilter
                      ? "bg-slate-700 text-white border border-primary/50"
                      : "hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  <t.icon className={`w-4 h-4 ${(activeTable === t.id && !currentFilter) ? 'text-white' : 'text-slate-400'}`} />
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

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              {TABLES.find(t => t.id === activeTable)?.label}
              {currentFilter && (
                <span className="text-sm font-normal text-slate-500 bg-slate-100 px-2 py-1 rounded-md flex items-center gap-1">
                  Filtré
                  <button onClick={() => setCurrentFilter(undefined)} className="hover:text-red-500 ml-1">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
            </h2>
          </div>
          <button 
            onClick={() => loadData(activeTable, currentFilter)}
            className="flex items-center gap-2 text-sm text-slate-600 hover:text-primary transition-colors bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-md font-medium"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Rafraîchir
          </button>
        </header>

        <div className="flex-1 overflow-auto p-8 relative">
          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6 border border-red-100 font-medium shadow-sm">
              {error}
            </div>
          )}

          {loading && !metrics && data.length === 0 ? (
            <div className="flex items-center justify-center h-64 text-slate-400 gap-3">
              <Loader2 className="w-6 h-6 animate-spin" /> Chargement...
            </div>
          ) : activeTable === "overview" && metrics ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-lg"><Home className="w-6 h-6" /></div>
                    <div>
                      <p className="text-sm font-medium text-slate-500">Logements</p>
                      <h3 className="text-2xl font-bold text-slate-800">{metrics.properties.total}</h3>
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 mt-4 border-t pt-2">Dont {metrics.properties.active} en ligne (actifs)</p>
                </div>
                
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-green-50 text-green-600 rounded-lg"><Users className="w-6 h-6" /></div>
                    <div>
                      <p className="text-sm font-medium text-slate-500">Candidats</p>
                      <h3 className="text-2xl font-bold text-slate-800">{metrics.candidates}</h3>
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 mt-4 border-t pt-2">Utilisateurs inscrits</p>
                </div>

                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-purple-50 text-purple-600 rounded-lg"><FileText className="w-6 h-6" /></div>
                    <div>
                      <p className="text-sm font-medium text-slate-500">Dossiers</p>
                      <h3 className="text-2xl font-bold text-slate-800">{metrics.applications.total}</h3>
                    </div>
                  </div>
                  <div className="flex gap-2 text-xs text-slate-500 mt-4 border-t pt-2">
                    {metrics.applications.byStatus.map((s: any) => (
                      <span key={s.status} className="bg-slate-100 px-2 py-0.5 rounded">{s.status}: {s._count.status}</span>
                    ))}
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-orange-50 text-orange-600 rounded-lg"><Calendar className="w-6 h-6" /></div>
                    <div>
                      <p className="text-sm font-medium text-slate-500">Visites</p>
                      <h3 className="text-2xl font-bold text-slate-800">{metrics.visits}</h3>
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 mt-4 border-t pt-2">Créneaux générés</p>
                </div>
              </div>
            </div>
          ) : data.length === 0 && activeTable !== "overview" ? (
            <div className="flex items-center justify-center h-64 text-slate-500 bg-white rounded-xl border border-dashed border-slate-300">
              Aucune donnée dans cette table.
            </div>
          ) : activeTable !== "overview" ? (
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
                            className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 p-1.5 rounded transition-colors border border-transparent hover:border-blue-200"
                            title="Modifier"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDelete(row.id)}
                            className="text-red-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded transition-colors border border-transparent hover:border-red-200"
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                        {columns.map(col => (
                          <td key={col} className="px-6 py-3 whitespace-nowrap text-slate-700 max-w-[250px] truncate">
                            {renderCell(col, row[col])}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* Editor Modal */}
      {editingId && (
        <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h3 className="font-bold text-lg text-slate-800">Éditer l'enregistrement</h3>
              <button onClick={() => setEditingId(null)} className="text-slate-400 hover:text-slate-600 transition-colors bg-slate-100 p-1 rounded-md">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 flex-1 bg-slate-50">
              <div className="bg-blue-50 text-blue-700 p-3 rounded-lg text-sm mb-4 border border-blue-100 flex items-start gap-2">
                <Database className="w-4 h-4 mt-0.5 shrink-0" />
                <p>Modifiez les valeurs au format JSON. Attention à respecter la syntaxe JSON stricte. Les clés étrangères techniques (si masquées visuellement) réapparaissent ici.</p>
              </div>
              <textarea
                value={editJson}
                onChange={(e) => setEditJson(e.target.value)}
                className="w-full h-[350px] font-mono text-sm p-4 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-inner"
                spellCheck={false}
              />
            </div>
            <div className="p-6 border-t border-slate-100 bg-white flex justify-end gap-3">
              <button
                onClick={() => setEditingId(null)}
                className="px-4 py-2 rounded-lg font-medium text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={loading}
                className="px-6 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg font-medium transition-colors flex items-center gap-2 shadow-sm disabled:opacity-70"
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
