import * as ImmutableUtils from './ImmutableUtils';

const getDefaultGetId = (idAttribute) => (input) =>
  ImmutableUtils.isImmutable(input) ? input.get(idAttribute) : input[idAttribute];

export default class EntitySchema {
  constructor(key, definition = {}, options = {}) {
    if (!key || typeof key !== 'string') {
      throw new Error(`Expected a string key for Entity, but found ${key}.`);
    }

    const {
      idAttribute = 'id',
      mergeStrategy = (entityA, entityB) => {
        return { ...entityA, ...entityB };
      },
      processStrategy = (input) => ({ ...input })
    } = options;

    this._key = key;
    this._getId = typeof idAttribute === 'function' ? idAttribute : getDefaultGetId(idAttribute);
    this._idAttribute = idAttribute;
    this._mergeStrategy = mergeStrategy;
    this._processStrategy = processStrategy;
    this.define(definition);
  }

  get key() {
    return this._key;
  }

  get idAttribute() {
    return this._idAttribute;
  }

  define(definition) {
    this.schema = Object.keys(definition).reduce((entitySchema, referenceKey) => {
      const referenceSchema = definition[referenceKey];
      return { ...entitySchema, [referenceKey]: referenceSchema };
    }, this.schema || {});
  }

  getId(input, parent, key) {
    return this._getId(input, parent, key);
  }

  merge(entityA, entityB) {
    return this._mergeStrategy(entityA, entityB);
  }

  isValidReference(entity, referenceKey) {
    const referenceValue = entity[referenceKey];
    return entity.hasOwnProperty(referenceKey) && typeof referenceValue === 'object';
  }

  isValid(entity, entityId) {
      const keys = Object.keys(entity);
      if (keys.length > 1) {
        return true;
      }
      // This is in order to support single value Entities
      return keys.length === 1 && Object.values(entity)[0] !== entityId;
  }

  normalize(input, parent, key, visit, addEntity) {
    const processedEntity = this._processStrategy(input, parent, key);
    Object.keys(this.schema).forEach((referenceKey) => {
      if (this.isValidReference(processedEntity, referenceKey)) {
        const schema = this.schema[referenceKey];
        const referenceId = visit(processedEntity[referenceKey], processedEntity, referenceKey, schema, addEntity);
        if (Array.isArray(referenceId) || schema._key === undefined) {
          processedEntity[referenceKey] = referenceId;
        } else {
          processedEntity[referenceKey] = { id: referenceId };
        }
      }
    });

    const entityId = this.getId(input, parent, key);

    if (this.isValid(processedEntity, entityId)) {
      addEntity(this, processedEntity, input, parent, key);
    }

    return entityId;
  }

  denormalize(entity, unvisit) {
    if (ImmutableUtils.isImmutable(entity)) {
      return ImmutableUtils.denormalizeImmutable(this.schema, entity, unvisit);
    }

    Object.keys(this.schema).forEach((referenceKey) => {
      if (entity.hasOwnProperty(referenceKey)) {
        const schema = this.schema[referenceKey];
        const referenceId =
          entity[referenceKey] && entity[referenceKey].id ? entity[referenceKey].id : entity[referenceKey];
        const referenceValue = unvisit(referenceId, schema);
        entity[referenceKey] = referenceValue;
      }
    });
    return entity;
  }
}
