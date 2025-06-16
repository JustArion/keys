import * as t from '@babel/types';
import generate from '@babel/generator';

const gen = (node) => generate.default(node, { compact: true }).code;

// Inlines static variable aliases like: var G6 = Object.prototype; or G6 = Object.prototype;
export const inlineStaticAliases = {
  visitor: {
    Program: {
      enter(path, state) {
        state.staticAliases = new Map();
      }
    },
    VariableDeclarator(path, state) {
      // var G6 = Object.prototype;
      if (
        t.isIdentifier(path.node.id) &&
        t.isMemberExpression(path.node.init) &&
        (t.isIdentifier(path.node.init.object) || t.isMemberExpression(path.node.init.object)) &&
        (t.isIdentifier(path.node.init.property) || t.isStringLiteral(path.node.init.property))
      ) {
        const aliasName = path.node.id.name;
        const targetAst = path.node.init;
        state.staticAliases.set(aliasName, targetAst);
        // Optionally remove the declaration
        path.parentPath.remove();
        console.log(`[INLINE-STATIC] Found static alias: ${aliasName} = ${gen(targetAst)}`);
      }
    },
    AssignmentExpression(path, state) {
      // G6 = Object.prototype;
      if (
        t.isIdentifier(path.node.left) &&
        t.isMemberExpression(path.node.right) &&
        (t.isIdentifier(path.node.right.object) || t.isMemberExpression(path.node.right.object)) &&
        (t.isIdentifier(path.node.right.property) || t.isStringLiteral(path.node.right.property))
      ) {
        const aliasName = path.node.left.name;
        const targetAst = path.node.right;
        state.staticAliases.set(aliasName, targetAst);
        // Optionally remove the assignment
        path.parentPath.remove();
        console.log(`[INLINE-STATIC] Found static alias: ${aliasName} = ${gen(targetAst)}`);
      }
    },
    Identifier(path, state) {
      if (state.staticAliases && state.staticAliases.has(path.node.name)) {
        // Avoid replacing the declaration itself
        if (
          path.parent.type === 'VariableDeclarator' && path.parent.id === path.node
        ) return;
        // Avoid replacing left side of assignment
        if (
          path.parent.type === 'AssignmentExpression' && path.parent.left === path.node
        ) return;
        const aliasName = path.node.name;
        const targetAst = state.staticAliases.get(aliasName);
        console.log(`[INLINE-STATIC] Inlined ${aliasName} -> ${gen(targetAst)}`);
        path.replaceWith(t.cloneDeep(targetAst));
      }
    }
  }
};
