import { apply, chain, mergeWith, move, Rule, SchematicContext, Tree, url } from '@angular-devkit/schematics';


// You don't have to export the function as default. You can also have more than one rule factory
// per file.
export function cypress(_options: any): Rule {
  return (tree: Tree, _context: SchematicContext) => {
    return chain([
      addCypressJson(),
      removeE2e()
    ])(tree, _context);
  };
}


export function removeE2e(): Rule {
  return (tree: Tree) => {
    console.log("Removing e2e default files");
    const dire2e = tree.getDir('e2e');
    console.log(dire2e.path);
    tree.delete(dire2e.path);
    return tree;
  };
}

function addCypressJson(): Rule {
  return (tree: Tree, context: SchematicContext) => {
    console.log("Adding cypress json file");
    return chain([
      mergeWith(apply(url("./files"), [move("./src")]))
    ])(
      tree,
      context
    );
  };
}
