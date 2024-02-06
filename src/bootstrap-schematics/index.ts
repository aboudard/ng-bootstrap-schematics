import { NodePackageInstallTask, RunSchematicTask } from "@angular-devkit/schematics/tasks";
import { NodeDependencyType, addPackageJsonDependency } from '../utility/dependencies';
import { bootstrapVersion, ngBootstrapVersion, ngLocalizeVersion } from './versions';
import { Schema } from './schema';
import { Rule, SchematicContext, Tree, chain, mergeWith, apply, url, move, SchematicsException, template } from '@angular-devkit/schematics';
import { InsertChange } from '@schematics/angular/utility/change';
import { getWorkspace } from "../utility/util";
import { getAppModulePath } from '@schematics/angular/utility/ng-ast-utils';
import { addImportToModule } from '@schematics/angular/utility/ast-utils';
import { installDependencies, getProjectTargetOptions, getSourceFile, getAngularJsonValue, getProject, applyWithOverwrite } from "../utility/custom";

// You don't have to export the function as default. You can also have more than one rule factory
// per file.
export function bootstrapSchematics(_options: Schema): Rule {

  let angularJsonVal;
  let project;

  return (tree: Tree, _context: SchematicContext) => {
    angularJsonVal = getAngularJsonValue(tree);
    project = getProject(angularJsonVal);

    return chain([
      addIcones(_options),
      addI18n(_options),
      updateDependencies(),
      addOidc(_options),
      installDependencies(),
      addComponents(_options),
      addSpinner(_options),
      addBootstrapFiles(),
      modifyAngularJson(_options, angularJsonVal, project),
      addModule(_options.project),
    ])(tree, _context);
  };
}

function addOidc(options: Schema): Rule {
  return (tree: Tree, _context: SchematicContext) => {
    // this tells the schematic to run the oidc schematic found in collection.json as a task
    _context.addTask(new RunSchematicTask('oidc', options));
    return tree;
  };
}

function addSpinner(options: Schema): Rule {
  return (tree: Tree, _context: SchematicContext) => {
    // this tells the schematic to run the spinner schematic found in collection.json as a task
    _context.addTask(new RunSchematicTask('spinner', options));
    return tree;
  };
}

function addIcones(options: Schema): Rule {
  return (tree: Tree, _context: SchematicContext) => {
    // this tells the schematic to run the font-awesome schematic found in collection.json as a task
    _context.addTask(new RunSchematicTask('font-awesome', options));
    return tree;
  };
}

function addI18n(options: Schema): Rule {
  return (tree: Tree, _context: SchematicContext) => {
    // this tells the schematic to run the transloco schematic found in collection.json as a task
    _context.addTask(new RunSchematicTask('transloco', options));
    return tree;
  };
}

function addModule(projectName?: string): Rule {
  return (tree: Tree) => {
    const workspace = getWorkspace(tree);
    const project = workspace.projects[projectName || workspace.defaultProject!];
    const buildOptions = getProjectTargetOptions(project, 'build');
    const modulePath = getAppModulePath(tree, buildOptions.main);
    const moduleSource = getSourceFile(tree, modulePath);
    const changes = addImportToModule(
      moduleSource,
      modulePath,
      'CompModule',
      './comp/comp.module'
    );
    const recorder = tree.beginUpdate(modulePath);
    changes.forEach((change) => {
      if (change instanceof InsertChange) {
        recorder.insertLeft(change.pos, change.toAdd);
      }
    });
    tree.commitUpdate(recorder);

    return tree;
  }
}

function updateDependencies(): Rule {
  return (tree: Tree, context: SchematicContext) => {
    context.logger.debug("Updating dependencies...");
    context.addTask(new NodePackageInstallTask());

    addPackageJsonDependency(tree, {
      type: NodeDependencyType.Default,
      name: 'bootstrap',
      version: bootstrapVersion,
    });

    addPackageJsonDependency(tree, {
      type: NodeDependencyType.Default,
      name: '@ng-bootstrap/ng-bootstrap',
      version: ngBootstrapVersion,
    });

    addPackageJsonDependency(tree, {
      type: NodeDependencyType.Default,
      name: '@angular/localize',
      version: ngLocalizeVersion,
    });

    return tree;
  }
}

function addBootstrapFiles(): Rule {
  return (tree: Tree, context: SchematicContext) => {
    context.logger.debug("Adding bootstrap files");
    return chain([
      mergeWith(apply(url("./assets"), [move("./src/assets")])),
      mergeWith(apply(url("./icon"), [move("./")]))
    ])(
      tree,
      context
    );
  };
}

function modifyAngularJson(options: Schema, angularJsonVal: any, project: string): Rule {
  return (tree: Tree, context: SchematicContext) => {
    if (tree.exists("./angular.json")) {
      const projectStylesOptionsJson = angularJsonVal["projects"][project]["architect"]["build"]["options"];
      const projectStylesTestJson = angularJsonVal["projects"][project]["architect"]["test"]["options"];
      const styles = [
        "src/assets/vendor.scss", "src/assets/main.scss"
      ];
      if (options.removeStyles) {

        context.logger.debug("Removing styles default file");
        if (tree.exists("./src/styles.scss")) {
          tree.delete("./src/styles.scss");
        }
        if (tree.exists("./src/styles.css")) {
          tree.delete("./src/styles.css");
        }

        projectStylesOptionsJson["styles"] = styles;
        projectStylesTestJson["styles"] = styles;
      } else {
        Array.prototype.push.apply(projectStylesOptionsJson["styles"], styles);
        Array.prototype.push.apply(projectStylesTestJson["styles"], styles);
      }

      context.logger.debug(
        `Adding bootstrap scss override in angular.json style`
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

function addComponents(_options: Schema): Rule {
  return () => {
    const rule =
      applyWithOverwrite(url('./files'), [
        template({
          ..._options,
        }),
      ]);
    return rule;
  };
}


