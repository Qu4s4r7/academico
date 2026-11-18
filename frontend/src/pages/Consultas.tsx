import { useEffect, useState } from 'react';
import { api, errMsg, getMeta } from '../api';

export default function Consultas() {
  const [meta, setMeta] = useState<any>(null);
  const [name, setName] = useState('estudiantes');
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [options, setOptions] = useState<Record<string, any[]>>({});
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { getMeta().then(setMeta).catch((e) => setError(errMsg(e))); }, []);

  // Cargar opciones de los filtros que necesita la consulta elegida
  useEffect(() => {
    if (!meta) return;
    meta.queries[name].filters.forEach((f: string) => {
      const ref = meta.filterDefs[f].ref;
      if (ref && !options[ref]) api.get(`/${ref}/options`).then((r) => setOptions((o) => ({ ...o, [ref]: r.data })));
    });
  }, [meta, name]);

  useEffect(() => {
    if (!meta) return;
    setLoading(true); setError('');
    api.get(`/consultas/${name}`, { params: filters }).then((r) => setRows(r.data)).catch((e) => setError(errMsg(e))).finally(() => setLoading(false));
  }, [meta, name, filters]);

  if (!meta) return error ? <div className="alert">{error}</div> : <p className="muted">Cargando…</p>;
  const q = meta.queries[name];
  const cols = rows[0] ? Object.keys(rows[0]) : [];

  return (
    <>
      <h1>Consultas e informes</h1>
      <p className="muted">Información combinada de varias tablas con JOIN.</p>
      <div className="tabs">
        {Object.entries(meta.queries).map(([k, v]: any) => (
          <button key={k} className={'tab' + (k === name ? ' active' : '')} onClick={() => { setName(k); setFilters({}); }}>{v.title}</button>
        ))}
      </div>
      {q.filters.length > 0 && (
        <div className="toolbar">
          {q.filters.map((f: string) => {
            const def = meta.filterDefs[f];
            return def.ref ? (
              <select key={f} value={filters[f] || ''} onChange={(e) => setFilters({ ...filters, [f]: e.target.value })}>
                <option value="">{def.label}: todos</option>
                {(options[def.ref] || []).map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
              </select>
            ) : (
              <input key={f} placeholder={def.label} value={filters[f] || ''} onChange={(e) => setFilters({ ...filters, [f]: e.target.value })} />
            );
          })}
        </div>
      )}
      {error && <div className="alert">{error}</div>}
      <div className="card table-wrap">
        {loading ? <p className="empty">Cargando…</p> : rows.length === 0 ? <p className="empty">No hay resultados para esta consulta.</p> : (
          <table>
            <thead><tr>{cols.map((c) => <th key={c}>{c}</th>)}</tr></thead>
            <tbody>{rows.map((r, i) => <tr key={i}>{cols.map((c) => <td key={c}>{String(r[c] ?? '')}</td>)}</tr>)}</tbody>
          </table>
        )}
      </div>
    </>
  );
}
