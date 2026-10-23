# React + TypeScript + Vite

## Sign-in and admin setup

Customers can sign in with Google or request a one-time code by email. Verifying
an email code creates the account on first sign-in. Email codes expire after 10
minutes, are single-use, and are rate-limited. Admin sign-in is a separate
email/password form at `/admin/login`, with no link from the customer site.
Only existing database users with the `admin` role and a CLI-configured password
can access admin APIs.

1. Copy `.env.example` to `.env` and keep your existing `DATABASE_URL`.
2. In Google Cloud Console, create a Web OAuth client. Add
   `http://localhost:3000/api/auth/google/callback` as an authorized redirect URI.
   Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `.env`.
3. Set `SMTP_USER` and `SMTP_PASS` in `.env` (for example, your Gmail and Google App Password) for sending OTP emails.
4. Generate a private session key with
   `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
   and set the output as `SESSION_SECRET`.
5. Apply the database migrations with `npm run db:migrate`.
6. Set a password on the existing admin account using `npm run admin:set-password`.
   The command verifies that the email belongs to a user already marked `admin`
   and does not echo the password.
7. Restart the app.

For a hosted deployment, add the same server-side settings to the hosting
provider, and register `https://<your-domain>/api/auth/google/callback` as an
authorized Google redirect URI. Never expose these settings as `VITE_*` values.

Product images can be selected from the device in the admin product editor.
JPEG, PNG, WebP, and GIF files up to 5 MB are stored in
`PRODUCT_IMAGE_UPLOAD_DIR` (defaults to `uploads/products`). Configure this
directory as persistent storage in production so uploaded images remain
available across deployments and restarts.

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(["dist"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.node.json", "./tsconfig.app.json"],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
]);
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from "eslint-plugin-react-x";
import reactDom from "eslint-plugin-react-dom";

export default defineConfig([
  globalIgnores(["dist"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs["recommended-typescript"],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.node.json", "./tsconfig.app.json"],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
]);
```
