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
      // test.step()/test.info() only exist inside a running test. When the page
      // objects are reused outside one (e.g. globalSetup), run the method
      // directly instead of wrapping it in a step.
      let inTest = true;
      try {
        test.info();
      } catch {
        inTest = false;
      }
      if (!inTest) {
        return target.call(this, ...args);
      }
      return test.step(name, async () => target.call(this, ...args), {
        box: true,
      });
    }
    return replacementMethod;
  };
}
