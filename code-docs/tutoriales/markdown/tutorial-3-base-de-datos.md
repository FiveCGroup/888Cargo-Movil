<img src="./media/image1.png" style="width:2in;height:2in" />

# TUTORIAL 3: Base de Datos

Sistema de Gestión de Cargas y Envíos Internacionales

**Proyecto:** Plataforma Web y Móbil de Gestión Logística (China–Colombia)
**Tipo de Documento:** Tutorial

**Revisión Técnica:** Five Consulting Group

**Fecha de Emisión:** 05 de noviembre de 2025
**Ubicación:** Medellín - Colombia

# INTRODUCCIÓN

El sistema 888Cargo implementa SQLite como motor de base de datos principal para la administración integral de información logística, abarcando la gestión de cargas, artículos, usuarios y códigos QR utilizados en el seguimiento de envíos.

Este documento técnico describe la estructura interna de la base de datos, sus componentes, relaciones y procedimientos de mantenimiento. Además, sirve como guía de referencia para desarrolladores y administradores encargados del soporte y la evolución del sistema.

# Propósito del Sistema

El modelo de datos de 888Cargo tiene como objetivo garantizar la trazabilidad y consistencia de la información durante todo el proceso logístico. Sus principales propósitos son:

- Gestionar de forma integral las cargas y sus estados.

- Controlar artículos y packing lists asociados a cada envío.

- Administrar usuarios y credenciales con mecanismos de autenticación seguros.

- Implementar seguimiento logístico mediante códigos QR únicos.

- Permitir la recuperación de contraseñas de forma segura y automatizada.

# Tecnologías Utilizadas

- Motor de Base de Datos: SQLite 3.x

- Interfaz de Conexión: Node.js con la librería sqlite3

- Ubicación del Archivo: ./db/packing_list.db

- Codificación: UTF-8

- Modelo de Datos: Arquitectura normalizada hasta la Tercera Forma Normal (3NF)

# ARQUITECTURA DE LA BASE DE DATOS

# Diseño General

La base de datos del sistema 888Cargo ha sido diseñada bajo los principios de normalización hasta la Tercera Forma Normal (3NF), lo que garantiza una estructura lógica, eficiente y coherente con las necesidades operativas del sistema.

El diseño busca mantener la integridad de los datos, eliminar redundancias y permitir la escalabilidad a medida que crece el volumen de información. Para ello, se aplican las siguientes prácticas:

- Integridad referencial: uso de claves foráneas activas que aseguran la consistencia entre tablas.

- Eliminación de redundancia: organización de los datos en entidades independientes y relacionadas.

- Escalabilidad: índices optimizados que mejoran la velocidad de búsqueda y las consultas frecuentes.

- Auditoría: campos automáticos de registro (created_at, updated_at) para seguimiento temporal.

- Seguridad: almacenamiento de contraseñas mediante hash criptográfico (bcrypt).

Para un análisis visual del modelo de datos y su interacción con los módulos del sistema, consulte el Anexo F – Diagrama de Arquitectura 888Cargo, disponible como documento externo.

# CREACIÓN E INICIALIZACIÓN

# Proceso de Inicialización

La base de datos del sistema 888Cargo se crea y configura automáticamente al iniciar el servidor.

Este proceso se ejecuta mediante la función initializeDatabase() ubicada en el archivo backend/db.js, que establece la conexión con SQLite, verifica la existencia del archivo packing_list.db y genera su estructura si no está presente.

Durante la conexión inicial, el sistema valida la integridad del archivo, crea las tablas necesarias y aplica los índices definidos para optimizar el rendimiento. En caso de error de conexión, se generan registros en consola y logs del sistema para diagnóstico.

# Funciones de Conexión

El módulo de base de datos implementa tres funciones principales que permiten interactuar con SQLite de manera asíncrona, utilizando promesas (Promises) para asegurar un flujo no bloqueante en el servidor Node.js:

## query() – Consultas de lectura (SELECT):

Ejecuta sentencias de lectura que devuelven múltiples registros. Se utiliza, por ejemplo, para obtener listados de clientes, cargas o artículos.

## run() – Operaciones de modificación (INSERT, UPDATE, DELETE):

Ejecuta consultas que alteran el contenido de la base de datos y devuelve información sobre los cambios realizados, como el ID del último registro insertado o la cantidad de filas afectadas.

## get() – Consultas de lectura única (SELECT con un solo resultado):

Recupera un único registro, útil para validaciones o búsquedas específicas (por ejemplo, consultar un cliente por su ID o verificar un código QR existente).

Estas funciones encapsulan la lógica de interacción con SQLite, brindando una interfaz consistente y reutilizable en todo el sistema backend.

# Secuencia de Inicialización

El proceso de arranque de la base de datos sigue la siguiente secuencia lógica:

- Conexión al motor SQLite.

- Verificación de la estructura existente.

- Actualización automática del esquema si hay cambios en la versión del sistema.

- Creación de tablas faltantes o ausentes.

- Aplicación de índices definidos para optimización de consultas.

- Confirmación de inicialización exitosa mediante logs del servidor.

# ESTRUCTURA DE TABLAS DETALLADA

La base de datos del sistema 888Cargo está compuesta por siete tablas principales, diseñadas bajo los principios de normalización (3NF) para garantizar integridad, trazabilidad y eficiencia. A continuación, se detalla el propósito y las características más relevantes de cada una:

# CLIENTE

## Propósito:

Almacena la información básica de los clientes registrados en el sistema, incluyendo datos de contacto, ubicación y su código de identificación único.

## Campos principales:

- cliente_shippingMark: Identificador único del cliente (por ejemplo: 888ABC).

- correo_cliente: Correo electrónico único para autenticación y comunicación.

- telefono_cliente: Número utilizado para notificaciones vía WhatsApp.

Notas:

Incluye los campos created_at y updated_at para auditoría y control temporal. El campo password se mantiene únicamente por compatibilidad con versiones anteriores (legacy).

# USERS

## Propósito:

Implementa el sistema moderno de autenticación y autorización de usuarios dentro de 888Cargo.

## Características principales:

- Contraseñas protegidas mediante hash bcrypt.

- Campos únicos: username y email.

- Control de estado mediante is_active (1 = activo, 0 = inactivo).

- Auditoría automática con created_at y updated_at.

Esta tabla reemplaza al sistema legacy definido en cliente, centralizando la gestión de credenciales.

# CARGA

## Propósito:

Registra la información de cada envío o carga logística asociada a un cliente, incluyendo detalles de destino, fechas y archivos originales (por ejemplo, Excel o PDF).

## Relaciones:

Cada carga está vinculada a un cliente mediante la clave foránea id_cliente.

Formato de código de carga:

- PL-20251105-123-4567 → Packing lists.

# ARTICULO_PACKING_LIST

## Propósito:

Contiene el detalle de los productos incluidos en cada carga, con atributos técnicos, descripciones bilingües y soporte para almacenamiento de imágenes.

## Características destacadas:

- Campos bilingües (descripcion_espanol, descripcion_chino).

- Almacenamiento de imágenes en formato binario (BLOB).

- Medidas físicas (largo, ancho, alto, cbm, gw) para cálculo de volumen y peso.

- Control de precios unitarios y totales.

Cada registro se asocia a una carga mediante id_carga.

# CAJA

## Propósito:

Define la división física de los artículos en cajas individuales para el proceso de envío.

## Relación:

Cada artículo puede dividirse en múltiples cajas (id_articulo como clave foránea).

## Atributos relevantes:

- numero_caja: Identificador secuencial dentro del envío.

- total_cajas: Número total de cajas del artículo.

- cantidad_en_caja: Unidades contenidas por caja.

- Campos de volumen (cbm) y peso (gw).

Permite un control detallado del contenido de cada caja y su trazabilidad dentro del envío.

# QR

## Propósito:

Gestiona el sistema de seguimiento logístico mediante códigos QR asociados a cada caja, artículo o carga.

## Características clave:

Cada código (codigo_qr) es único y se genera automáticamente.

Los estados posibles del QR son:

- Generado: QR creado pero no impreso.

- Impreso: QR producido físicamente.

- Escaneado: QR leído por el cliente o destinatario.

Incluye campos de control (fecha_generacion, fecha_escaneado, contador_escaneos).

Se almacena configuración visual en opciones_render (ancho, margen, color).

Cada registro de QR se vincula a una caja mediante id_caja.

# RECOVERY_TOKENS

## Propósito:

Esta tabla es una incorporación reciente al modelo de datos. Su función es administrar los tokens temporales utilizados durante el proceso de recuperación de contraseñas, permitiendo almacenarlos de forma persistente en la base de datos en lugar de mantenerlos en memoria del servidor.

De esta manera, los tokens permanecen válidos incluso ante reinicios del servidor, evitando errores por caducidad prematura o pérdida de sesión y garantizando un flujo de recuperación más confiable y seguro.

## Características de seguridad:

- Tokens únicos y de un solo uso.

- Expiración automática de 30 minutos desde su creación.

- Eliminación en cascada cuando se borra el usuario correspondiente.

- Limpieza periódica automatizada cada 15 minutos.

Estos tokens se relacionan directamente con la tabla users a través del campo user_id, garantizando control y seguridad en los procesos de recuperación de credenciales.

# SENTENCIAS SQL DEL SISTEMA

El sistema 888Cargo utiliza un conjunto de sentencias SQL estructuradas que permiten ejecutar las operaciones más comunes sobre la base de datos: consultas, inserciones, actualizaciones, eliminaciones y mantenimiento general.

A continuación, se presentan las más relevantes clasificadas por su propósito.

# Sentencias de Consulta (SELECT)

Estas consultas permiten recuperar información crítica del sistema, validar datos y realizar operaciones de monitoreo:

- Buscar usuario por número de teléfono: recupera la información del usuario con base en su número registrado, útil en el proceso de recuperación de contraseñas.

- Verificar token de recuperación: comprueba la validez de un token activo y no utilizado.

- Obtener estadísticas de tokens activos: retorna el número de tokens válidos cuya fecha de expiración aún no ha sido alcanzada.

- Listar todas las tablas del sistema: muestra los nombres de todas las tablas existentes dentro del archivo SQLite.

- Contar registros por tabla: genera un resumen general del número de registros en tablas principales como users, carga y recovery_tokens.

# Sentencias de Inserción (INSERT)

Permiten registrar nuevos datos en las tablas del sistema:

- Crear token de recuperación: inserta un nuevo registro en recovery_tokens con su token único, usuario asociado y tiempo de expiración.

- Registrar nuevo usuario: crea una cuenta de usuario con credenciales y datos personales (nombre, correo, teléfono, país, ciudad).

- Crear nueva carga: registra una carga logística asociada a un cliente, incluyendo código identificador, destino y archivo fuente.

# Sentencias de Actualización (UPDATE)

Se emplean para modificar datos existentes manteniendo la trazabilidad de los cambios:

- Actualizar contraseña de usuario: modifica la contraseña almacenada y actualiza el campo updated_at.

- Marcar token como usado: registra la fecha en que un token fue utilizado para evitar su reutilización.

- Invalidar otros tokens del usuario: marca como usados todos los tokens previos del mismo usuario, excepto el más reciente.

# Sentencias de Eliminación (DELETE)

Controlan la limpieza y mantenimiento de los registros relacionados con los tokens de recuperación:

- Eliminar token específico: borra un token determinado de la base de datos.

- Eliminar tokens expirados de un usuario:limpia los tokens caducados o ya utilizados asociados a un usuario en particular.

- Limpieza general de tokens expirados: elimina de forma masiva los registros vencidos o usados para optimizar espacio y rendimiento.

# Sentencias de Análisis y Mantenimiento

Estas operaciones aseguran la integridad y el rendimiento óptimo de la base de datos:

- Verificar integridad general: ejecuta PRAGMA integrity_check para comprobar la consistencia de la base.

- Obtener estructura de una tabla: consulta la definición de columnas mediante PRAGMA table_info.

- Verificar claves foráneas: analiza la coherencia de las relaciones entre tablas.

- Compactar base de datos: ejecuta VACUUM para recuperar espacio libre y reducir fragmentación.

- Actualizar estadísticas del optimizador: utiliza ANALYZE para mejorar el rendimiento de las consultas.

# RELACIONES E INTEGRIDAD

El modelo de datos de 888Cargo ha sido diseñado con un enfoque relacional, garantizando la integridad referencial, la consistencia de los datos y el rendimiento óptimo de las consultas mediante el uso de claves foráneas, restricciones únicas y índices estratégicos.

# Relaciones entre Tablas (Foreign Keys)

Las relaciones principales del sistema se definen bajo el esquema de cardinalidades 1:N o 1:1, según la naturaleza de cada entidad:

| Relación | Descripción | Tipo |
|:--:|----|----|
| Cliente → Carga | Un cliente puede tener múltiples cargas asociadas. | 1:N |
| Carga → Artículo | Cada carga puede contener varios artículos. | 1:N |
| Artículo → Caja | Un artículo puede dividirse en múltiples cajas físicas. | 1:N |
| Caja → QR | Cada caja cuenta con un código QR único para seguimiento. | 1:1 |
| Usuario → Token | Un usuario puede tener varios tokens de recuperación; los tokens se eliminan automáticamente si el usuario es borrado (*ON DELETE CASCADE*). | 1:N |

# Restricciones de Integridad

Las restricciones de integridad garantizan que los datos almacenados sean consistentes, únicos y válidos.

## Campos únicos (UNIQUE):

- cliente.correo_cliente

- cliente.cliente_shippingMark

- users.username

- users.email

- carga.codigo_carga

- qr.codigo_qr

- recovery_tokens.token

## Campos obligatorios (NOT NULL):

- cliente.nombre_cliente

- users.username, users.email, users.password

- carga.codigo_carga, carga.fecha_inicio

- qr.codigo_qr, qr.datos_qr

- recovery_tokens.token, recovery_tokens.expires_at

Estas reglas aseguran que no se inserten registros incompletos o duplicados, manteniendo la coherencia del sistema.

## Índices para Optimización

Con el fin de mejorar la eficiencia de las operaciones de búsqueda y filtrado, el sistema define índices específicos en las columnas de uso frecuente:

- Consultas por correo y teléfono:

> cliente(correo_cliente), cliente(telefono_cliente), users(email).

- Consultas por código identificador:

> carga(codigo_carga), qr(codigo_qr).

- Relaciones frecuentes entre entidades:

> carga(id_cliente), articulo_packing_list(id_carga), caja(id_articulo).

- Tokens de recuperación:

> recovery_tokens(token), recovery_tokens(expires_at), recovery_tokens(user_id).

El uso de estos índices reduce significativamente el tiempo de respuesta en consultas recurrentes y mantiene el rendimiento general de la base de datos.

# GESTIÓN DE USUARIOS Y AUTENTICACIÓN

# Sistema de Usuarios

El sistema 888Cargo cuenta con dos modelos de usuarios:

- Tabla cliente — versión heredada (legacy), conservada por compatibilidad con bases de datos anteriores MongoDB y PostgreSQL.

- Tabla users — modelo moderno, recomendado para nuevas implementaciones.

El proceso de registro se realiza a través del backend que, valida los datos ingresados, cifra la contraseña mediante bcrypt (con un salt de 10 rondas) e inserta el nuevo usuario en la base de datos junto con su información de contacto.

Durante el inicio de sesión (login), el sistema busca al usuario por su correo o nombre de usuario, valida la contraseña cifrada y genera un token JWT o sesión activa, según la configuración del servidor.

# Seguridad de Contraseñas

El módulo de autenticación implementa medidas de seguridad específicas para proteger las credenciales de los usuarios:

- Cifrado de contraseñas con bcrypt (10 rondas de salt).

- Longitud mínima de 8 caracteres.

- Validación de complejidad (mayúsculas, minúsculas y números).

- Recuperación segura mediante tokens temporales gestionados en la tabla recovery_tokens.

Estas prácticas aseguran la protección de la información sensible y el cumplimiento de buenas prácticas de seguridad.

# SISTEMA DE CÓDIGOS QR

# Generación de Códigos QR

El módulo de tracking logístico se basa en la generación y gestión de códigos QR asociados a cada caja o artículo.

Flujo de generación:

- Creación de la caja correspondiente en la base de datos.

- Generación de un código único.

- Preparación de los datos logísticos a codificar.

- Creación de la imagen QR con la configuración establecida (width, margin, color).

- Almacenamiento del resultado en la tabla qr, junto con su metadato JSON.

Estructura del contenido codificado:

Cada código QR contiene información básica de la caja o artículo, como el identificador de carga, descripción, cantidad, destino y fecha de creación.

# Tracking y Escaneo

Los QR pasan por tres estados operativos dentro del sistema:

- Generado: código creado pero aún no impreso.

- Impreso: código QR producido físicamente.

- Escaneado: código leído por un cliente o destinatario.

Al momento del escaneo, el sistema actualiza los campos de control (fecha_escaneado, escaneado_por, contador_escaneos y estado), permitiendo así la trazabilidad completa del proceso logístico desde origen hasta destino.

# RECUPERACIÓN DE CONTRASEÑAS

Flujo Completo de Recuperación

El sistema de recuperación de contraseñas utiliza tokens seguros y temporales para garantizar la validez y trazabilidad del proceso.

Flujo general:

1.  Solicitud: el usuario inicia la recuperación proporcionando su número telefónico.

2.  Generación de token: el sistema crea un token único (URL-safe) con tiempo de expiración de 30 minutos y lo almacena en la tabla recovery_tokens.

3.  Envío de enlace: se envía un mensaje de WhatsApp con un enlace personalizado para restablecer la contraseña, utilizando plantillas oficiales configuradas en la API de WhatsApp Business.

4.  Validación: al acceder al enlace, el sistema verifica la validez y vigencia del token.

5.  Cambio de contraseña: se actualiza la nueva contraseña cifrada en la tabla users.

6.  Marcado de token como usado: el token utilizado se registra con fecha de uso (used_at) para evitar reutilizaciones.

# Medidas de Seguridad

El proceso está respaldado por controles que aseguran su integridad:

- Tokens únicos y de un solo uso.

- Expiración automática a los 30 minutos.

- Invalidación automática de otros tokens activos del mismo usuario.

- Limpieza periódica cada 15 minutos de registros expirados.

- Uso de tokens encriptados y codificados en formato URL-safe.

Estas medidas garantizan un flujo seguro, trazable y resiliente ante reinicios del servidor o intentos de reutilización.
