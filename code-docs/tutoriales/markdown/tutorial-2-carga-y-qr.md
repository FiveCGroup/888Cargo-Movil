<img src="./media/image1.png" style="width:2in;height:2in" />

# TUTORIAL 2: Creación de una Carga Completa, Generación de QRs y Descarga de PDF

Sistema de Gestión de Cargas y Envíos Internacionales

**Proyecto:** Plataforma Web y Móbil de Gestión Logística (China–Colombia)
**Tipo de Documento:** Tutorial

**Revisión Técnica:** Five Consulting Group

**Fecha de Emisión:** 31 de octubre de 2025
**Ubicación:** Medellín - Colombia

# Creación de una Carga Completa, Generación de QRs y Descarga de PDF

Objetivo

Guiar al usuario (rol Cliente) en el proceso completo para registrar una nueva carga en el sistema, subir el Packing List en formato Excel, generar las etiquetas con códigos QR únicos y descargar el archivo PDF final para impresión logística.

Requisitos Previos

- Antes de iniciar este proceso, asegúrese de cumplir con las siguientes condiciones:

- Tener una cuenta activa con rol Cliente.

- Haber iniciado sesión correctamente en la aplicación 888Cargo.

- Disponer del archivo de Packing List en formato .xls o .xlsx.

- Contar con conexión estable a Internet.

- Verificar que el archivo cumpla con el formato estructurado descrito en el Anexo C – Anexo Técnico de Componentes y APIs.

# Inicio de la Carga y Subida del Packing List

1.  Acceda al módulo de cargas:

<img src="./media/image2.png" style="width:6.1375in;height:2.69306in" />Habiendo iniciado sesión y desde el Dashboard o menú principal, seleccione el módulo de “Crear Carga”.

2.  Cree una nueva carga:

<img src="./media/image3.png" style="width:6.1375in;height:2.38681in" />En la interdaz del modulo “Crear Carga”, presione el botón “Subir Packing List” que le abrirá una ventana emergente desde la cual podrá seleccionar el archivo Excel de su packing list.

3.  Seleccione el archivo de carga:

Dentro de la ventana emergente, navegue hasta la carpeta en donde se encuentra el archivo y seleccione el archivo que desea cargar.

<img src="./media/image4.png" style="width:6.1375in;height:3.99514in" />

4.  Envíe el archivo a procesar:

Presione el botón “Abrir” ubicado en la parte inferior de la ventana.

El sistema se encargará de procesar el archivo y cargarlo en el sistema.

<img src="./media/image5.png" style="width:4.15683in;height:1.92735in" />

5.  Revise los resultados del procesamiento:

El sistema devolverá una respuesta con las siguientes estadísticas:

<img src="./media/image6.png" style="width:6.1375in;height:1.85972in" />

- Total: Cantidad de filas procesadas.

<!-- -->

- Filas Exitosas: Cantidad de ítems procesados correctamente.

- Filas con Errores: Celdas con datos inválidos detectados.

- Filas vacias.

De forma detallada podrá verificar:

1.  <img src="./media/image7.png" style="width:6.1375in;height:2.36319in" />Las filas con errores y sus errores respectivos:

2.  <img src="./media/image8.png" style="width:6.1375in;height:2.00556in" />Las filas validas:

# Revisión de Datos y Generación de Códigos QR (RF-08)

Cuando halla cargado el archivo correctamente, podrá proceder a terminar de crear la carga en el sistema, siguiendo en orden los siguientes pasos:

1.  Verifique los datos cargados:

La aplicación mostrará una tabla interactiva con los registros procesados.

<img src="./media/image8.png" style="width:6.1375in;height:2.00556in" />Revise cuidadosamente los datos de cada artículo, como descripción, cantidad, destino y medidas.

2.  Corrija errores (si aplica):

<img src="./media/image9.png" style="width:2.77292in;height:2.15694in" /><img src="./media/image7.png" style="width:2.14583in;height:2.36319in" />Si existen advertencias o errores, modifique los campos necesarios directamente en la tabla antes de continuar y corrija los ítems en el archivo respectivo directamente.

3.  Cree la carga:

<img src="./media/image10.png" style="width:6.1375in;height:3.03542in" />Luego de haber corregido los datos en el archivo original, ejecute nuevamente los pasos 1 y 2 y cree la carga presionando el botón “Guardar como Packing List”.

4.  Complete la información de la carga:

Luego complete el formulario e ingrese los datos restantes de la carga:

<img src="./media/image11.png" style="width:5.11417in;height:4.66929in" />

- Direccion de Entrega de Mercancia: dirección del lugar donde se alistara la carga.

- Codigo de Packing List: generado automáticamente por el sistema, si desea puede crear uno nuevo.

- Dirección de Destino.

5.  Cree la carga en el sistema:

Presione “Guardar en Base de Datos”.

<img src="./media/image12.png" style="width:5.01181in;height:4.66142in" />

Esta acción envía la información al sistema, donde se guarda los datos en la base de datos y genera un código QR único para cada ítem o caja.

<img src="./media/image13.png" style="width:4.7715in;height:2.52119in" />

6.  Confirmación final:

<img src="./media/image14.png" style="width:5.85498in;height:2.06279in" />El sistema mostrará un mensaje de éxito confirmando que la carga fue registrada y los códigos QR fueron generados correctamente.

# Descarga y Obtención del PDF de Etiquetas

Siguiendo el proceso anterior, desde la creación de la carga:

1.  Acceda a la visualización de los QR generados:

Presione el botón “Visualizar Códigos QR” para acceder a la interfaz donde podrá observar a detalle todos y cada uno de los códigos QR generados para el total de los ítems de su carga.

<img src="./media/image15.png" style="width:5.67788in;height:1.65648in" />

2.  Visualice los códigos QR generados para su carga:

Al ingresar a la interfaz podrá ver la información de su carga, asi como los códigos

<img src="./media/image16.png" style="width:6.1375in;height:2.77083in" />QR generados en su totalidad.

3.  <img src="./media/image17.png" style="width:6.1375in;height:2.88056in" />Si requiere ver con mayor precisión y detalle algún código QR en específico, puede dar clic en este y se ampliará en el centro de la pantalla permitiéndole ver con mayor magnitud el QR, también podrá ver la información del ítem al que está relacionado y su respectiva referencia, así como el identificador único del código QR en el sistema.

Para salir solo debe dar clic nuevamente en el botón “X” ubicado en la parte superior de la ventana o bien puede dar clic por fuera de ella para que esta se cierre.

4.  Descargue el archivo PDF:

Podra descargar un archivo pdf con todos los códigos QR generados para su carga, para ello solo deberá desplazarse hacia la parte superior de la interfaz de visualización de códigos QR y presionar el botón “Descargar PDF”.

<img src="./media/image18.png" style="width:6.1375in;height:1.97014in" />

5.  Visualice el PDF:

<img src="./media/image19.png" style="width:6.1375in;height:2.77153in" />Al descargar el PDF obtendrá un documento consolidado con todos los códigos QR.

6.  Imprima las etiquetas:

Una vez descargado, abra el archivo PDF en su dispositivo y envíelo a una impresora de etiquetas.

<img src="./media/image20.png" style="width:6.1375in;height:3.85694in" />

# Advertencias de Seguridad

No cierre la aplicación durante el procesamiento o la generación del PDF.

No modifique manualmente los códigos QR fuera del sistema.
