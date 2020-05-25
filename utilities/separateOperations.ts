import { ObjMap } from '../utilities/ObjMap.ts';

import { Kind } from '../language/kinds.ts';
import { visit } from '../language/visitor.ts';
import {
DocumentNode,
OperationDefinitionNode,
} from '../language/ast.ts';

/**
 * separateOperations accepts a single AST document which may contain many
 * operations and fragments and returns a collection of AST documents each of
 * which contains a single operation as well the fragment definitions it
 * refers to.
 */
export function separateOperations(
  documentAST: DocumentNode,
): ObjMap<DocumentNode> {
  const operations: OperationDefinitionNode[] = [];
  const depGraph: DepGraph = Object.create(null);
  let fromName: string;

  // Populate metadata and build a dependency graph.
  visit(documentAST, {
    OperationDefinition(node) {
      fromName = opName(node);
      operations.push(node);
    },
    FragmentDefinition(node) {
      fromName = node.name.value;
    },
    FragmentSpread(node) {
      const toName = node.name.value;
      let dependents = depGraph[fromName];
      if (dependents === undefined) {
        dependents = depGraph[fromName] = Object.create(null);
      }
      dependents[toName] = true;
    },
  });

  // For each operation, produce a new synthesized AST which includes only what
  // is necessary for completing that operation.
  const separatedDocumentASTs = Object.create(null);
  for (const operation of operations) {
    const operationName = opName(operation);
    const dependencies = Object.create(null);
    collectTransitiveDependencies(dependencies, depGraph, operationName);

    // The list of definition nodes to be included for this operation, sorted
    // to retain the same order as the original document.
    separatedDocumentASTs[operationName] = {
      kind: Kind.DOCUMENT,
      definitions: documentAST.definitions.filter(
        (node) =>
          node === operation ||
          (node.kind === Kind.FRAGMENT_DEFINITION &&
            dependencies[node.name.value]),
      ),
    };
  }

  return separatedDocumentASTs;
}

type DepGraph = ObjMap<ObjMap<boolean>>;

// Provides the empty string for anonymous operations.
function opName(operation: OperationDefinitionNode): string {
  return operation.name ? operation.name.value : '';
}

// From a dependency graph, collects a list of transitive dependencies by
// recursing through a dependency graph.
function collectTransitiveDependencies(
  collected: ObjMap<boolean>,
  depGraph: DepGraph,
  fromName: string,
): void {
  const immediateDeps = depGraph[fromName];
  if (immediateDeps) {
    for (const toName of Object.keys(immediateDeps)) {
      if (!collected[toName]) {
        collected[toName] = true;
        collectTransitiveDependencies(collected, depGraph, toName);
      }
    }
  }
}
