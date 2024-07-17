import { react as bindCallbacks } from 'auto-bind';
import Dialog, { ButtonSet } from 'components/dialog/Dialog';
import { ActionFormProps } from 'components/flow/props';
import TextInputElement from 'components/form/textinput/TextInputElement';
import TypeList from 'components/nodeeditor/TypeList';
import UploadButton from 'components/uploadbutton/UploadButton';
import { fakePropType } from 'config/ConfigProvider';
import * as React from 'react';
import { FormState, mergeForm, StringEntry } from 'store/nodeEditor';
import { shouldRequireIf, validate } from 'store/validators';

import { initializeForm, stateToAction } from './helpers';
import i18n from 'config/i18n';
import { renderIssues } from '../helpers';
import { MediaPlayer } from '../../../mediaplayer/MediaPlayer';
import { renderIf } from '../../../../utils';

import styles from './SayMsgForm.module.scss';

export interface SayMsgFormState extends FormState {
  message: StringEntry;
  audio: StringEntry;
}

export default class SayMsgForm extends React.Component<ActionFormProps, SayMsgFormState> {
  constructor(props: ActionFormProps) {
    super(props);
    this.state = initializeForm(this.props.nodeSettings);
    bindCallbacks(this, {
      include: [/^handle/]
    });
  }

  public static contextTypes = {
    config: fakePropType
  };

  private handleUpdate(keys: { text?: string }, submitting = false): boolean {
    const updates: Partial<SayMsgFormState> = {};

    if (keys.hasOwnProperty('text')) {
      updates.message = validate(i18n.t('forms.message', 'Message'), keys.text!, [
        shouldRequireIf(submitting)
      ]);
    }

    const updated = mergeForm(this.state, updates);
    this.setState(updated);
    return updated.valid;
  }

  public handleMessageUpdate(text: string, name: string, submitting = false): boolean {
    return this.handleUpdate({ text }, submitting);
  }

  private handleSave(): void {
    // make sure we validate untouched text fields
    const valid = this.handleUpdate({ text: this.state.message.value }, true);

    if (valid) {
      this.props.updateAction(stateToAction(this.props.nodeSettings, this.state));

      // notify our modal we are done
      this.props.onClose(false);
    }
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

  private handleUploadChanged(url: string): void {
    this.setState({ audio: { value: url } });
  }

  private getUploadedFileName(): string {
    if (this.state.audio.value && this.state.audio.value.length > 0) {
      let fullPath = this.state.audio.value;
      let fullPathSplit = fullPath.split('/');
      let filename = fullPathSplit[fullPathSplit.length - 1];
      filename = decodeURI(filename);
      return filename;
    }
    return '';
  }

  public render(): JSX.Element {
    const typeConfig = this.props.typeConfig;

    return (
      <Dialog title={typeConfig.name} headerClass={typeConfig.type} buttons={this.getButtons()}>
        <TypeList __className="" initialType={typeConfig} onChange={this.props.onTypeChange} />
        <TextInputElement
          name={i18n.t('forms.message', 'Message')}
          showLabel={false}
          onChange={this.handleMessageUpdate}
          entry={this.state.message}
          autocomplete={true}
          focus={true}
          textarea={true}
        />

        {renderIf(this.state.audio.value && this.state.audio.value.length > 0)(
          <p>{this.getUploadedFileName()}</p>
        )}

        <div className={styles.upload_recording_container}>
          <UploadButton
            icon="fe-mic"
            uploadText="Upload Recording"
            removeText="Remove Recording"
            url={this.state.audio.value}
            endpoint={this.context.config.endpoints.attachments}
            onUploadChanged={this.handleUploadChanged}
          />
          {renderIf(this.state.audio.value && this.state.audio.value.length > 0)(
            <div className={styles.media_player}>
              <MediaPlayer url={this.state.audio.value} />
            </div>
          )}
        </div>
        {renderIssues(this.props)}
      </Dialog>
    );
  }
}
