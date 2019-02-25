// eslint-env jest
import { fromJS } from 'immutable';
import { denormalize, normalize, schema } from '../../';

describe('ObjectSchema normalization', () => {
  test('normalizes an object', () => {
    const userSchema = new schema.Entity('user');
    const object = new schema.Object({
      user: userSchema
    });
    expect(normalize({ user: { id: 1, type: 'user' } }, object)).toMatchSnapshot();
  });

  test(`normalizes plain objects as shorthand for ${schema.Object.name}`, () => {
    const userSchema = new schema.Entity('user');
    expect(normalize({ user: { id: 1, type: 'user' } }, { user: userSchema })).toMatchSnapshot();
  });

  test('filters out undefined and null values', () => {
    const userSchema = new schema.Entity('user');
    const users = { foo: userSchema, bar: userSchema, baz: userSchema };
    const normalizedValue = normalize({ foo: {}, bar: { id: '1', type: 'bar' } }, users);
    expect(normalizedValue).toMatchSnapshot();
  });
});

describe('ObjectSchema denormalization', () => {
  test('denormalizes an object', () => {
    const userSchema = new schema.Entity('user');
    const object = new schema.Object({
      user: userSchema
    });
    const entities = {
      user: {
        1: { id: 1, name: 'Nacho' }
      }
    };
    expect(denormalize({ user: 1 }, object, entities)).toMatchSnapshot();
    expect(denormalize({ user: 1 }, object, fromJS(entities))).toMatchSnapshot();
    expect(denormalize(fromJS({ user: 1 }), object, fromJS(entities))).toMatchSnapshot();
  });

  test('denormalizes plain object shorthand', () => {
    const userSchema = new schema.Entity('user');
    const entities = {
      user: {
        1: { id: 1, name: 'Jane' }
      }
    };
    expect(denormalize({ user: 1 }, { user: userSchema, tacos: {} }, entities)).toMatchSnapshot();
    expect(denormalize({ user: 1 }, { user: userSchema, tacos: {} }, fromJS(entities))).toMatchSnapshot();
    expect(denormalize(fromJS({ user: 1 }), { user: userSchema, tacos: {} }, fromJS(entities))).toMatchSnapshot();
  });
});
