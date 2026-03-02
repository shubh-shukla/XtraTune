"use client";

import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { store, persistor } from "@/store/store";

function HydrationSkeleton() {
  return <div className="min-h-screen bg-background" aria-busy="true" />;
}

export function ReduxProvider({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <PersistGate loading={<HydrationSkeleton />} persistor={persistor}>
        {children}
      </PersistGate>
    </Provider>
  );
}
