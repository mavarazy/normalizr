import * as ImmutableUtils from './ImmutableUtils';

export const normalize = (schema, input, parent, key, visit, addEntity) => {
  const object = { ...input };

  Object.keys(schema).forEach((referenceKey) => {
    const localSchema = schema[referenceKey];
    const referencedValue = input[referenceKey];
    if (referencedValue !== undefined) {
      const value = visit(referencedValue, input, referenceKey, localSchema, addEntity);
      if (value === undefined || value === null) {
        delete object[referenceKey];
      } else {
        if (Array.isArray(value) || localSchema._key === undefined || parent === input) {
          object[referenceKey] = value;
        } else {
          object[referenceKey] = { id: value };
        }
      }
    }
  });

  return object;
};

export const denormalize = (schema, input, unvisit) => {
  if (ImmutableUtils.isImmutable(input)) {
    return ImmutableUtils.denormalizeImmutable(schema, input, unvisit);
  }

  const object = { ...input };
  Object.keys(schema).forEach((referenceKey) => {
    if (object[referenceKey]) {
      const referencedValue = unvisit(object[referenceKey], schema[referenceKey]);
      object[referenceKey] = referencedValue || object[referenceKey];
    }
  });

  return object;
};

export default class ObjectSchema {
  constructor(definition) {
    this.define(definition);
  }

  define(definition) {
    this.schema = Object.keys(definition).reduce((entitySchema, referenceKey) => {
      const referenceSchema = definition[referenceKey];
      return { ...entitySchema, [referenceKey]: referenceSchema };
    }, this.schema || {});
  }

  normalize(...args) {
    return normalize(this.schema, ...args);
  }

  denormalize(...args) {
    return denormalize(this.schema, ...args);
  }
}
