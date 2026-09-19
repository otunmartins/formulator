"use client";

import { useReducer } from "react";
import { Drawer } from "@/components/ui/Drawer";
import { NOT_CONNECTED, NoticeProvider } from "@/components/ui/Notice";
import { AskTab } from "./AskTab";
import { EmptyState } from "./EmptyState";
import { Footer } from "./Footer";
import { InputPanel } from "./InputPanel";
import { ProgressStrip } from "./ProgressStrip";
import { ReviewBar } from "./ReviewBar";
import { RunHeader } from "./RunHeader";
import { initialScreenState, ScreenContext, screenReducer } from "./screenState";
import { TopBar } from "./TopBar";
import type { ShellData } from "./types";

export interface ScreenProps {
  data: ShellData;
}

/** The client shell for the one screen: every region, with state changing in place. */
export function Screen({ data }: ScreenProps) {
  const [state, dispatch] = useReducer(screenReducer, initialScreenState);

  return (
    <ScreenContext.Provider value={{ state, dispatch }}>
      <NoticeProvider>
        <div className="flex min-h-screen flex-col pb-footer">
          <TopBar data={data} />
          <div className="flex flex-1">
            <InputPanel />
            <main id="main" className="flex min-w-0 flex-1 flex-col">
              <div className="px-6 pt-6 pb-8 pr-14 desk:px-8 desk:pr-16">
                <RunHeader />
                <ProgressStrip />
                <EmptyState />
              </div>
              <ReviewBar />
            </main>
          </div>
          <AskTab />
          <Drawer
            open={state.drawer === "ask"}
            onClose={() => dispatch({ type: "closeDrawer" })}
            title="Ask about this result"
          >
            {/* TODO(build-08): dossier-limited Q&A. */}
            <p className="text-[13px] text-muted">{NOT_CONNECTED}.</p>
          </Drawer>
          <Footer />
        </div>
      </NoticeProvider>
    </ScreenContext.Provider>
  );
}
