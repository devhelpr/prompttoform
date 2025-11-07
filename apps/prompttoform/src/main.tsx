import { StrictMode } from 'react';
import { BrowserRouter } from 'react-router-dom';
import * as ReactDOM from 'react-dom/client';
import App from './app/app';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
);

/*
 * Grid utility classes - included to ensure Tailwind compiles these classes
 * even when they're used dynamically at runtime (e.g., from JSON form definitions)
 *
 * Grid display:
 * grid grid-cols-1 grid-cols-2 grid-cols-3 grid-cols-4 grid-cols-5 grid-cols-6
 * grid-cols-7 grid-cols-8 grid-cols-9 grid-cols-10 grid-cols-11 grid-cols-12
 *
 * Column span:
 * col-span-1 col-span-2 col-span-3 col-span-4 col-span-5 col-span-6
 * col-span-7 col-span-8 col-span-9 col-span-10 col-span-11 col-span-12
 * col-span-full col-auto
 *
 * Row span:
 * row-span-1 row-span-2 row-span-3 row-span-4 row-span-5 row-span-6
 * row-span-full row-auto
 *
 * Gap:
 * gap-0 gap-1 gap-2 gap-3 gap-4 gap-5 gap-6 gap-8 gap-10 gap-12 gap-16 gap-20 gap-24
 * gap-x-0 gap-x-1 gap-x-2 gap-x-3 gap-x-4 gap-x-5 gap-x-6 gap-x-8 gap-x-10 gap-x-12 gap-x-16 gap-x-20 gap-x-24
 * gap-y-0 gap-y-1 gap-y-2 gap-y-3 gap-y-4 gap-y-5 gap-y-6 gap-y-8 gap-y-10 gap-y-12 gap-y-16 gap-y-20 gap-y-24
 *
 * Grid auto:
 * auto-cols-auto auto-cols-min auto-cols-max auto-cols-fr
 * auto-rows-auto auto-rows-min auto-rows-max auto-rows-fr
 *
 * Grid template columns:
 * grid-cols-none grid-cols-subgrid
 *
 * Grid template rows:
 * grid-rows-1 grid-rows-2 grid-rows-3 grid-rows-4 grid-rows-5 grid-rows-6
 * grid-rows-none grid-rows-subgrid
 *
 * Grid flow:
 * grid-flow-row grid-flow-col grid-flow-dense grid-flow-row-dense grid-flow-col-dense
 *
 * Grid auto flow:
 * auto-flow-row auto-flow-col auto-flow-dense auto-flow-row-dense auto-flow-col-dense
 *
 * Place items:
 * place-items-auto place-items-start place-items-end place-items-center place-items-stretch
 *
 * Place content:
 * place-content-center place-content-start place-content-end place-content-between
 * place-content-around place-content-evenly place-content-baseline place-content-stretch
 *
 * Place self:
 * place-self-auto place-self-start place-self-end place-self-center place-self-stretch
 *
 * Justify items:
 * justify-items-start justify-items-end justify-items-center justify-items-stretch
 *
 * Justify self:
 * justify-self-auto justify-self-start justify-self-end justify-self-center justify-self-stretch
 *
 * Align items:
 * items-start items-end items-center items-baseline items-stretch
 *
 * Align self:
 * self-auto self-start self-end self-center self-stretch self-baseline
 *
 * Grid column start/end:
 * col-start-1 col-start-2 col-start-3 col-start-4 col-start-5 col-start-6 col-start-7
 * col-start-8 col-start-9 col-start-10 col-start-11 col-start-12 col-start-13 col-start-auto
 * col-end-1 col-end-2 col-end-3 col-end-4 col-end-5 col-end-6 col-end-7
 * col-end-8 col-end-9 col-end-10 col-end-11 col-end-12 col-end-13 col-end-auto
 *
 * Grid row start/end:
 * row-start-1 row-start-2 row-start-3 row-start-4 row-start-5 row-start-6 row-start-7
 * row-start-auto
 * row-end-1 row-end-2 row-end-3 row-end-4 row-end-5 row-end-6 row-end-7
 * row-end-auto
 */
