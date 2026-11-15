import {MODULE_KEYS, ROLES} from './role';

const role = (id: string) => ROLES.find(candidate => candidate.id === id)!;

describe('Role', () => {
  it('should let the administrator manage every module except the catalogs of the suppliers', () => {
    expect(role('administrator').modulesWith('manage')).toEqual(MODULE_KEYS.filter(module => module !== 'catalog'));
    expect(role('administrator').accessTo('catalog')).toBe('view');
  });

  it('should keep users and settings away from operators and suppliers', () => {
    expect(role('operator').accessTo('users')).toBe('none');
    expect(role('operator').accessTo('settings')).toBe('none');
    expect(role('supplier').accessTo('users')).toBe('none');
  });

  it('should tell managing apart from viewing', () => {
    const operator = role('operator');

    expect(operator.accessTo('inventory')).toBe('manage');
    expect(operator.accessTo('shipments')).toBe('view');
    expect(operator.modulesWith('view')).toContain('requests');
    expect(operator.modulesWith('view')).not.toContain('inventory');
  });

  it('should keep the business figures and the supplier directory away from operators', () => {
    const operator = role('operator');

    expect(operator.accessTo('analytics')).toBe('none');
    expect(operator.accessTo('suppliers')).toBe('none');
    expect(operator.accessTo('catalog')).toBe('none');
  });

  it('should let suppliers manage their orders and catalog but only follow the needs of the minimarkets', () => {
    expect(role('supplier').modulesWith('manage')).toEqual(['shipments', 'catalog']);
    expect(role('supplier').accessTo('requests')).toBe('view');
    expect(role('supplier').accessTo('inventory')).toBe('none');
    expect(role('supplier').accessTo('suppliers')).toBe('none');
  });
});
