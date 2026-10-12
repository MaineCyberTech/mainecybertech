import type { Preview } from "@storybook/react";
import { ThemeProvider } from "@mct/ui/providers/ThemeProvider";
import { colors } from "@mct/ui/tokens";
import "@mct/ui/styles.css";

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      default: "dark",
      values: [{ name: "dark", value: colors.cyber.base }],
    },
    a11y: {
      // UX-P3-009: the addon was configured but never asserted anything.
      // `test: "error"` makes Chromatic run axe-core against every story and
      // fail the build on violations (Chromatic reads this parameter; the
      // addon alone only renders a local panel). Do not relax this to
      // "todo" to paper over a violation — fix the story or the component.
      test: "error",
      config: {
        rules: [{ id: "color-contrast", enabled: true }],
      },
    },
  },
  decorators: [
    (Story) => (
      <ThemeProvider>
        <div className="cyber-page-bg min-h-[200px] p-4">
          <Story />
        </div>
      </ThemeProvider>
    ),
  ],
};

export default preview;
