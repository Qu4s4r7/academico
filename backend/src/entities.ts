export type Field = {
  name: string; label: string;
  type: 'text' | 'email' | 'password' | 'number' | 'date' | 'select';
  required?: boolean; ref?: string; max?: number; min?: number; maxVal?: number;
  decimal?: boolean; column?: string; hash?: boolean; hint?: string;
};
export type Entity = {
  title: string; table: string; pk: string; from: string; label: string;
  search: string[]; cols: [string, string, string][]; fields: Field[];
};

const NOMBRE = "u.nombres || ' ' || u.apellidos";
const MAT_FROM = `matricula t
  JOIN estudiante e ON e.id_estudiante = t.id_estudiante
  JOIN usuario u ON u.id_usuario = e.id_usuario
  JOIN grupo g ON g.id_grupo = t.id_grupo
  JOIN asignatura a ON a.id_asignatura = g.id_asignatura`;

export const entities: Record<string, Entity> = {
  'tipos-documento': {
    title: 'Tipos de documento', table: 'tipo_documento', pk: 'id_tipo_documento',
    from: 'tipo_documento t', label: 't.nombre', search: ['t.nombre'],
    cols: [['t.id_tipo_documento', 'id', 'ID'], ['t.nombre', 'nombre', 'Nombre']],
    fields: [{ name: 'nombre', label: 'Nombre', type: 'text', required: true, max: 50 }],
  },
  usuarios: {
    title: 'Usuarios', table: 'usuario', pk: 'id_usuario',
    from: 'usuario t JOIN tipo_documento td ON td.id_tipo_documento = t.id_tipo_documento',
    label: "t.nombres || ' ' || t.apellidos || ' (' || t.numero_documento || ')'",
    search: ['t.nombres', 't.apellidos', 't.correo', 't.numero_documento'],
    cols: [['t.id_usuario', 'id', 'ID'], ['td.nombre', 'tipo', 'Tipo de documento'],
      ['t.numero_documento', 'documento', 'Documento'],
      ["t.nombres || ' ' || t.apellidos", 'nombre', 'Nombre'], ['t.correo', 'correo', 'Correo']],
    fields: [
      { name: 'id_tipo_documento', label: 'Tipo de documento', type: 'select', required: true, ref: 'tipos-documento' },
      { name: 'numero_documento', label: 'Número de documento', type: 'text', required: true, max: 20 },
      { name: 'nombres', label: 'Nombres', type: 'text', required: true, max: 80 },
      { name: 'apellidos', label: 'Apellidos', type: 'text', required: true, max: 80 },
      { name: 'correo', label: 'Correo electrónico', type: 'email', required: true, max: 120 },
      { name: 'password', label: 'Contraseña', type: 'password', required: true, max: 72, column: 'password_hash', hash: true,
        hint: 'Al editar, déjala vacía para conservar la actual' },
    ],
  },
  docentes: {
    title: 'Docentes', table: 'docente', pk: 'id_docente',
    from: 'docente t JOIN usuario u ON u.id_usuario = t.id_usuario', label: NOMBRE,
    search: ['u.nombres', 'u.apellidos', 't.especialidad'],
    cols: [['t.id_docente', 'id', 'ID'], [NOMBRE, 'nombre', 'Docente'], ['u.correo', 'correo', 'Correo'],
      ['t.especialidad', 'especialidad', 'Especialidad']],
    fields: [
      { name: 'id_usuario', label: 'Usuario', type: 'select', required: true, ref: 'usuarios' },
      { name: 'especialidad', label: 'Especialidad', type: 'text', max: 100 },
    ],
  },
  programas: {
    title: 'Programas', table: 'programa', pk: 'id_programa',
    from: 'programa t', label: "t.codigo || ' - ' || t.nombre", search: ['t.codigo', 't.nombre'],
    cols: [['t.id_programa', 'id', 'ID'], ['t.codigo', 'codigo', 'Código'], ['t.nombre', 'nombre', 'Nombre'],
      ['t.duracion_semestres', 'duracion', 'Semestres']],
    fields: [
      { name: 'codigo', label: 'Código', type: 'text', required: true, max: 20 },
      { name: 'nombre', label: 'Nombre', type: 'text', required: true, max: 100 },
      { name: 'duracion_semestres', label: 'Duración (semestres)', type: 'number', required: true, min: 1, maxVal: 20 },
    ],
  },
  asignaturas: {
    title: 'Asignaturas', table: 'asignatura', pk: 'id_asignatura',
    from: 'asignatura t JOIN programa p ON p.id_programa = t.id_programa',
    label: "t.codigo || ' - ' || t.nombre", search: ['t.codigo', 't.nombre', 'p.nombre'],
    cols: [['t.id_asignatura', 'id', 'ID'], ['t.codigo', 'codigo', 'Código'], ['t.nombre', 'nombre', 'Nombre'],
      ['p.nombre', 'programa', 'Programa'], ['t.creditos', 'creditos', 'Créditos'], ['t.semestre', 'semestre', 'Semestre']],
    fields: [
      { name: 'id_programa', label: 'Programa', type: 'select', required: true, ref: 'programas' },
      { name: 'codigo', label: 'Código', type: 'text', required: true, max: 20 },
      { name: 'nombre', label: 'Nombre', type: 'text', required: true, max: 100 },
      { name: 'creditos', label: 'Créditos', type: 'number', required: true, min: 1, maxVal: 20 },
      { name: 'semestre', label: 'Semestre', type: 'number', required: true, min: 1, maxVal: 20 },
    ],
  },
  estudiantes: {
    title: 'Estudiantes', table: 'estudiante', pk: 'id_estudiante',
    from: `estudiante t JOIN usuario u ON u.id_usuario = t.id_usuario
           JOIN programa p ON p.id_programa = t.id_programa`,
    label: NOMBRE, search: ['u.nombres', 'u.apellidos', 'u.numero_documento', 'p.nombre'],
    cols: [['t.id_estudiante', 'id', 'ID'], [NOMBRE, 'nombre', 'Estudiante'], ['u.correo', 'correo', 'Correo'],
      ['p.nombre', 'programa', 'Programa'], ['t.semestre_actual', 'semestre', 'Semestre'],
      ['t.fecha_ingreso', 'ingreso', 'Ingreso']],
    fields: [
      { name: 'id_usuario', label: 'Usuario', type: 'select', required: true, ref: 'usuarios' },
      { name: 'id_programa', label: 'Programa', type: 'select', required: true, ref: 'programas' },
      { name: 'semestre_actual', label: 'Semestre actual', type: 'number', required: true, min: 1, maxVal: 20 },
      { name: 'fecha_ingreso', label: 'Fecha de ingreso', type: 'date', hint: 'Vacía = hoy' },
    ],
  },
  grupos: {
    title: 'Grupos', table: 'grupo', pk: 'id_grupo',
    from: `grupo t JOIN asignatura a ON a.id_asignatura = t.id_asignatura
           JOIN docente d ON d.id_docente = t.id_docente JOIN usuario u ON u.id_usuario = d.id_usuario`,
    label: "a.codigo || ' G' || t.numero_grupo || ' (' || t.periodo || ')'",
    search: ['a.nombre', 'a.codigo', 'u.nombres', 'u.apellidos', 't.periodo'],
    cols: [['t.id_grupo', 'id', 'ID'], ['a.nombre', 'asignatura', 'Asignatura'], [NOMBRE, 'docente', 'Docente'],
      ['t.numero_grupo', 'grupo', 'Grupo'], ['t.periodo', 'periodo', 'Periodo'], ['t.cupo', 'cupo', 'Cupo']],
    fields: [
      { name: 'id_asignatura', label: 'Asignatura', type: 'select', required: true, ref: 'asignaturas' },
      { name: 'id_docente', label: 'Docente', type: 'select', required: true, ref: 'docentes' },
      { name: 'numero_grupo', label: 'Número de grupo', type: 'number', required: true, min: 1, maxVal: 99 },
      { name: 'periodo', label: 'Periodo', type: 'text', required: true, max: 10, hint: 'Ej: 2026-2' },
      { name: 'cupo', label: 'Cupo', type: 'number', required: true, min: 1, maxVal: 500 },
    ],
  },
  matriculas: {
    title: 'Matrículas', table: 'matricula', pk: 'id_matricula',
    from: MAT_FROM,
    label: `${NOMBRE} || ' - ' || a.nombre || ' G' || g.numero_grupo || ' (' || g.periodo || ')'`,
    search: ['u.nombres', 'u.apellidos', 'a.nombre', 'g.periodo'],
    cols: [['t.id_matricula', 'id', 'ID'], [NOMBRE, 'estudiante', 'Estudiante'], ['a.nombre', 'asignatura', 'Asignatura'],
      ['g.numero_grupo', 'grupo', 'Grupo'], ['g.periodo', 'periodo', 'Periodo'], ['t.fecha_matricula', 'fecha', 'Fecha']],
    fields: [
      { name: 'id_estudiante', label: 'Estudiante', type: 'select', required: true, ref: 'estudiantes' },
      { name: 'id_grupo', label: 'Grupo', type: 'select', required: true, ref: 'grupos' },
      { name: 'fecha_matricula', label: 'Fecha de matrícula', type: 'date', hint: 'Vacía = hoy' },
    ],
  },
  calificaciones: {
    title: 'Calificaciones', table: 'calificacion', pk: 'id_calificacion',
    from: `calificacion t
      JOIN matricula m ON m.id_matricula = t.id_matricula
      JOIN estudiante e ON e.id_estudiante = m.id_estudiante
      JOIN usuario u ON u.id_usuario = e.id_usuario
      JOIN grupo g ON g.id_grupo = m.id_grupo
      JOIN asignatura a ON a.id_asignatura = g.id_asignatura`,
    label: "t.descripcion || ' (' || t.nota || ')'",
    search: ['u.nombres', 'u.apellidos', 'a.nombre', 't.descripcion', 'g.periodo'],
    cols: [['t.id_calificacion', 'id', 'ID'], [NOMBRE, 'estudiante', 'Estudiante'], ['a.nombre', 'asignatura', 'Asignatura'],
      ['g.periodo', 'periodo', 'Periodo'], ['t.descripcion', 'descripcion', 'Descripción'], ['t.nota', 'nota', 'Nota']],
    fields: [
      { name: 'id_matricula', label: 'Matrícula', type: 'select', required: true, ref: 'matriculas' },
      { name: 'descripcion', label: 'Descripción', type: 'text', required: true, max: 100, hint: 'Ej: Parcial 1' },
      { name: 'nota', label: 'Nota', type: 'number', required: true, min: 0, maxVal: 5, decimal: true },
    ],
  },
};

// ---------- Consultas con JOIN ----------
const E_FROM = `estudiante e JOIN usuario u ON u.id_usuario = e.id_usuario JOIN programa p ON p.id_programa = e.id_programa`;
const G_FROM = `grupo g JOIN asignatura a ON a.id_asignatura = g.id_asignatura
  JOIN docente d ON d.id_docente = g.id_docente JOIN usuario ud ON ud.id_usuario = d.id_usuario`;
const M_FROM = `matricula m JOIN estudiante e ON e.id_estudiante = m.id_estudiante
  JOIN usuario u ON u.id_usuario = e.id_usuario JOIN grupo g ON g.id_grupo = m.id_grupo
  JOIN asignatura a ON a.id_asignatura = g.id_asignatura JOIN programa p ON p.id_programa = a.id_programa`;
const ALL = { id_estudiante: 'e.id_estudiante', id_programa: 'p.id_programa', id_asignatura: 'a.id_asignatura', id_grupo: 'g.id_grupo', periodo: 'g.periodo' };

export const queries: Record<string, { title: string; sql: string; order: string; filters: Record<string, string> }> = {
  estudiantes: {
    title: 'Estudiantes con usuario y programa',
    sql: `SELECT u.nombres || ' ' || u.apellidos AS "Estudiante", u.numero_documento AS "Documento", u.correo AS "Correo",
          p.nombre AS "Programa", e.semestre_actual AS "Semestre" FROM ${E_FROM}`,
    order: 'ORDER BY 1', filters: { id_estudiante: 'e.id_estudiante', id_programa: 'p.id_programa' },
  },
  docentes: {
    title: 'Docentes con su usuario',
    sql: `SELECT u.nombres || ' ' || u.apellidos AS "Docente", u.numero_documento AS "Documento", u.correo AS "Correo",
          d.especialidad AS "Especialidad" FROM docente d JOIN usuario u ON u.id_usuario = d.id_usuario`,
    order: 'ORDER BY 1', filters: {},
  },
  asignaturas: {
    title: 'Asignaturas por programa',
    sql: `SELECT p.nombre AS "Programa", a.codigo AS "Código", a.nombre AS "Asignatura", a.creditos AS "Créditos",
          a.semestre AS "Semestre" FROM asignatura a JOIN programa p ON p.id_programa = a.id_programa`,
    order: 'ORDER BY 1, 5, 2', filters: { id_programa: 'p.id_programa', id_asignatura: 'a.id_asignatura' },
  },
  grupos: {
    title: 'Grupos con asignatura y docente',
    sql: `SELECT a.nombre AS "Asignatura", g.numero_grupo AS "Grupo", g.periodo AS "Periodo",
          ud.nombres || ' ' || ud.apellidos AS "Docente", g.cupo AS "Cupo" FROM ${G_FROM}`,
    order: 'ORDER BY 3 DESC, 1, 2', filters: { id_programa: 'a.id_programa', id_asignatura: 'a.id_asignatura', id_grupo: 'g.id_grupo', periodo: 'g.periodo' },
  },
  matriculas: {
    title: 'Matrículas con estudiante y grupo',
    sql: `SELECT u.nombres || ' ' || u.apellidos AS "Estudiante", a.nombre AS "Asignatura", g.numero_grupo AS "Grupo",
          g.periodo AS "Periodo", m.fecha_matricula AS "Fecha" FROM ${M_FROM}`,
    order: 'ORDER BY 4 DESC, 1', filters: ALL,
  },
  calificaciones: {
    title: 'Calificaciones por estudiante',
    sql: `SELECT u.nombres || ' ' || u.apellidos AS "Estudiante", a.nombre AS "Asignatura", g.numero_grupo AS "Grupo",
          g.periodo AS "Periodo", c.descripcion AS "Descripción", c.nota AS "Nota"
          FROM calificacion c JOIN matricula m ON m.id_matricula = c.id_matricula
          JOIN estudiante e ON e.id_estudiante = m.id_estudiante JOIN usuario u ON u.id_usuario = e.id_usuario
          JOIN grupo g ON g.id_grupo = m.id_grupo JOIN asignatura a ON a.id_asignatura = g.id_asignatura
          JOIN programa p ON p.id_programa = a.id_programa`,
    order: 'ORDER BY 4 DESC, 1, 2', filters: ALL,
  },
};

export const filterDefs: Record<string, { label: string; ref?: string }> = {
  id_estudiante: { label: 'Estudiante', ref: 'estudiantes' },
  id_programa: { label: 'Programa', ref: 'programas' },
  id_asignatura: { label: 'Asignatura', ref: 'asignaturas' },
  id_grupo: { label: 'Grupo', ref: 'grupos' },
  periodo: { label: 'Periodo (ej: 2026-2)' },
};
