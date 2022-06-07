import * as React from 'react';
import { CallDialogflow } from 'flowTypes';

const CallDialogflowComp: React.SFC<CallDialogflow> = ({ dialogflow_db }): JSX.Element => (
  <div>{dialogflow_db.text || dialogflow_db.id}</div>
);

export default CallDialogflowComp;
