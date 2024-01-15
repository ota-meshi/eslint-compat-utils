import assert from "assert";
import type * as ESTree from "estree";
import { getSourceCode } from "../../src";
import type { Scope } from "eslint";
import { getLinter } from "../../src/linter";
import type { Rule } from "eslint";
// eslint-disable-next-line @typescript-eslint/naming-convention -- class name
const Linter = getLinter();
describe("getSourceCode", () => {
  describe("getAncestors", () => {
    it("The result of getAncestors should match your expectations.", () => {
      const linter = new Linter();
      let ancestors: ESTree.Node[] = [];
      linter.verify("if (true) { var me = 1; }", {
        plugins: {
          test: {
            rules: {
              "test-rule": {
                create(context: Rule.RuleContext) {
                  return {
                    "Identifier[name=me]"(node: ESTree.Identifier) {
                      ancestors = getSourceCode(context).getAncestors(node);
                    },
                  };
                },
              },
            },
          },
        } as any,
        rules: {
          "test/test-rule": "error",
        },
      });

      assert.strictEqual(ancestors.length, 5);
      assert.deepStrictEqual(
        ancestors.map((n) => n.type),
        [
          "Program",
          "IfStatement",
          "BlockStatement",
          "VariableDeclaration",
          "VariableDeclarator",
        ],
      );
    });
  });
  describe("getDeclaredVariables", () => {
    it("The result of getDeclaredVariables should match your expectations.", () => {
      const linter = new Linter();
      let variables: Scope.Variable[] = [];
      linter.verify("var {x,y} = {}", {
        languageOptions: { ecmaVersion: 2015 },
        plugins: {
          test: {
            rules: {
              test: {
                create(context: Rule.RuleContext) {
                  return {
                    VariableDeclaration(node: ESTree.VariableDeclaration) {
                      variables =
                        getSourceCode(context).getDeclaredVariables(node);
                    },
                  };
                },
              },
            },
          },
        },
        rules: {
          "test/test": "error",
        },
      } as any);

      assert.strictEqual(variables.length, 2);
      assert.deepStrictEqual(
        variables.map((n) => n.name),
        ["x", "y"],
      );
    });
  });
  describe("markVariableAsUsed", () => {
    it("The result of markVariableAsUsed should match your expectations.", () => {
      const linter = new Linter();
      const result = linter.verify("var me", {
        plugins: {
          test: {
            rules: {
              test: {
                create(context: Rule.RuleContext) {
                  return {
                    "Identifier[name=me]"(node: ESTree.Identifier) {
                      getSourceCode(context).markVariableAsUsed(
                        node.name,
                        node,
                      );
                    },
                  };
                },
              },
            },
          },
        } as any,
        rules: {
          "test/test": "error",
          "no-unused-vars": "error",
        },
      });

      assert.strictEqual(result.length, 0);
    });
  });
});
