import { dialog, invoke } from '@tauri-apps/api';
import { CssBaseline } from '@mui/material';
import { listen } from '@tauri-apps/api/event';
import { open, save } from '@tauri-apps/api/dialog';
import { readTextFile, writeFile } from '@tauri-apps/api/fs';
import React, { useEffect, useState } from 'react';
import { Paper } from './features/paper/Paper';
import { selectPaperSingleton } from './features/paper/paperSlice';
import { useAppSelector } from './app/hooks';
import { store } from './app/store';

import './App.css';

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
                case "import-model-event":
                    ImportModel();
                    break;

                default:
                    break;
            }
            setMenuOpen(false)
        }
    }, [menuOpen, menuPayload]);

    const ImportModel = async () => {
        try {
            let path = await open();
            // @ts-ignore
            let content = await readTextFile(path);

            let state = store.getState();
            state = JSON.parse(content);
            // @ts-ignore
            // console.log(content);
        } catch (e) {
            console.error(e);
        }
    };

    const ExportSchema = () => {
    };

    const ExportModel = async () => {
        let state = store.getState();
        let json = JSON.stringify(state, null, 4);
        let path = await save();
        // @ts-ignore
        await writeFile({ contents: json, path: path });
    };

    let paper_obj = useAppSelector((state) => selectPaperSingleton(state));
    let { x, y } = paper_obj!.offset;

    return (
        <>
            <CssBaseline />
            <div className="OIM">
                <Paper domain={paper_obj!.domain_name} domain_ns={paper_obj!.domain_ns} x={x} y={y} />
            </div>
        </>
    );
}

export default App;
