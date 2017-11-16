import * as React from 'react';
import '../../../enzymeAdapter';
import { mount } from 'enzyme';
import EditorConfig from '../../../services/EditorConfig';
import ComponentMap from '../../../services/ComponentMap';
import ChangeGroupForm, { ChangeGroupFormProps } from './ChangeGroupForm';

const {
    results: [{ definition }]
} = require('../../../../test_flows/9ecc8e84-6b83-442b-a04a-8094d5de997b.json');

const Config = new EditorConfig();
const CompMap = new ComponentMap(definition);

const testGroupForm = (type: string) => {
    const { nodes: [{ actions: [, action ] } ] } = definition;
    const typeConfig = Config.getTypeConfig(type);
    const { endpoints } = Config;
    const props = {
        action,
        getActionUUID: jest.fn(() => action.uuid),
        config: typeConfig,
        updateAction: jest.fn(),
        onBindWidget: jest.fn(),
        endpoints,
        ComponentMap: CompMap
    };
    const { groups: [{ uuid, name }] } = action;
    const groups = [{ group: uuid, name }];
    const localGroups = [{ id: uuid, name, type: 'group' }];
    const GroupForm = mount(<ChangeGroupForm {...props} />);
    const expectedP =
        type === 'add_to_group'
            ? 'Select the group(s) to add the contact to.'
            : 'Select the group(s) to remove the contact from.';

    expect(GroupForm.find('div').exists()).toBeTruthy();
    expect(GroupForm.find('p').text()).toBe(expectedP);
    expect(props.onBindWidget).toBeCalled();
    expect(GroupForm.find('GroupElement').props()).toEqual({
        name: 'Group',
        endpoint: endpoints.groups,
        groups,
        localGroups,
        add: type === 'add_to_group',
        required: true
    });
};

describe('Component: ChangeGroupForm', () => {
    it("renders an 'Add to Group' form", () => {
        testGroupForm('add_to_group');
    });

    it("renders a 'Remove from Group' form", () => {
        testGroupForm('remove_from_group');
    });
});
