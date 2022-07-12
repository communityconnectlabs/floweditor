import React from 'react';
import { FormState, StringEntry, AssetEntry, mergeForm } from 'store/nodeEditor';
import { RouterFormProps } from 'components/flow/props';
import Dialog, { ButtonSet } from 'components/dialog/Dialog';
import TypeList from 'components/nodeeditor/TypeList';
import { createResultNameInput } from '../widgets';
import AssetSelector from 'components/form/assetselector/AssetSelector';
import { nodeToState, stateToNode } from './helpers';
import TextInputElement from 'components/form/textinput/TextInputElement';
import i18n from 'config/i18n';
import {
  Alphanumeric,
  Required,
  shouldRequireIf,
  StartIsNonNumeric,
  validate
} from 'store/validators';
import { Asset } from 'store/flowContext';
import { hasErrors, renderIssues } from 'components/flow/actions/helpers';

export interface DialogflowRouterFormState extends FormState {
  dialogflowDB: AssetEntry;
  resultName: StringEntry;
  questionSrc: StringEntry;
}

class DialogflowRouterForm extends React.PureComponent<RouterFormProps, DialogflowRouterFormState> {
  constructor(props: RouterFormProps) {
    super(props);

    this.state = nodeToState(this.props.nodeSettings);
  }

  private handleSave = (): void => {
    const updates: Partial<DialogflowRouterFormState> = {
      dialogflowDB: validate('Dialogflow Database', this.state.dialogflowDB.value, [Required]),
      resultName: validate('Result Name', this.state.resultName.value, [
        Alphanumeric,
        StartIsNonNumeric,
        Required
      ])
    };

    const updated = mergeForm(this.state, updates);
    this.setState(updated);

    if (this.state.valid && updated.valid) {
      this.props.updateRouter(stateToNode(this.props.nodeSettings, this.state));
      this.props.onClose(false);
    }
  };

  private getButtons = (): ButtonSet => {
    return {
      primary: { name: 'Ok', onClick: this.handleSave, disabled: !this.state.valid },
      secondary: { name: 'Cancel', onClick: () => this.props.onClose(true) }
    };
  };

  private handleProjectSelection = (selected: Asset[], submitting = false): boolean => {
    const updates: Partial<DialogflowRouterFormState> = {
      dialogflowDB: validate('Dialogflow Database', selected[0], [
        shouldRequireIf(submitting),
        Required
      ])
    };

    const updated = mergeForm(this.state, updates);
    this.setState(updated);
    return updated.valid;
  };

  private handleOnQuestionSrcChange = (
    value: string,
    name: string,
    submitting = false
  ): boolean => {
    const updates: Partial<DialogflowRouterFormState> = {};
    updates.questionSrc = validate(name, value, [shouldRequireIf(submitting), Required]);

    const updated = mergeForm(this.state, updates);
    this.setState(updated);
    return updated.valid;
  };

  private handleUpdateResultName(value: string): void {
    const resultName = validate(i18n.t('forms.result_name', 'Result Name'), value, [
      Alphanumeric,
      StartIsNonNumeric
    ]);
    this.setState({
      resultName,
      valid: this.state.valid && !hasErrors(resultName)
    });
  }

  public render(): JSX.Element {
    const { typeConfig } = this.props;
    return (
      <Dialog title={typeConfig.name} headerClass={typeConfig.type} buttons={this.getButtons()}>
        <TypeList __className="" initialType={typeConfig} onChange={this.props.onTypeChange} />
        <span>Project Name</span>
        <AssetSelector
          assets={this.props.assetStore.dialogflow}
          entry={this.state.dialogflowDB}
          name="Dialogflow Database"
          onChange={this.handleProjectSelection}
          searchable={true}
          nameKey={'text'}
          valueKey={'id'}
        />
        <p>Question Source</p>
        <div>
          <TextInputElement
            name={i18n.t('forms.question_src', 'Question Source')}
            placeholder={i18n.t('forms.question_src_placeholder', 'Enter question path')}
            entry={this.state.questionSrc}
            onChange={this.handleOnQuestionSrcChange}
            autocomplete={true}
            helpText="Type the path we should be using to get the question. e.g.: @results.question.input "
          />
        </div>
        {createResultNameInput(
          this.state.resultName,
          this.handleUpdateResultName.bind(this),
          false,
          i18n.t(
            'forms.dialogflow_result_name_help_text',
            'By naming the result, you can reference it later using @results.result'
          )
        )}
        {renderIssues(this.props)}
      </Dialog>
    );
  }
}

export default DialogflowRouterForm;
