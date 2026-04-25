import { Outlet } from 'react-router';

export default function AppLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="h-16 border-b bg-white flex items-center px-6 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-primary">Quote Builder</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">
            Salesforce
          </span>
        </div>
      </header>
      <Outlet />
    </div>
  );
}
