import { test } from "@playwright/test";

export function step<This, Args extends any[], Return>(message?: string) {
  return function actualDecorator(
    target: (this: This, ...args: Args) => Promise<Return>,
    context: ClassMethodDecoratorContext<
      This,
      (this: This, ...args: Args) => Promise<Return>
    >
  ) {
    function replacementMethod(this: any, ...args: Args) {
      const name =
        message ?? `${this.constructor.name}.${context.name as string}`;
      try {
        return test.step(name, async () => target.call(this, ...args), {
          box: true,
        });
      } catch {
        return target.call(this, ...args);
      }
    }
    return replacementMethod;
  };
}
