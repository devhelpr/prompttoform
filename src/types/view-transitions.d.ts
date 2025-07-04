// View Transition API TypeScript declarations

interface ViewTransition {
  finished: Promise<void>;
  ready: Promise<void>;
  updateCallbackDone: Promise<void>;
}

interface Document {
  startViewTransition?: (
    updateCallback: () => void | Promise<void>
  ) => ViewTransition;
}

declare global {
  interface Document {
    startViewTransition?: (
      updateCallback: () => void | Promise<void>
    ) => ViewTransition;
  }
}
