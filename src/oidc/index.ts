import { Rule, SchematicContext, Tree, chain, SchematicsException, mergeWith, apply, url, move, noop } from '@angular-devkit/schematics';
import { NodePackageInstallTask } from '@angular-devkit/schematics/tasks';
import { addPackageJsonDependency, NodeDependencyType } from '../utility/dependencies';
import { ngoidcVersion, oidcClientVersion } from './versions';
import { getWorkspace } from '../utility/util';
import {
  getProjectTargetOptions, getAngularJsonValue,
  findNodeByName, getSource, findServiceInNodes, insertService, insertBody, findMethodBlockByName, getSourceFile
} from '../utility/custom';
import { getAppModulePath } from '@schematics/angular/utility/ng-ast-utils';
import { addImportToModule } from '@schematics/angular/utility/ast-utils';
import { InsertChange } from '@schematics/angular/utility/change';
import * as ts from 'typescript';
import { camelize } from '@angular-devkit/core/src/utils/strings';


// You don't have to export the function as default. You can also have more than one rule factory
// per file.
export function oidc(_options: any): Rule {

  let angularJsonVal;

  return (tree: Tree, _context: SchematicContext) => {

    angularJsonVal = getAngularJsonValue(tree);
    const workspace = getWorkspace(tree);
    const project = _options.project ?? workspace.defaultProject!;

    return chain([
      updateDependencies(),
      modifyAngularJson(angularJsonVal, project),
      addModule(project),
      injectServiceIntoAppComponent(),
      mergeWith(apply(url("./files"), [move("./src/")]))
    ])(tree, _context);
  };
}

function updateDependencies(): Rule {
  return (tree: Tree, context: SchematicContext) => {
    context.logger.debug("Updating dependencies...");
    context.addTask(new NodePackageInstallTask());
    addPackageJsonDependency(tree, {
      type: NodeDependencyType.Default,
      name: "oidc-client",
      version: oidcClientVersion
    });
    return tree;
  };
}

function addModule(projectName?: string): Rule {
  return (tree: Tree) => {
    const workspace = getWorkspace(tree);
    const project =
      workspace.projects[projectName || workspace.defaultProject!];
    const buildOptions = getProjectTargetOptions(project, "build");
    const modulePath = getAppModulePath(tree, buildOptions.main);
    const moduleSource = getSourceFile(tree, modulePath);
    const changes = addImportToModule(
      moduleSource,
      modulePath,
      "NgOidcModule.forRoot({protectedApis: [ '.*/api/' ], signOnStartup: true})"
    );
    const recorder = tree.beginUpdate(modulePath);
    changes.forEach(change => {
      if (change instanceof InsertChange) {
        recorder.insertLeft(change.pos, change.toAdd);
      }
    });
    tree.commitUpdate(recorder);

    return tree;
  };
}

function modifyAngularJson(angularJsonVal: any, project: string): Rule {
  return (tree: Tree, context: SchematicContext) => {
    if (tree.exists("./angular.json")) {
      const projectScriptsOptionsJson = angularJsonVal["projects"][project]["architect"]["build"]["options"];
      const projectScriptsTestJson = angularJsonVal["projects"][project]["architect"]["test"]["options"];

      const assets = [
        "src/configuration.json",
        { "glob": "oidc-client.slim.min.js", "input": "./node_modules/oidc-client/dist", "output": "/assets" },
        ];
      Array.prototype.push.apply(projectScriptsOptionsJson["assets"], assets);
      Array.prototype.push.apply(projectScriptsTestJson["assets"], assets);

      context.logger.debug(
        `Adding oidc script and callback in angular.json assets build sections`
      );

      return tree.overwrite(
        "./angular.json",
        JSON.stringify(angularJsonVal, null, 2)
      );

    } else {
      throw new SchematicsException("angular.json not found");
    }
  }
}

function injectServiceIntoAppComponent(): Rule {
  return (tree: Tree) => {
    const compFile = './src/app/app.component.ts';
    const serviceName = 'AuthenticationService'
    const servicePath = 'ng-oidc';
    const toAddParam = `private ${camelize(serviceName)}: ${serviceName}`;
    const toAddBlock = `\n
    if (this.${camelize(serviceName)} && this.${camelize(serviceName)}.error) {
      this.${camelize(serviceName)}.error.subscribe(errInfo => {
        console.error('Auth. renew error: ', errInfo);
        this.${camelize(serviceName)}.signin();
      });
    }
    this.${camelize(serviceName)}.getUser().then(
      (user) => console.log(user)
    );
    \n`;

    let sourceFile = getSource(tree, compFile);

    // get constructor
    let parameterListNode = findNodeByName(sourceFile, ts.SyntaxKind.Constructor);
    let parameterNodes = parameterListNode.getChildren();
    // Find a constructor argument
    let paramNode = findServiceInNodes(parameterNodes, serviceName);
    // There is already a respective constructor argument --> nothing to do for us here ...
    if (paramNode) return noop();
    insertService(toAddParam, tree, paramNode, sourceFile, parameterNodes, parameterListNode, serviceName, servicePath, compFile);

    /*
    // get constructor body
    sourceFile = getSource(tree, compFile);
    let blockNode = findNodeBlockByName(sourceFile, ts.SyntaxKind.Constructor);
    let blockNodes = blockNode.getChildren();
    insertBody(toAddBlock, tree, blockNodes, blockNode, compFile);
    */

    sourceFile = getSource(tree, compFile);
    let methodNode = findMethodBlockByName(sourceFile, ts.SyntaxKind.MethodDeclaration, 'ngOnInit');
    let methodeNodes = methodNode.getChildren();
    insertBody(toAddBlock, tree, methodeNodes, methodNode, compFile);

    return tree;
  }
}
