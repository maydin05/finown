import React from 'react';
import {createRoot} from 'react-dom/client';
import {MemoryRouter} from 'react-router-dom';
import FamilyServer from '../src/family/FamilyServer';
import '../src/index.css';
if(import.meta.env.DEV)createRoot(document.getElementById('root')).render(<MemoryRouter><div className="app-shell"><FamilyServer/></div></MemoryRouter>);
