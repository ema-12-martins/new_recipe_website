import type { RecognitionProvider } from "./types";

/** Deterministic provider for tests and local runs; never touches the photos. */
export const stubProvider: RecognitionProvider = {
  name: "stub",
  async recognize({ signal }) {
    signal.throwIfAborted();
    return {
      draft: {
        title: "Bolo de laranja",
        ingredients: ["4 ovos", "1/2 chávena de açúcar", "Sumo de 2 laranjas"],
        steps: [
          "Bater os ovos com o açúcar.",
          "Juntar o sumo de laranja.",
          "Levar ao forno a 180 °C durante 40 minutos.",
        ],
      },
      confidence: null,
    };
  },
};
