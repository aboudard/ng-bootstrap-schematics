import { Rule, SchematicContext, Tree, chain, externalSchematic } from '@angular-devkit/schematics';
import { addPackageJsonDependency, NodeDependencyType } from '../utility/dependencies';
import { translocoVersion } from './versions';
import { NodePackageInstallTask } from '@angular-devkit/schematics/tasks';


// You don't have to export the function as default. You can also have more than one rule factory
// per file.
export function transloco(_options: any): Rule {
  return (tree: Tree, _context: SchematicContext) => {
    return chain([
      addTransloco(_options.project),
      updateDependencies()
    ])(tree, _context);
  };
}

/**
 * Force langs to fr,en
 * @param project : ng project that schematics run on
 */
function addTransloco(project: string): Rule {
  return (tree: Tree, context: SchematicContext) => {
    context.logger.debug("Adding transloco files");
    return chain([
      externalSchematic('@ngneat/transloco', 'ng-add', {
        project: project,
        langs: 'fr,en',
        ssr: false
      })
    ])(
      tree,
      context
    );
  };
}

/**
 * Force adding to local package.json since transloco schematics don't
 */
function updateDependencies(): Rule {
  return (tree: Tree, context: SchematicContext) => {
    context.logger.debug("Updating dependencies...");
    context.addTask(new NodePackageInstallTask());

    addPackageJsonDependency(tree, {
      type: NodeDependencyType.Default,
      name: '@ngneat/transloco',
      version: translocoVersion,
    });

    return tree;
  }
}