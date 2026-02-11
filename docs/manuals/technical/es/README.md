# Manual Técnico (Español)

## Audiencia

Este manual está dirigido a personas técnicas que trabajan con el repositorio:
- desarrolladores
- responsables de despliegue/release
- operadores técnicos del AMPA

Si solo usas la interfaz, usa `docs/manuals/end-user/es/README.md`.

## Estructura del repositorio

- `issuer/`: SPA de emisión de tarjetas (uso administrativo)
- `verification/`: SPA pública de verificación
- `docs/`: documentación del proyecto

## Requisitos

- Node.js `>=20`
- npm
- Opcional: toolchain de Rust (empaquetado desktop con Tauri)

## Puesta en marcha local

1. Instalar dependencias:
```bash
npm install
cd verification && npm install && cd ..
cd issuer && npm install && cd ..
```
2. Ejecutar tests:
```bash
npm test
```
3. Arrancar apps:
```bash
cd verification && npm run dev
cd issuer && npm run dev
```

URLs por defecto:
- Verificador: `http://localhost:5173`
- Emisor: `http://localhost:5174`

## Gestión de claves y modelo de confianza

- El emisor firma tarjetas JWT con clave privada Ed25519.
- El verificador valida firmas con la clave pública Ed25519.
- La clave privada nunca debe versionarse ni compartirse.
- La clave pública se distribuye en la configuración del verificador.

Regla operativa:
- Si hay rotación de claves, actualiza la clave pública del verificador y reemite tarjetas con la nueva clave privada.

## Configuración del verificador

Archivo principal:
- `verification/src/config.json`

Campos críticos:
- `issuer`
- `publicKey`
- `revocationEnabled`
- `revocationUrl`
- `clockSkewSeconds`
- `offlinePolicy`
- `contactUrl`

Tras cambiar configuración:
1. Build del verificador
2. Despliegue del verificador
3. Validación con tokens conocidos (válido y revocado)

## Operativa de revocación

Esquema de `revoked.json`:
- `revoked_jti`: IDs de token revocados
- `revoked_sub`: IDs de socio revocados
- `updated_at`

Ruta objetivo del archivo publicado:
- `verification/public/revoked.json`

Flujo recomendado:
1. Cargar lista actual en la pestaña Revocación del emisor (URL o archivo)
2. Fusionar nuevas entradas (sin duplicados)
3. Exportar `revoked.json` actualizado
4. Publicarlo junto al despliegue del verificador
5. Probar en producción un token revocado

## Build y despliegue

Verificador:
```bash
cd verification
npm run build
```

Emisor (web):
```bash
cd issuer
npm run build
```

Emisor desktop (scaffold opcional):
```bash
cd issuer
npm run desktop:dev
npm run desktop:build
```

## Controles mínimos antes de release

1. `npm test` pasa en raíz y apps
2. Un token válido aparece como válido en el verificador desplegado
3. Un token revocado aparece como revocado
4. Un token caducado aparece como no válido
5. `revoked.json` se sirve desde la URL esperada
6. La clave pública del verificador coincide con la clave privada activa del emisor

## Referencias principales

- `README.md`
- `issuer/README.md`
- `verification/README.md`
- `docs/LOCAL_SETUP.md`
- `docs/DESKTOP_SIGNING.md`
- `docs/SPEC.md`
- `SECURITY.md`
