/*
|--------------------------------------------------------------------------
| TS-Exec ESM hook
|--------------------------------------------------------------------------
|
| Importing this file before any other file will allow you to run TypeScript
| code directly using TS-Exec. For example
|
| node --import="./tsnode.esm.js" bin/test.ts
| node --import="./tsnode.esm.js" audit.ts
|
|
| Why not use "--loader"?
| Because, loaders have been deprecated.
*/

import '@poppinss/ts-exec'
