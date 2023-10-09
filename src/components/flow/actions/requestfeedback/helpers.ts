import { getActionUUID } from 'components/flow/actions/helpers';
import { Types } from 'config/interfaces';
import { RequestFeedback } from 'flowTypes';
import { NodeEditorSettings } from 'store/nodeEditor';
import { RequestFeedbackFormState } from './RequestFeedbackForm';

export const initializeForm = (settings: NodeEditorSettings): RequestFeedbackFormState => {
  if (settings.originalAction && settings.originalAction.type === Types.request_feedback) {
    const action = settings.originalAction as RequestFeedback;
    return {
      feedbackQuestion: { value: action.feedback_question },
      rateQuestion: { value: action.rate_question },
      resultName: { value: 'Result' },
      valid: true
    };
  }

  return {
    feedbackQuestion: { value: '' },
    rateQuestion: { value: '' },
    resultName: { value: 'Result' },
    valid: false
  };
};

export const stateToAction = (
  settings: NodeEditorSettings,
  state: RequestFeedbackFormState
): RequestFeedback => ({
  uuid: getActionUUID(settings, Types.request_feedback),
  type: Types.request_feedback,
  feedback_question: state.feedbackQuestion.value,
  rate_question: state.rateQuestion.value,
  result_name: state.resultName.value
});
