import { MediaPlayer } from 'components/mediaplayer/MediaPlayer';
import { SayMsg } from 'flowTypes';
import * as React from 'react';

import styles from './SayMsg.module.scss';
import i18n from 'config/i18n';

export const PLACEHOLDER = i18n.t('actions.say_msg.placeholder', 'Send a message to the contact');

const SayMsgComp: React.SFC<SayMsg> = (action: SayMsg): JSX.Element => {
  const getUploadedFileName = () => {
    if (action.audio_url && action.audio_url.length > 0) {
      let fullPath = action.audio_url;
      let fullPathSplit = fullPath.split('/');
      return fullPathSplit[fullPathSplit.length - 1];
    }
    return '';
  };

  if (action.text) {
    return (
      <>
        <div className={styles.text}>
          {action.text}
          {action.audio_url && (
            <>
              <br />
              <div className={`${styles.attachment} fe-paperclip`} />
              {getUploadedFileName()}
            </>
          )}
        </div>

        {action.audio_url ? (
          <div className={styles.recording}>
            <MediaPlayer url={action.audio_url} />
          </div>
        ) : null}
      </>
    );
  }
  return <div className="placeholder">{PLACEHOLDER}</div>;
};

export default SayMsgComp;
