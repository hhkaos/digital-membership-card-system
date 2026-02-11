# Manual de Usuario Emisor (Español)

## Para quién es esta guía

Esta guía es para administradores AMPA no técnicos que usan la app Emisor.

## Qué puedes hacer en Emisor

- Cargar o crear claves de firma
- Generar una tarjeta manualmente
- Generar muchas tarjetas desde CSV
- Revocar tarjetas/socios y exportar `revoked.json`

## 1. Abrir la app

Abre la app Emisor y selecciona idioma con `ES/EN`.

![Marcador - Inicio Emisor](../../assets/placeholder.svg)
_Sustituir por captura: inicio del Emisor con pestañas._

## 2. Gestión de claves

Ve a `🔑 Gestión de claves`.

- Primera vez: pulsa `Generar nuevo par de claves`
- Clave existente: pégala en `Importar clave privada existente`
- Mantén siempre la clave privada en secreto

![Marcador - Gestión de claves](../../assets/placeholder.svg)
_Sustituir por captura: zona de generación/importación de claves._

## 3. Generar una tarjeta

Ve a `🎫 Generar tarjeta`.

1. Introduce `Nombre completo`
2. Introduce `ID de socio`
3. Elige `Fecha de caducidad`
4. Pulsa `Generar tarjeta`

Resultado esperado: se descarga un PNG.

![Marcador - Generar tarjeta](../../assets/placeholder.svg)
_Sustituir por captura: formulario manual y estado de éxito._

## 4. Generar tarjetas desde CSV

Ve a `📦 Carga por lotes`.

Columnas CSV:
- `full_name`
- `member_id`
- `expiry_date` (AAAA-MM-DD)

Pasos:
1. Pulsa `Seleccionar archivo CSV`
2. Revisa validación
3. Pulsa `Generar N tarjetas`

Resultado esperado: ZIP con tarjetas y metadatos.

![Marcador - Carga por lotes](../../assets/placeholder.svg)
_Sustituir por captura: validación CSV y botón de generar._

## 5. Revocación

Ve a `🚫 Revocación`.

Puedes:
- Revocar un token por `jti`
- Revocar todos los tokens de un socio por `sub`

Flujo recomendado:
1. Cargar y fusionar `revoked.json` actual
2. Añadir revocaciones (manual o lectura de QR PNG)
3. Descargar `revoked.json` actualizado
4. Publicarlo con tu proceso habitual

![Marcador - Revocación](../../assets/placeholder.svg)
_Sustituir por captura: lista actual y acciones de exportación._

## Problemas frecuentes

- `No hay clave privada cargada`
  - Carga/importa clave en `Gestión de claves`
- Errores en CSV por lotes
  - Revisa columnas y formato de fecha
- Revocación no aplicada
  - Verifica que el `revoked.json` actualizado se ha desplegado
