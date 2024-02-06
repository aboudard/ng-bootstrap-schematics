import {
  Rule,
  Tree,
  SchematicContext,
  SchematicsException,
  apply,
  mergeWith,
  Source,
  forEach
} from "@angular-devkit/schematics";
import { NodePackageInstallTask } from "@angular-devkit/schematics/tasks";

import { createSourceFile, ScriptTarget } from "typescript";
import { parseJsonAtPath } from './util';
import * as ts from 'typescript';
import { getSourceNodes, insertImport } from '@schematics/angular/utility/ast-utils';
import { InsertChange } from '@schematics/angular/utility/change';
import { WorkspaceProject } from "@schematics/angular/utility/workspace-models";

export function installDependencies(): Rule {
  return (tree: Tree, context: SchematicContext) => {
    context.addTask(new NodePackageInstallTask());
    context.logger.debug("✅️ Dependencies installed");
    return tree;
  };
}

export function getProjectTargetOptions(
  project: WorkspaceProject,
  buildTarget: string
) {
  if (
    project.targets &&
    project.targets[buildTarget] &&
    project.targets[buildTarget].options
  ) {
    return project.targets[buildTarget].options;
  }

  if (
    project.architect &&
    project.architect[buildTarget] &&
    project.architect[buildTarget].options
  ) {
    return project.architect[buildTarget].options;
  }

  throw new SchematicsException(
    `Cannot determine project target configuration for: ${buildTarget}.`
  );
}

export function getSourceFile(host: Tree, path: string) {
  const buffer = host.read(path);
  if (!buffer) {
    throw new SchematicsException(`Could not find ${path}.`);
  }
  const content = buffer.toString('utf-8');
  return createSourceFile(path, content, ScriptTarget.Latest, true);
}


export function applyWithOverwrite(source: Source, rules: Rule[]): Rule {
  return (tree: Tree, _context: SchematicContext) => {
    const rule = mergeWith(
      apply(source, [
        ...rules,
        forEach((fileEntry) => {
          if (tree.exists(fileEntry.path)) {
            tree.overwrite(fileEntry.path, fileEntry.content);
            return null;
          }
          return fileEntry;
        }),

      ]),
    );

    return rule(tree, _context);
  };
}

export function getAngularJsonValue(tree: Tree): any {
  const angularJsonAst = parseJsonAtPath(tree, "./angular.json");
  return angularJsonAst.value as any;
}

export function getProject(angularJsonValue: any): string {
  return angularJsonValue.defaultProject;
}

export function findSuccessor(node: ts.Node, searchPath: ts.SyntaxKind[]) {
  let children = node.getChildren();
  let next: ts.Node | undefined = undefined;

  for (let syntaxKind of searchPath) {
    next = children.find(n => n.kind == syntaxKind);
    if (!next) return null;
    children = next.getChildren();
  }
  return next;
}


export function getSource(tree: Tree, compFile: string): ts.SourceFile {
  let text = tree.read(compFile);
  if (!text) {
    throw new SchematicsException(`File <span class="hljs-subst">app.component</span> does not exist.`);
  }
  let sourceText = text.toString('utf-8');
  return ts.createSourceFile(compFile, sourceText, ts.ScriptTarget.Latest, true);
}

export function findMethodBlockByName(sourceFile: ts.SourceFile, kind: ts.SyntaxKind, name: string): ts.Node {
  let nodes = getSourceNodes(sourceFile);
  let nodeMethod = nodes.find(n => {
    if (n.kind == kind) {
      let ch = n.getChildren();
      let ni = ch.find(no => {
        return no.kind == ts.SyntaxKind.Identifier
      });
      if (ni?.getText() == name) {
        return true
      }
    }
  });

  let siblings = nodeMethod?.getChildren();
  let tmpNodes = siblings?.find(n => n.kind === ts.SyntaxKind.Block);
  let tmpChildren = tmpNodes?.getChildren();
  let tmpNode = tmpChildren?.find(n => n.kind === ts.SyntaxKind.SyntaxList);
  if (!tmpNode) {
    throw new SchematicsException(`findMethodBlockByName - method ${name} not found in ${sourceFile.fileName}`);
  }
  return tmpNode;
}
export function findNodeByName(sourceFile: ts.SourceFile, kind: ts.SyntaxKind): ts.Node {
  let nodes = getSourceNodes(sourceFile);
  let ctorNode = nodes.find(n => n.kind == kind);
  let siblings = ctorNode?.getChildren();
  let parameterListNode = siblings?.find(n => n.kind === ts.SyntaxKind.SyntaxList);

  if (!parameterListNode) {
    throw new SchematicsException(`findNodeByName - No ${ts.SyntaxKind[kind]} found in ${sourceFile.fileName}`);
  }
  return parameterListNode;
}

export function findNodeBlockByName(sourceFile: ts.SourceFile, kind: ts.SyntaxKind): ts.Node {
  let nodes = getSourceNodes(sourceFile);
  let ctorNode = nodes.find(n => n.kind == kind);
  let siblings = ctorNode?.getChildren();
  let tmpNodes = siblings?.find(n => n.kind === ts.SyntaxKind.Block);
  let tmpChildren = tmpNodes?.getChildren();
  let tmpNode = tmpChildren?.find(n => n.kind === ts.SyntaxKind.SyntaxList);
  if (!tmpNode) {
    throw new SchematicsException(`findNodeBlockByName - Expected type to have a parameter list`);
  }
  return tmpNode;
}

export function findServiceInNodes(parameterNodes: ts.Node[], serviceName: string) {
  return parameterNodes.find(p => {
    let typeNode = findSuccessor(p, [ts.SyntaxKind.TypeReference, ts.SyntaxKind.Identifier]);
    if (!typeNode) return false;
    return typeNode.getText() === serviceName;
  });
}

export function insertService(
  toAdd: string,
  tree: Tree,
  paramNode: any,
  sourceFile: ts.SourceFile,
  parameterNodes: ts.Node[],
  parameterListNode: ts.Node,
  serviceName: string,
  servicePath: string,
  compFile: string
): void {

  let insertChanges: any[] = [];
  // Is the new argument the first one?
  if (!paramNode && parameterNodes.length == 0) {
    insertChanges.push(new InsertChange(compFile, parameterListNode.pos, toAdd));
  }
  else if (!paramNode && parameterNodes.length > 0) {
    let lastParameter = parameterNodes[parameterNodes.length - 1];
    insertChanges.push(new InsertChange(compFile, lastParameter.end, `, ${toAdd}`));
  }

  insertChanges.push(insertImport(sourceFile, compFile, serviceName, servicePath));

  const declarationRecorder = tree.beginUpdate(compFile);
  for (let change of insertChanges) {
    if (change instanceof InsertChange) {
      declarationRecorder.insertLeft(change.pos, change.toAdd);
    }
  }
  tree.commitUpdate(declarationRecorder);
}

export function insertBody(
  toAdd: string,
  tree: Tree,
  parameterNodes: ts.Node[],
  parameterListNode: ts.Node,
  compFile: string
) {
  let insertChanges: any[] = [];
  // Is the new argument the first one?
  if (parameterNodes.length == 0) {
    insertChanges.push(new InsertChange(compFile, parameterListNode.pos, toAdd));
  }
  else if (parameterNodes.length > 0) {
    let lastParameter = parameterNodes[parameterNodes.length - 1];
    insertChanges.push(new InsertChange(compFile, lastParameter.end, toAdd));
  }

  const declarationRecorder = tree.beginUpdate(compFile);
  for (let change of insertChanges) {
    if (change instanceof InsertChange) {
      declarationRecorder.insertLeft(change.pos, change.toAdd);
    }
  }
  tree.commitUpdate(declarationRecorder);
}