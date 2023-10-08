import type * as ESTree from "estree";

type HasParentNode = ESTree.Node & { parent: HasParentNode | null };
/**
 * Get parent node from the given node.
 */
export function getParent(node: ESTree.Node): HasParentNode | null {
  return (node as any).parent;
}
