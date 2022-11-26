import React from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import Backdrop from '@mui/material/CircularProgress';
import { PersistGate } from 'redux-persist/integration/react';

import { store, persistor } from './app/store';

// import reportWebVitals from './reportWebVitals';

import App from './App';

import './index.css';
import CircularProgress from '@mui/material/CircularProgress';

let container = document.getElementById('root')!;
let root = createRoot(container);
let theme = createTheme({
  palette: {
    mode: 'dark',
  },
});

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
          <App />
        </ThemeProvider>
      </PersistGate>
    </Provider>
  </React.StrictMode >
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
// reportWebVitals(console.log);
