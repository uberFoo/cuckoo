import { dialog, invoke } from '@tauri-apps/api';
import { CssBaseline } from '@mui/material';
import { listen } from '@tauri-apps/api/event';
import { open, save } from '@tauri-apps/api/dialog';
import { readTextFile, writeFile } from '@tauri-apps/api/fs';
import React, { useEffect, useState } from 'react';

import { Paper } from './features/paper/Paper';
import { selectPaperSingleton } from './features/paper/paperSlice';
import { useAppSelector } from './app/hooks';
import { store, OpenModel } from './app/store';

import './App.css';

function App() {
    const [menuPayload, setMenuPayload] = useState("");
    const [menuOpen, setMenuOpen] = useState(false);

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
                case "open-model-event":
                    OpenModel();
                    break;
                case 'save-model-event':
                    SaveModel();
                    break;

                default:
                    break;
            }
            setMenuOpen(false)
        }
    }, [menuOpen, menuPayload]);

    const OpenModel = async () => OpenModel;

    const ExportSchema = async () => {
        let state = store.getState();
        // Yank out the paper, since it's not really part of the schema.
        let { objects, relationships } = state.present;

        // Need to un-normalize it.
        let obj = objects.ids.map(id => { return { Object: objects.entities[id] }; });
        let rel = relationships.ids.map(id => { return { Relationship: relationships.entities[id] }; });

        // Make it pretty too.
        let json = JSON.stringify({ Objects: obj, Relationships: rel }, null, 4);

        let path = await save({
            title: 'Export Schema',
            filters: [{ name: 'Schema', extensions: ['json'] }]
        });

        if (path?.split('.json').length !== 2) {
            path! += '.json';
        }

        await writeFile({ contents: json, path: path! });
    };

    const ExportModel = async () => {
        let state = store.getState();
        // If we export with history, and import later, for some reason our state doesn't
        // persist from then forward. I.e., reloading the page brings up the state from
        // disk.
        let json = JSON.stringify(state);

        let path = await save({
            title: 'Save Model',
            filters: [{ name: 'Schema', extensions: ['json'] }]
        });

        if (path?.split('.json').length !== 2) {
            path! += '.json';
        }

        await writeFile({ contents: json, path: path! });
    };

    const SaveModel = async () => {
        let state = store.getState();
        // If we export with history, and import later, for some reason our state doesn't
        // persist from then forward. I.e., reloading the page brings up the state from
        // disk.
        let { present } = state;
        let json = JSON.stringify(present);

        let path = await save({
            title: 'Save Model',
            filters: [{ name: 'Schema', extensions: ['json'] }]
        });

        if (path?.split('.json').length !== 2) {
            path! += '.json';
        }

        await writeFile({ contents: json, path: path! });
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
