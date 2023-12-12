import * as React from 'react';
import { RequestFeedback } from 'flowTypes';
import i18n from 'config/i18n';

export const PLACEHOLDER = i18n.t(
  'actions.request_feedback.placeholder',
  'Send a message to the contact'
);

const RequestFeedbackComp: React.SFC<RequestFeedback> = (action: RequestFeedback): JSX.Element => {
  if (action.comment_question.length > 0 || action.star_rating_question.length > 0) {
    return (
      <>
        <div style={{ fontWeight: 500 }}>Star Rating Question:</div>
        <div>{action.star_rating_question}</div>
        <div style={{ fontWeight: 500 }}>Comment Question:</div>
        <div>{action.comment_question}</div>
        <div style={{ fontWeight: 500 }}>SMS Question:</div>
        <div>{action.sms_question}</div>
      </>
    );
  }
  return <div>{PLACEHOLDER}</div>;
};

export default RequestFeedbackComp;
