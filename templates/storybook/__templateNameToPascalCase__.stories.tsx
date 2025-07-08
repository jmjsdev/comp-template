import type { Meta, StoryObj } from "@storybook/react";
import { __templateNameToPascalCase__ } from "./__templateNameToPascalCase__";

const meta = {
  title: "Example/__templateNameToPascalCase__",
  component: __templateNameToPascalCase__,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    // Define your component props here
  },
} satisfies Meta<typeof __templateNameToPascalCase__>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    // Default props values
  },
};

export const WithProps: Story = {
  args: {
    // Example with different props
  },
};

export const Interactive: Story = {
  args: {
    // Interactive example
  },
  play: async ({ canvasElement }) => {
    // Add interactions here if needed
  },
};
