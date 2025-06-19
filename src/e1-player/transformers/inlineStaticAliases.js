import * as t from '@babel/types';
import generate from '@babel/generator';

const gen = (node) => generate.default(node, { compact: true }).code;

// Inlines static variable aliases like: var G6 = Object.prototype; or G6 = Object.prototype;
export const inlineStaticAliases = {
  visitor: {
    Program: {
      enter(path, state) {
        state.staticAliases = new Map();
        state.pathsToRemove = [];
      },
      exit(path, state) {
        // Remove all marked paths after traversal
        for (const p of state.pathsToRemove) {
          if (!p.removed) p.remove();
        }
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
        // Mark the declaration for removal
        state.pathsToRemove.push(path.parentPath);
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
        // Mark the assignment for removal
        state.pathsToRemove.push(path.parentPath);
        console.log(`[INLINE-STATIC] Found static alias: ${aliasName} = ${gen(targetAst)}`);
      }
    },
    Identifier(path, state) {
    if (state.staticAliases && state.staticAliases.has(path.node.name)) {
      // Avoid replacing non-computed property of a MemberExpression
      if (
        path.parent.type === 'MemberExpression' &&
        path.parent.property === path.node &&
        !path.parent.computed
      ) return;

      // Avoid replacing declaration itself
      if (
        path.parent.type === 'VariableDeclarator' && path.parent.id === path.node
      ) return;
      // Avoid replacing left side of assignment
      if (
        path.parent.type === 'AssignmentExpression' && path.parent.left === path.node
      ) return;
      // Avoid replacing function/class/variable names, object keys, and labels
      if (
        (path.parent.type === 'FunctionDeclaration' && path.parent.id === path.node) ||
        (path.parent.type === 'FunctionExpression' && path.parent.id === path.node) ||
        (path.parent.type === 'ClassDeclaration' && path.parent.id === path.node) ||
        (path.parent.type === 'ClassExpression' && path.parent.id === path.node) ||
        (path.parent.type === 'ObjectProperty' && path.parent.key === path.node && !path.parent.computed) ||
        (path.parent.type === 'ObjectMethod' && path.parent.key === path.node && !path.parent.computed) ||
        (path.parent.type === 'ClassMethod' && path.parent.key === path.node && !path.parent.computed) ||
        (path.parent.type === 'LabeledStatement' && path.parent.label === path.node) ||
        (path.parent.type === 'BreakStatement' && path.parent.label === path.node) ||
        (path.parent.type === 'ContinueStatement' && path.parent.label === path.node)
      ) return;
      const aliasName = path.node.name;
      const targetAst = state.staticAliases.get(aliasName);
      console.log(`[INLINE-STATIC] Inlined ${aliasName} -> ${gen(targetAst)}`);
      path.replaceWith(t.cloneDeep(targetAst));
      path.skip();
    }
  }
  }
};