// eslint-env jest
import { denormalize, normalize, schema } from '../index';
import {
  generateOrganization,
  generateOrganizationMembership,
  generateUser
} from '@process-street/subgrade/dist/lib/test/generators';

const AuditMetadata = new schema.Object({});
const Organization = new schema.Entity('Organization', { audit: AuditMetadata });
const User = new schema.Entity('User', { audit: AuditMetadata });

AuditMetadata.define({ createdBy: User, updatedBy: User });

const OrganizationMembership = new schema.Entity('OrganizationMembership', {
  organization: Organization,
  user: User
});

describe('Normalizr schema test', () => {
  const userId = 'iMN428lwSWmZRu8ad11Fbg';
  const email = 'test@process.st';
  const organizationId = 'i3FUO85zlSXhFFbZwthHgg';
  const organizationMembershipId = 'gCcQfV06KXig7iIUyqVFLw';

  beforeEach(() => {
    Date.now = jest.fn(() => 0);
  });

  test('should normalize referenced values', () => {
    const user = generateUser(userId, email);
    const organization = generateOrganization(organizationId);
    const organizationMembership = {
      ...generateOrganizationMembership(userId, organizationId),
      id: organizationMembershipId,
      user,
      organization
    };

    const normalized = normalize(organizationMembership, OrganizationMembership);
    expect(normalized).toMatchSnapshot();
  });

  test('should restore referenced value', () => {
    const user = generateUser(userId, email);
    const organization = generateOrganization(organizationId);
    const organizationMembership = {
      ...generateOrganizationMembership(userId, organizationId),
      id: organizationMembershipId,
      user,
      organization
    };

    const { entities } = normalize(organizationMembership, OrganizationMembership);
    const recreated = denormalize(organizationMembershipId, OrganizationMembership, entities);
    expect(recreated).toMatchSnapshot();
  });

  test('should keep reference on all entities match', () => {
    const organizationMembership = {
      ...generateOrganizationMembership(userId, organizationId),
      id: organizationMembershipId
    };

    const { entities } = normalize(organizationMembership, OrganizationMembership);
    const recreated = denormalize(organizationMembershipId, OrganizationMembership, entities);
    expect(recreated).toEqual(organizationMembership);
  });

  test('should normalize audit metadata', () => {
    const createdBy = generateUser();
    const updatedBy = generateUser();

    const user = {
      ...generateUser(),
      audit: {
        createdDate: new Date(0),
        createdBy,
        updatedDate: new Date(0),
        updatedBy
      }
    };

    const { entities } = normalize(user, User);

    const restoredUpdatedBy = denormalize(updatedBy.id, User, entities);
    expect(restoredUpdatedBy).toEqual(updatedBy);

    const restoredCreatedBy = denormalize(createdBy.id, User, entities);
    expect(restoredCreatedBy).toEqual(createdBy);

    const restoredUser = denormalize(user.id, User, entities);
    const expectedUser = {
      ...user,
      audit: {
        ...user.audit,
        createdBy: { id: createdBy.id },
        updatedBy: { id: updatedBy.id }
      }
    };
    expect(restoredUser).toEqual(expectedUser);
  });
});
