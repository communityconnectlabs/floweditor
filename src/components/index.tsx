import { react as bindCallbacks } from 'auto-bind';
import Button, { ButtonTypes } from 'components/button/Button';
import Dialog from 'components/dialog/Dialog';
import { Fixy } from 'components/fixy/Fixy';
import ConnectedFlow from 'components/flow/Flow';
import styles from 'components/index.module.scss';
import ConnectedLanguageSelector from 'components/languageselector/LanguageSelector';
import Loading from 'components/loading/Loading';
import Modal from 'components/modal/Modal';
import { RevisionExplorer } from 'components/revisions/RevisionExplorer';
import { IssuesTab, IssueDetail } from 'components/issues/IssuesTab';
import ConfigProvider from 'config';
import { fakePropType } from 'config/ConfigProvider';
import { FlowDefinition, FlowEditorConfig, FlowMetadata, AnyAction } from 'flowTypes';
import * as React from 'react';
import { connect, Provider as ReduxProvider } from 'react-redux';
import { bindActionCreators } from 'redux';
import createStore from 'store/createStore';
import { ModalMessage } from 'store/editor';
import { Asset, Assets, AssetStore, RenderNodeMap } from 'store/flowContext';
import { getCurrentDefinition } from 'store/helpers';
import AppState from 'store/state';
import {
  CreateNewRevision,
  createNewRevision,
  DispatchWithState,
  FetchFlow,
  fetchFlow,
  LoadFlowDefinition,
  loadFlowDefinition,
  MergeEditorState,
  mergeEditorState,
  onOpenNodeEditor,
  OnOpenNodeEditor,
  handleLanguageChange,
  HandleLanguageChange
} from 'store/thunks';
import { ACTIVITY_INTERVAL, downloadJSON, renderIf } from 'utils';
import { PopTabType } from 'config/interfaces';

const { default: PageVisibility } = require('react-page-visibility');

export interface FlowEditorContainerProps {
  config: FlowEditorConfig;
}

export interface FlowEditorStoreProps {
  assetStore: AssetStore;
  baseLanguage: Asset;
  language: Asset;
  languages: Assets;
  simulating: boolean;
  translating: boolean;
  fetchingFlow: boolean;
  definition: FlowDefinition;
  metadata: FlowMetadata;
  fetchFlow: FetchFlow;
  loadFlowDefinition: LoadFlowDefinition;
  createNewRevision: CreateNewRevision;
  mergeEditorState: MergeEditorState;
  onOpenNodeEditor: OnOpenNodeEditor;
  handleLanguageChange: HandleLanguageChange;
  nodes: RenderNodeMap;
  modalMessage: ModalMessage;
  saving: boolean;
  scrollToNode: string;
  scrollToAction: string;
  popped: string;
}

const hotStore = createStore();

export const getLabel = (): JSX.Element => {
  return <div>testing</div>;
};

// Root container, wires up context-providers
export const FlowEditorContainer: React.SFC<FlowEditorContainerProps> = ({ config }) => {
  return (
    <ConfigProvider config={{ ...config }}>
      <ReduxProvider store={hotStore as any}>
        <ConnectedFlowEditor />
      </ReduxProvider>
    </ConfigProvider>
  );
};

export const contextTypes = {
  config: fakePropType
};

export const editorContainerSpecId = 'editor-container';
export const editorSpecId = 'editor';

/**
 * The main editor view for editing a flow
 */
export class FlowEditor extends React.Component<FlowEditorStoreProps> {
  public static contextTypes = contextTypes;

  constructor(props: FlowEditorStoreProps) {
    super(props);
    bindCallbacks(this, {
      include: [/^handle/]
    });
  }

  public componentDidMount(): void {
    const { endpoints, flow, onLoad, forceSaveOnLoad } = this.context.config;
    this.props.fetchFlow(endpoints, flow, onLoad, forceSaveOnLoad);
  }

  private handleDownloadClicked(): void {
    downloadJSON(getCurrentDefinition(this.props.definition, this.props.nodes), 'definition');
  }

  private handleVisibilityChanged(visible: boolean): void {
    this.props.mergeEditorState({
      visible,
      activityInterval: ACTIVITY_INTERVAL
    });
  }

  public getAlertModal(): JSX.Element {
    if (!this.props.modalMessage) {
      return null;
    }

    return (
      <Modal width="600px" show={true}>
        <Dialog
          className={styles.alert_modal}
          title={this.props.modalMessage.title}
          headerClass="alert"
          buttons={{
            primary: {
              name: 'Ok',
              onClick: () => {
                this.props.mergeEditorState({ modalMessage: null });
              }
            }
          }}
        >
          <div className={styles.alert_body}>{this.props.modalMessage.body}</div>
        </Dialog>
      </Modal>
    );
  }

  public getSavingIndicator(): JSX.Element {
    if (!this.props.saving) {
      return null;
    }

    return (
      <div className={styles.saving}>
        <Fixy>
          <Loading units={5} color="#3498db" size={7} />
        </Fixy>
      </div>
    );
  }

  public getFooter(): JSX.Element {
    return !this.props.fetchingFlow && this.context.config.showDownload ? (
      <div className={styles.footer}>
        <div className={styles.download_button}>
          <Button name="Download" onClick={this.handleDownloadClicked} type={ButtonTypes.primary} />
        </div>
      </div>
    ) : null;
  }

  private handleLanguageSetting(issueDetail: IssueDetail): void {
    if (issueDetail.language) {
      this.props.handleLanguageChange(issueDetail.language);
    } else {
      this.props.handleLanguageChange(this.props.baseLanguage);
    }
  }

  public handleOpenIssue(issueDetail: IssueDetail): void {
    this.handleLanguageSetting(issueDetail);
    this.props.onOpenNodeEditor({
      originalNode: issueDetail.renderObjects.renderNode,
      originalAction: issueDetail.renderObjects.renderAction
        ? (issueDetail.renderObjects.renderAction.action as AnyAction)
        : null
    });
  }

  public handleScrollToIssue(issueDetail: IssueDetail): void {
    this.handleLanguageSetting(issueDetail);
    const issue = issueDetail.issues[0];
    if (
      this.props.scrollToNode === issue.node_uuid &&
      this.props.scrollToAction === issue.action_uuid
    ) {
      this.props.mergeEditorState({
        scrollToNode: null,
        scrollToAction: null
      });
    }

    window.setTimeout(() => {
      this.props.mergeEditorState({
        scrollToNode: issue.node_uuid,
        scrollToAction: issue.action_uuid
      });
    }, 0);
  }

  private handleTabPopped(visible: boolean, tab: PopTabType): void {
    if (visible) {
      this.props.mergeEditorState({ popped: tab });
    } else {
      this.props.mergeEditorState({ popped: null });
    }
  }

  public render(): JSX.Element {
    return (
      <PageVisibility onChange={this.handleVisibilityChanged}>
        <div
          id={editorContainerSpecId}
          className={this.props.translating ? styles.translating : undefined}
          data-spec={editorContainerSpecId}
        >
          {this.getFooter()}
          {this.getAlertModal()}
          <div className={styles.editor} data-spec={editorSpecId}>
            {renderIf(this.props.languages && Object.keys(this.props.languages.items).length > 0)(
              <ConnectedLanguageSelector />
            )}

            {this.getSavingIndicator()}

            {renderIf(this.props.definition && this.props.language && !this.props.fetchingFlow)(
              <ConnectedFlow />
            )}

            <RevisionExplorer
              loadFlowDefinition={this.props.loadFlowDefinition}
              createNewRevision={this.props.createNewRevision}
              assetStore={this.props.assetStore}
              onToggled={this.handleTabPopped}
              popped={this.props.popped}
            />

            {renderIf(this.props.metadata.issues.length > 0)(
              <IssuesTab
                issues={this.props.metadata.issues}
                onIssueClicked={this.handleScrollToIssue}
                onIssueOpened={this.handleOpenIssue}
                languages={this.props.languages ? this.props.languages.items : {}}
                nodes={this.props.nodes}
                onToggled={this.handleTabPopped}
                popped={this.props.popped}
              />
            )}
            <div id="portal-root" />
          </div>
        </div>
      </PageVisibility>
    );
  }
}

const mapStateToProps = ({
  flowContext: { definition, metadata, nodes, assetStore, baseLanguage },
  editorState: {
    translating,
    language,
    fetchingFlow,
    simulating,
    modalMessage,
    saving,
    scrollToAction,
    scrollToNode,
    popped
  }
}: AppState) => {
  const languages = assetStore ? assetStore.languages : null;

  return {
    popped,
    baseLanguage,
    modalMessage,
    saving,
    simulating,
    assetStore,
    translating,
    language,
    fetchingFlow,
    definition,
    metadata,
    nodes,
    languages,
    scrollToAction,
    scrollToNode
  };
};

const mapDispatchToProps = (dispatch: DispatchWithState) =>
  bindActionCreators(
    {
      fetchFlow,
      loadFlowDefinition,
      createNewRevision,
      mergeEditorState,
      onOpenNodeEditor,
      handleLanguageChange
    },
    dispatch
  );

export const ConnectedFlowEditor = connect(
  mapStateToProps,
  mapDispatchToProps
)(FlowEditor);

export default FlowEditorContainer;
