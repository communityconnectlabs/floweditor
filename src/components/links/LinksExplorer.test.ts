import { composeComponentTestUtils } from 'testUtils';
import { LinksExplorer, LinksExplorerProps } from 'components/links/LinksExplorer';
import { PopTabType } from '../../config/interfaces';

const baseProps: LinksExplorerProps = {
  onToggled: jest.fn(),
  popped: PopTabType.LINKS_TAB
};

const { setup } = composeComponentTestUtils(LinksExplorer, baseProps);

describe(LinksExplorer.name, () => {
  describe('render', () => {
    it('should render base component', async () => {
      const { wrapper, instance } = setup();
      expect(wrapper).toMatchSnapshot();
    });
  });
});
