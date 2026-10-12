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
