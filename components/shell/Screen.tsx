"use client";

import { useReducer } from "react";
import { RunInputProvider } from "@/components/inputs/RunInputProvider";
import { RunArea } from "@/components/run/RunArea";
import { Drawer } from "@/components/ui/Drawer";
import { NOT_CONNECTED, NoticeProvider } from "@/components/ui/Notice";
import { AskTab } from "./AskTab";
import { Footer } from "./Footer";
import { InputPanel } from "./InputPanel";
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
        <RunInputProvider>
          <div className="flex min-h-screen flex-col pb-footer">
            <TopBar data={data} />
            <div className="flex flex-1">
              {/* TODO(build-07): disabled while the loaded version is signed. */}
              <InputPanel disabled={false} />
              <main id="main" className="flex min-w-0 flex-1 flex-col">
                <div className="px-6 pt-6 pb-8 pr-14 desk:px-8 desk:pr-16">
                  <RunHeader />
                  <RunArea />
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
        </RunInputProvider>
      </NoticeProvider>
    </ScreenContext.Provider>
  );
}
