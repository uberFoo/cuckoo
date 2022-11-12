import { dialog, invoke } from '@tauri-apps/api';
import { open } from '@tauri-apps/api/dialog';
import React, { useEffect } from 'react';
import logo from './logo.svg';
import { Paper } from './features/paper/Paper';

import './App.css';

function App() {
    let foo = () => {
        dialog.open({ defaultPath: ".", directory: false, filters: [{ extensions: ['json'], name: '*' }] }).then((bar) => {
            console.log(bar);
        })
    };

    // foo();

    useEffect(() => {
        invoke('greet', { name: 'uberFoo' })
            .then((result) => {
                let title = result;
                console.log(title);
            })
            .catch(console.error)
    }, []);

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
