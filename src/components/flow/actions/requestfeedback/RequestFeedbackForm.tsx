import React, { Component } from 'react';
import { react as bindCallbacks } from 'auto-bind';
import { ActionFormProps } from 'components/flow/props';
import { FormState, mergeForm, StringEntry } from 'store/nodeEditor';
import Dialog, { ButtonSet } from 'components/dialog/Dialog';
import TypeList from 'components/nodeeditor/TypeList';
import i18n from 'config/i18n';
import { initializeForm, stateToAction } from './helpers';
import { hasErrors, renderIssues } from 'components/flow/actions/helpers';
import { Alphanumeric, shouldRequireIf, StartIsNonNumeric, validate } from 'store/validators';
import { createResultNameInput } from 'components/flow/routers/widgets';
import TextInputElement from 'components/form/textinput/TextInputElement';

import styles from './RequesteFeedbackForm.module.scss';

export interface RequestFeedbackFormState extends FormState {
  rateQuestion: StringEntry;
  feedbackQuestion: StringEntry;
  resultName: StringEntry;
}

export default class RequestFeedbackForm extends Component<
  ActionFormProps,
  RequestFeedbackFormState
> {
  constructor(props: ActionFormProps) {
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
      this.props.updateAction(stateToAction(this.props.nodeSettings, this.state));

      // notify our modal we are done
      this.props.onClose(false);
    }
  }

  private handleUpdate(state: Partial<RequestFeedbackFormState>, submitting = false): boolean {
    const updates: Partial<RequestFeedbackFormState> = {};

    if (state.feedbackQuestion.hasOwnProperty('value')) {
      updates.feedbackQuestion = validate('Feedback Question', state.feedbackQuestion.value!, [
        shouldRequireIf(submitting)
      ]);
    }

    if (state.rateQuestion.hasOwnProperty('value')) {
      updates.rateQuestion = validate('Feedback Question', state.rateQuestion.value!, [
        shouldRequireIf(submitting)
      ]);
    }

    const updated = mergeForm(this.state, updates);
    this.setState(updated);
    return updated.valid;
  }

  private handleUpdateRateQuestion(value: string): void {
    const rateQuestion = validate(i18n.t('forms.result_name', 'Result Name'), value, [
      Alphanumeric,
      StartIsNonNumeric
    ]);

    this.setState({ rateQuestion, valid: !hasErrors(rateQuestion) });
  }

  private handleUpdateFeedbackQuestion(value: string): void {
    const feedbackQuestion = validate(i18n.t('forms.result_name', 'Result Name'), value, [
      Alphanumeric,
      StartIsNonNumeric
    ]);

    this.setState({ feedbackQuestion, valid: !hasErrors(feedbackQuestion) });
  }

  private handleUpdateResultName(value: string): void {
    const resultName = validate(i18n.t('forms.result_name', 'Result Name'), value, [
      Alphanumeric,
      StartIsNonNumeric
    ]);

    this.setState({ resultName, valid: !hasErrors(resultName) });
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
    console.log(this.state);

    return (
      <Dialog title={typeConfig.name} headerClass={typeConfig.type} buttons={this.getButtons()}>
        <TypeList __className="" initialType={typeConfig} onChange={this.props.onTypeChange} />
        <TextInputElement
          __className={styles.question}
          showLabel={true}
          name={i18n.t('forms.rate_question', 'Rate Question')}
          placeholder="Type a question that will be displayed with a star input field..."
          onChange={this.handleUpdateRateQuestion}
          entry={this.state.rateQuestion}
          autocomplete={true}
        />
        <TextInputElement
          __className={styles.question}
          showLabel={true}
          name={i18n.t('forms.feedback_question', 'Feedback Question')}
          placeholder="Type a question that will be displayed with text input field..."
          onChange={this.handleUpdateFeedbackQuestion}
          entry={this.state.feedbackQuestion}
          autocomplete={true}
        />
        {createResultNameInput(this.state.resultName, this.handleUpdateResultName)}
        {renderIssues(this.props)}
      </Dialog>
    );
  }
}
