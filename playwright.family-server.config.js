import {defineConfig} from '@playwright/test';
import base from './playwright.config.js';
export default defineConfig({...base,webServer:[
 {...base.webServer,command:'FINOWN_FAMILY_API_URL=http://127.0.0.1:8786 npm run dev -- --host 127.0.0.1'},
 {command:'FINOWN_FAMILY_PORT=8786 npm run dev:family-server',url:'http://127.0.0.1:8786/family-api/health',reuseExistingServer:false,timeout:45000,gracefulShutdown:{signal:'SIGTERM',timeout:15000}}
]});
