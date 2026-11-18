import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Plus, Search, Eye, Pencil, Trash2, X } from 'lucide-react';
import { api, errMsg, getMeta } from '../api';

export default function CrudPage() {
  const { key } = useParams();
  return <Crud key={key} k={key!} />;
}

type Modal = null | { mode: 'create' | 'edit' | 'view'; id?: number; row?: any };

function Crud({ k }: { k: string }) {
  const [meta, setMeta] = useState<any>(null);
  const [rows, setRows] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [size, setSize] = useState(10);
  const [page, setPage] = useState(1);
  const [qInput, setQInput] = useState('');
  const [q, setQ] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [options, setOptions] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<Modal>(null);
  const [form, setForm] = useState<Record<string, any>>({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [toast, setToast] = useState<{ ok: boolean; text: string } | null>(null);

  const notify = (ok: boolean, text: string) => { setToast({ ok, text }); setTimeout(() => setToast(null), 3500); };

  const loadOptions = useCallback((m: any) => {
    const refs = [...new Set(m.fields.filter((f: any) => f.type === 'select').map((f: any) => f.ref))] as string[];
    refs.forEach((ref) => api.get(`/${ref}/options`).then((r) => setOptions((o) => ({ ...o, [ref]: r.data }))));
  }, []);

  useEffect(() => { getMeta().then((m) => { setMeta(m.entities[k]); loadOptions(m.entities[k]); }).catch((e) => notify(false, errMsg(e))); }, [k]);

  const load = useCallback(() => {
    setLoading(true);
    api.get(`/${k}`, { params: { q, page, ...filters } })
      .then((r) => { setRows(r.data.rows); setTotal(r.data.total); setSize(r.data.size); })
      .catch((e) => notify(false, errMsg(e)))
      .finally(() => setLoading(false));
  }, [k, q, page, filters]);
  useEffect(load, [load]);

  if (!meta) return <p className="muted">Cargando…</p>;
  const selects = meta.fields.filter((f: any) => f.type === 'select');
  const pages = Math.max(1, Math.ceil(total / size));

  const openCreate = () => {
    loadOptions(meta); setForm({}); setFormError(''); setModal({ mode: 'create' });
  };
  const openEdit = async (id: number) => {
    try {
      loadOptions(meta);
      const r = await api.get(`/${k}/${id}`);
      const v: any = {};
      meta.fields.forEach((f: any) => { const raw = r.data[f.column || f.name]; v[f.name] = raw == null ? '' : f.type === 'date' ? String(raw).slice(0, 10) : raw; });
      setForm(v); setFormError(''); setModal({ mode: 'edit', id });
    } catch (e) { notify(false, errMsg(e)); }
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setFormError('');
    try {
      if (modal!.mode === 'create') await api.post(`/${k}`, form);
      else await api.put(`/${k}/${modal!.id}`, form);
      notify(true, modal!.mode === 'create' ? 'Registro creado' : 'Cambios guardados');
      setModal(null); load();
      getMeta().then((m) => loadOptions(m.entities[k]));
    } catch (err) { setFormError(errMsg(err)); }
    finally { setSaving(false); }
  };

  const remove = async () => {
    try {
      await api.delete(`/${k}/${confirmId}`);
      notify(true, 'Registro eliminado');
      setConfirmId(null);
      if (rows.length === 1 && page > 1) setPage(page - 1); else load();
    } catch (err) { setConfirmId(null); notify(false, errMsg(err)); }
  };

  return (
    <>
      <div className="head">
        <div>
          <h1>{meta.title}</h1>
          <p className="muted">{total} {total === 1 ? 'registro' : 'registros'}</p>
        </div>
        <button className="btn primary" onClick={openCreate}><Plus size={16} /> Crear</button>
      </div>

      <div className="toolbar">
        <form className="search" onSubmit={(e) => { e.preventDefault(); setPage(1); setQ(qInput); }}>
          <Search size={16} />
          <input placeholder="Buscar…" value={qInput} onChange={(e) => setQInput(e.target.value)} />
        </form>
        {selects.map((f: any) => (
          <select key={f.name} value={filters[f.name] || ''} onChange={(e) => { setPage(1); setFilters({ ...filters, [f.name]: e.target.value }); }}>
            <option value="">{f.label}: todos</option>
            {(options[f.ref] || []).map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
          </select>
        ))}
      </div>

      <div className="card table-wrap">
        {loading ? <p className="empty">Cargando…</p> : rows.length === 0 ? <p className="empty">No hay registros. Usa “Crear” para agregar el primero.</p> : (
          <table>
            <thead><tr>{meta.cols.slice(1).map((c: any) => <th key={c.key}>{c.label}</th>)}<th className="actions">Acciones</th></tr></thead>
            <tbody>{rows.map((r) => (
              <tr key={r.id}>
                {meta.cols.slice(1).map((c: any) => <td key={c.key}>{String(r[c.key] ?? '')}</td>)}
                <td className="actions">
                  <button className="icon-btn" title="Ver" onClick={() => setModal({ mode: 'view', row: r })}><Eye size={16} /></button>
                  <button className="icon-btn" title="Editar" onClick={() => openEdit(r.id)}><Pencil size={16} /></button>
                  <button className="icon-btn danger" title="Eliminar" onClick={() => setConfirmId(r.id)}><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}</tbody>
          </table>
        )}
      </div>

      <div className="pager">
        <button className="btn" disabled={page <= 1} onClick={() => setPage(page - 1)}>Anterior</button>
        <span className="muted">Página {page} de {pages}</span>
        <button className="btn" disabled={page >= pages} onClick={() => setPage(page + 1)}>Siguiente</button>
      </div>

      {modal && (
        <div className="overlay" onClick={() => setModal(null)}>
          <div className="modal card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h2>{modal.mode === 'create' ? `Crear · ${meta.title}` : modal.mode === 'edit' ? `Editar · ${meta.title}` : 'Detalle'}</h2>
              <button className="icon-btn" onClick={() => setModal(null)}><X size={18} /></button>
            </div>
            {modal.mode === 'view' ? (
              <dl className="detail">
                {meta.cols.map((c: any) => <div key={c.key}><dt>{c.label}</dt><dd>{String(modal.row[c.key] ?? '—')}</dd></div>)}
              </dl>
            ) : (
              <form onSubmit={save}>
                {formError && <div className="alert">{formError}</div>}
                <div className="fields">
                  {meta.fields.map((f: any) => {
                    const required = f.required && !(f.hash && modal.mode === 'edit');
                    const set = (v: any) => setForm({ ...form, [f.name]: v });
                    return (
                      <label key={f.name}>{f.label}{required && ' *'}
                        {f.type === 'select' ? (
                          <select required={required} value={form[f.name] ?? ''} onChange={(e) => set(e.target.value)}>
                            <option value="">Selecciona…</option>
                            {(options[f.ref] || []).map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
                          </select>
                        ) : (
                          <input type={f.type} required={required} value={form[f.name] ?? ''} onChange={(e) => set(e.target.value)}
                            maxLength={f.max} min={f.min} max={f.maxVal} step={f.type === 'number' ? (f.decimal ? 0.1 : 1) : undefined}
                            autoComplete={f.type === 'password' ? 'new-password' : undefined} />
                        )}
                        {f.hint && <small className="muted">{f.hint}</small>}
                      </label>
                    );
                  })}
                </div>
                <div className="modal-foot">
                  <button type="button" className="btn" onClick={() => setModal(null)}>Cancelar</button>
                  <button className="btn primary" disabled={saving}>{saving ? 'Guardando…' : 'Guardar cambios'}</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {confirmId !== null && (
        <div className="overlay" onClick={() => setConfirmId(null)}>
          <div className="modal card small" onClick={(e) => e.stopPropagation()}>
            <h2>¿Eliminar este registro?</h2>
            <p className="muted">Esta acción no se puede deshacer.</p>
            <div className="modal-foot">
              <button className="btn" onClick={() => setConfirmId(null)}>Cancelar</button>
              <button className="btn danger-solid" onClick={remove}>Eliminar</button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className={'toast ' + (toast.ok ? 'ok' : 'bad')}>{toast.text}</div>}
    </>
  );
}
