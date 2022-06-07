import { NodeEditorSettings } from 'store/nodeEditor';

import { Types } from 'config/interfaces';
import { CallDialogflow } from 'flowTypes';
import { AssetType, RenderNode } from 'store/flowContext';
import { getActionUUID } from 'components/flow/actions/helpers';
import { createWebhookBasedNode } from '../helpers';
import { DialogflowRouterFormState } from './DialogflowRouterForm';

export const nodeToState = (settings: NodeEditorSettings): DialogflowRouterFormState => {
  const nodeFirstAction = settings.originalAction || settings.originalNode.node.actions[0];
  if (nodeFirstAction && nodeFirstAction.type === Types.call_dialogflow) {
    const action = nodeFirstAction as CallDialogflow;
    return {
      resultName: { value: action.result_name },
      dialogflowDB: {
        value: {
          id: action.dialogflow_db.id,
          name: action.dialogflow_db.text,
          type: AssetType.Dialogflow
        }
      },
      questionSrc: { value: action.question_src },
      valid: true
    };
  }
  return {
    resultName: { value: 'Result' },
    questionSrc: { value: '' },
    dialogflowDB: {
      value: { id: '', name: '', type: AssetType.Dialogflow }
    },
    valid: false
  };
};

export const stateToNode = (
  nodeSettings: NodeEditorSettings,
  formState: DialogflowRouterFormState
): RenderNode => {
  const action: CallDialogflow = {
    type: Types.call_dialogflow,
    result_name: formState.resultName.value,
    dialogflow_db: {
      id: formState.dialogflowDB.value.id,
      // @ts-ignore
      text: formState.dialogflowDB.value.name || formState.dialogflowDB.value.text
    },
    question_src: formState.questionSrc.value,
    uuid: getActionUUID(nodeSettings, Types.call_dialogflow)
  };

  return createWebhookBasedNode(action, nodeSettings.originalNode, false);
};
