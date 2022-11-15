import { dialog, invoke } from '@tauri-apps/api';
import { listen } from '@tauri-apps/api/event';
import { open, save } from '@tauri-apps/api/dialog';
import { writeFile } from '@tauri-apps/api/fs';
import React, { useEffect, useState } from 'react';
import { Paper } from './features/paper/Paper';

import './App.css';
import { store } from './app/store';

function App() {
    const [menuPayload, setMenuPayload] = useState("");
    const [menuOpen, setMenuOpen] = useState(false);

    useEffect(() => {
        invoke('greet', { name: 'uberFoo' })
            .then((result) => {
                let title = result;
                console.log(title);
            })
            .catch(console.error)
    }, []);

    useEffect(() => {
        listen("menu-event", (e) => {
            console.log(e);
            // @ts-ignore
            setMenuPayload(e.payload);
            setMenuOpen(true);
        })
    }, []);

    useEffect(() => {
        if (menuOpen) {
            switch (menuPayload) {
                case "export-schema-event":
                    ExportSchema();
                    break;
                case "export-model-event":
                    ExportModel();
                    break;

                default:
                    break;
            }
            setMenuOpen(false)
        }
    }, [menuOpen]);

    const ExportSchema = () => {
    };

    const ExportModel = async () => {
        let state = store.getState();
        let json = JSON.stringify(state, null, 4);
        let path = await save();
        // @ts-ignore
        await writeFile({ contents: json, path: path });
    };

    return (
        <div className="OIM">
            {/* This is lame, encoding the size of the root before we've got the paper loaded. */}
            <svg id="svg-root" width={3200} height={1600} xmlns='http://www.w3.org/2000/svg'>
                <Paper domain="sarzak_ooa_0" domain_ns="b49d6fe1-e5e9-5896-bd42-b72012429e52" />
            </svg>
        </div>
    );
}

export default App;
