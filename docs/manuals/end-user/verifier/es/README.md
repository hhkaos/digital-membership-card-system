# Manual de Usuario Verificador (Español)

## Para quién es esta guía

Esta guía es para comercios y usuarios no técnicos que validan tarjetas en la app Verificador.

## Qué hace Verificador

Al escanear un QR, Verificador comprueba:
- validez de firma
- fecha de caducidad
- coincidencia del emisor
- estado de revocación

## 1. Abrir verificación desde QR

1. Escanea el QR de la tarjeta
2. Abre la URL de verificación
3. Espera el resultado

![Marcador - Verificador cargando](../../assets/placeholder.svg)
_Sustituir por captura: estado de carga del verificador._

## 2. Entender los estados

### Membresía válida

- Estado verde con nombre del socio
- Muestra fecha de validez
- La membresía es aceptada

![Marcador - Resultado válido](../../assets/placeholder.svg)
_Sustituir por captura: estado de membresía válida._

### Membresía revocada

- Aviso de membresía revocada
- La tarjeta/socio no debe aceptarse
- Usa el enlace de contacto para soporte

![Marcador - Resultado revocado](../../assets/placeholder.svg)
_Sustituir por captura: estado de revocación._

### Membresía no válida

Posibles motivos:
- tarjeta caducada
- token alterado/manipulado
- formato inválido
- emisor incorrecto

Puedes abrir `Mostrar detalles técnicos` para diagnóstico de soporte.

![Marcador - Resultado no válido](../../assets/placeholder.svg)
_Sustituir por captura: estado no válido con detalles técnicos._

## 3. Idioma y soporte

- Cambia idioma con `ES/EN`
- Usa el enlace de contacto cuando aparezca para soporte AMPA

## Problemas frecuentes

- `No se detectó una tarjeta de membresía`
  - La URL del QR no incluye token
- `El sistema de verificación no está configurado`
  - Falta clave pública/configuración en el despliegue
- `No se pudo comprobar el estado de revocación`
  - Problema temporal de red o del archivo de revocación
