import type { RouteObject } from 'react-router';
import AppLayout from '@/appLayout';
import QuoteBuilder from './pages/QuoteBuilder';
import NotFound from './pages/NotFound';

export const routes: RouteObject[] = [
  {
    path: '/',
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: <QuoteBuilder />,
        handle: { showInNavigation: false },
      },
      {
        path: '*',
        element: <NotFound />,
      },
    ],
  },
];
