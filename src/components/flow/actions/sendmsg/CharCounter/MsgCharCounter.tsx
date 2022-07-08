import * as React from 'react';
import axios, { AxiosResponse } from 'axios';

import { getCookie } from 'external';
import i18n from 'config/i18n';
import Modal from 'components/modal/Modal';
import Dialog, { ButtonSet } from 'components/dialog/Dialog';

import styles from './styles.module.scss';
import { getMessageInfo } from './helper';
import { FormProps, FormState } from './types';

class MsgCharCounter extends React.Component<FormProps, FormState> {
  endpoint: string;
  BUTTON_OK: string = i18n.t('buttons.ok', 'Ok');
  BUTTON_REPLACE: string = i18n.t('buttons.replace', 'Replace');

  constructor(props: FormProps) {
    super(props);
    this.endpoint = this.props.endpoint;
    this.state = this.init();
  }

  private init(): FormState {
    return {
      updateMsgResult: { updated: '', removed: [], replaced: {} },
      openDialog: false,
      replacementDone: false,
      buttonText: this.BUTTON_REPLACE,
      replacing: false
    };
  }

  private updateState(entry: Partial<FormState>) {
    this.setState({ ...this.state, ...entry });
  }

  requestReplacement() {
    const csrf = getCookie('csrftoken');
    const headers = csrf ? { 'X-CSRFToken': csrf } : {};
    axios
      .post(
        this.endpoint,
        { message: this.props.text },
        {
          headers,
          timeout: 0
        }
      )
      .then(({ data: result }: AxiosResponse) => {
        this.updateState({
          updateMsgResult: result,
          buttonText: this.BUTTON_OK,
          replacementDone: true,
          replacing: false
        });
      })
      .catch((error: any) => {
        console.log(error);
        this.updateState({ replacing: false });
      });
  }

  getButton(): ButtonSet {
    const buttonData: ButtonSet = {
      primary: {
        name: this.state.buttonText,
        disabled: this.state.replacing,
        onClick: () => {
          if (this.state.replacementDone) {
            const updateMsgResult = this.state.updateMsgResult.updated;
            this.updateState(this.init());
            this.props.updateFn(updateMsgResult);
          } else {
            this.updateState({ replacing: true });
            this.requestReplacement();
          }
        }
      }
    };

    if (!this.state.replacementDone) {
      buttonData.secondary = {
        name: i18n.t('buttons.cancel', 'Cancel'),
        onClick: () => {
          this.updateState({ openDialog: false });
        }
      };
    }

    return buttonData;
  }

  renderSaveOption() {
    return (
      <div>
        <span
          className={styles.counter_question}
          onClick={() => {
            this.updateState({ openDialog: true });
          }}
        >
          Want to save some money?
        </span>
      </div>
    );
  }

  renderAccentedCharList(accentedChars: string[]) {
    return (
      <div>
        This message is GSM encoded. GSM has only 70 characters per segment vs. 160 characters
        characters for 7-bit. If you replace the following characters, you can get space for space
        space for your message and likely save money.
        <div className={styles.accented_chars_list}>{accentedChars.join(', ')}</div>
      </div>
    );
  }

  renderReplacedCharsMsg() {
    return (
      <div>
        The following characters have been replaced <br />
        {Object.entries(this.state.updateMsgResult.replaced).map(([key, value]) => (
          <div key={`${key}-${value}`}>{`${key} -> ${value}`}</div>
        ))}
        {(this.state.updateMsgResult.removed || []).length > 0 && (
          <div>
            The following characters have been removed:{' '}
            {this.state.updateMsgResult.removed.join(', ')}
          </div>
        )}
      </div>
    );
  }

  renderModal(accentedChars: string[]) {
    return (
      <Modal show={this.state.openDialog} width="400px">
        <Dialog
          title="Replace Accented Text"
          className={styles.counter_dialog}
          buttons={this.getButton()}
        >
          {!this.state.replacementDone && this.renderAccentedCharList(accentedChars)}
          {this.state.replacementDone && this.renderReplacedCharsMsg()}
        </Dialog>
      </Modal>
    );
  }

  render() {
    const msg = getMessageInfo(this.props.text);
    return (
      <div className={`${styles.clearfix} ${styles.counter_wrapper}`}>
        <div className={styles.float_counter}>
          <div className={msg.segmentCount > 1 ? styles.counter_high_segments : null}>
            {msg.count} characters / {msg.segmentCount} segments
          </div>
          <div>
            Encoding:{' '}
            <span className={msg.isGSM ? styles.counter_high_segments : null}>
              {msg.characterSet}
            </span>
          </div>
          {msg.isGSM &&
            msg.accentedChars.length > 0 &&
            msg.segmentCount > 1 &&
            this.renderSaveOption()}
        </div>
        {this.state.openDialog && this.renderModal(msg.accentedChars)}
      </div>
    );
  }
}

export default MsgCharCounter;
