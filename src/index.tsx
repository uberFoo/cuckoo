import React from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { ThemeProvider, createTheme } from '@mui/material/styles';

// import reportWebVitals from './reportWebVitals';

import { store } from './app/store';
import App from './App';

import './index.css';

import model from './with_obj.json'

const container = document.getElementById('root')!;
const root = createRoot(container);

const theme = createTheme({});

root.render(
  <React.StrictMode>
    <Provider store={store}>
      {/* serverState={model}> */}
      <ThemeProvider theme={theme}>
        <App />
      </ThemeProvider>
    </Provider>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
// reportWebVitals(console.log);
