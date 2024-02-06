import { Rule, SchematicContext, Tree, chain, externalSchematic, mergeWith, apply, url, move, noop } from '@angular-devkit/schematics';
import { getSource, findMethodBlockByName, insertBody, findNodeByName, findServiceInNodes, insertService } from '../utility/custom';
import * as ts from 'typescript';
import { camelize } from '@angular-devkit/core/src/utils/strings';
import { getWorkspace } from '../utility/util';

// You don't have to export the function as default. You can also have more than one rule factory
// per file.
export function fontAwesome(_options: any): Rule {
  return (tree: Tree, _context: SchematicContext) => {
    return chain([
      addFontAwesome(_options.project),
      addService()
    ])(tree, _context);
  };
}

/**
 * Do not specify version since it's in the local package.json file
 * Force package to free-solid and init a service with this package
 * @param project : ng project that schematics run on
 */
function addFontAwesome(projectName?: string): Rule {
  return (tree: Tree, context: SchematicContext) => {
    const workspace = getWorkspace(tree);
    const project = projectName ?? workspace.defaultProject!;
    context.logger.debug("Adding fontawesome files");
    return chain([
      externalSchematic('@fortawesome/angular-fontawesome', 'ng-add', {
        project: project,
        iconPackages: ['free-solid']
      }),
      mergeWith(apply(url("./files"), [move("./src/app/shared/services")]))
    ])(
      tree,
      context
    );
  };
}


// Add service to constructor and call it in ngOnInit method
function addService(): Rule {
  return (tree: Tree) => {
    const compFile = './src/app/app.component.ts';
    const toAddBlock = `\n\tthis.utilsService.initFaIcons();\n`;
    const serviceName = 'UtilsService'
    const servicePath = './shared/services/utils.service';
    const toAddParam = `private ${camelize(serviceName)}: ${serviceName}`;
    let sourceFile = getSource(tree, compFile);

    // get constructor
    let parameterListNode = findNodeByName(sourceFile, ts.SyntaxKind.Constructor);
    let parameterNodes = parameterListNode.getChildren();
    // Find a constructor argument
    let paramNode = findServiceInNodes(parameterNodes, serviceName);
    // There is already a respective constructor argument --> nothing to do for us here ...
    if (paramNode) return noop();
    insertService(toAddParam, tree, paramNode, sourceFile, parameterNodes, parameterListNode, serviceName, servicePath, compFile);

    sourceFile = getSource(tree, compFile);
    let methodNode = findMethodBlockByName(sourceFile, ts.SyntaxKind.MethodDeclaration, 'ngOnInit');
    let methodeNodes = methodNode.getChildren();
    insertBody(toAddBlock, tree, methodeNodes, methodNode, compFile);

    return tree;
  }
}
