/**
 * __templateNameToPascalCase__ Stories
 *
 * This is a Storybook file for the __templateNameToPascalCase__ component.
 *
 * Usage
 *
 * This file contains various stories (scenarios) for the __templateNameToPascalCase__ component:
 *
 * - **Default**: The basic component with default props
 * - **WithProps**: Example with different props configuration
 * - **Interactive**: Story with interactions for testing
 *
 * Prerequisites
 *
 * Make sure you have Storybook installed in your project:
 *
 * ```bash
 * npx storybook@latest init
 * ```
 *
 * Running Stories
 *
 * ```bash
 * npm run storybook
 * ```
 */

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
