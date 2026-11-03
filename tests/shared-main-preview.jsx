// DEV-only genuine local Supabase Auth; never connect this harness to production.
import React from 'react';
import {createRoot} from 'react-dom/client';
import {MemoryRouter} from 'react-router-dom';
import App from '../src/App';
import {familyAuth} from '../src/family/authClient';
import '../src/index.css';
if(import.meta.env.DEV)familyAuth().then(auth=>createRoot(document.getElementById('root')).render(<App auth={auth} Router={MemoryRouter}/>));
