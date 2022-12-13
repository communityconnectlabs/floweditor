import { RevisionExplorer, RevisionExplorerProps } from 'components/revisions/RevisionExplorer';
import { AssetType } from 'store/flowContext';
import { composeComponentTestUtils } from 'testUtils';
import { PopTabType } from '../../config/interfaces';

const baseProps: RevisionExplorerProps = {
  assetStore: {
    revisions: {
      id: 'id',
      endpoint: '/assets/revisions.json',
      type: AssetType.Revision,
      items: {}
    },
    flows: {
      endpoint: '/assets/flows.json',
      type: AssetType.Flow,
      items: {}
    }
  },
  createNewRevision: jest.fn(),
  loadFlowDefinition: jest.fn(),
  onToggled: jest.fn(),
  utc: true,
  mutable: true,
  popped: PopTabType.REVISION_HISTORY
};

const { setup } = composeComponentTestUtils(RevisionExplorer, baseProps);

describe(RevisionExplorer.name, () => {
  describe('render', () => {
    it('should render base component', async () => {
      const { wrapper, instance } = setup();

      await instance.handleUpdateRevisions();

      expect(wrapper).toMatchSnapshot();
    });
  });
});
