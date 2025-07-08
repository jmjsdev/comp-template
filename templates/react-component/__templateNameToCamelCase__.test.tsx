import React from "react";
import { render, screen } from "@testing-library/react";
import { __templateNameToPascalCase__ } from "./__templateNameToDashCase__";

describe("__templateNameToPascalCase__", () => {
  it("renders without crashing", () => {
    render(<__templateNameToPascalCase__ />);
    expect(screen.getByText("__templateNameToPascalCase__ Component")).toBeInTheDocument();
  });

  it("has correct CSS class", () => {
    render(<__templateNameToPascalCase__ />);
    expect(screen.getByText("__templateNameToPascalCase__ Component")).toHaveClass("__templateNameToDashCase__");
  });
});
