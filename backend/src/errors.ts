const unicos: Record<string, string> = {
  uq_usuario_documento: 'El documento ingresado ya está registrado',
  uq_usuario_correo: 'Este correo electrónico ya se encuentra asociado a otro usuario',
  uq_programa_codigo: 'Ya existe un programa con ese código',
  uq_asignatura_codigo: 'Ya existe una asignatura con ese código',
  uq_grupo: 'Ya existe un grupo con esa asignatura, número y periodo',
  uq_matricula: 'El estudiante ya está matriculado en ese grupo',
  uq_docente_usuario: 'Ese usuario ya está registrado como docente',
  uq_estudiante_usuario: 'Ese usuario ya está registrado como estudiante',
  uq_tipo_documento_nombre: 'Ya existe un tipo de documento con ese nombre',
};

export function pgMessage(e: any): { status: number; message: string } | null {
  switch (e?.code) {
    case '23505': return { status: 409, message: unicos[e.constraint] || 'Ya existe un registro con esos datos' };
    case '23503': return { status: 409, message: 'El registro relacionado seleccionado no existe' };
    case '23502': return { status: 400, message: 'Todos los campos obligatorios deben completarse' };
    case '23514':
      return { status: 400, message: String(e.constraint).includes('nota')
        ? 'La nota debe encontrarse dentro del rango permitido (0 a 5)'
        : 'Un valor está fuera del rango permitido' };
    case '22P02':
    case '22003': return { status: 400, message: 'Alguno de los valores tiene un formato inválido' };
    case '22001': return { status: 400, message: 'Un texto supera la longitud permitida' };
    default: return null;
  }
}
