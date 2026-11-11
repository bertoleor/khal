// Global type declarations for vitest + @testing-library/jest-dom
// This avoids needing to install @testing-library/jest-dom types package

import '@testing-library/jest-dom';

declare global {
  namespace Vi {
    interface Assertion<T> {
      toBeInTheDocument(): T;
      toHaveTextContent(text: string | RegExp): T;
      toHaveAttribute(name: string, value?: string): T;
      toHaveClass(...classNames: string[]): T;
      toHaveValue(value: string | string[] | number): T;
      toBeDisabled(): T;
      toBeEnabled(): T;
      toBeChecked(): T;
      toHaveFocus(): T;
      toHaveFormValues(values: Record<string, any>): T;
      toBeVisible(): T;
      toBeEmptyDOMElement(): T;
      toHaveStyle(css: string | Record<string, any>): T;
    }
  }
}

export {};
