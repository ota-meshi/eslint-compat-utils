import assert from "assert";
import type * as ESTree from "estree";
import { getSourceCode } from "../../src";
import type { Scope } from "eslint";
import { Linter } from "eslint";

describe("getSourceCode", () => {
  describe("getAncestors", () => {
    it("The result of getAncestors should match your expectations.", () => {
      const linter = new Linter();
      let ancestors: ESTree.Node[] = [];
      linter.defineRule("test-rule", {
        create(context) {
          return {
            "Identifier[name=me]"(node: ESTree.Identifier) {
              ancestors = getSourceCode(context).getAncestors(node);
            },
          };
        },
      });
      linter.verify("if (true) { var me = 1; }", {
        rules: {
          "test-rule": "error",
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
      linter.defineRule("test-rule", {
        create(context) {
          return {
            VariableDeclaration(node: ESTree.VariableDeclaration) {
              variables = getSourceCode(context).getDeclaredVariables(node);
            },
          };
        },
      });
      linter.verify("var {x,y} = {}", {
        parserOptions: { ecmaVersion: 2015 },
        rules: {
          "test-rule": "error",
        },
      });

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
      linter.defineRule("test-rule", {
        create(context) {
          return {
            "Identifier[name=me]"(node: ESTree.Identifier) {
              getSourceCode(context).markVariableAsUsed(node.name, node);
            },
          };
        },
      });
      const result = linter.verify("var me", {
        rules: {
          "test-rule": "error",
          "no-unused-vars": "error",
        },
      });

      assert.strictEqual(result.length, 0);
    });
  });
});
