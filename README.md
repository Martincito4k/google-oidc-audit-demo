# Login con Google y registro de eventos
[![Netlify Status](https://api.netlify.com/api/v1/badges/d60e2cb1-ecc2-4d77-ad6f-9a2d045d54b0/deploy-status)](https://app.netlify.com/projects/google-oidc-audit-demo)
[Ver la app publicada](https://google-oidc-audit-demo.netlify.app)

Proyecto para probar un inicio de sesión federado con Google en un sitio publicado en Netlify. Al entrar, la app muestra los datos básicos de la cuenta y un ID de Netlify Identity. El botón de salida cierra la sesión de la aplicación.

## Cómo está armado

- Vite y TypeScript para la interfaz.
- `@netlify/identity` para iniciar el flujo con Google, procesar el callback y consultar o cerrar la sesión.
- Funciones de Netlify para registrar los eventos de login, alta de usuario y solicitud de logout.

Google confirma la identidad. Netlify Identity administra la cuenta y la sesión que usa esta app. No se solicitan permisos para Gmail, Drive ni otros productos de Google.

## Probar la interfaz

```sh
npm install
npm run dev
```

Para revisar la compilación:

```sh
npm run build
```

El login no funciona desde el servidor local de Vite. Hay que desplegar el proyecto, habilitar Identity en Netlify y activar Google como proveedor externo.

## Publicar y conectar Google

1. Importar este repositorio como proyecto de Netlify. El comando de build (`npm run build`), la carpeta publicada (`dist`) y las funciones están declarados en `netlify.toml`.
2. En la configuración del proyecto, habilitar **Identity**.
3. En **Identity → Registration → External providers**, agregar Google. Si se quiere que Google muestre el nombre de esta app durante el consentimiento, crear un cliente OAuth en Google Cloud y guardar su *Client ID* y *Client secret* en la configuración de Netlify.
4. Copiar en Google la URL de callback que indique Netlify. No subir el *Client secret* al repositorio ni al frontend.
5. Dejar el registro abierto para que cualquier persona pueda probarlo, o cambiarlo a invitación si se quiere limitar el acceso.

Netlify maneja el retorno del proveedor y la aplicación procesa el callback al cargar la página. La documentación actual está en [Netlify Identity](https://docs.netlify.com/manage/security/secure-access-to-sites/identity/get-started/) y [proveedores externos](https://docs.netlify.com/manage/security/secure-access-to-sites/identity/registration-login/).

## Eventos que quedan registrados

Las funciones escriben registros JSON en los logs de Netlify para los inicios de sesión, las altas y las solicitudes de cierre de sesión. Incluyen el ID interno de Netlify, email, nombre cuando está disponible, proveedor, fecha, resultado e ID del evento.

No se guardan tokens, códigos OAuth, cookies ni contraseñas. Estos registros sirven para revisar el funcionamiento de la demo; no son una bitácora inmutable ni una base de auditoría con retención garantizada. El cierre de sesión de la app tampoco cierra la cuenta de Google.

## Algunas decisiones

- Uso el ID interno de Netlify Identity para identificar la cuenta en la app. El `sub` original de Google no se expone como identificador de usuario en esta implementación.
- Si Google/Netlify no devuelve el nombre, la pantalla usa el email como alternativa.
- El endpoint que anota el logout comprueba que la llamada venga de una sesión autenticada y del mismo origen. Si el registro falla, la app igual intenta cerrar la sesión.

Antes de compartir el sitio, conviene agregar un aviso de privacidad breve: la app registra accesos y muestra datos básicos de perfil.
