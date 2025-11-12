<img src="./media/image1.png" style="width:2in;height:2in" />

# Acceso Seguro y Recuperación de Contraseña (Vía WhatsApp)

Sistema de Gestión de Cargas y Envíos Internacionales

**Proyecto:** Plataforma Web y Móbil de Gestión Logística (China–Colombia)
**Tipo de Documento:** Tutorial

**Revisión Técnica:** Five Consulting Group

**Fecha de Emisión:** 31 de octubre de 2025
**Ubicación:** Medellín - Colombia

# TUTORIAL 1: Acceso Seguro y Recuperación de Contraseña (Vía WhatsApp)

# Requisitos Previos

Antes de comenzar, asegúrese de cumplir con las siguientes condiciones:

- Tener instalada la aplicación 888Cargo (última versión disponible).

- Contar con conexión estable a Internet.

- Disponer de acceso al número de teléfono registrado en la cuenta, necesario para recibir el mensaje de recuperación vía WhatsApp.

#  Registro de Nuevo Usuario

1\. Acceda a la pantalla de registro:

Al abrir la aplicación, ubíquese en el formulario “Registrarse”.

<img src="./media/image2.png" style="width:5.60495in;height:6.00084in" />

2\. Complete sus datos personales:

Llene todos los campos obligatorios del formulario, incluyendo:

- Nombres y Apellidos completos

- Correo electrónico

- Al seleccionar el indicador telefónico de su país, se seleccionar el país de forma independiente y de manera automática.

> <img src="./media/image3.png" style="width:3.88596in;height:3.70885in" />

- No es necesario que modifique el país. Para cambiarlo, solo debe seleccionar el código de país correcto en el indicador telefónico.

> <img src="./media/image4.png" style="width:3.88596in;height:1.46895in" />

- Ingrese el número de su teléfono, preferiblemente el mismo número de su WhatsApp.

- Contraseña segura

- Marque la casilla de verificación.

Al aceptar recibir mensajes de WhatsApp nos permitirá enviarle a través de WhatsApp el enlace de recuperación de la contraseña en caso de llegar a perderlo u olvidar sus credenciales de acceso, además de otro tipo de información que puede ser de su interés.

<img src="./media/image5.png" style="width:4.04223in;height:0.82303in" />

3\. Confirme el registro:

Presione el botón “Crear Cuenta”.

4\. Validación del sistema:

- En caso de que falte un campo por rellenar, el sistema le indicara con un mensaje emergente el campo que debe llenar.

<img src="./media/image6.png" style="width:3.93701in;height:1.40551in" />

Si el formulario está completo, el sistema verificará los datos ingresados y mostrará un mensaje de confirmación.

<img src="./media/image7.png" style="width:4.57874in;height:3.42126in" />

De no ser así, el sistema le mostrara un mensaje con el error especifico.

<img src="./media/image8.png" style="width:4.34646in;height:2.99606in" />

Posteriormente, podrá iniciar sesión con los datos registrados anteriormente en el formulario de inicio de sesión.

#  Inicio de Sesión Estándar

1\. Ingrese sus credenciales:

En la pantalla principal, digite su Correo electrónico y Contraseña.

<img src="./media/image9.png" style="width:3.77953in;height:3.06693in" />

2\. Inicie sesión:

Presione el botón “Iniciar Sesión”.

3\. Acceso exitoso:

Una vez validada su autenticación mediante JWT (JSON Web Token), el sistema le mostrara un mensaje de Bienvenida.

<img src="./media/image10.png" style="width:4.33858in;height:3.23228in" />

Luego será dirigido a su Dashboard o a la pantalla principal de gestión de cargas, según su rol.

<img src="./media/image11.png" style="width:6.1375in;height:2.72917in" />

# Recuperación de Contraseña vía WhatsApp (Flujo Crítico)

Si ha olvidado su contraseña, puede restablecerla de forma segura mediante un código enviado por WhatsApp.

1\. Seleccione la opción de recuperación:

En el formulario de Inicio de Sesion, pulse el enlace “¿Olvidaste tu Contraseña?”.

<img src="./media/image12.png" style="width:3.95669in;height:3.0748in" />

2\. Identifique su cuenta:

Ingrese el número de Whatsapp asociado a su cuenta de 888Cargo.

<img src="./media/image13.png" style="width:3.97972in;height:5.83415in" />

El sistema validará que la cuenta exista y que el número telefónico esté registrado.

3\. Confirme el envío del código:

Presione “Continuar”.

El sistema mostrará un mensaje confirmando que se ha enviado un enlace de recuperación a su número de teléfono vía WhatsApp.

<img src="./media/image14.png" style="width:4.49213in;height:3.0748in" />

4\. Obtenga el código de seguridad:

Abra su aplicación de WhatsApp y verifique el mensaje proveniente de 888Cargo.

Este mensaje incluirá un enlace que lo llevará directamente a la página de restablecimiento de contraseña, válido por 30 minutos.

<img src="./media/image15.png" style="width:4.58397in;height:4.27143in" />

5\. Verifique el enlace:

Si el tiempo no ha expirado y el enlace es válido, será redirigido a una nueva página de 888Cargo.

<img src="./media/image16.png" style="width:4.33394in;height:6.19878in" />

6\. Establezca una nueva contraseña:

Al abrir en enlace, se habilitarán los campos para crear una nueva contraseña y confirmarla.

Se recomienda usar una combinación de letras, números y símbolos para mayor seguridad. La contraseña no debe tener menos de 8 caracteres. Como soporte, el sistema le mostrara un banner indicando si la contraseña cumple o no con los requisitos anteriores.

<img src="./media/image17.png" style="width:5.32366in;height:5.02153in" />

7\. Finalice el proceso:

Presione el botón “Actualizar Contraseña”.

Si aun se encuentra dentro del limite de tiempo y el enlace aun es valido, el sistema confirmará que la contraseña se ha restablecido correctamente.

<img src="./media/image18.png" style="width:4.41732in;height:3.22441in" />

A partir de este momento, podrá iniciar sesión con sus nuevas credenciales.

En caso contrario, el sistema le mostrara un mensaje indicando cual es el error.

<img src="./media/image19.png" style="width:4.47638in;height:3.05906in" />

8\. Desestimación:

En caso de arrepentirse o si simplemente ya no desea finalizar el proceso para el cambio de contraseña, puede simplemente regresar a la interfaz de inicio de sesión presionando el botón “Volver al inicio de sesión” ubicado debajo del botón “Actualizar Contraseña”

<img src="./media/image20.png" style="width:5.18822in;height:1.75024in" />

# Recomendación de Seguridad

No comparta su enlace de recuperación ni su nueva contraseña con terceros.

El equipo de 888Cargo nunca solicitará su enlace o clave por otros medios (correo, llamada o mensaje).

Si sospecha de un intento de fraude, comuníquese inmediatamente con el soporte técnico oficial.

# Nota Técnica

El proceso de recuperación utiliza la API oficial de WhatsApp Business para enviar mensajes automáticos de validación.

El enlace de verificación incluye un enlace temporal asociado al número telefónico registrado del usuario.

El backend valida el token con el que se genera el enlace antes de permitir el restablecimiento de la contraseña, garantizando la seguridad del proceso.
