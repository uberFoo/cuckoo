import React from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import Backdrop from '@mui/material/CircularProgress';
import { PersistGate } from 'redux-persist/integration/react';
import { ErrorBoundary } from 'react-error-boundary';
import storage from 'redux-persist/lib/storage';
import reportWebVitals from './reportWebVitals';
import CircularProgress from '@mui/material/CircularProgress';

import { store, persistor } from './app/store';
import App from './App';

import './index.css';

// @ts-ignore
// import { greet } from '../xuder';

// greet('World!!!!');


let container = document.getElementById('root')!;
let root = createRoot(container);
let theme = createTheme({
    palette: {
        mode: 'dark',
    },
});

function ErrorFallback({ error }: any) {
    let reset = () => {
        storage.removeItem('persist:root');
        window.location.reload();
    }

    return (
        <div role="alert">
            <p>Something went wrong:</p>
            <pre style={{ color: 'red' }}>{error.message}</pre>
            {/* This doesn't do anything. :-( */}
            <pre style={{ color: 'purple' }}>{error}</pre>
            <p>Click the button to clear the model, and reload from last save.</p>
            <button onClick={reset}>Hard Reset</button>
        </div>
    )
}

root.render(
    <React.StrictMode>
        <Provider store={store}>
            <PersistGate loading={
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center'
                }}>
                    {/* @ts-ignore */}
                    <Backdrop sx={{ color: '#5d3fd3' }}>
                        <CircularProgress color="inherit" />
                    </Backdrop>
                </div>
            } persistor={persistor}>
                <ThemeProvider theme={theme}>
                    <ErrorBoundary FallbackComponent={ErrorFallback}>
                        <App />
                    </ErrorBoundary>
                </ThemeProvider>
            </PersistGate>
        </Provider>
    </React.StrictMode >
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals(console.log);
