import React, { Component } from 'react';
import { react as bindCallbacks } from 'auto-bind';
import { RouterFormProps } from 'components/flow/props';
import { FormState, mergeForm, StringEntry } from 'store/nodeEditor';
import Dialog, { ButtonSet } from 'components/dialog/Dialog';
import TypeList from 'components/nodeeditor/TypeList';
import i18n from 'config/i18n';
import { initializeForm, stateToNode } from './helpers';
import { hasErrors, renderIssues } from 'components/flow/actions/helpers';
import { Alphanumeric, shouldRequireIf, StartIsNonNumeric, validate } from 'store/validators';
import { createResultNameInput } from 'components/flow/routers/widgets';
import TextInputElement from 'components/form/textinput/TextInputElement';

import styles from './RequesteFeedbackForm.module.scss';
import TimeoutControl from 'components/form/timeout/TimeoutControl';

export interface RequestFeedbackFormState extends FormState {
  starRatingQuestion: StringEntry;
  commentQuestion: StringEntry;
  smsQuestion: StringEntry;
  resultName: StringEntry;
  timeout: number;
}

export default class RequestFeedbackForm extends Component<
  RouterFormProps,
  RequestFeedbackFormState
> {
  constructor(props: RouterFormProps) {
    super(props);
    this.state = initializeForm(this.props.nodeSettings);
    bindCallbacks(this, {
      include: [/^handle/]
    });
  }

  private handleSave(): void {
    // make sure we validate untouched text fields
    const valid = this.handleUpdate(this.state, true);

    if (valid) {
      this.props.updateRouter(stateToNode(this.props.nodeSettings, this.state));

      // notify our modal we are done
      this.props.onClose(false);
    }
  }

  private handleUpdate(state: Partial<RequestFeedbackFormState>, submitting = false): boolean {
    const updates: Partial<RequestFeedbackFormState> = {};

    if (state.starRatingQuestion.hasOwnProperty('value')) {
      updates.starRatingQuestion = validate(
        'Star Rating Question',
        state.starRatingQuestion.value!,
        [shouldRequireIf(submitting)]
      );
    }

    if (state.commentQuestion.hasOwnProperty('value')) {
      updates.commentQuestion = validate('Comment Question', state.commentQuestion.value!, [
        shouldRequireIf(submitting)
      ]);
    }

    if (state.smsQuestion.hasOwnProperty('value')) {
      updates.smsQuestion = validate('SMS Question', state.smsQuestion.value!, [
        shouldRequireIf(submitting)
      ]);
    }

    const updated = mergeForm(this.state, updates);
    this.setState(updated);
    return updated.valid;
  }

  private handleUpdateStarRatingQuestion(value: string): void {
    const starRatingQuestion = validate('Star Rating Question', value, [StartIsNonNumeric]);

    this.setState({ starRatingQuestion, valid: !hasErrors(starRatingQuestion) });
  }

  private handleUpdateCommentQuestion(value: string): void {
    const commentQuestion = validate('Comment Question', value, [StartIsNonNumeric]);

    this.setState({ commentQuestion, valid: !hasErrors(commentQuestion) });
  }

  private handleUpdateSMSQuestion(value: string): void {
    const smsQuestion = validate('SMS Question', value, [StartIsNonNumeric]);

    this.setState({ smsQuestion, valid: !hasErrors(smsQuestion) });
  }

  private handleUpdateResultName(value: string): void {
    const resultName = validate(i18n.t('forms.result_name', 'Result Name'), value, [
      Alphanumeric,
      StartIsNonNumeric
    ]);

    this.setState({ resultName, valid: !hasErrors(resultName) });
  }

  private handleUpdateTimeout(timeout: number): void {
    this.setState({ timeout });
  }

  private getButtons(): ButtonSet {
    return {
      primary: { name: i18n.t('buttons.ok', 'Ok'), onClick: this.handleSave },
      secondary: {
        name: i18n.t('buttons.cancel', 'Cancel'),
        onClick: () => this.props.onClose(true)
      }
    };
  }

  public render(): JSX.Element {
    const typeConfig = this.props.typeConfig;

    return (
      <Dialog
        title={typeConfig.name}
        headerClass={typeConfig.type}
        buttons={this.getButtons()}
        gutter={
          <TimeoutControl timeout={this.state.timeout} onChanged={this.handleUpdateTimeout} />
        }
      >
        <TypeList __className="" initialType={typeConfig} onChange={this.props.onTypeChange} />
        <TextInputElement
          __className={styles.question}
          showLabel={true}
          name={i18n.t('forms.star_rating_question', 'Star Rating Question')}
          placeholder="Type a question that will be displayed with a star input field..."
          onChange={this.handleUpdateStarRatingQuestion}
          entry={this.state.starRatingQuestion}
          autocomplete={true}
        />
        <TextInputElement
          __className={styles.question}
          showLabel={true}
          name={i18n.t('forms.comment_question', 'Comment Question')}
          placeholder="Type a question that will be displayed with text input field..."
          onChange={this.handleUpdateCommentQuestion}
          entry={this.state.commentQuestion}
          autocomplete={true}
        />
        <TextInputElement
          __className={styles.question}
          showLabel={true}
          name={i18n.t('forms.comment_question', 'SMS Question')}
          placeholder="Type a question that will be displayed for SMS type channels..."
          onChange={this.handleUpdateSMSQuestion}
          entry={this.state.smsQuestion}
          autocomplete={true}
        />
        {createResultNameInput(this.state.resultName, this.handleUpdateResultName)}
        {renderIssues(this.props)}
      </Dialog>
    );
  }
}
