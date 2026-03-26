import { RouterProvider } from 'react-router';
import { router } from './routes';
import { Toaster } from 'sonner';

export default function App() {
  return (
    <div className="contents">
      <RouterProvider router={router} />
      <Toaster position="top-center" richColors dir="rtl" />
    </div>
  );
}