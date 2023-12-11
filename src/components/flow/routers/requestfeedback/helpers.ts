import { getActionUUID } from 'components/flow/actions/helpers';
import { Types } from 'config/interfaces';
import { RequestFeedback, Router, RouterTypes, SwitchRouter, Wait, WaitTypes } from 'flowTypes';
import { NodeEditorSettings } from 'store/nodeEditor';
import { RequestFeedbackFormState } from './RequestFeedbackForm';
import { RenderNode } from 'store/flowContext';
import { createRenderNode, resolveRoutes } from 'components/flow/routers/helpers';
import { DEFAULT_OPERAND } from 'components/nodeeditor/constants';
import { getType } from 'config/typeConfigs';

export const initializeForm = (settings: NodeEditorSettings): RequestFeedbackFormState => {
  if (settings.originalNode && getType(settings.originalNode) === Types.request_feedback) {
    const action = settings.originalNode.node.actions[0] as RequestFeedback;
    const router = settings.originalNode.node.router as SwitchRouter;
    if (router) {
      let timeout = 0;
      if (router.wait && router.wait.timeout) {
        timeout = router.wait.timeout.seconds || 0;
      }
      return {
        starRatingQuestion: { value: action.star_rating_question },
        commentQuestion: { value: action.comment_question },
        resultName: { value: router.result_name || '' },
        timeout: timeout,
        valid: true
      };
    }
  }

  return {
    starRatingQuestion: { value: '' },
    commentQuestion: { value: '' },
    resultName: { value: 'Result' },
    timeout: 0,
    valid: false
  };
};

export const stateToNode = (
  settings: NodeEditorSettings,
  state: RequestFeedbackFormState
): RenderNode => {
  const { cases, exits, defaultCategory, timeoutCategory, caseConfig, categories } = resolveRoutes(
    [],
    state.timeout > 0,
    settings.originalNode.node
  );

  const optionalRouter: Pick<Router, 'result_name'> = {};
  if (state.resultName.value) {
    optionalRouter.result_name = state.resultName.value;
  }

  const wait = { type: WaitTypes.msg } as Wait;
  if (state.timeout > 0) {
    wait.timeout = {
      seconds: state.timeout,
      category_uuid: timeoutCategory
    };
  }

  const router: SwitchRouter = {
    type: RouterTypes.switch,
    default_category_uuid: defaultCategory,
    cases,
    categories,
    operand: DEFAULT_OPERAND,
    wait,
    ...optionalRouter
  };

  const newRenderNode = createRenderNode(
    settings.originalNode.node.uuid,
    router,
    exits,
    Types.request_feedback,
    [stateToAction(settings, state)],
    { cases: caseConfig }
  );

  return newRenderNode;
};

export const stateToAction = (
  settings: NodeEditorSettings,
  state: RequestFeedbackFormState
): RequestFeedback => ({
  uuid: getActionUUID(settings, Types.request_feedback),
  type: Types.request_feedback,
  star_rating_question: state.starRatingQuestion.value,
  comment_question: state.commentQuestion.value
});
