import * as React from 'react';
import { RequestFeedback } from 'flowTypes';
import i18n from 'config/i18n';

export const PLACEHOLDER = i18n.t(
  'actions.request_feedback.placeholder',
  'Send a message to the contact'
);

const RequestFeedbackComp: React.SFC<RequestFeedback> = (action: RequestFeedback): JSX.Element => {
  if (action.feedback_question.length > 0 || action.rate_question.length > 0) {
    return (
      <>
        <div>{action.rate_question}</div>
        <div>{action.feedback_question}</div>
      </>
    );
  }
  return <div>{PLACEHOLDER}</div>;
};

export default RequestFeedbackComp;
