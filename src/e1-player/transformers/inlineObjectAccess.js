import * as t from '@babel/types';
import generate from '@babel/generator';

const gen = (node) => generate.default(node, { compact: true }).code;

function buildMemberExpressionChain(node) {
  if (t.isMemberExpression(node)) {
    const object = buildMemberExpressionChain(node.object);
    let property = node.property;
    let computed = node.computed;
    if (t.isStringLiteral(property) && t.isValidIdentifier(property.value)) {
      property = t.identifier(property.value);
      computed = false;
    } else if (t.isNumericLiteral(property)) {
      computed = true;
    }
    return t.memberExpression(object, property, computed);
  }
  return node;
}

export const inlineObjectAccess = {
  visitor: {
    MemberExpression(path) {
      // Only inline if at least one property in the chain is a string literal
      let curr = path.node;
      let foundString = false;
      while (t.isMemberExpression(curr)) {
        if (t.isStringLiteral(curr.property)) foundString = true;
        curr = curr.object;
      }
      if (foundString) {
        const before = gen(path.node);
        const afterAst = buildMemberExpressionChain(path.node);
        const after = gen(afterAst);
        if (before !== after) {
          console.log(`[INLINE-OBJ] Inlining ${before} -> ${after}`);
          path.replaceWith(afterAst);
        }
      }
    },
    AssignmentExpression(path) {
      const { node } = path;
      // Inline .bind() calls and their arguments
      if (
        t.isCallExpression(node.right) &&
        t.isMemberExpression(node.right.callee) &&
        t.isMemberExpression(node.right.callee.object) &&
        node.right.callee.property.value === 'bind' &&
        node.right.arguments.length >= 1
      ) {
        const before = gen(node.right);
        const afterAst = t.callExpression(
          buildMemberExpressionChain(node.right.callee),
          node.right.arguments.map(arg =>
            t.isMemberExpression(arg) ? buildMemberExpressionChain(arg) : arg
          )
        );
        const after = gen(afterAst);
        if (before !== after) {
          console.log(`[INLINE-OBJ] Inlining ${before} -> ${after}`);
          path.get('right').replaceWith(afterAst);
        }
      }
    }
  }
};
