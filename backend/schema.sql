CREATE TABLE IF NOT EXISTS tipo_documento (
  id_tipo_documento SERIAL PRIMARY KEY,
  nombre VARCHAR(50) NOT NULL,
  CONSTRAINT uq_tipo_documento_nombre UNIQUE (nombre)
);

CREATE TABLE IF NOT EXISTS usuario (
  id_usuario SERIAL PRIMARY KEY,
  id_tipo_documento INT NOT NULL REFERENCES tipo_documento(id_tipo_documento),
  numero_documento VARCHAR(20) NOT NULL,
  nombres VARCHAR(80) NOT NULL,
  apellidos VARCHAR(80) NOT NULL,
  correo VARCHAR(120) NOT NULL,
  password_hash VARCHAR(100) NOT NULL,
  CONSTRAINT uq_usuario_documento UNIQUE (numero_documento),
  CONSTRAINT uq_usuario_correo UNIQUE (correo)
);

CREATE TABLE IF NOT EXISTS docente (
  id_docente SERIAL PRIMARY KEY,
  id_usuario INT NOT NULL REFERENCES usuario(id_usuario),
  especialidad VARCHAR(100),
  CONSTRAINT uq_docente_usuario UNIQUE (id_usuario)
);

CREATE TABLE IF NOT EXISTS programa (
  id_programa SERIAL PRIMARY KEY,
  codigo VARCHAR(20) NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  duracion_semestres INT NOT NULL CHECK (duracion_semestres > 0),
  CONSTRAINT uq_programa_codigo UNIQUE (codigo)
);

CREATE TABLE IF NOT EXISTS asignatura (
  id_asignatura SERIAL PRIMARY KEY,
  id_programa INT NOT NULL REFERENCES programa(id_programa),
  codigo VARCHAR(20) NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  creditos INT NOT NULL CHECK (creditos > 0),
  semestre INT NOT NULL CHECK (semestre > 0),
  CONSTRAINT uq_asignatura_codigo UNIQUE (codigo)
);

CREATE TABLE IF NOT EXISTS estudiante (
  id_estudiante SERIAL PRIMARY KEY,
  id_usuario INT NOT NULL REFERENCES usuario(id_usuario),
  id_programa INT NOT NULL REFERENCES programa(id_programa),
  semestre_actual INT NOT NULL DEFAULT 1 CHECK (semestre_actual > 0),
  fecha_ingreso DATE NOT NULL DEFAULT CURRENT_DATE,
  CONSTRAINT uq_estudiante_usuario UNIQUE (id_usuario)
);

CREATE TABLE IF NOT EXISTS grupo (
  id_grupo SERIAL PRIMARY KEY,
  id_asignatura INT NOT NULL REFERENCES asignatura(id_asignatura),
  id_docente INT NOT NULL REFERENCES docente(id_docente),
  numero_grupo INT NOT NULL CHECK (numero_grupo > 0),
  periodo VARCHAR(10) NOT NULL,
  cupo INT NOT NULL DEFAULT 30 CHECK (cupo > 0),
  CONSTRAINT uq_grupo UNIQUE (id_asignatura, numero_grupo, periodo)
);

CREATE TABLE IF NOT EXISTS matricula (
  id_matricula SERIAL PRIMARY KEY,
  id_estudiante INT NOT NULL REFERENCES estudiante(id_estudiante),
  id_grupo INT NOT NULL REFERENCES grupo(id_grupo),
  fecha_matricula DATE NOT NULL DEFAULT CURRENT_DATE,
  CONSTRAINT uq_matricula UNIQUE (id_estudiante, id_grupo)
);

CREATE TABLE IF NOT EXISTS calificacion (
  id_calificacion SERIAL PRIMARY KEY,
  id_matricula INT NOT NULL REFERENCES matricula(id_matricula),
  descripcion VARCHAR(100) NOT NULL,
  nota NUMERIC(3,2) NOT NULL,
  fecha_registro DATE NOT NULL DEFAULT CURRENT_DATE,
  CONSTRAINT ck_calificacion_nota CHECK (nota >= 0 AND nota <= 5)
);

INSERT INTO tipo_documento (nombre) VALUES
  ('Cédula de ciudadanía'), ('Tarjeta de identidad'), ('Cédula de extranjería'), ('Pasaporte')
ON CONFLICT DO NOTHING;
