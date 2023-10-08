import type { SourceCode, Rule, Scope } from "eslint";
import type * as ESTree from "estree";
import type { V6SourceCodeProps } from "./v6-props";
import { applyPolyfills } from "./lib/apply-polyfills";
import { getParent } from "./lib/get-parent";

type MaybeV6SourceCode = Pick<SourceCode, V6SourceCodeProps & keyof SourceCode>;

const cache = new WeakMap<MaybeV6SourceCode, SourceCode>();

/**
 * Returns an extended instance of `context.sourceCode` or the result of `context.getSourceCode()`.
 * Extended instances can use new APIs such as `getScope(node)` even with old ESLint.
 */
export function getSourceCode(context: Rule.RuleContext): SourceCode {
  const original: MaybeV6SourceCode =
    context.sourceCode || context.getSourceCode();

  const cached = cache.get(original);
  if (cached) {
    return cached;
  }

  const sourceCode = applyPolyfills(original, {
    getScope(node: ESTree.Node) {
      const inner = node.type !== "Program";
      for (let n: ESTree.Node | null = node; n; n = getParent(n)) {
        const scope = original.scopeManager.acquire(n, inner);
        if (scope) {
          if (scope.type === "function-expression-name") {
            return scope.childScopes[0];
          }
          return scope;
        }
      }
      return original.scopeManager.scopes[0];
    },
    markVariableAsUsed(name: string, refNode = original.ast) {
      const currentScope = sourceCode.getScope(refNode);
      if (currentScope === context.getScope()) {
        return context.markVariableAsUsed(name);
      }
      //
      let initialScope = currentScope;
      if (
        currentScope.type === "global" &&
        currentScope.childScopes.length > 0 &&
        currentScope.childScopes[0].block === original.ast
      ) {
        initialScope = currentScope.childScopes[0];
      }

      for (
        let scope: Scope.Scope | null = initialScope;
        scope;
        scope = scope.upper
      ) {
        const variable = scope.variables.find(
          (scopeVar) => scopeVar.name === name,
        );

        if (variable) {
          (variable as any).eslintUsed = true;
          return true;
        }
      }

      return false;
    },
    getAncestors(node: ESTree.Node) {
      const result: ESTree.Node[] = [];
      for (
        let ancestor = getParent(node);
        ancestor;
        ancestor = ancestor.parent
      ) {
        result.unshift(ancestor);
      }
      return result;
    },
    getDeclaredVariables(node: ESTree.Node) {
      return original.scopeManager.getDeclaredVariables(node);
    },
    isSpaceBetween(first: ESTree.Node, second: ESTree.Node) {
      if (
        first.range![0] <= second.range![1] &&
        second.range![0] <= first.range![1]
      ) {
        return false;
      }
      const [startingNodeOrToken, endingNodeOrToken] =
        first.range![1] <= second.range![0] ? [first, second] : [second, first];
      const tokens = sourceCode.getTokensBetween(first, second, {
        includeComments: true,
      });
      let startIndex = startingNodeOrToken.range![1];
      for (const token of tokens) {
        if (startIndex !== token.range![0]) {
          return true;
        }
        startIndex = token.range![1];
      }
      return startIndex !== endingNodeOrToken.range![0];
    },
  });

  cache.set(original, sourceCode);
  return sourceCode;
}
