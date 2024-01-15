import assert from "assert";
import type * as ESTree from "estree";
import { getESLint } from "../../src/eslint";
import type { Rule } from "eslint";
// eslint-disable-next-line @typescript-eslint/naming-convention -- class name
const ESLint = getESLint();
describe("getESLint", () => {
  describe("lintText", () => {
    it("The result of lintText should match expectations.", async () => {
      const eslint = new ESLint({
        overrideConfig: {
          plugins: {
            test: {
              rules: {
                test: {
                  create(context: Rule.RuleContext) {
                    return {
                      IfStatement(node: ESTree.IfStatement) {
                        context.report({ node, message: "Foo" });
                      },
                    };
                  },
                },
              },
            },
          } as any,
          rules: {
            "test/test": "error",
            "no-undef": "error",
          },
          ...({
            languageOptions: {
              globals: { console: "readonly", foo: "readonly" },
            },
          } as any),
        },
      });
      const [result] = await eslint.lintText(
        "if (true) { var me = 1; } console.log(foo)",
      );

      assert.deepStrictEqual(
        result.messages.map((m) => ({ message: m.message, ruleId: m.ruleId })),
        [
          {
            message: "Foo",
            ruleId: "test/test",
          },
        ],
      );
    });
  });
});
