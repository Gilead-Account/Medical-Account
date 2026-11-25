import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const modulePath = new URL('../src/lib/dataservice/accountPlan/dependentPicklists.js', import.meta.url);
const businessPicklistsPath = new URL(
  '../src/lib/dataservice/accountPlan/barrierOpportunityPicklists.js',
  import.meta.url
);
const dataModule = (source) => `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`;

const loadModule = async () => {
  const queryStubUrl = dataModule(`
    export const getObjectMetadata = () => Promise.resolve(globalThis.__dependentPicklistMetadata || null);
  `);
  const businessPicklistsUrl = dataModule(await readFile(businessPicklistsPath, 'utf8'));
  const source = (await readFile(modulePath, 'utf8'))
    .replace(/from ['"]@\/lib\/dataservice\/query['"]/g, `from '${queryStubUrl}'`)
    .replace(/from ['"]\.\/barrierOpportunityPicklists\.js['"]/g, `from '${businessPicklistsUrl}'`);
  return import(`${dataModule(source)}#${Date.now()}-${Math.random()}`);
};

test('dependencyOptionsFromMetadata maps dependent picklist values by controlling indication', async () => {
  const mod = await loadModule();

  const options = mod.dependencyOptionsFromMetadata({
    objectApi: 'KPH_Medical_Barrier_Tactical_Actions__c',
    fieldApi: 'KPH_Medical_Strategy__c',
    controllingFieldApi: 'KPH_Indication__c',
    allOptions: ['DLBCL Strategy', 'MM Strategy', 'Shared Strategy'],
    metadata: {
      data: {
        object: 'KPH_Medical_Barrier_Tactical_Actions__c',
        fields: [
          {
            name: 'KPH_Indication__c',
            picklistValues: [{ value: 'DLBCL' }, { value: 'MM' }],
          },
          {
            name: 'KPH_Medical_Strategy__c',
            controllerName: 'KPH_Indication__c',
            controllerValues: { DLBCL: 0, MM: 1 },
            picklistValues: [
              { value: 'DLBCL Strategy', validFor: ['DLBCL'] },
              { value: 'MM Strategy', validFor: ['MM'] },
              { value: 'Shared Strategy', validFor: ['DLBCL', 'MM'] },
            ],
          },
        ],
      },
    },
  });

  assert.deepEqual(options, {
    DLBCL: ['DLBCL Strategy', 'Shared Strategy'],
    MM: ['MM Strategy', 'Shared Strategy'],
  });
  assert.deepEqual(mod.optionsForControllerValue(options, 'mm'), ['MM Strategy', 'Shared Strategy']);
});

test('fetchDependencyOptionsFromObjectMetadata has no hardcoded strategy fallback', async () => {
  const mod = await loadModule();
  globalThis.__dependentPicklistMetadata = {
    data: {
      object: 'KPH_Medical_Barrier_Tactical_Actions__c',
      fields: [
        { name: 'KPH_Indication__c', dataType: 'picklist' },
        { name: 'KPH_Medical_Strategy__c', dataType: 'picklist' },
      ],
    },
  };

  const options = await mod.fetchDependencyOptionsFromObjectMetadata({
    objectApi: 'KPH_Medical_Barrier_Tactical_Actions__c',
    fieldApi: 'KPH_Medical_Strategy__c',
    controllingFieldApi: 'KPH_Indication__c',
    allOptions: [
      'Win the CAR T Treatment Decision',
      'Drive earlier referral and CAR T Action',
      'Community Expansion',
      'Maximize Opportunities in Lymphoma and Leukemia pipeline',
      'Establish anito-cel as leading treatment option for patients with multiple myeloma',
      'MM Launch Preparedness',
      'Unapproved strategy',
    ],
  });

  assert.deepEqual(options, {});
});
